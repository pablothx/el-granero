import { crearApp, type Dependencias } from "./app";
import { correrProgramadas } from "./programadas";

export function crearWorker(dependencias: Dependencias) {
  const app = crearApp(dependencias);
  return {
    fetch: app.fetch,
    async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
      ctx.waitUntil(correrProgramadas(env, dependencias.reloj));
    },
  } satisfies ExportedHandler<Env>;
}
