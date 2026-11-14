import { describe, expect, it } from "vitest";
import { CLAVE, familiaConfigurada, MINUTO, type Dispositivo } from "./ayudantes";

async function fallarCincoVeces(d: Dispositivo) {
  for (let i = 0; i < 5; i++) await d.post("/vincular", { clave: "adivino", nombre: "x" });
}

describe("límite de intentos de Clave de la casa", () => {
  it("5 Claves incorrectas desde una IP la bloquean para vincular", async () => {
    const f = await familiaConfigurada();
    const intruso = f.sistema.dispositivo({ ip: "198.51.100.7" });
    for (let i = 1; i <= 4; i++) {
      expect((await intruso.post("/vincular", { clave: "adivino", nombre: "x" })).cuerpo.error).toBe("clave_incorrecta");
    }
    const quinto = await intruso.post("/vincular", { clave: "adivino", nombre: "x" });
    expect(quinto.status).toBe(429);
    expect(quinto.cuerpo.error).toBe("bloqueado");

    // Bloqueada: ni la Clave correcta sirve.
    expect((await intruso.post("/vincular", { clave: CLAVE, nombre: "x" })).cuerpo.error).toBe("bloqueado");
  });

  it("el bloqueo es de esa IP y dura 15 minutos", async () => {
    const f = await familiaConfigurada();
    const intruso = f.sistema.dispositivo({ ip: "198.51.100.7" });
    await fallarCincoVeces(intruso);

    // Desde otra IP se puede vincular igual.
    expect((await f.sistema.dispositivo({ ip: "203.0.113.50" }).post("/vincular", { clave: CLAVE, nombre: "Tablet" })).status).toBe(201);

    f.reloj.avanzar(15 * MINUTO - 1000);
    expect((await intruso.post("/vincular", { clave: CLAVE, nombre: "x" })).cuerpo.error).toBe("bloqueado");
    f.reloj.avanzar(2000);
    expect((await intruso.post("/vincular", { clave: CLAVE, nombre: "x" })).status).toBe(201);
  });

  it("restablecer el PIN con la Clave comparte el mismo límite", async () => {
    const f = await familiaConfigurada();
    const tablet = f.sistema.dispositivo({ ip: "198.51.100.7" });
    await tablet.post("/vincular", { clave: CLAVE, nombre: "Tablet" });
    for (let i = 0; i < 4; i++) {
      expect((await tablet.post("/restablecer-pin", { miembroId: f.adultoId, clave: "adivino", pin: "2468" })).cuerpo.error).toBe("clave_incorrecta");
    }
    expect((await tablet.post("/vincular", { clave: "adivino", nombre: "x" })).cuerpo.error).toBe("bloqueado");
    expect((await tablet.post("/restablecer-pin", { miembroId: f.adultoId, clave: CLAVE, pin: "2468" })).cuerpo.error).toBe("bloqueado");
  });
});
