import { createExecutionContext, createScheduledController, waitOnExecutionContext } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { crearWorker } from "../src/worker/worker";
import { relojFijo } from "./reloj-fijo";

function pedir(worker: ReturnType<typeof crearWorker>, ruta: string) {
  const ctx = createExecutionContext();
  return worker.fetch(new Request(`https://el-granero.test${ruta}`), env, ctx);
}

describe("esqueleto", () => {
  it("la API lee de D1 y responde con la hora del reloj", async () => {
    const worker = crearWorker({ reloj: relojFijo("2026-11-17T23:59:00-03:00") });

    const respuesta = await pedir(worker, "/api/estado");

    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual({
      app: "El Granero",
      familiaConfigurada: false,
      ahora: "2026-11-18T02:59:00.000Z",
    });
  });

  it("el reloj se puede avanzar entre requests", async () => {
    const reloj = relojFijo("2026-11-17T23:59:00-03:00");
    const worker = crearWorker({ reloj });

    reloj.avanzar(2 * 60 * 1000);
    const cuerpo = (await (await pedir(worker, "/api/estado")).json()) as { ahora: string };

    expect(cuerpo.ahora).toBe("2026-11-18T03:01:00.000Z");
  });

  it("el Cron se puede disparar", async () => {
    const worker = crearWorker({ reloj: relojFijo("2026-11-18T03:05:00Z") });
    const ctx = createExecutionContext();

    await worker.scheduled(createScheduledController({ cron: "5 3 * * *" }), env, ctx);
    await waitOnExecutionContext(ctx);
  });
});
