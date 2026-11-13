import { describe, expect, it } from "vitest";
import { CLAVE, crearMiembro, dispositivoDe, familiaConfigurada, MINUTO } from "./ayudantes";

async function tabletVinculada(f: Awaited<ReturnType<typeof familiaConfigurada>>) {
  const tablet = f.sistema.dispositivo();
  await tablet.post("/vincular", { clave: CLAVE, nombre: "Tablet" });
  return tablet;
}

describe("bloqueo por PIN incorrecto", () => {
  it("5 fallos seguidos bloquean 5 minutos a ese Miembro en ese dispositivo", async () => {
    const f = await familiaConfigurada();
    const tablet = await tabletVinculada(f);
    for (let i = 1; i <= 4; i++) {
      const r = await tablet.entrar(f.adultoId, "0000");
      expect(r.cuerpo).toMatchObject({ error: "pin_incorrecto", intentosRestantes: 5 - i });
    }
    const quinto = await tablet.entrar(f.adultoId, "0000");
    expect(quinto.status).toBe(429);
    expect(quinto.cuerpo.error).toBe("bloqueado");

    // Bloqueado: ni el PIN correcto entra.
    expect((await tablet.entrar(f.adultoId, "1111")).cuerpo.error).toBe("bloqueado");
    // En otro dispositivo sí puede.
    const otro = await tabletVinculada(f);
    expect((await otro.entrar(f.adultoId, "1111")).status).toBe(200);

    f.reloj.avanzar(5 * MINUTO + 1000);
    expect((await tablet.entrar(f.adultoId, "1111")).status).toBe(200);
  });

  it("un ingreso correcto reinicia el contador", async () => {
    const f = await familiaConfigurada();
    const tablet = await tabletVinculada(f);
    for (let i = 0; i < 4; i++) await tablet.entrar(f.adultoId, "0000");
    expect((await tablet.entrar(f.adultoId, "1111")).status).toBe(200);
    await tablet.post("/salir");
    expect((await tablet.entrar(f.adultoId, "0000")).cuerpo.intentosRestantes).toBe(4);
  });

  it("el reingreso de Adulto también cuenta para el bloqueo", async () => {
    const f = await familiaConfigurada();
    for (let i = 0; i < 5; i++) await f.casa.post("/reingresar", { pin: "0000" });
    expect((await f.casa.post("/reingresar", { pin: "1111" })).cuerpo.error).toBe("bloqueado");
  });
});

describe("reset de PIN", () => {
  it("un Adulto le pone un PIN nuevo a cualquier Miembro (y se olvida el bloqueo)", async () => {
    const f = await familiaConfigurada();
    const tomi = await crearMiembro(f.casa, { nombre: "Tomi", pin: "4321" });
    const tablet = await tabletVinculada(f);
    for (let i = 0; i < 5; i++) await tablet.entrar(tomi, "0000");
    expect((await f.casa.pedir("PUT", `/miembros/${tomi}/pin`, { pin: "9876" })).status).toBe(200);
    expect((await tablet.entrar(tomi, "4321")).cuerpo.error).toBe("pin_incorrecto");
    expect((await tablet.entrar(tomi, "9876")).status).toBe(200);
  });

  it("un Chico no puede cambiar PINs", async () => {
    const f = await familiaConfigurada();
    const tomi = await crearMiembro(f.casa, { nombre: "Tomi", pin: "4321" });
    const celuTomi = await dispositivoDe(f.sistema, tomi, "4321");
    expect((await celuTomi.pedir("PUT", `/miembros/${f.adultoId}/pin`, { pin: "0000" })).status).toBe(403);
  });

  it("si hay un solo Adulto, puede poner un PIN nuevo con la Clave de la casa", async () => {
    const f = await familiaConfigurada();
    const tablet = await tabletVinculada(f);
    expect((await tablet.post("/restablecer-pin", { miembroId: f.adultoId, clave: "otra", pin: "2468" })).cuerpo.error).toBe("clave_incorrecta");
    expect((await tablet.post("/restablecer-pin", { miembroId: f.adultoId, clave: CLAVE, pin: "2468" })).status).toBe(200);
    expect((await tablet.entrar(f.adultoId, "2468")).status).toBe(200);
  });

  it("con dos Adultos, ninguno puede usar la Clave para resetear su PIN; ni un Chico", async () => {
    const f = await familiaConfigurada();
    await crearMiembro(f.casa, { nombre: "Papá", rol: "adulto" });
    const tomi = await crearMiembro(f.casa, { nombre: "Tomi" });
    const tablet = await tabletVinculada(f);
    expect((await tablet.post("/restablecer-pin", { miembroId: f.adultoId, clave: CLAVE, pin: "2468" })).status).toBe(403);
    expect((await tablet.post("/restablecer-pin", { miembroId: tomi, clave: CLAVE, pin: "2468" })).status).toBe(403);
  });

  it("sin dispositivo vinculado no se puede resetear", async () => {
    const f = await familiaConfigurada();
    expect((await f.sistema.dispositivo().post("/restablecer-pin", { miembroId: f.adultoId, clave: CLAVE, pin: "2468" })).status).toBe(401);
  });
});

