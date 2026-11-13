import type { Ctx, Miembro } from "./contexto";
import { exigirMiembro } from "./contexto";
import { fallar } from "./errores";

/** Un Adulto con la sesión abierta. */
export function exigirAdulto(c: Ctx): Miembro {
  const miembro = exigirMiembro(c);
  if (miembro.rol !== "adulto") fallar("prohibido", "Solo un Adulto puede hacer esto");
  return miembro;
}
