import { describe, expect, it } from "vitest";
import { Sistema } from "./ayudantes";
import { relojFijo } from "./reloj-fijo";

describe("esqueleto", () => {
  it("la API lee de D1", async () => {
    const sistema = new Sistema(relojFijo("2026-11-17T23:59:00-03:00"));
    const r = await sistema.dispositivo().get("/estado");
    expect(r.status).toBe(200);
    expect(r.cuerpo).toEqual({ familiaConfigurada: false, dispositivoVinculado: false, miembro: null });
  });

  it("el Cron se puede disparar", async () => {
    await new Sistema(relojFijo("2026-11-18T03:05:00Z")).correrCron();
  });
});
