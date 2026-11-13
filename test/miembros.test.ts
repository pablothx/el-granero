import { describe, expect, it } from "vitest";
import { crearMiembro, crearTarea, dispositivoDe, familiaConfigurada, hoy, MINUTO } from "./ayudantes";

describe("Miembros", () => {
  it("un Adulto crea y edita Miembros", async () => {
    const { casa } = await familiaConfigurada();
    const tomi = await crearMiembro(casa, { nombre: "Tomi", rol: "chico", emoji: "🐸", color: "#22c55e" });

    const editado = await casa.patch(`/miembros/${tomi}`, { nombre: "Tomás", avatar: { emoji: "🦁", color: "#f59e0b" } });
    expect(editado.status).toBe(200);
    const lista = (await casa.get("/miembros")).cuerpo.miembros;
    expect(lista).toContainEqual({ id: tomi, nombre: "Tomás", rol: "chico", emoji: "🦁", color: "#f59e0b", archivado: false });
    expect((await casa.get("/avatares")).cuerpo.miembros.map((m: { nombre: string }) => m.nombre)).toEqual(["Mamá", "Tomás"]);
  });

  it("valida el PIN y el Avatar", async () => {
    const { casa } = await familiaConfigurada();
    const base = { nombre: "Tomi", rol: "chico", avatar: { emoji: "🐸", color: "#22c55e" } };
    expect((await casa.post("/miembros", { ...base, pin: "12a4" })).status).toBe(400);
    expect((await casa.post("/miembros", { ...base, pin: "1234", avatar: { emoji: "🚀", color: "#22c55e" } })).status).toBe(400);
  });

  it("el nuevo Miembro entra con su PIN y se le pueden asignar Tareas", async () => {
    const { sistema, casa } = await familiaConfigurada();
    const tomi = await crearMiembro(casa, { nombre: "Tomi", pin: "4321" });
    await crearTarea(casa, { nombre: "Darle de comer al perro", miembroId: tomi });

    const celuTomi = await dispositivoDe(sistema, tomi, "4321");
    expect((await hoy(celuTomi)).ocurrencias.map((o) => o.nombre)).toEqual(["Darle de comer al perro"]);
    expect((await hoy(casa)).ocurrencias).toEqual([]);
  });
});

describe("permisos de Chico", () => {
  async function conChico() {
    const familia = await familiaConfigurada();
    const tomi = await crearMiembro(familia.casa, { nombre: "Tomi", pin: "4321" });
    const juli = await crearMiembro(familia.casa, { nombre: "Juli", pin: "5555" });
    await crearTarea(familia.casa, { nombre: "Perro", miembroId: tomi });
    await crearTarea(familia.casa, { nombre: "Patio", miembroId: juli });
    const celuTomi = await dispositivoDe(familia.sistema, tomi, "4321");
    return { ...familia, tomi, juli, celuTomi };
  }

  it("un Chico no puede administrar Miembros ni Tareas", async () => {
    const { celuTomi, tomi } = await conChico();
    expect((await celuTomi.get("/miembros")).status).toBe(403);
    expect((await celuTomi.post("/miembros", { nombre: "X", rol: "adulto", pin: "1234", avatar: { emoji: "🐶", color: "#3b82f6" } })).status).toBe(403);
    expect((await celuTomi.patch(`/miembros/${tomi}`, { rol: "adulto" })).status).toBe(403);
    expect((await celuTomi.get("/tareas")).status).toBe(403);
    expect((await celuTomi.post("/tareas", { nombre: "x", frecuencia: "diaria", miembroId: tomi })).status).toBe(403);
  });

  it("un Chico solo ve y tilda sus propias Ocurrencias", async () => {
    const { celuTomi, sistema, juli } = await conChico();
    const deTomi = (await hoy(celuTomi)).ocurrencias;
    expect(deTomi.map((o) => o.nombre)).toEqual(["Perro"]);
    expect((await celuTomi.post(`/ocurrencias/${deTomi[0]!.id}/tildar`)).status).toBe(200);

    const celuJuli = await dispositivoDe(sistema, juli, "5555");
    const deJuli = (await hoy(celuJuli)).ocurrencias[0]!;
    const r = await celuTomi.post(`/ocurrencias/${deJuli.id}/tildar`);
    expect(r.status).toBe(403);
    expect(r.cuerpo.error).toBe("prohibido");
    expect((await hoy(celuJuli)).ocurrencias[0]!.estado).toBe("pendiente");
  });

  it("un Adulto puede tildar y destildar las Ocurrencias de cualquiera", async () => {
    const { casa, celuTomi } = await conChico();
    const perro = (await hoy(celuTomi)).ocurrencias[0]!;
    expect((await casa.post(`/ocurrencias/${perro.id}/tildar`)).status).toBe(200);
    expect((await hoy(celuTomi)).ocurrencias[0]).toMatchObject({ estado: "cumplida", tildadaPor: { nombre: "Mamá" } });
    expect((await casa.post(`/ocurrencias/${perro.id}/destildar`)).status).toBe(200);
    expect((await hoy(celuTomi)).ocurrencias[0]!.estado).toBe("pendiente");
  });
});

describe("reingreso del PIN para acciones de Adulto", () => {
  it("a los 4 minutos no lo pide; a los 6 sí, y después de reingresar vuelve a andar", async () => {
    const { casa, reloj } = await familiaConfigurada();

    reloj.avanzar(4 * MINUTO);
    expect((await casa.get("/miembros")).status).toBe(200);

    reloj.avanzar(2 * MINUTO);
    const r = await casa.get("/miembros");
    expect(r.status).toBe(403);
    expect(r.cuerpo.error).toBe("reingreso_requerido");
    expect((await casa.post("/tareas", { nombre: "x", frecuencia: "diaria", miembroId: 1 })).cuerpo.error).toBe("reingreso_requerido");

    expect((await casa.post("/reingresar", { pin: "0000" })).status).toBe(401);
    expect((await casa.post("/reingresar", { pin: "1111" })).status).toBe(200);
    expect((await casa.get("/miembros")).status).toBe(200);
  });

  it("tildar lo propio no pide reingreso; tildar por otro sí", async () => {
    const { casa, reloj, adultoId } = await familiaConfigurada();
    const tomi = await crearMiembro(casa, { nombre: "Tomi" });
    await crearTarea(casa, { nombre: "Mía", miembroId: adultoId });
    await crearTarea(casa, { nombre: "De Tomi", miembroId: tomi });
    const mia = (await hoy(casa)).ocurrencias[0]!;

    reloj.avanzar(10 * MINUTO);
    expect((await casa.post(`/ocurrencias/${mia.id}/tildar`)).status).toBe(200);

    const deTomiId = mia.id + 1;
    const r = await casa.post(`/ocurrencias/${deTomiId}/tildar`);
    expect(r.cuerpo.error).toBe("reingreso_requerido");
  });
});
