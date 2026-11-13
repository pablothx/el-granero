import { describe, expect, it } from "vitest";
import { CLAVE, crearMiembro, crearTarea, dispositivoDe, familiaConfigurada, hoy } from "./ayudantes";

describe("archivar y borrar Miembros", () => {
  it("no se puede archivar a un Miembro con Tareas activas; la respuesta dice cuáles", async () => {
    const f = await familiaConfigurada();
    const tomi = await crearMiembro(f.casa, { nombre: "Tomi" });
    await crearTarea(f.casa, { nombre: "Perro", emoji: "🐶", miembroId: tomi });
    const r = await f.casa.post(`/miembros/${tomi}/archivar`);
    expect(r.status).toBe(409);
    expect(r.cuerpo.tareas).toEqual([{ id: expect.any(Number), nombre: "Perro", emoji: "🐶" }]);
  });

  it("archivado: no aparece en los Avatares ni en la Vista Familia, se cierran sus sesiones y no puede entrar", async () => {
    const f = await familiaConfigurada("2026-11-17T10:00:00-03:00");
    const tomi = await crearMiembro(f.casa, { nombre: "Tomi", pin: "4321" });
    const perro = await crearTarea(f.casa, { nombre: "Perro", miembroId: tomi });
    const celuTomi = await dispositivoDe(f.sistema, tomi, "4321");
    const ocurrencia = (await hoy(celuTomi)).ocurrencias[0]!;
    await celuTomi.post(`/ocurrencias/${ocurrencia.id}/tildar`);

    await f.casa.patch(`/tareas/${perro.id}`, { miembroId: f.adultoId });
    expect((await f.casa.post(`/miembros/${tomi}/archivar`)).status).toBe(200);

    expect((await celuTomi.get("/estado")).cuerpo.miembro).toBeNull();
    expect((await celuTomi.entrar(tomi, "4321")).status).toBe(404);
    expect((await f.casa.get("/avatares")).cuerpo.miembros.map((m: { nombre: string }) => m.nombre)).toEqual(["Mamá"]);
    expect((await f.casa.get("/familia")).cuerpo.miembros.map((m: { miembro: { nombre: string } }) => m.miembro.nombre)).toEqual(["Mamá"]);
    // Su historial sigue a su nombre.
    f.reloj.fijar("2026-11-18T10:00:00-03:00");
    await f.casa.post("/reingresar", { pin: "1111" });
    expect((await f.casa.get(`/miembros/${tomi}/terminadas`)).cuerpo.ocurrencias).toEqual([
      expect.objectContaining({ id: ocurrencia.id, estado: "cumplida", tildadaPor: { id: tomi, nombre: "Tomi" } }),
    ]);
    expect((await f.casa.get("/miembros")).cuerpo.miembros).toContainEqual(expect.objectContaining({ id: tomi, archivado: true }));
  });

  it("reactivar lo devuelve a los Avatares con su historial", async () => {
    const f = await familiaConfigurada();
    const tomi = await crearMiembro(f.casa, { nombre: "Tomi", pin: "4321" });
    await f.casa.post(`/miembros/${tomi}/archivar`);
    expect((await f.casa.post(`/miembros/${tomi}/reactivar`)).status).toBe(200);
    const tablet = f.sistema.dispositivo();
    await tablet.post("/vincular", { clave: CLAVE, nombre: "Tablet" });
    expect((await tablet.entrar(tomi, "4321")).status).toBe(200);
  });

  it("no se puede archivar, borrar ni pasar a Chico al último Adulto activo", async () => {
    const f = await familiaConfigurada();
    expect((await f.casa.post(`/miembros/${f.adultoId}/archivar`)).status).toBe(409);
    expect((await f.casa.delete(`/miembros/${f.adultoId}`)).status).toBe(409);
    expect((await f.casa.patch(`/miembros/${f.adultoId}`, { rol: "chico" })).status).toBe(409);

    const papa = await crearMiembro(f.casa, { nombre: "Papá", rol: "adulto" });
    expect((await f.casa.patch(`/miembros/${papa}`, { rol: "chico" })).status).toBe(200);
    await f.casa.patch(`/miembros/${papa}`, { rol: "adulto" });
    expect((await f.casa.post(`/miembros/${f.adultoId}/archivar`)).status).toBe(200);
  });

  it("borrar solo se permite sin historial", async () => {
    const f = await familiaConfigurada();
    const error = await crearMiembro(f.casa, { nombre: "Cargado por error" });
    expect((await f.casa.delete(`/miembros/${error}`)).status).toBe(200);
    expect((await f.casa.get("/miembros")).cuerpo.miembros.map((m: { nombre: string }) => m.nombre)).toEqual(["Mamá"]);

    const tomi = await crearMiembro(f.casa, { nombre: "Tomi", pin: "4321" });
    const celuTomi = await dispositivoDe(f.sistema, tomi, "4321");
    await celuTomi.post("/listas/super/items", { texto: "Galletitas" });
    const r = await f.casa.delete(`/miembros/${tomi}`);
    expect(r.status).toBe(409);
    expect(r.cuerpo.mensaje).toMatch(/archivalo/);

    const juli = await crearMiembro(f.casa, { nombre: "Juli" });
    await crearTarea(f.casa, { nombre: "Patio", miembroId: juli });
    expect((await f.casa.delete(`/miembros/${juli}`)).status).toBe(409);
  });

  it("un Chico no puede archivar ni borrar Miembros", async () => {
    const f = await familiaConfigurada();
    const tomi = await crearMiembro(f.casa, { nombre: "Tomi", pin: "4321" });
    const juli = await crearMiembro(f.casa, { nombre: "Juli" });
    const celuTomi = await dispositivoDe(f.sistema, tomi, "4321");
    expect((await celuTomi.post(`/miembros/${juli}/archivar`)).status).toBe(403);
    expect((await celuTomi.delete(`/miembros/${juli}`)).status).toBe(403);
  });
});
