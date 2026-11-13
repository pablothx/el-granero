import { and, desc, eq, gt, isNull, lte, or } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { Hono } from "hono";
import { z } from "zod";
import { items, miembros } from "../../shared/esquema";
import { LISTAS, VIDA_COMPRADO_MS } from "../../shared/listas";
import { exigirMiembro, validar, type Ctx, type Db, type Entorno } from "../contexto";
import { fallar } from "../errores";

const textoSchema = z.string().trim().min(1, "Escribí qué falta").max(120);
const idParam = validar("param", z.object({ id: z.coerce.number().int() }));
const anotador = alias(miembros, "anotador");
const comprador = alias(miembros, "comprador");

/** Borra los Ítems Comprados hace más de 24 h (lo corre el Cron). */
export async function borrarCompradosViejos(db: Db, ahora: Date) {
  await db.delete(items).where(lte(items.compradoEn, new Date(ahora.getTime() - VIDA_COMPRADO_MS)));
}

async function exigirItem(c: Ctx, id: number) {
  exigirMiembro(c);
  return (await c.var.db.query.items.findFirst({ where: eq(items.id, id) })) ?? fallar("no_encontrado", "Ese Ítem ya no está");
}

export const rutasListas = new Hono<Entorno>()
  .get("/listas/:lista", validar("param", z.object({ lista: z.enum(LISTAS) })), async (c) => {
    exigirMiembro(c);
    const limite = new Date(c.var.reloj.ahora().getTime() - VIDA_COMPRADO_MS);
    const filas = await c.var.db
      .select({ i: items, anotadoPor: anotador.nombre, compradoPor: comprador.nombre })
      .from(items)
      .innerJoin(anotador, eq(anotador.id, items.anotadoPorId))
      .leftJoin(comprador, eq(comprador.id, items.compradoPorId))
      .where(and(eq(items.lista, c.req.valid("param").lista), or(isNull(items.compradoEn), gt(items.compradoEn, limite))))
      .orderBy(desc(items.anotadoEn), desc(items.id));
    const vistas = filas.map(({ i, anotadoPor, compradoPor }) => ({
      id: i.id,
      texto: i.texto,
      anotadoPor,
      anotadoEn: i.anotadoEn.toISOString(),
      comprado: i.compradoEn !== null,
      compradoPor: compradoPor ?? null,
      compradoEn: i.compradoEn?.toISOString() ?? null,
    }));
    // Sin comprar: el más nuevo arriba. Comprados: abajo, el último comprado primero.
    const sinComprar = vistas.filter((v) => !v.comprado);
    const comprados = vistas.filter((v) => v.comprado).sort((a, b) => b.compradoEn!.localeCompare(a.compradoEn!));
    return c.json({ items: [...sinComprar, ...comprados] });
  })

  .post(
    "/listas/:lista/items",
    validar("param", z.object({ lista: z.enum(LISTAS) })),
    validar("json", z.object({ texto: textoSchema })),
    async (c) => {
      const miembro = exigirMiembro(c);
      const [item] = await c.var.db
        .insert(items)
        .values({ lista: c.req.valid("param").lista, texto: c.req.valid("json").texto, anotadoPorId: miembro.id, anotadoEn: c.var.reloj.ahora() })
        .returning();
      return c.json({ id: item!.id }, 201);
    },
  )

  .patch("/items/:id", idParam, validar("json", z.object({ texto: textoSchema })), async (c) => {
    const item = await exigirItem(c, c.req.valid("param").id);
    await c.var.db.update(items).set({ texto: c.req.valid("json").texto }).where(eq(items.id, item.id));
    return c.json({ ok: true });
  })

  .delete("/items/:id", idParam, async (c) => {
    const item = await exigirItem(c, c.req.valid("param").id);
    await c.var.db.delete(items).where(eq(items.id, item.id));
    return c.json({ ok: true });
  })

  .post("/items/:id/comprar", idParam, async (c) => {
    const item = await exigirItem(c, c.req.valid("param").id);
    await c.var.db.update(items).set({ compradoPorId: c.var.miembro!.id, compradoEn: c.var.reloj.ahora() }).where(eq(items.id, item.id));
    return c.json({ ok: true });
  })

  .post("/items/:id/descomprar", idParam, async (c) => {
    const item = await exigirItem(c, c.req.valid("param").id);
    await c.var.db.update(items).set({ compradoPorId: null, compradoEn: null }).where(eq(items.id, item.id));
    return c.json({ ok: true });
  });
