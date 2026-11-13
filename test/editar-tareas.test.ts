import { describe, expect, it } from "vitest";
import { crearMiembro, crearTarea, dispositivoDe, familiaConfigurada, hoy, type FamiliaDePrueba } from "./ayudantes";

/** Mamá y dos Chicos; "Patio" es Semanal y le toca a Tomi. Arranca el lunes 16. */
async function escenario() {
  const f = await familiaConfigurada("2026-11-16T10:00:00-03:00");
  const tomi = await crearMiembro(f.casa, { nombre: "Tomi", pin: "4321" });
  const juli = await crearMiembro(f.casa, { nombre: "Juli", pin: "5555" });
  const patio = await crearTarea(f.casa, { nombre: "Patio", frecuencia: "semanal", miembroId: tomi });
  const celuTomi = await dispositivoDe(f.sistema, tomi, "4321");
  const celuJuli = await dispositivoDe(f.sistema, juli, "5555");
  return { ...f, tomi, juli, patio, celuTomi, celuJuli };
}

async function irAlMiercoles(f: FamiliaDePrueba) {
  f.reloj.fijar("2026-11-18T10:00:00-03:00");
  await f.casa.post("/reingresar", { pin: "1111" });
}

async function terminadasDe(f: FamiliaDePrueba, miembroId: number) {
  return (await f.casa.get(`/miembros/${miembroId}/terminadas?dias=30`)).cuerpo.ocurrencias as Array<{ inicio: string; estado: string; nombre: string }>;
}

