import { and, asc, eq, gt, isNotNull, isNull, lte, or } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { nombreSchema } from "../../shared/dominio";
import { miembros, ocurrencias, tareas } from "../../shared/esquema";
import { diasAMascara, FRECUENCIAS, fechaLocal, periodoTerminado, sumarDias, type DiaSemana } from "../../shared/periodos";
import { exigirMiembro, obtenerFamilia, validar, type Ctx, type Entorno } from "../contexto";
import { fallar } from "../errores";
import { asegurarOcurrencias, descartarPendienteActual, listarHoy, listarTerminadas, reglaDe, type Tarea } from "../ocurrencias";
import { exigirAdulto } from "../permisos";
import { aMiembroPublico } from "./acceso";

export async function hoyDeLaFamilia(c: Ctx) {
  const { zonaHoraria } = await obtenerFamilia(c.var.db);
  return { hoy: fechaLocal(c.var.reloj.ahora(), zonaHoraria), zonaHoraria };
}

export const diasSchema = z.array(z.number().int().min(1).max(7)).max(7).default([]);
export const emojiSchema = z
  .string()
  .trim()
  .max(16)
  .nullish()
  .transform((e) => e || null);

export function aTareaVista(t: Tarea, miembro: { id: number; nombre: string } | undefined) {
  const { frecuencia, dias } = reglaDe(t);
  return { id: t.id, nombre: t.nombre, emoji: t.emoji, frecuencia, dias, archivada: t.archivada, miembro: miembro ?? null };
}

const idParam = validar("param", z.object({ id: z.coerce.number().int() }));

async function exigirTarea(c: Ctx, id: number) {
  return (await c.var.db.query.tareas.findFirst({ where: eq(tareas.id, id) })) ?? fallar("no_encontrado", "Esa Tarea no existe");
}

async function exigirMiembroActivo(c: Ctx, id: number) {
  const m = await c.var.db.query.miembros.findFirst({ where: and(eq(miembros.id, id), eq(miembros.archivado, false)) });
  return m ?? fallar("validacion", "Ese Miembro no existe o está archivado");
}

