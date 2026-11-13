import { describe, expect, it } from "vitest";
import { crearMiembro, crearTarea, dispositivoDe, familiaConfigurada, hoy } from "./ayudantes";

async function terminadas(d: Awaited<ReturnType<typeof familiaConfigurada>>["casa"], miembroId: number) {
  await d.post("/reingresar", { pin: "1111" });
  const r = await d.get(`/miembros/${miembroId}/terminadas`);
  if (r.status !== 200) throw new Error(JSON.stringify(r.cuerpo));
  return r.cuerpo.ocurrencias as Array<{ id: number; inicio: string; estado: string; nombre: string }>;
}

describe("Cron y No cumplidas", () => {
  it("un día en que nadie abre la app, el Cron genera la Ocurrencia y queda No cumplida", async () => {
    const { sistema, casa, adultoId, reloj } = await familiaConfigurada("2026-11-16T10:00:00-03:00");
    await crearTarea(casa, { nombre: "Basura", miembroId: adultoId });

    reloj.fijar("2026-11-17T00:05:00-03:00"); // martes 00:05: corre el Cron y nadie abre la app
    await sistema.correrCron();

    reloj.fijar("2026-11-18T09:00:00-03:00"); // miércoles
    const pasadas = await terminadas(casa, adultoId);
    expect(pasadas.map((o) => [o.inicio, o.estado])).toEqual([
      ["2026-11-17", "no_cumplida"],
      ["2026-11-16", "no_cumplida"],
    ]);
  });

  it("correr el Cron dos veces, o el Cron y después Hoy, no duplica", async () => {
    const { sistema, casa, adultoId, reloj } = await familiaConfigurada("2026-11-16T10:00:00-03:00");
    await crearTarea(casa, { nombre: "Basura", miembroId: adultoId });
    await crearTarea(casa, { nombre: "Patio", frecuencia: "semanal", miembroId: adultoId });

    reloj.fijar("2026-11-17T00:05:00-03:00");
    await sistema.correrCron();
    await sistema.correrCron();
    expect((await hoy(casa)).ocurrencias.map((o) => o.nombre)).toEqual(["Basura", "Patio"]);

    reloj.fijar("2026-11-18T09:00:00-03:00");
    expect((await terminadas(casa, adultoId)).map((o) => o.inicio)).toEqual(["2026-11-17", "2026-11-16"]);
  });

  it("el Cron no genera Ocurrencias de Tareas Archivadas ni en días no elegidos", async () => {
    const { sistema, casa, adultoId, reloj } = await familiaConfigurada("2026-11-16T10:00:00-03:00");
    await crearTarea(casa, { nombre: "Solo lunes", dias: [1], miembroId: adultoId });
    reloj.fijar("2026-11-17T00:05:00-03:00");
    await sistema.correrCron();
    reloj.fijar("2026-11-18T09:00:00-03:00");
    expect((await terminadas(casa, adultoId)).map((o) => o.inicio)).toEqual(["2026-11-16"]);
  });

  it("sin Familia configurada el Cron no hace nada", async () => {
    const { Sistema } = await import("./ayudantes");
    const { relojFijo } = await import("./reloj-fijo");
    await new Sistema(relojFijo("2026-11-17T03:05:00Z")).correrCron();
  });

  it("una No cumplida no se arrastra al Hoy del día siguiente", async () => {
    const { casa, adultoId, reloj } = await familiaConfigurada("2026-11-16T10:00:00-03:00");
    await crearTarea(casa, { nombre: "Basura", miembroId: adultoId });
    const lunes = (await hoy(casa)).ocurrencias[0]!;
    reloj.fijar("2026-11-17T10:00:00-03:00");
    const martes = (await hoy(casa)).ocurrencias;
    expect(martes).toHaveLength(1);
    expect(martes[0]!.id).not.toBe(lunes.id);
    expect(martes[0]!.estado).toBe("pendiente");
  });

  it("un Chico no puede tildar ni destildar una Ocurrencia de un Período terminado; un Adulto sí", async () => {
    const { sistema, casa, reloj } = await familiaConfigurada("2026-11-16T10:00:00-03:00");
    const tomi = await crearMiembro(casa, { nombre: "Tomi", pin: "4321" });
    await crearTarea(casa, { nombre: "Perro", miembroId: tomi });
    await crearTarea(casa, { nombre: "Cama", miembroId: tomi });
    const celuTomi = await dispositivoDe(sistema, tomi, "4321");
    const [cama, perro] = (await hoy(celuTomi)).ocurrencias;
    await celuTomi.post(`/ocurrencias/${cama!.id}/tildar`);

    reloj.fijar("2026-11-17T10:00:00-03:00");
    expect((await celuTomi.post(`/ocurrencias/${perro!.id}/tildar`)).status).toBe(403);
    expect((await celuTomi.post(`/ocurrencias/${cama!.id}/destildar`)).status).toBe(403);

    await casa.post("/reingresar", { pin: "1111" });
    expect((await casa.post(`/ocurrencias/${perro!.id}/tildar`)).status).toBe(200);
  });
});
