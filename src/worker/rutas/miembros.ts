import { asc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { avatarSchema, nombreSchema, pinSchema, ROLES } from "../../shared/dominio";
import { miembros, sesiones } from "../../shared/esquema";
import { hashSecreto } from "../cripto";
import { olvidarIntentos, verificarPin } from "../pin";
import { exigirMiembro, validar, type Entorno, type Miembro } from "../contexto";
import { fallar } from "../errores";
import { exigirAdulto } from "../permisos";
import { aMiembroPublico } from "./acceso";

export function aMiembroAdmin(m: Miembro) {
  return { ...aMiembroPublico(m), archivado: m.archivado };
}

const idParam = validar("param", z.object({ id: z.coerce.number().int() }));

export const rutasMiembros = new Hono<Entorno>()
  .post("/reingresar", validar("json", z.object({ pin: z.string() })), async (c) => {
    const miembro = exigirMiembro(c);
    await verificarPin(c, c.var.dispositivo!.id, miembro, c.req.valid("json").pin);
    await c.var.db.update(sesiones).set({ ultimoPinAt: c.var.reloj.ahora() }).where(eq(sesiones.id, c.var.sesion!.id));
    return c.json({ ok: true });
  })

  .get("/miembros", async (c) => {
    exigirAdulto(c);
    const todos = await c.var.db.query.miembros.findMany({ orderBy: [asc(miembros.nombre)] });
    return c.json({ miembros: todos.map(aMiembroAdmin) });
  })

  .post(
    "/miembros",
    validar("json", z.object({ nombre: nombreSchema, rol: z.enum(ROLES), avatar: avatarSchema, pin: pinSchema })),
    async (c) => {
      exigirAdulto(c);
      const datos = c.req.valid("json");
      const [miembro] = await c.var.db
        .insert(miembros)
        .values({
          nombre: datos.nombre,
          rol: datos.rol,
          avatarEmoji: datos.avatar.emoji,
          avatarColor: datos.avatar.color,
          pinHash: await hashSecreto(datos.pin),
          createdAt: c.var.reloj.ahora(),
        })
        .returning();
      return c.json({ miembro: aMiembroAdmin(miembro!) }, 201);
    },
  )

  .patch(
    "/miembros/:id",
    idParam,
    validar("json", z.object({ nombre: nombreSchema.optional(), rol: z.enum(ROLES).optional(), avatar: avatarSchema.optional() })),
    async (c) => {
      exigirAdulto(c);
      const { id } = c.req.valid("param");
      const datos = c.req.valid("json");
      const miembro = await c.var.db.query.miembros.findFirst({ where: eq(miembros.id, id) });
      if (!miembro) fallar("no_encontrado", "Ese Miembro no existe");
      const [actualizado] = await c.var.db
        .update(miembros)
        .set({
          nombre: datos.nombre,
          rol: datos.rol,
          avatarEmoji: datos.avatar?.emoji,
          avatarColor: datos.avatar?.color,
        })
        .where(eq(miembros.id, id))
        .returning();
      return c.json({ miembro: aMiembroAdmin(actualizado!) });
    },
  )

  /** Un Adulto le pone un PIN nuevo a cualquier Miembro. */
  .put("/miembros/:id/pin", idParam, validar("json", z.object({ pin: pinSchema })), async (c) => {
    exigirAdulto(c);
    const { id } = c.req.valid("param");
    const miembro = await c.var.db.query.miembros.findFirst({ where: eq(miembros.id, id) });
    if (!miembro) fallar("no_encontrado", "Ese Miembro no existe");
    await c.var.db.update(miembros).set({ pinHash: await hashSecreto(c.req.valid("json").pin) }).where(eq(miembros.id, id));
    await olvidarIntentos(c, id);
    return c.json({ ok: true });
  });
