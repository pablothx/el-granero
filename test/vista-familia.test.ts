import { describe, expect, it } from "vitest";
import { crearMiembro, crearTarea, dispositivoDe, familiaConfigurada, hoy } from "./ayudantes";

async function escenario() {
  const f = await familiaConfigurada("2026-11-17T10:00:00-03:00");
  const tomi = await crearMiembro(f.casa, { nombre: "Tomi", pin: "4321", emoji: "🐸" });
  const juli = await crearMiembro(f.casa, { nombre: "Juli", pin: "5555" });
  await crearTarea(f.casa, { nombre: "Perro", miembroId: tomi });
  await crearTarea(f.casa, { nombre: "Cama", miembroId: tomi });
  await crearTarea(f.casa, { nombre: "Patio", frecuencia: "semanal", miembroId: tomi });
  await crearTarea(f.casa, { nombre: "Basura", miembroId: f.adultoId });
  const celuTomi = await dispositivoDe(f.sistema, tomi, "4321");
  return { ...f, tomi, juli, celuTomi };
}

describe("Vista Familia", () => {
  it("muestra el progreso de hoy de cada Miembro activo, igual a su Hoy", async () => {
    const e = await escenario();
    const deTomi = (await hoy(e.celuTomi)).ocurrencias;
    await e.celuTomi.post(`/ocurrencias/${deTomi.find((o) => o.nombre === "Perro")!.id}/tildar`);
    await e.celuTomi.post(`/ocurrencias/${deTomi.find((o) => o.nombre === "Cama")!.id}/tildar`);

    const r = await e.casa.get("/familia");
    expect(r.status).toBe(200);
    expect(r.cuerpo.miembros.map((m: { miembro: { nombre: string }; cumplidas: number; total: number }) => [m.miembro.nombre, m.cumplidas, m.total])).toEqual([
      ["Juli", 0, 0],
      ["Mamá", 0, 1],
      ["Tomi", 2, 3],
    ]);
  });

  it("un Chico no accede a la Vista Familia ni al Hoy de otros", async () => {
    const e = await escenario();
    expect((await e.celuTomi.get("/familia")).status).toBe(403);
    expect((await e.celuTomi.get(`/miembros/${e.adultoId}/hoy`)).status).toBe(403);
  });

  it("la Vista Familia exige reingreso reciente", async () => {
    const e = await escenario();
    e.reloj.avanzar(6 * 60_000);
    expect((await e.casa.get("/familia")).cuerpo.error).toBe("reingreso_requerido");
  });

  it("desde el Hoy de un Chico, el Adulto tilda por él y queda registrado", async () => {
    const e = await escenario();
    const deTomi = (await e.casa.get(`/miembros/${e.tomi}/hoy`)).cuerpo;
    expect(deTomi.miembro.nombre).toBe("Tomi");
    const perro = deTomi.ocurrencias.find((o: { nombre: string }) => o.nombre === "Perro");
    await e.casa.post(`/ocurrencias/${perro.id}/tildar`);
    expect((await hoy(e.celuTomi)).ocurrencias.find((o) => o.nombre === "Perro")).toMatchObject({ estado: "cumplida", tildadaPor: { nombre: "Mamá" } });
    // El Hoy propio del Adulto sigue mostrando solo lo suyo.
    expect((await hoy(e.casa)).ocurrencias.map((o) => o.nombre)).toEqual(["Basura"]);
  });

  it("corregir una No cumplida de ayer la deja Cumplida, con quién y cuándo; y al revés", async () => {
    const e = await escenario();
    const perroAyer = (await hoy(e.celuTomi)).ocurrencias.find((o) => o.nombre === "Perro")!;

    e.reloj.fijar("2026-11-18T19:30:00-03:00");
    await e.casa.post("/reingresar", { pin: "1111" });
    let pasadas = (await e.casa.get(`/miembros/${e.tomi}/terminadas`)).cuerpo.ocurrencias;
    expect(pasadas.find((o: { id: number }) => o.id === perroAyer.id).estado).toBe("no_cumplida");

    expect((await e.casa.post(`/ocurrencias/${perroAyer.id}/tildar`)).status).toBe(200);
    pasadas = (await e.casa.get(`/miembros/${e.tomi}/terminadas`)).cuerpo.ocurrencias;
    expect(pasadas.find((o: { id: number }) => o.id === perroAyer.id)).toMatchObject({
      estado: "cumplida",
      tildadaPor: { nombre: "Mamá" },
      tildadaEn: "2026-11-18T22:30:00.000Z",
    });
    // Corregir un Período pasado no lo hace aparecer en el Hoy de hoy.
    expect((await hoy(e.celuTomi)).ocurrencias.filter((o) => o.id === perroAyer.id)).toEqual([]);

    await e.casa.post(`/ocurrencias/${perroAyer.id}/destildar`);
    pasadas = (await e.casa.get(`/miembros/${e.tomi}/terminadas`)).cuerpo.ocurrencias;
    expect(pasadas.find((o: { id: number }) => o.id === perroAyer.id)).toMatchObject({ estado: "no_cumplida", tildadaPor: null });
  });
});
