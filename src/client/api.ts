import { hc } from "hono/client";
import type { CodigoError } from "../shared/dominio";
import type { AppType } from "../worker/app";

/** Cliente RPC de la API: los tipos de cada endpoint vienen directo del Worker. */
export const api = hc<AppType>("/").api;

export type CodigoErrorCliente = CodigoError | "sin_conexion" | "interno";

export class ErrorApi extends Error {
  constructor(
    readonly codigo: CodigoErrorCliente,
    mensaje: string,
    readonly datos: Record<string, unknown> = {},
  ) {
    super(mensaje);
  }
}

export const MENSAJE_SIN_CONEXION = "Sin conexión: no se guardó. Probá de nuevo cuando vuelva la señal.";

type Llamada<T> = () => Promise<{ ok: boolean; json(): Promise<T> }>;

/** Hace una llamada a la API; si falla, tira un ErrorApi con el código de la API. */
export async function pedir<T>(llamada: Llamada<T>): Promise<T> {
  if (typeof navigator !== "undefined" && !navigator.onLine) throw new ErrorApi("sin_conexion", MENSAJE_SIN_CONEXION);
  let respuesta: Awaited<ReturnType<Llamada<T>>>;
  try {
    respuesta = await llamada();
  } catch {
    throw new ErrorApi("sin_conexion", MENSAJE_SIN_CONEXION);
  }
  if (!respuesta.ok) {
    const datos = (await respuesta.json().catch(() => ({}))) as { error?: CodigoErrorCliente; mensaje?: string };
    throw new ErrorApi(datos.error ?? "interno", datos.mensaje ?? "Algo salió mal", datos as Record<string, unknown>);
  }
  return respuesta.json();
}

export function mensajeDeError(error: unknown): string {
  return error instanceof Error ? error.message : "Algo salió mal";
}
