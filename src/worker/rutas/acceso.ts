import { and, count, eq } from "drizzle-orm";
import { Hono } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
import { z } from "zod";
import {
  avatarSchema,
  claveSchema,
  nombreSchema,
  pinSchema,
  zonaHorariaSchema,
  type MiembroPublico,
} from "../../shared/dominio";
import { dispositivos, familia, miembros, sesiones } from "../../shared/esquema";
import { generarToken, hashSecreto, hashToken, verificarSecreto } from "../cripto";
import {
  COOKIE_DISPOSITIVO,
  COOKIE_SESION,
  OPCIONES_COOKIE,
  exigirDispositivo,
  obtenerFamilia,
  validar,
  type Ctx,
  type Db,
  type Entorno,
  type Miembro,
} from "../contexto";
import { fallar } from "../errores";

export function aMiembroPublico(m: Miembro): MiembroPublico {
  return { id: m.id, nombre: m.nombre, rol: m.rol, emoji: m.avatarEmoji, color: m.avatarColor };
}

const nombreDispositivoSchema = z.string().trim().min(1).max(60).default("Dispositivo");

async function hayMiembros(db: Db) {
  const [fila] = await db.select({ total: count() }).from(miembros);
  return (fila?.total ?? 0) > 0;
}

export async function vincularDispositivo(c: Ctx, nombre: string) {
  const token = generarToken();
  const ahora = c.var.reloj.ahora();
  const [dispositivo] = await c.var.db
    .insert(dispositivos)
    .values({ tokenHash: await hashToken(token), nombre, createdAt: ahora, ultimoUsoAt: ahora })
    .returning();
  setCookie(c, COOKIE_DISPOSITIVO, token, OPCIONES_COOKIE);
  return dispositivo!;
}

export async function abrirSesion(c: Ctx, dispositivoId: number, miembroId: number) {
  const token = generarToken();
  const ahora = c.var.reloj.ahora();
  await c.var.db
    .insert(sesiones)
    .values({ tokenHash: await hashToken(token), dispositivoId, miembroId, ultimoPinAt: ahora, createdAt: ahora });
  setCookie(c, COOKIE_SESION, token, OPCIONES_COOKIE);
}

export const rutasAcceso = new Hono<Entorno>()
  .get("/estado", async (c) => {
    const miembro = c.var.miembro;
    return c.json({
      familiaConfigurada: await hayMiembros(c.var.db),
      dispositivoVinculado: c.var.dispositivo !== null,
      miembro: miembro ? aMiembroPublico(miembro) : null,
    });
  })

  .post(
    "/configuracion-inicial",
    validar(
      "json",
      z.object({
        token: z.string(),
        clave: claveSchema,
        zonaHoraria: zonaHorariaSchema,
        nombreDispositivo: nombreDispositivoSchema,
        adulto: z.object({ nombre: nombreSchema, avatar: avatarSchema, pin: pinSchema }),
      }),
    ),
    async (c) => {
      const datos = c.req.valid("json");
      const db = c.var.db;
      if (await hayMiembros(db)) fallar("conflicto", "La Familia ya está configurada");
      const esperado = c.env.TOKEN_INSTALACION;
      if (!esperado || datos.token !== esperado) fallar("token_incorrecto", "El token de instalación no es correcto");

      const ahora = c.var.reloj.ahora();
      await db.delete(familia);
      await db.insert(familia).values({
        id: 1,
        zonaHoraria: datos.zonaHoraria,
        claveHash: await hashSecreto(datos.clave),
        createdAt: ahora,
      });
      const [adulto] = await db
        .insert(miembros)
        .values({
          nombre: datos.adulto.nombre,
          rol: "adulto",
          avatarEmoji: datos.adulto.avatar.emoji,
          avatarColor: datos.adulto.avatar.color,
          pinHash: await hashSecreto(datos.adulto.pin),
          createdAt: ahora,
        })
        .returning();
      const dispositivo = await vincularDispositivo(c, datos.nombreDispositivo);
      await abrirSesion(c, dispositivo.id, adulto!.id);
      return c.json({ miembro: aMiembroPublico(adulto!) }, 201);
    },
  )

  .post("/vincular", validar("json", z.object({ clave: z.string(), nombre: nombreDispositivoSchema })), async (c) => {
    const { clave, nombre } = c.req.valid("json");
    const configuracion = await obtenerFamilia(c.var.db);
    if (!(await verificarSecreto(clave, configuracion.claveHash))) {
      fallar("clave_incorrecta", "La Clave de la casa no es correcta");
    }
    await vincularDispositivo(c, nombre);
    return c.json({ vinculado: true }, 201);
  })

  .get("/avatares", async (c) => {
    exigirDispositivo(c);
    const activos = await c.var.db.query.miembros.findMany({
      where: eq(miembros.archivado, false),
      orderBy: (m, { asc }) => [asc(m.nombre)],
    });
    return c.json({ miembros: activos.map(aMiembroPublico) });
  })

  .post("/entrar", validar("json", z.object({ miembroId: z.number().int(), pin: z.string() })), async (c) => {
    const dispositivo = exigirDispositivo(c);
    const { miembroId, pin } = c.req.valid("json");
    const miembro = await c.var.db.query.miembros.findFirst({
      where: and(eq(miembros.id, miembroId), eq(miembros.archivado, false)),
    });
    if (!miembro) fallar("no_encontrado", "Ese Miembro no existe");
    if (!(await verificarSecreto(pin, miembro.pinHash))) fallar("pin_incorrecto", "PIN incorrecto");
    await abrirSesion(c, dispositivo.id, miembro.id);
    return c.json({ miembro: aMiembroPublico(miembro) });
  })

  .post("/salir", async (c) => {
    if (c.var.sesion) await c.var.db.delete(sesiones).where(eq(sesiones.id, c.var.sesion.id));
    deleteCookie(c, COOKIE_SESION, OPCIONES_COOKIE);
    return c.json({ ok: true });
  });
