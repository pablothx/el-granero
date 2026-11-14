import { createExecutionContext, createScheduledController, waitOnExecutionContext } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { crearWorker } from "../src/worker/worker";
import { relojFijo, type RelojFijo } from "./reloj-fijo";

export const TOKEN = "token-de-prueba";
export const CLAVE = "clave-de-la-casa";
export const ZONA = "America/Argentina/Buenos_Aires";
export const MINUTO = 60_000;
export const HORA = 60 * MINUTO;
export const DIA = 24 * HORA;

const TABLAS = ["items", "ocurrencias", "tareas", "intentos_pin", "intentos_clave", "sesiones", "dispositivos", "miembros", "familia"];

export async function vaciarBase() {
  const existentes = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all<{ name: string }>();
  const nombres = new Set(existentes.results.map((t) => t.name));
  await env.DB.batch(TABLAS.filter((t) => nombres.has(t)).map((t) => env.DB.prepare(`DELETE FROM ${t}`)));
}

export type Respuesta<T = any> = { status: number; cuerpo: T };

/**
 * Un "dispositivo" de prueba: guarda sus propias cookies entre requests,
 * como un navegador.
 */
export class Dispositivo {
  private cookies = new Map<string, string>();
  constructor(
    readonly sistema: Sistema,
    /** IP desde la que pide, como la informa Cloudflare en CF-Connecting-IP. */
    readonly ip = "203.0.113.1",
  ) {}

  async pedir<T = any>(metodo: string, ruta: string, cuerpo?: unknown): Promise<Respuesta<T>> {
    const headers = new Headers({ "cf-connecting-ip": this.ip });
    if (cuerpo !== undefined) headers.set("content-type", "application/json");
    if (this.cookies.size) headers.set("cookie", [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; "));
    const ctx = createExecutionContext();
    const respuesta = await this.sistema.worker.fetch(
      new Request(`https://el-granero.test/api${ruta}`, {
        method: metodo,
        headers,
        body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      }),
      env,
      ctx,
    );
    await waitOnExecutionContext(ctx);
    for (const linea of respuesta.headers.getSetCookie()) {
      const [par, ...atributos] = linea.split(";");
      const [nombre, ...valor] = par!.split("=");
      const borrar = atributos.some((a) => /max-age=0\b/i.test(a.trim()));
      if (borrar || valor.join("=") === "") this.cookies.delete(nombre!.trim());
      else this.cookies.set(nombre!.trim(), valor.join("="));
    }
    const texto = await respuesta.text();
    return { status: respuesta.status, cuerpo: texto ? JSON.parse(texto) : null };
  }

  get = <T = any>(ruta: string) => this.pedir<T>("GET", ruta);
  post = <T = any>(ruta: string, cuerpo: unknown = {}) => this.pedir<T>("POST", ruta, cuerpo);
  patch = <T = any>(ruta: string, cuerpo: unknown = {}) => this.pedir<T>("PATCH", ruta, cuerpo);
  delete = <T = any>(ruta: string) => this.pedir<T>("DELETE", ruta);

  async entrar(miembroId: number, pin: string) {
    return this.post("/entrar", { miembroId, pin });
  }
}

/** El Worker bajo prueba, con su reloj fijo. */
export class Sistema {
  readonly worker: ReturnType<typeof crearWorker>;
  constructor(readonly reloj: RelojFijo) {
    this.worker = crearWorker({ reloj });
  }

  dispositivo({ ip }: { ip?: string } = {}) {
    return new Dispositivo(this, ip);
  }

  async correrCron() {
    const ctx = createExecutionContext();
    await this.worker.scheduled(createScheduledController({ cron: "5 3 * * *" }), env, ctx);
    await waitOnExecutionContext(ctx);
  }
}

export interface FamiliaDePrueba {
  sistema: Sistema;
  reloj: RelojFijo;
  /** Dispositivo del Adulto que hizo la configuración inicial, con la sesión abierta. */
  casa: Dispositivo;
  adultoId: number;
}

/** Arranca con la configuración inicial hecha: un Adulto "Mamá" con PIN 1111. */
export async function familiaConfigurada(ahora = "2026-11-16T10:00:00-03:00"): Promise<FamiliaDePrueba> {
  const reloj = relojFijo(ahora);
  const sistema = new Sistema(reloj);
  const casa = sistema.dispositivo();
  const r = await casa.post("/configuracion-inicial", {
    token: TOKEN,
    clave: CLAVE,
    zonaHoraria: ZONA,
    nombreDispositivo: "Celular de Mamá",
    adulto: { nombre: "Mamá", avatar: { emoji: "🦊", color: "#f97316" }, pin: "1111" },
  });
  if (r.status !== 201) throw new Error(`configuración inicial falló: ${JSON.stringify(r.cuerpo)}`);
  return { sistema, reloj, casa, adultoId: r.cuerpo.miembro.id };
}

export async function crearTarea(
  d: Dispositivo,
  datos: { nombre: string; miembroId: number; frecuencia?: "diaria" | "semanal" | "mensual"; dias?: number[]; emoji?: string },
) {
  const r = await d.post("/tareas", { frecuencia: "diaria", dias: [], ...datos });
  if (r.status !== 201) throw new Error(`crear Tarea falló: ${JSON.stringify(r.cuerpo)}`);
  return r.cuerpo.tarea as { id: number };
}

export async function hoy(d: Dispositivo, ruta = "/hoy") {
  const r = await d.get(ruta);
  if (r.status !== 200) throw new Error(`Hoy falló: ${JSON.stringify(r.cuerpo)}`);
  return r.cuerpo as { fecha: string; ocurrencias: Array<{ id: number; nombre: string; tipo: string; estado: string; tildadaPor: { nombre: string } | null; tildadaEn: string | null; inicio: string; fin: string }> };
}

export async function crearMiembro(
  d: Dispositivo,
  datos: { nombre: string; rol?: "adulto" | "chico"; pin?: string; emoji?: string; color?: string },
) {
  const r = await d.post("/miembros", {
    nombre: datos.nombre,
    rol: datos.rol ?? "chico",
    pin: datos.pin ?? "2222",
    avatar: { emoji: datos.emoji ?? "🐶", color: datos.color ?? "#3b82f6" },
  });
  if (r.status !== 201) throw new Error(`crear Miembro falló: ${JSON.stringify(r.cuerpo)}`);
  return r.cuerpo.miembro.id as number;
}

/** Un dispositivo nuevo, vinculado con la Clave de la casa y con la sesión del Miembro abierta. */
export async function dispositivoDe(sistema: Sistema, miembroId: number, pin: string) {
  const d = sistema.dispositivo();
  await d.post("/vincular", { clave: CLAVE, nombre: "Otro" });
  const r = await d.entrar(miembroId, pin);
  if (r.status !== 200) throw new Error(`entrar falló: ${JSON.stringify(r.cuerpo)}`);
  return d;
}
