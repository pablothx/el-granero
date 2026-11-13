import { exigirMiembro, type Ctx, type Miembro } from "./contexto";
import { fallar } from "./errores";

/** Las acciones de Adulto exigen haber puesto el PIN hace menos de esto. */
export const VENTANA_REINGRESO_MS = 5 * 60_000;

/** Exige que el último ingreso del PIN de la sesión sea reciente. */
export function exigirReingresoReciente(c: Ctx) {
  const sesion = c.var.sesion!;
  if (c.var.reloj.ahora().getTime() - sesion.ultimoPinAt.getTime() > VENTANA_REINGRESO_MS) {
    fallar("reingreso_requerido", "Volvé a poner tu PIN para seguir");
  }
}

/** Un Adulto con la sesión abierta y reingreso reciente del PIN. */
export function exigirAdulto(c: Ctx): Miembro {
  const miembro = exigirMiembro(c);
  if (miembro.rol !== "adulto") fallar("prohibido", "Solo un Adulto puede hacer esto");
  exigirReingresoReciente(c);
  return miembro;
}
