import { and, asc, eq, ne, or } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { avatarSchema, nombreSchema, pinSchema, ROLES } from "../../shared/dominio";
import { items, miembros, ocurrencias, sesiones, tareas } from "../../shared/esquema";
import { hashSecreto } from "../cripto";
import { olvidarIntentos, verificarPin } from "../pin";
import { exigirMiembro, validar, type Ctx, type Entorno, type Miembro } from "../contexto";
import { fallar } from "../errores";
import { exigirAdulto } from "../permisos";
import { aMiembroPublico } from "./acceso";

export function aMiembroAdmin(m: Miembro) {
  return { ...aMiembroPublico(m), archivado: m.archivado };
}

const idParam = validar("param", z.object({ id: z.coerce.number().int() }));

async function exigirMiembroPorId(c: Ctx, id: number) {
  return (await c.var.db.query.miembros.findFirst({ where: eq(miembros.id, id) })) ?? fallar("no_encontrado", "Ese Miembro no existe");
}

/** Siempre tiene que quedar al menos un Adulto activo. */
async function exigirOtroAdultoActivo(c: Ctx, miembro: Miembro) {
  if (miembro.rol !== "adulto" || miembro.archivado) return;
  const otro = await c.var.db.query.miembros.findFirst({
    where: and(eq(miembros.rol, "adulto"), eq(miembros.archivado, false), ne(miembros.id, miembro.id)),
  });
  if (!otro) fallar("conflicto", "Tiene que quedar al menos un Adulto activo");
}

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
      const miembro = await exigirMiembroPorId(c, id);
      if (datos.rol === "chico") await exigirOtroAdultoActivo(c, miembro);
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
  })

  /** Archivar: deja de aparecer y no puede entrar, pero conserva su historial. */
  .post("/miembros/:id/archivar", idParam, async (c) => {
    exigirAdulto(c);
    const miembro = await exigirMiembroPorId(c, c.req.valid("param").id);
    const activas = await c.var.db.query.tareas.findMany({
      where: and(eq(tareas.miembroId, miembro.id), eq(tareas.archivada, false)),
      orderBy: [asc(tareas.nombre)],
    });
    if (activas.length) {
      fallar("conflicto", "Antes reasigná o archivá sus Tareas activas", {
        tareas: activas.map((t) => ({ id: t.id, nombre: t.nombre, emoji: t.emoji })),
      });
    }
    await exigirOtroAdultoActivo(c, miembro);
    await c.var.db.update(miembros).set({ archivado: true }).where(eq(miembros.id, miembro.id));
    await c.var.db.delete(sesiones).where(eq(sesiones.miembroId, miembro.id));
    return c.json({ ok: true });
  })

  .post("/miembros/:id/reactivar", idParam, async (c) => {
    exigirAdulto(c);
    const miembro = await exigirMiembroPorId(c, c.req.valid("param").id);
    await c.var.db.update(miembros).set({ archivado: false }).where(eq(miembros.id, miembro.id));
    return c.json({ ok: true });
  })

  /** Borrar: solo un Miembro sin historial (cargado por error). */
  .delete("/miembros/:id", idParam, async (c) => {
    exigirAdulto(c);
    const db = c.var.db;
    const miembro = await exigirMiembroPorId(c, c.req.valid("param").id);
    await exigirOtroAdultoActivo(c, miembro);
    const [ocurrencia, tarea, item] = await Promise.all([
      db.query.ocurrencias.findFirst({ where: or(eq(ocurrencias.miembroId, miembro.id), eq(ocurrencias.tildadaPorId, miembro.id)) }),
      db.query.tareas.findFirst({ where: eq(tareas.miembroId, miembro.id) }),
      db.query.items.findFirst({ where: or(eq(items.anotadoPorId, miembro.id), eq(items.compradoPorId, miembro.id)) }),
    ]);
    if (ocurrencia || tarea || item) fallar("conflicto", "Este Miembro ya tiene historial: archivalo en lugar de borrarlo");
    await db.delete(miembros).where(eq(miembros.id, miembro.id));
    return c.json({ ok: true });
  });
