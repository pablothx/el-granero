import { and, eq } from "drizzle-orm";
import { intentosPin } from "../shared/esquema";
import type { Ctx, Miembro } from "./contexto";
import { verificarSecreto } from "./cripto";
import { fallar } from "./errores";

export const MAX_FALLOS = 5;
export const DURACION_BLOQUEO_MS = 5 * 60_000;

/**
 * Verifica el PIN de un Miembro en un Dispositivo vinculado. Después de 5
 * fallos seguidos, ese Miembro queda bloqueado 5 minutos en ese dispositivo.
 * Un ingreso correcto reinicia el contador.
 */
export async function verificarPin(c: Ctx, dispositivoId: number, miembro: Miembro, pin: string) {
  const db = c.var.db;
  const ahora = c.var.reloj.ahora();
  const clave = and(eq(intentosPin.dispositivoId, dispositivoId), eq(intentosPin.miembroId, miembro.id));
  const intento = await db.query.intentosPin.findFirst({ where: clave });

  if (intento?.bloqueadoHasta && intento.bloqueadoHasta > ahora) {
    fallar("bloqueado", "Demasiados intentos. Esperá unos minutos.", { hasta: intento.bloqueadoHasta.toISOString() });
  }
  if (await verificarSecreto(pin, miembro.pinHash)) {
    if (intento) await db.delete(intentosPin).where(clave);
    return;
  }

  const fallos = (intento?.bloqueadoHasta ? 0 : (intento?.fallos ?? 0)) + 1;
  const bloqueadoHasta = fallos >= MAX_FALLOS ? new Date(ahora.getTime() + DURACION_BLOQUEO_MS) : null;
  await db
    .insert(intentosPin)
    .values({ dispositivoId, miembroId: miembro.id, fallos, bloqueadoHasta })
    .onConflictDoUpdate({ target: [intentosPin.dispositivoId, intentosPin.miembroId], set: { fallos, bloqueadoHasta } });
  if (bloqueadoHasta) fallar("bloqueado", "Demasiados intentos. Esperá unos minutos.", { hasta: bloqueadoHasta.toISOString() });
  fallar("pin_incorrecto", "PIN incorrecto", { intentosRestantes: MAX_FALLOS - fallos });
}

/** Después de cambiar un PIN, se olvidan sus intentos fallidos. */
export async function olvidarIntentos(c: Ctx, miembroId: number) {
  await c.var.db.delete(intentosPin).where(eq(intentosPin.miembroId, miembroId));
}
