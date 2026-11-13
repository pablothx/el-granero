import { Hono } from "hono";
import { cargarContexto, type Entorno } from "./contexto";
import { manejarError } from "./errores";
import type { Reloj } from "./reloj";
import { rutasAcceso } from "./rutas/acceso";

export interface Dependencias {
  reloj: Reloj;
}

export function crearApp({ reloj }: Dependencias) {
  return new Hono<Entorno>()
    .basePath("/api")
    .onError(manejarError)
    .use(cargarContexto(reloj))
    .route("/", rutasAcceso);
}

export type AppType = ReturnType<typeof crearApp>;