export const rutasTareas = new Hono<Entorno>()
  .get("/tareas", async (c) => {
    exigirAdulto(c);
    const filas = await c.var.db
      .select({ t: tareas, m: { id: miembros.id, nombre: miembros.nombre } })
      .from(tareas)
      .innerJoin(miembros, eq(miembros.id, tareas.miembroId))
      .orderBy(asc(tareas.nombre));
    return c.json({ tareas: filas.map(({ t, m }) => aTareaVista(t, m)) });
  })

  .post(
    "/tareas",
    validar(
      "json",
      z.object({
        nombre: nombreSchema,
        emoji: emojiSchema,
        frecuencia: z.enum(FRECUENCIAS),
        dias: diasSchema,
        miembroId: z.number().int(),
      }),
    ),
    async (c) => {
      exigirAdulto(c);
      const datos = c.req.valid("json");
      const miembro = await exigirMiembroActivo(c, datos.miembroId);
      const [tarea] = await c.var.db
        .insert(tareas)
        .values({
          nombre: datos.nombre,
          emoji: datos.emoji,
          frecuencia: datos.frecuencia,
          diasSemana: datos.frecuencia === "diaria" ? diasAMascara(datos.dias as DiaSemana[]) : 0,
          miembroId: miembro.id,
          createdAt: c.var.reloj.ahora(),
        })
        .returning();
      const { hoy } = await hoyDeLaFamilia(c);
      await asegurarOcurrencias(c.var.db, hoy, [tarea!.id]);
      return c.json({ tarea: aTareaVista(tarea!, miembro) }, 201);
    },
  )

  .patch(
    "/tareas/:id",
    idParam,
    validar(
      "json",
      z.object({
        nombre: nombreSchema.optional(),
        emoji: emojiSchema.optional(),
        frecuencia: z.enum(FRECUENCIAS).optional(),
        dias: z.array(z.number().int().min(1).max(7)).max(7).optional(),
        miembroId: z.number().int().optional(),
      }),
    ),
    async (c) => {
      exigirAdulto(c);
      const tarea = await exigirTarea(c, c.req.valid("param").id);
      const datos = c.req.valid("json");
      const db = c.var.db;
      const { hoy } = await hoyDeLaFamilia(c);

      const frecuencia = datos.frecuencia ?? tarea.frecuencia;
      const diasSemana =
        frecuencia !== "diaria" ? 0 : datos.dias !== undefined ? diasAMascara(datos.dias as DiaSemana[]) : tarea.diasSemana;
      const cambiaRegla = frecuencia !== tarea.frecuencia || diasSemana !== tarea.diasSemana;
      const reasigna = datos.miembroId !== undefined && datos.miembroId !== tarea.miembroId;
      if (reasigna) await exigirMiembroActivo(c, datos.miembroId!);

      const [actualizada] = await db
        .update(tareas)
        .set({ nombre: datos.nombre, emoji: datos.emoji, frecuencia, diasSemana, miembroId: datos.miembroId })
        .where(eq(tareas.id, tarea.id))
        .returning();

      if (!tarea.archivada) {
        if (cambiaRegla) {
          // El cambio aplica ya: se descarta la Pendiente actual y se genera la que corresponde.
          await descartarPendienteActual(db, tarea.id, hoy);
          await asegurarOcurrencias(db, hoy, [tarea.id]);
        } else if (reasigna) {
          // La Pendiente actual pasa al nuevo Miembro; las pasadas conservan el anterior.
          await db
            .update(ocurrencias)
            .set({ miembroId: datos.miembroId })
            .where(and(eq(ocurrencias.tareaId, tarea.id), isNull(ocurrencias.tildadaEn), lte(ocurrencias.inicio, hoy), gt(ocurrencias.fin, hoy)));
        }
      }
      const miembro = await db.query.miembros.findFirst({ where: eq(miembros.id, actualizada!.miembroId) });
      return c.json({ tarea: aTareaVista(actualizada!, miembro) });
    },
  )

  .post("/tareas/:id/archivar", idParam, async (c) => {
    exigirAdulto(c);
    const tarea = await exigirTarea(c, c.req.valid("param").id);
    const { hoy } = await hoyDeLaFamilia(c);
    await c.var.db.update(tareas).set({ archivada: true }).where(eq(tareas.id, tarea.id));
    await descartarPendienteActual(c.var.db, tarea.id, hoy);
    return c.json({ ok: true });
  })

  .post("/tareas/:id/reactivar", idParam, async (c) => {
    exigirAdulto(c);
    const tarea = await exigirTarea(c, c.req.valid("param").id);
    await exigirMiembroActivo(c, tarea.miembroId);
    const { hoy } = await hoyDeLaFamilia(c);
    await c.var.db.update(tareas).set({ archivada: false }).where(eq(tareas.id, tarea.id));
    await asegurarOcurrencias(c.var.db, hoy, [tarea.id]);
    return c.json({ ok: true });
  })

  .delete("/tareas/:id", idParam, async (c) => {
    exigirAdulto(c);
    const tarea = await exigirTarea(c, c.req.valid("param").id);
    const { hoy } = await hoyDeLaFamilia(c);
    const conHistorial = await c.var.db.query.ocurrencias.findFirst({
      where: and(eq(ocurrencias.tareaId, tarea.id), or(isNotNull(ocurrencias.tildadaEn), lte(ocurrencias.fin, hoy))),
    });
    if (conHistorial) fallar("conflicto", "Esta Tarea ya tiene historial: archivala en lugar de borrarla");
    await c.var.db.delete(tareas).where(eq(tareas.id, tarea.id));
    return c.json({ ok: true });
  })

  .get("/hoy", async (c) => {
    const miembro = exigirMiembro(c);
    const { hoy, zonaHoraria } = await hoyDeLaFamilia(c);
    await asegurarOcurrencias(c.var.db, hoy);
    return c.json({ fecha: hoy, ocurrencias: await listarHoy(c.var.db, miembro.id, hoy, zonaHoraria) });
  })

  /** Vista Familia: progreso de hoy de cada Miembro activo. */
  .get("/familia", async (c) => {
    exigirAdulto(c);
    const { hoy, zonaHoraria } = await hoyDeLaFamilia(c);
    await asegurarOcurrencias(c.var.db, hoy);
    const activos = await c.var.db.query.miembros.findMany({ where: eq(miembros.archivado, false), orderBy: [asc(miembros.nombre)] });
    const progreso = await Promise.all(
      activos.map(async (m) => {
        const deHoy = await listarHoy(c.var.db, m.id, hoy, zonaHoraria);
        return { miembro: aMiembroPublico(m), cumplidas: deHoy.filter((o) => o.estado === "cumplida").length, total: deHoy.length };
      }),
    );
    return c.json({ fecha: hoy, miembros: progreso });
  })

  /** El Hoy de cualquier Miembro (para un Adulto, desde la Vista Familia). */
  .get("/miembros/:id/hoy", idParam, async (c) => {
    exigirAdulto(c);
    const { id } = c.req.valid("param");
    const miembro = await c.var.db.query.miembros.findFirst({ where: eq(miembros.id, id) });
    if (!miembro) fallar("no_encontrado", "Ese Miembro no existe");
    const { hoy, zonaHoraria } = await hoyDeLaFamilia(c);
    await asegurarOcurrencias(c.var.db, hoy);
    return c.json({ fecha: hoy, miembro: aMiembroPublico(miembro), ocurrencias: await listarHoy(c.var.db, id, hoy, zonaHoraria) });
  })

  /** Ocurrencias de Períodos terminados en los últimos `dias` días (para revisar y corregir). */
  .get(
    "/miembros/:id/terminadas",
    validar("param", z.object({ id: z.coerce.number().int() })),
    validar("query", z.object({ dias: z.coerce.number().int().min(1).max(62).default(14) })),
    async (c) => {
      exigirAdulto(c);
      const { id } = c.req.valid("param");
      const { hoy, zonaHoraria } = await hoyDeLaFamilia(c);
      const desde = sumarDias(hoy, -c.req.valid("query").dias);
      return c.json({ fecha: hoy, ocurrencias: await listarTerminadas(c.var.db, id, desde, hoy, zonaHoraria) });
    },
  )

  .post("/ocurrencias/:id/tildar", validar("param", z.object({ id: z.coerce.number().int() })), async (c) => {
    const ocurrencia = await ocurrenciaEditable(c, c.req.valid("param").id);
    await c.var.db
      .update(ocurrencias)
      .set({ tildadaPorId: c.var.miembro!.id, tildadaEn: c.var.reloj.ahora() })
      .where(eq(ocurrencias.id, ocurrencia.id));
    return c.json({ ok: true });
  })

  .post("/ocurrencias/:id/destildar", validar("param", z.object({ id: z.coerce.number().int() })), async (c) => {
    const ocurrencia = await ocurrenciaEditable(c, c.req.valid("param").id);
    await c.var.db.update(ocurrencias).set({ tildadaPorId: null, tildadaEn: null }).where(eq(ocurrencias.id, ocurrencia.id));
    return c.json({ ok: true });
  });

/** La Ocurrencia, si el Miembro actual puede tildarla o destildarla. */
async function ocurrenciaEditable(c: Ctx, id: number) {
  const miembro = exigirMiembro(c);
  const ocurrencia = await c.var.db.query.ocurrencias.findFirst({ where: eq(ocurrencias.id, id) });
  if (!ocurrencia) fallar("no_encontrado", "Esa Ocurrencia no existe");
  if (miembro.rol === "chico") {
    if (ocurrencia.miembroId !== miembro.id) fallar("prohibido", "Solo podés tildar tus propias Tareas");
    const { hoy } = await hoyDeLaFamilia(c);
    if (periodoTerminado(ocurrencia, hoy)) fallar("prohibido", "Ese Período ya terminó");
  } else if (ocurrencia.miembroId !== miembro.id) {
    // Tildar por otro es una acción de Adulto (se hace desde la Vista Familia).
    exigirAdulto(c);
  }
  return ocurrencia;
}

