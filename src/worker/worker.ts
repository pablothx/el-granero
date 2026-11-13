import { crearApp, type Dependencias } from "./app";

export function crearWorker(dependencias: Dependencias) {
  const app = crearApp(dependencias);
  return {
    fetch: app.fetch,
    // Cron diario a las 00:05 hora de la Familia. Todavía no hace nada:
    // los tickets 06 (Ocurrencias) y 09 (Ítems Comprados) le agregan trabajo.
    async scheduled(_controller: ScheduledController, _env: Env, _ctx: ExecutionContext) {},
  } satisfies ExportedHandler<Env>;
}
