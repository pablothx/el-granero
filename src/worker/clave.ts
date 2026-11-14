import { eq } from "drizzle-orm";
import { intentosClave } from "../shared/esquema";
import type { Ctx } from "./contexto";
import { verificarSecreto } from "./cripto";
import { fallar } from "./errores";

export const MAX_FALLOS_CLAVE = 5;
export const DURACION_BLOQUEO_CLAVE_MS = 15 * 60_000;

/**
 * Verifica la Clave de la casa. Se cuenta por IP porque quien la usa todavía
 * no tiene un Dispositivo vinculado: después de 5 fallos seguidos, esa IP
 * queda bloqueada 15 minutos. Un acierto reinicia el contador.
 */
export async function verificarClave(c: Ctx, clave: string, claveHash: string) {
  const db = c.var.db;
  const ahora = c.var.reloj.ahora();
  const ip = c.req.header("cf-connecting-ip") ?? "desconocida";
  const intento = await db.query.intentosClave.findFirst({ where: eq(intentosClave.ip, ip) });

  if (intento?.bloqueadoHasta && intento.bloqueadoHasta > ahora) {
    fallar("bloqueado", "Demasiados intentos. Esperá unos minutos.", { hasta: intento.bloqueadoHasta.toISOString() });
  }
  if (await verificarSecreto(clave, claveHash)) {
    if (intento) await db.delete(intentosClave).where(eq(intentosClave.ip, ip));
    return;
  }

  const fallos = (intento?.bloqueadoHasta ? 0 : (intento?.fallos ?? 0)) + 1;
  const bloqueadoHasta = fallos >= MAX_FALLOS_CLAVE ? new Date(ahora.getTime() + DURACION_BLOQUEO_CLAVE_MS) : null;
  await db
    .insert(intentosClave)
    .values({ ip, fallos, bloqueadoHasta })
    .onConflictDoUpdate({ target: intentosClave.ip, set: { fallos, bloqueadoHasta } });
  if (bloqueadoHasta) fallar("bloqueado", "Demasiados intentos. Esperá unos minutos.", { hasta: bloqueadoHasta.toISOString() });
  fallar("clave_incorrecta", "La Clave de la casa no es correcta");
}
