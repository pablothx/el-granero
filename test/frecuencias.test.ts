import { describe, expect, it } from "vitest";
import { crearTarea, familiaConfigurada, hoy } from "./ayudantes";

describe("Semanales, Mensuales y días elegidos en Hoy", () => {
  it("agrupa Diarias, Semanales y Mensuales, en orden alfabético dentro de cada grupo", async () => {
    const { casa, adultoId } = await familiaConfigurada("2026-11-18T10:00:00-03:00");
    await crearTarea(casa, { nombre: "Regar", frecuencia: "diaria", miembroId: adultoId });
    await crearTarea(casa, { nombre: "Patio", frecuencia: "semanal", miembroId: adultoId });
    await crearTarea(casa, { nombre: "Cambiar filtros", frecuencia: "mensual", miembroId: adultoId });
    await crearTarea(casa, { nombre: "Basura", frecuencia: "diaria", miembroId: adultoId });
    await crearTarea(casa, { nombre: "Auto", frecuencia: "semanal", miembroId: adultoId });

    expect((await hoy(casa)).ocurrencias.map((o) => [o.tipo, o.nombre])).toEqual([
      ["diaria", "Basura"],
      ["diaria", "Regar"],
      ["semanal", "Auto"],
      ["semanal", "Patio"],
      ["mensual", "Cambiar filtros"],
    ]);
  });

  it("una Semanal tildada el lunes aparece tachada el lunes y ya no aparece el martes", async () => {
    const { casa, adultoId, reloj } = await familiaConfigurada("2026-11-16T09:00:00-03:00");
    await crearTarea(casa, { nombre: "Patio", frecuencia: "semanal", miembroId: adultoId });
    const patio = (await hoy(casa)).ocurrencias[0]!;
    expect(patio).toMatchObject({ inicio: "2026-11-16", fin: "2026-11-23", estado: "pendiente" });
    await casa.post(`/ocurrencias/${patio.id}/tildar`);
    expect((await hoy(casa)).ocurrencias).toEqual([expect.objectContaining({ id: patio.id, estado: "cumplida" })]);

    reloj.fijar("2026-11-17T09:00:00-03:00");
    expect((await hoy(casa)).ocurrencias).toEqual([]);
  });

  it("una Semanal Pendiente sigue apareciendo toda la semana, y el lunes siguiente hay una nueva", async () => {
    const { casa, adultoId, reloj } = await familiaConfigurada("2026-11-16T09:00:00-03:00");
    await crearTarea(casa, { nombre: "Patio", frecuencia: "semanal", miembroId: adultoId });
    const primera = (await hoy(casa)).ocurrencias[0]!;

    reloj.fijar("2026-11-22T23:00:00-03:00");
    expect((await hoy(casa)).ocurrencias.map((o) => o.id)).toEqual([primera.id]);

    reloj.fijar("2026-11-23T08:00:00-03:00");
    const nueva = (await hoy(casa)).ocurrencias;
    expect(nueva).toEqual([expect.objectContaining({ inicio: "2026-11-23", estado: "pendiente" })]);
    expect(nueva[0]!.id).not.toBe(primera.id);
  });

  it("una Mensual se puede cumplir cualquier día del mes", async () => {
    const { casa, adultoId, reloj } = await familiaConfigurada("2026-11-02T09:00:00-03:00");
    await crearTarea(casa, { nombre: "Filtros", frecuencia: "mensual", miembroId: adultoId });
    reloj.fijar("2026-11-29T09:00:00-03:00");
    const filtros = (await hoy(casa)).ocurrencias[0]!;
    expect(filtros).toMatchObject({ inicio: "2026-11-01", fin: "2026-12-01", estado: "pendiente" });
    await casa.post(`/ocurrencias/${filtros.id}/tildar`);
    reloj.fijar("2026-11-30T09:00:00-03:00");
    expect((await hoy(casa)).ocurrencias).toEqual([]);
  });

  it("una Diaria de lunes, miércoles y viernes solo aparece esos días", async () => {
    const { casa, adultoId, reloj } = await familiaConfigurada("2026-11-16T09:00:00-03:00");
    await crearTarea(casa, { nombre: "Basura", frecuencia: "diaria", dias: [1, 3, 5], miembroId: adultoId });
    const visto: Record<string, number> = {};
    for (const dia of ["16", "17", "18", "19", "20", "21", "22"]) {
      reloj.fijar(`2026-11-${dia}T09:00:00-03:00`);
      visto[dia] = (await hoy(casa)).ocurrencias.length;
    }
    expect(visto).toEqual({ "16": 1, "17": 0, "18": 1, "19": 0, "20": 1, "21": 0, "22": 0 });
  });

  it("la lista de Tareas devuelve Frecuencia y días", async () => {
    const { casa, adultoId } = await familiaConfigurada();
    await crearTarea(casa, { nombre: "Basura", frecuencia: "diaria", dias: [5, 1, 3], miembroId: adultoId });
    await crearTarea(casa, { nombre: "Patio", frecuencia: "semanal", dias: [2], miembroId: adultoId });
    expect((await casa.get("/tareas")).cuerpo.tareas.map((t: { nombre: string; frecuencia: string; dias: number[] }) => [t.nombre, t.frecuencia, t.dias])).toEqual([
      ["Basura", "diaria", [1, 3, 5]],
      ["Patio", "semanal", []],
    ]);
  });
});
