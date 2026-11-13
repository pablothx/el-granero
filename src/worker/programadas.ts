import { drizzle } from "drizzle-orm/d1";
import * as esquema from "../shared/esquema";
import { fechaLocal } from "../shared/periodos";
import { asegurarOcurrencias } from "./ocurrencias";
import type { Reloj } from "./reloj";
import { borrarCompradosViejos } from "./rutas/listas";

/**
 * Lo que corre el Cron diario (00:05 hora de la Familia): genera las
 * Ocurrencias del Período nuevo, así un día sin uso de la app igual
 * queda registrado (ADR 0005), y borra los Ítems Comprados hace más de 24 h.
 */
export async function correrProgramadas(env: Env, reloj: Reloj) {
  const db = drizzle(env.DB, { schema: esquema });
  const familia = await db.query.familia.findFirst();
  if (!familia) return;
  const hoy = fechaLocal(reloj.ahora(), familia.zonaHoraria);
  await asegurarOcurrencias(db, hoy);
  await borrarCompradosViejos(db, reloj.ahora());
}
