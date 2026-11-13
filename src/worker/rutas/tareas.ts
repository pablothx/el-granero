import { and, asc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { nombreSchema } from "../../shared/dominio";
import { miembros, ocurrencias, tareas } from "../../shared/esquema";
import { diasAMascara, FRECUENCIAS, fechaLocal, periodoTerminado, type DiaSemana } from "../../shared/periodos";
import { exigirMiembro, obtenerFamilia, validar, type Ctx, type Entorno } from "../contexto";
import { fallar } from "../errores";
import { asegurarOcurrencias, listarHoy, reglaDe, type Tarea } from "../ocurrencias";
import { exigirAdulto } from "../permisos";

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

  .get("/hoy", async (c) => {
    const miembro = exigirMiembro(c);
    const { hoy, zonaHoraria } = await hoyDeLaFamilia(c);
    await asegurarOcurrencias(c.var.db, hoy);
    return c.json({ fecha: hoy, ocurrencias: await listarHoy(c.var.db, miembro.id, hoy, zonaHoraria) });
  })

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
  }
  return ocurrencia;
}

