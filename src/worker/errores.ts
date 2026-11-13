import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { CodigoError } from "../shared/dominio";

const ESTADOS: Record<CodigoError, ContentfulStatusCode> = {
  validacion: 400,
  no_vinculado: 401,
  sin_sesion: 401,
  pin_incorrecto: 401,
  clave_incorrecta: 401,
  token_incorrecto: 401,
  prohibido: 403,
  reingreso_requerido: 403,
  no_encontrado: 404,
  conflicto: 409,
  bloqueado: 429,
};

export class ErrorDominio extends Error {
  constructor(
    readonly codigo: CodigoError,
    mensaje: string,
    readonly extra: Record<string, unknown> = {},
  ) {
    super(mensaje);
  }
}

export function fallar(codigo: CodigoError, mensaje: string, extra?: Record<string, unknown>): never {
  throw new ErrorDominio(codigo, mensaje, extra);
}

export function manejarError(error: Error, c: Context) {
  if (error instanceof ErrorDominio) {
    return c.json({ error: error.codigo, mensaje: error.message, ...error.extra }, ESTADOS[error.codigo]);
  }
  if (error instanceof HTTPException) return error.getResponse();
  console.error(error);
  return c.json({ error: "interno", mensaje: "Algo salió mal" }, 500);
}
