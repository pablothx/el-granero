import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import type { Context, MiddlewareHandler, ValidationTargets } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import type { ZodType } from "zod";
import * as esquema from "../shared/esquema";
import { dispositivos, familia, miembros, sesiones } from "../shared/esquema";
import { hashToken } from "./cripto";
import { fallar } from "./errores";
import type { Reloj } from "./reloj";

export type Db = DrizzleD1Database<typeof esquema>;
export type Dispositivo = typeof dispositivos.$inferSelect;
export type Sesion = typeof sesiones.$inferSelect;
export type Miembro = typeof miembros.$inferSelect;

export interface Entorno {
  Bindings: Env;
  Variables: {
    db: Db;
    reloj: Reloj;
    dispositivo: Dispositivo | null;
    sesion: Sesion | null;
    miembro: Miembro | null;
  };
}

export type Ctx = Context<Entorno>;

export const COOKIE_DISPOSITIVO = "granero_dispositivo";
export const COOKIE_SESION = "granero_sesion";
export const OPCIONES_COOKIE = {
  httpOnly: true,
  secure: true,
  sameSite: "Strict",
  path: "/",
  // Es el máximo que aceptan los navegadores; las cookies se renuevan con el uso,
  // así que en la práctica no vencen (spec: la sesión no vence).
  maxAge: 60 * 60 * 24 * 400,
} as const;

/** Resuelve base, reloj, Dispositivo vinculado, sesión y Miembro de cada request. */
export function cargarContexto(reloj: Reloj): MiddlewareHandler<Entorno> {
  return async (c, next) => {
    const db = drizzle(c.env.DB, { schema: esquema });
    c.set("db", db);
    c.set("reloj", reloj);
    c.set("dispositivo", null);
    c.set("sesion", null);
    c.set("miembro", null);

    const tokenDispositivo = getCookie(c, COOKIE_DISPOSITIVO);
    if (tokenDispositivo) {
      const dispositivo = await db.query.dispositivos.findFirst({
        where: eq(dispositivos.tokenHash, await hashToken(tokenDispositivo)),
      });
      if (dispositivo) {
        c.set("dispositivo", dispositivo);
        const ahora = reloj.ahora();
        // Para no escribir en cada request, el último uso se actualiza como mucho una vez por minuto.
        const renovar = ahora.getTime() - dispositivo.ultimoUsoAt.getTime() > 60_000;
        if (renovar) {
          await db.update(dispositivos).set({ ultimoUsoAt: ahora }).where(eq(dispositivos.id, dispositivo.id));
          setCookie(c, COOKIE_DISPOSITIVO, tokenDispositivo, OPCIONES_COOKIE);
        }
        const tokenSesion = getCookie(c, COOKIE_SESION);
        if (tokenSesion) {
          const sesion = await db.query.sesiones.findFirst({
            where: and(eq(sesiones.tokenHash, await hashToken(tokenSesion)), eq(sesiones.dispositivoId, dispositivo.id)),
          });
          const miembro =
            sesion &&
            (await db.query.miembros.findFirst({
              where: and(eq(miembros.id, sesion.miembroId), eq(miembros.archivado, false)),
            }));
          if (sesion && miembro) {
            c.set("sesion", sesion);
            c.set("miembro", miembro);
            if (renovar) setCookie(c, COOKIE_SESION, tokenSesion, OPCIONES_COOKIE);
          }
        }
      }
    }
    await next();
  };
}

export function exigirDispositivo(c: Ctx): Dispositivo {
  return c.var.dispositivo ?? fallar("no_vinculado", "Este dispositivo no está vinculado");
}

export function exigirMiembro(c: Ctx): Miembro {
  exigirDispositivo(c);
  return c.var.miembro ?? fallar("sin_sesion", "Tenés que entrar con tu PIN");
}

export async function obtenerFamilia(db: Db) {
  return (await db.query.familia.findFirst({ where: eq(familia.id, 1) })) ?? fallar("no_encontrado", "La Familia no está configurada");
}

/** zValidator que responde con el formato de error de la API. */
export function validar<Target extends keyof ValidationTargets, S extends ZodType>(target: Target, schema: S) {
  return zValidator(target, schema, (resultado) => {
    if (!resultado.success) fallar("validacion", resultado.error.issues[0]?.message ?? "Datos inválidos");
  });
}
