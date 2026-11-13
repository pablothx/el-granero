import { and, asc, eq, gt, inArray, lte } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { miembros, ocurrencias, tareas } from "../shared/esquema";
import {
  estadoDe,
  fechaLocal,
  FRECUENCIAS,
  mascaraADias,
  periodoDe,
  tipoDePeriodo,
  type EstadoOcurrencia,
  type Fecha,
  type Frecuencia,
} from "../shared/periodos";
import type { Db } from "./contexto";

export type Tarea = typeof tareas.$inferSelect;

export function reglaDe(tarea: Pick<Tarea, "frecuencia" | "diasSemana">) {
  return { frecuencia: tarea.frecuencia, dias: mascaraADias(tarea.diasSemana) };
}

// D1 acepta hasta 100 parámetros por consulta; cada Ocurrencia usa 4.
const LOTE = 20;

/**
 * Asegura que exista la Ocurrencia del Período actual de cada Tarea activa
 * (o de las indicadas). Idempotente: la clave única (Tarea, inicio) evita duplicados.
 */
export async function asegurarOcurrencias(db: Db, hoy: Fecha, tareaIds?: number[]) {
  const condiciones = [eq(tareas.archivada, false)];
  if (tareaIds) {
    if (tareaIds.length === 0) return;
    condiciones.push(inArray(tareas.id, tareaIds));
  }
  const activas = await db.select().from(tareas).where(and(...condiciones));
  const filas = activas.flatMap((t) => {
    const periodo = periodoDe(reglaDe(t), hoy);
    return periodo ? [{ tareaId: t.id, miembroId: t.miembroId, ...periodo }] : [];
  });
  for (let i = 0; i < filas.length; i += LOTE) {
    await db.insert(ocurrencias).values(filas.slice(i, i + LOTE)).onConflictDoNothing();
  }
}

/** Borra la Ocurrencia Pendiente del Período en curso de una Tarea (sin tilde). */
export async function descartarPendienteActual(db: Db, tareaId: number, hoy: Fecha) {
  const actuales = await db
    .select()
    .from(ocurrencias)
    .where(and(eq(ocurrencias.tareaId, tareaId), lte(ocurrencias.inicio, hoy), gt(ocurrencias.fin, hoy)));
  const pendientes = actuales.filter((o) => !o.tildadaEn).map((o) => o.id);
  if (pendientes.length) await db.delete(ocurrencias).where(inArray(ocurrencias.id, pendientes));
}

export interface OcurrenciaVista {
  id: number;
  tareaId: number;
  nombre: string;
  emoji: string | null;
  tipo: Frecuencia;
  estado: EstadoOcurrencia;
  inicio: Fecha;
  fin: Fecha;
  miembroId: number;
  tildadaEn: string | null;
  tildadaPor: { id: number; nombre: string } | null;
}

const tildador = alias(miembros, "tildador");

async function cargarVistas(db: Db, zonaHoraria: string, hoy: Fecha, condicion: ReturnType<typeof and>) {
  const filas = await db
    .select({ o: ocurrencias, t: tareas, por: { id: tildador.id, nombre: tildador.nombre } })
    .from(ocurrencias)
    .innerJoin(tareas, eq(tareas.id, ocurrencias.tareaId))
    .leftJoin(tildador, eq(tildador.id, ocurrencias.tildadaPorId))
    .where(condicion)
    .orderBy(asc(ocurrencias.inicio));
  return filas.map(({ o, t, por }) => ({
    vista: {
      id: o.id,
      tareaId: t.id,
      nombre: t.nombre,
      emoji: t.emoji,
      tipo: tipoDePeriodo(o),
      estado: estadoDe(o, hoy),
      inicio: o.inicio,
      fin: o.fin,
      miembroId: o.miembroId,
      tildadaEn: o.tildadaEn?.toISOString() ?? null,
      tildadaPor: por?.id ? { id: por.id, nombre: por.nombre! } : null,
    } satisfies OcurrenciaVista,
    tildadaHoy: o.tildadaEn ? fechaLocal(o.tildadaEn, zonaHoraria) === hoy : false,
  }));
}

const ORDEN_TIPO: Record<Frecuencia, number> = Object.fromEntries(FRECUENCIAS.map((f, i) => [f, i])) as Record<Frecuencia, number>;

function ordenarHoy(a: OcurrenciaVista, b: OcurrenciaVista) {
  const cumplidaA = a.estado === "cumplida" ? 1 : 0;
  const cumplidaB = b.estado === "cumplida" ? 1 : 0;
  return cumplidaA - cumplidaB || ORDEN_TIPO[a.tipo] - ORDEN_TIPO[b.tipo] || a.nombre.localeCompare(b.nombre, "es");
}

/**
 * Hoy de un Miembro: Ocurrencias de los Períodos en curso de Tareas activas.
 * Las Cumplidas solo aparecen el día en que se tildaron.
 */
export async function listarHoy(db: Db, miembroId: number, hoy: Fecha, zonaHoraria: string): Promise<OcurrenciaVista[]> {
  const filas = await cargarVistas(
    db,
    zonaHoraria,
    hoy,
    and(eq(ocurrencias.miembroId, miembroId), lte(ocurrencias.inicio, hoy), gt(ocurrencias.fin, hoy), eq(tareas.archivada, false)),
  );
  return filas
    .filter(({ vista, tildadaHoy }) => vista.estado === "pendiente" || tildadaHoy)
    .map(({ vista }) => vista)
    .sort(ordenarHoy);
}

/** Ocurrencias de Períodos ya terminados de un Miembro, desde `desde` (para corregirlas). */
export async function listarTerminadas(db: Db, miembroId: number, desde: Fecha, hoy: Fecha, zonaHoraria: string) {
  const filas = await cargarVistas(
    db,
    zonaHoraria,
    hoy,
    and(eq(ocurrencias.miembroId, miembroId), lte(ocurrencias.fin, hoy), gt(ocurrencias.fin, desde)),
  );
  return filas.map(({ vista }) => vista).sort((a, b) => b.inicio.localeCompare(a.inicio) || a.nombre.localeCompare(b.nombre, "es"));
}