describe("Dispositivos vinculados y Clave de la casa", () => {
  it("lista los Dispositivos vinculados con nombre y último uso, que se actualiza al usarlos", async () => {
    const f = await familiaConfigurada("2026-11-17T10:00:00-03:00");
    const tablet = await tabletVinculada(f);
    f.reloj.avanzar(3 * MINUTO);
    await tablet.get("/avatares");
    await f.casa.post("/reingresar", { pin: "1111" });

    const lista = (await f.casa.get("/dispositivos")).cuerpo.dispositivos;
    expect(lista).toHaveLength(2);
    expect(lista).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ nombre: "Tablet", ultimoUso: "2026-11-17T13:03:00.000Z", actual: false }),
        expect.objectContaining({ nombre: "Celular de Mamá", actual: true }),
      ]),
    );
  });

  it("desvincular un dispositivo invalida su cookie y sus sesiones", async () => {
    const f = await familiaConfigurada();
    const tablet = await tabletVinculada(f);
    await tablet.entrar(f.adultoId, "1111");
    const id = (await f.casa.get("/dispositivos")).cuerpo.dispositivos.find((d: { nombre: string }) => d.nombre === "Tablet").id;

    expect((await f.casa.delete(`/dispositivos/${id}`)).status).toBe(200);
    expect((await tablet.get("/estado")).cuerpo).toMatchObject({ dispositivoVinculado: false, miembro: null });
    expect((await tablet.get("/hoy")).status).toBe(401);
  });

  it("cambiar la Clave desvincula todos los dispositivos menos el actual, y la Clave vieja ya no sirve", async () => {
    const f = await familiaConfigurada();
    const tablet = await tabletVinculada(f);
    const celuTomi = await dispositivoDe(f.sistema, await crearMiembro(f.casa, { nombre: "Tomi", pin: "4321" }), "4321");

    expect((await f.casa.post("/clave", { clave: "clave-nueva-123" })).status).toBe(200);
    expect((await tablet.get("/estado")).cuerpo.dispositivoVinculado).toBe(false);
    expect((await celuTomi.get("/estado")).cuerpo.dispositivoVinculado).toBe(false);
    expect((await f.casa.get("/estado")).cuerpo.miembro).toMatchObject({ nombre: "Mamá" });

    const nuevo = f.sistema.dispositivo();
    expect((await nuevo.post("/vincular", { clave: CLAVE, nombre: "x" })).status).toBe(401);
    expect((await nuevo.post("/vincular", { clave: "clave-nueva-123", nombre: "x" })).status).toBe(201);
  });

  it("todo esto exige reingreso reciente y ser Adulto", async () => {
    const f = await familiaConfigurada();
    const celuTomi = await dispositivoDe(f.sistema, await crearMiembro(f.casa, { nombre: "Tomi", pin: "4321" }), "4321");
    expect((await celuTomi.get("/dispositivos")).status).toBe(403);
    expect((await celuTomi.post("/clave", { clave: "clave-nueva-123" })).status).toBe(403);
    f.reloj.avanzar(6 * MINUTO);
    expect((await f.casa.get("/dispositivos")).cuerpo.error).toBe("reingreso_requerido");
    expect((await f.casa.post("/clave", { clave: "clave-nueva-123" })).cuerpo.error).toBe("reingreso_requerido");
  });
});