describe("editar, reasignar y archivar Tareas", () => {
  it("editar nombre y emoji no toca las Ocurrencias", async () => {
    const e = await escenario();
    const antes = (await hoy(e.celuTomi)).ocurrencias[0]!;
    await e.casa.patch(`/tareas/${e.patio.id}`, { nombre: "Barrer el patio", emoji: "🧹" });
    const despues = (await hoy(e.celuTomi)).ocurrencias[0]!;
    expect(despues).toMatchObject({ id: antes.id, nombre: "Barrer el patio", emoji: "🧹" });
  });

  it("reasignar a mitad de semana pasa la Pendiente al nuevo Miembro; lo pasado queda a nombre del anterior", async () => {
    const e = await escenario();
    // Una Diaria de Tomi, cumplida el lunes, para verificar que el historial no cambia.
    const perro = await crearTarea(e.casa, { nombre: "Perro", miembroId: e.tomi });
    const perroLunes = (await hoy(e.celuTomi)).ocurrencias.find((o) => o.nombre === "Perro")!;
    await e.celuTomi.post(`/ocurrencias/${perroLunes.id}/tildar`);
    e.reloj.fijar("2026-11-17T00:05:00-03:00");
    await e.sistema.correrCron();

    await irAlMiercoles(e);
    expect((await e.casa.patch(`/tareas/${e.patio.id}`, { miembroId: e.juli })).status).toBe(200);
    expect((await e.casa.patch(`/tareas/${perro.id}`, { miembroId: e.juli })).status).toBe(200);

    expect((await hoy(e.celuJuli)).ocurrencias.map((o) => o.nombre).sort()).toEqual(["Patio", "Perro"]);
    expect((await hoy(e.celuTomi)).ocurrencias).toEqual([]);
    expect((await terminadasDe(e, e.tomi)).map((o) => [o.nombre, o.inicio, o.estado])).toEqual([
      ["Perro", "2026-11-17", "no_cumplida"],
      ["Perro", "2026-11-16", "cumplida"],
    ]);
  });

  it("cambiar la Frecuencia aplica ya: se descarta la Pendiente y se genera la nueva", async () => {
    const e = await escenario();
    await irAlMiercoles(e);
    await e.casa.patch(`/tareas/${e.patio.id}`, { frecuencia: "diaria" });
    expect((await hoy(e.celuTomi)).ocurrencias).toEqual([
      expect.objectContaining({ nombre: "Patio", tipo: "diaria", inicio: "2026-11-18", estado: "pendiente" }),
    ]);
    // La Semanal descartada no queda como No cumplida.
    e.reloj.fijar("2026-11-30T10:00:00-03:00");
    await e.casa.post("/reingresar", { pin: "1111" });
    expect((await terminadasDe(e, e.tomi)).filter((o) => o.inicio === "2026-11-16")).toEqual([]);
  });

  it("si la Semanal ya estaba Cumplida, se conserva y la Diaria arranca hoy igual", async () => {
    const e = await escenario();
    const semanal = (await hoy(e.celuTomi)).ocurrencias[0]!;
    await e.celuTomi.post(`/ocurrencias/${semanal.id}/tildar`);
    await irAlMiercoles(e);
    await e.casa.patch(`/tareas/${e.patio.id}`, { frecuencia: "diaria" });

    const h = (await hoy(e.celuTomi)).ocurrencias;
    expect(h).toEqual([expect.objectContaining({ tipo: "diaria", inicio: "2026-11-18", estado: "pendiente" })]);
    e.reloj.fijar("2026-11-30T10:00:00-03:00");
    await e.casa.post("/reingresar", { pin: "1111" });
    expect(await terminadasDe(e, e.tomi)).toContainEqual(expect.objectContaining({ inicio: "2026-11-16", estado: "cumplida" }));
  });

  it("cambiar los días de una Diaria aplica ya", async () => {
    const e = await escenario();
    const basura = await crearTarea(e.casa, { nombre: "Basura", dias: [1], miembroId: e.tomi });
    await irAlMiercoles(e);
    expect((await hoy(e.celuTomi)).ocurrencias.map((o) => o.nombre)).toEqual(["Patio"]);
    await e.casa.patch(`/tareas/${basura.id}`, { dias: [1, 3, 5] });
    expect((await hoy(e.celuTomi)).ocurrencias.map((o) => o.nombre)).toEqual(["Basura", "Patio"]);
  });

  it("archivar descarta la Pendiente sin contarla como No cumplida; reactivar la vuelve a generar", async () => {
    const e = await escenario();
    await irAlMiercoles(e);
    expect((await e.casa.post(`/tareas/${e.patio.id}/archivar`)).status).toBe(200);
    expect((await hoy(e.celuTomi)).ocurrencias).toEqual([]);
    expect((await e.casa.get("/tareas")).cuerpo.tareas[0]).toMatchObject({ nombre: "Patio", archivada: true });

    e.reloj.fijar("2026-11-24T10:00:00-03:00");
    await e.casa.post("/reingresar", { pin: "1111" });
    expect(await terminadasDe(e, e.tomi)).toEqual([]);

    expect((await e.casa.post(`/tareas/${e.patio.id}/reactivar`)).status).toBe(200);
    expect((await hoy(e.celuTomi)).ocurrencias).toEqual([expect.objectContaining({ nombre: "Patio", inicio: "2026-11-23" })]);
  });

  it("el Cron no genera Ocurrencias de Tareas Archivadas", async () => {
    const e = await escenario();
    await e.casa.post(`/tareas/${e.patio.id}/archivar`);
    e.reloj.fijar("2026-11-23T00:05:00-03:00");
    await e.sistema.correrCron();
    expect((await hoy(e.celuTomi)).ocurrencias).toEqual([]);
  });

  it("borrar solo se permite sin historial", async () => {
    const e = await escenario();
    const nueva = await crearTarea(e.casa, { nombre: "Error de tipeo", miembroId: e.tomi });
    expect((await e.casa.delete(`/tareas/${nueva.id}`)).status).toBe(200);
    expect((await hoy(e.celuTomi)).ocurrencias.map((o) => o.nombre)).toEqual(["Patio"]);

    const semanal = (await hoy(e.celuTomi)).ocurrencias[0]!;
    await e.celuTomi.post(`/ocurrencias/${semanal.id}/tildar`);
    const r = await e.casa.delete(`/tareas/${e.patio.id}`);
    expect(r.status).toBe(409);
    expect(r.cuerpo.error).toBe("conflicto");
  });

  it("una Tarea con un Período terminado (aunque No cumplido) tampoco se puede borrar", async () => {
    const e = await escenario();
    const perro = await crearTarea(e.casa, { nombre: "Perro", miembroId: e.tomi });
    await irAlMiercoles(e);
    expect((await e.casa.delete(`/tareas/${perro.id}`)).status).toBe(409);
  });

  it("no se puede reasignar a un Miembro inexistente", async () => {
    const e = await escenario();
    expect((await e.casa.patch(`/tareas/${e.patio.id}`, { miembroId: 999 })).status).toBe(400);
  });
});
