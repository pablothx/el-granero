import { z } from "zod";

export const ROLES = ["adulto", "chico"] as const;
export type Rol = (typeof ROLES)[number];

export const EMOJIS_AVATAR = [
  "🐶", "🐱", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐸", "🐵",
  "🐰", "🐷", "🐮", "🐔", "🐧", "🦄", "🐢", "🐙", "🦉", "🐝",
] as const;

export const COLORES_AVATAR = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e",
  "#14b8a6", "#0ea5e9", "#3b82f6", "#8b5cf6", "#ec4899",
] as const;

export const pinSchema = z.string().regex(/^\d{4}$/, "El PIN tiene que tener 4 dígitos");
export const nombreSchema = z.string().trim().min(1, "Falta el nombre").max(40);
export const avatarSchema = z.object({
  emoji: z.enum(EMOJIS_AVATAR),
  color: z.enum(COLORES_AVATAR),
});

export function esZonaHorariaValida(zona: string): boolean {
  try {
    new Intl.DateTimeFormat("es-AR", { timeZone: zona });
    return true;
  } catch {
    return false;
  }
}

export const zonaHorariaSchema = z.string().refine(esZonaHorariaValida, "Zona horaria inválida");

export const claveSchema = z.string().min(6, "La Clave de la casa tiene que tener al menos 6 caracteres").max(100);

/** Lo que el cliente sabe del Miembro que tiene la sesión abierta. */
export interface MiembroPublico {
  id: number;
  nombre: string;
  rol: Rol;
  emoji: string;
  color: string;
}

/** Códigos de error que devuelve la API, en `{ error, mensaje }`. */
export type CodigoError =
  | "validacion"
  | "no_vinculado"
  | "sin_sesion"
  | "prohibido"
  | "reingreso_requerido"
  | "pin_incorrecto"
  | "bloqueado"
  | "clave_incorrecta"
  | "token_incorrecto"
  | "conflicto"
  | "no_encontrado";
