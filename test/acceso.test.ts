import { describe, expect, it } from "vitest";
import { CLAVE, Sistema, TOKEN, ZONA, familiaConfigurada } from "./ayudantes";
import { relojFijo } from "./reloj-fijo";

const configuracion = (cambios: Record<string, unknown> = {}) => ({
  token: TOKEN,
  clave: CLAVE,
  zonaHoraria: ZONA,
  nombreDispositivo: "Celular de Mamá",
  adulto: { nombre: "Mamá", avatar: { emoji: "🦊", color: "#f97316" }, pin: "1111" },
  ...cambios,
});

describe("configuración inicial", () => {
  it("exige el token de instalación", async () => {
    const d = new Sistema(relojFijo("2026-11-16T10:00:00-03:00")).dispositivo();
    const r = await d.post("/configuracion-inicial", configuracion({ token: "otro" }));
    expect(r.status).toBe(401);
    expect(r.cuerpo.error).toBe("token_incorrecto");
    expect((await d.get("/estado")).cuerpo.familiaConfigurada).toBe(false);
  });

  it("crea la Familia y el primer Adulto, vincula el dispositivo y abre la sesión", async () => {
    const d = new Sistema(relojFijo("2026-11-16T10:00:00-03:00")).dispositivo();
    const r = await d.post("/configuracion-inicial", configuracion());
    expect(r.status).toBe(201);

    const estado = (await d.get("/estado")).cuerpo;
    expect(estado).toMatchObject({
      familiaConfigurada: true,
      dispositivoVinculado: true,
      miembro: { nombre: "Mamá", rol: "adulto", emoji: "🦊", color: "#f97316" },
    });
  });

  it("solo se puede hacer una vez", async () => {
    const { sistema } = await familiaConfigurada();
    const r = await sistema.dispositivo().post("/configuracion-inicial", configuracion());
    expect(r.status).toBe(409);
  });

  it("valida el PIN y la zona horaria", async () => {
    const d = new Sistema(relojFijo("2026-11-16T10:00:00-03:00")).dispositivo();
    expect((await d.post("/configuracion-inicial", configuracion({ zonaHoraria: "Marte/Olimpo" }))).status).toBe(400);
    const pinCorto = configuracion({ adulto: { nombre: "Mamá", avatar: { emoji: "🦊", color: "#f97316" }, pin: "12" } });
    expect((await d.post("/configuracion-inicial", pinCorto)).status).toBe(400);
  });
});

describe("vincular un dispositivo", () => {
  it("sin vincular no se ve ningún dato de la Familia", async () => {
    const { sistema } = await familiaConfigurada();
    const extraño = sistema.dispositivo();
    expect((await extraño.get("/avatares")).status).toBe(401);
    expect((await extraño.get("/estado")).cuerpo).toEqual({
      familiaConfigurada: true,
      dispositivoVinculado: false,
      miembro: null,
    });
  });

  it("con la Clave de la casa incorrecta no se vincula", async () => {
    const { sistema } = await familiaConfigurada();
    const tablet = sistema.dispositivo();
    const r = await tablet.post("/vincular", { clave: "cualquiera", nombre: "Tablet" });
    expect(r.status).toBe(401);
    expect(r.cuerpo.error).toBe("clave_incorrecta");
    expect((await tablet.get("/avatares")).status).toBe(401);
  });

  it("con la Clave correcta se vincula y muestra los Avatares", async () => {
    const { sistema } = await familiaConfigurada();
    const tablet = sistema.dispositivo();
    expect((await tablet.post("/vincular", { clave: CLAVE, nombre: "Tablet" })).status).toBe(201);
    const r = await tablet.get("/avatares");
    expect(r.status).toBe(200);
    expect(r.cuerpo.miembros).toEqual([{ id: expect.any(Number), nombre: "Mamá", rol: "adulto", emoji: "🦊", color: "#f97316" }]);
  });
});

describe("entrar con PIN", () => {
  it("con el PIN correcto abre la sesión; 'Cambiar de Miembro' la cierra", async () => {
    const { sistema, adultoId } = await familiaConfigurada();
    const tablet = sistema.dispositivo();
    await tablet.post("/vincular", { clave: CLAVE, nombre: "Tablet" });

    const r = await tablet.entrar(adultoId, "1111");
    expect(r.status).toBe(200);
    expect((await tablet.get("/estado")).cuerpo.miembro).toMatchObject({ nombre: "Mamá" });

    await tablet.post("/salir");
    const estado = (await tablet.get("/estado")).cuerpo;
    expect(estado.miembro).toBeNull();
    expect(estado.dispositivoVinculado).toBe(true);
  });

  it("con el PIN incorrecto no entra", async () => {
    const { sistema, adultoId } = await familiaConfigurada();
    const tablet = sistema.dispositivo();
    await tablet.post("/vincular", { clave: CLAVE, nombre: "Tablet" });
    const r = await tablet.entrar(adultoId, "9999");
    expect(r.status).toBe(401);
    expect(r.cuerpo.error).toBe("pin_incorrecto");
    expect((await tablet.get("/estado")).cuerpo.miembro).toBeNull();
  });

  it("no se puede entrar desde un dispositivo sin vincular", async () => {
    const { sistema, adultoId } = await familiaConfigurada();
    const r = await sistema.dispositivo().entrar(adultoId, "1111");
    expect(r.status).toBe(401);
    expect(r.cuerpo.error).toBe("no_vinculado");
  });

  it("la sesión no vence", async () => {
    const { casa, reloj } = await familiaConfigurada();
    reloj.avanzar(400 * 24 * 60 * 60 * 1000);
    expect((await casa.get("/estado")).cuerpo.miembro).toMatchObject({ nombre: "Mamá" });
  });
});
