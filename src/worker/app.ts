import { Hono } from "hono";
import { cargarContexto, type Entorno } from "./contexto";
import { manejarError } from "./errores";
import type { Reloj } from "./reloj";
import { rutasAcceso } from "./rutas/acceso";
import { rutasTareas } from "./rutas/tareas";

export interface Dependencias {
  reloj: Reloj;
}

export function crearApp({ reloj }: Dependencias) {
  return new Hono<Entorno>()
    .basePath("/api")
    .onError(manejarError)
    .use(cargarContexto(reloj))
    .route("/", rutasAcceso)
    .route("/", rutasTareas);
}

export type AppType = ReturnType<typeof crearApp>;
