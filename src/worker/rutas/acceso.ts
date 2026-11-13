import { and, count, eq, ne } from "drizzle-orm";
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
import { olvidarIntentos, verificarPin } from "../pin";
import { exigirAdulto } from "../permisos";

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
    await verificarPin(c, dispositivo.id, miembro, pin);
    await abrirSesion(c, dispositivo.id, miembro.id);
    return c.json({ miembro: aMiembroPublico(miembro) });
  })

  /** Si hay un solo Adulto activo, puede poner un PIN nuevo con la Clave de la casa. */
  .post(
    "/restablecer-pin",
    validar("json", z.object({ miembroId: z.number().int(), clave: z.string(), pin: pinSchema })),
    async (c) => {
      exigirDispositivo(c);
      const { miembroId, clave, pin } = c.req.valid("json");
      const db = c.var.db;
      const adultos = await db.query.miembros.findMany({ where: and(eq(miembros.rol, "adulto"), eq(miembros.archivado, false)) });
      if (adultos.length !== 1 || adultos[0]!.id !== miembroId) {
        fallar("prohibido", "Pedile a un Adulto que te ponga un PIN nuevo");
      }
      const configuracion = await obtenerFamilia(db);
      if (!(await verificarSecreto(clave, configuracion.claveHash))) fallar("clave_incorrecta", "La Clave de la casa no es correcta");
      await db.update(miembros).set({ pinHash: await hashSecreto(pin) }).where(eq(miembros.id, miembroId));
      await olvidarIntentos(c, miembroId);
      return c.json({ ok: true });
    },
  )

  .get("/dispositivos", async (c) => {
    exigirAdulto(c);
    const todos = await c.var.db.query.dispositivos.findMany({ orderBy: (d, { desc }) => [desc(d.ultimoUsoAt)] });
    return c.json({
      dispositivos: todos.map((d) => ({
        id: d.id,
        nombre: d.nombre,
        ultimoUso: d.ultimoUsoAt.toISOString(),
        vinculado: d.createdAt.toISOString(),
        actual: d.id === c.var.dispositivo!.id,
      })),
    });
  })

  .delete("/dispositivos/:id", validar("param", z.object({ id: z.coerce.number().int() })), async (c) => {
    exigirAdulto(c);
    const { id } = c.req.valid("param");
    await c.var.db.delete(sesiones).where(eq(sesiones.dispositivoId, id));
    await c.var.db.delete(dispositivos).where(eq(dispositivos.id, id));
    return c.json({ ok: true });
  })

  /** Cambiar la Clave de la casa desvincula todos los dispositivos menos el actual. */
  .post("/clave", validar("json", z.object({ clave: claveSchema })), async (c) => {
    exigirAdulto(c);
    const actual = c.var.dispositivo!.id;
    await c.var.db.update(familia).set({ claveHash: await hashSecreto(c.req.valid("json").clave) }).where(eq(familia.id, 1));
    await c.var.db.delete(sesiones).where(ne(sesiones.dispositivoId, actual));
    await c.var.db.delete(dispositivos).where(ne(dispositivos.id, actual));
    return c.json({ ok: true });
  })

  .post("/salir", async (c) => {
    if (c.var.sesion) await c.var.db.delete(sesiones).where(eq(sesiones.id, c.var.sesion.id));
    deleteCookie(c, COOKIE_SESION, OPCIONES_COOKIE);
    return c.json({ ok: true });
  });
