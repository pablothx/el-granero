import { Hono } from "hono";
import { cargarContexto, type Entorno } from "./contexto";
import { manejarError } from "./errores";
import type { Reloj } from "./reloj";
import { rutasAcceso } from "./rutas/acceso";
import { rutasListas } from "./rutas/listas";
import { rutasMiembros } from "./rutas/miembros";
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
    .route("/", rutasMiembros)
    .route("/", rutasTareas)
    .route("/", rutasListas);
}

export type AppType = ReturnType<typeof crearApp>;
