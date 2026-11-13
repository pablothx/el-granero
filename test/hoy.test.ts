import { describe, expect, it } from "vitest";
import { crearTarea, familiaConfigurada, hoy } from "./ayudantes";

describe("primera Tarea Diaria en Hoy", () => {
  it("crear una Tarea genera su Ocurrencia Pendiente de hoy", async () => {
    const { casa, adultoId } = await familiaConfigurada("2026-11-17T10:00:00-03:00");
    await crearTarea(casa, { nombre: "Sacar la basura", emoji: "🗑️", miembroId: adultoId });

    const h = await hoy(casa);
    expect(h.fecha).toBe("2026-11-17");
    expect(h.ocurrencias).toEqual([
      expect.objectContaining({ nombre: "Sacar la basura", emoji: "🗑️", tipo: "diaria", estado: "pendiente", inicio: "2026-11-17", fin: "2026-11-18" }),
    ]);
  });

  it("leer Hoy varias veces no duplica Ocurrencias", async () => {
    const { casa, adultoId } = await familiaConfigurada();
    await crearTarea(casa, { nombre: "Darle de comer al perro", miembroId: adultoId });
    await hoy(casa);
    await hoy(casa);
    expect((await hoy(casa)).ocurrencias).toHaveLength(1);
  });

  it("tildar la deja Cumplida, con quién y cuándo; destildar lo borra", async () => {
    const { casa, adultoId } = await familiaConfigurada("2026-11-17T19:40:00-03:00");
    await crearTarea(casa, { nombre: "Sacar la basura", miembroId: adultoId });
    const [ocurrencia] = (await hoy(casa)).ocurrencias;

    expect((await casa.post(`/ocurrencias/${ocurrencia!.id}/tildar`)).status).toBe(200);
    expect((await hoy(casa)).ocurrencias[0]).toMatchObject({
      estado: "cumplida",
      tildadaPor: { nombre: "Mamá" },
      tildadaEn: "2026-11-17T22:40:00.000Z",
    });

    await casa.post(`/ocurrencias/${ocurrencia!.id}/destildar`);
    expect((await hoy(casa)).ocurrencias[0]).toMatchObject({ estado: "pendiente", tildadaPor: null, tildadaEn: null });
  });

  it("muestra primero las Pendientes y abajo las Cumplidas", async () => {
    const { casa, adultoId } = await familiaConfigurada();
    await crearTarea(casa, { nombre: "Abrir las ventanas", miembroId: adultoId });
    await crearTarea(casa, { nombre: "Barrer", miembroId: adultoId });
    await crearTarea(casa, { nombre: "Cerrar con llave", miembroId: adultoId });
    const abrir = (await hoy(casa)).ocurrencias.find((o) => o.nombre === "Abrir las ventanas")!;
    await casa.post(`/ocurrencias/${abrir.id}/tildar`);

    expect((await hoy(casa)).ocurrencias.map((o) => [o.nombre, o.estado])).toEqual([
      ["Barrer", "pendiente"],
      ["Cerrar con llave", "pendiente"],
      ["Abrir las ventanas", "cumplida"],
    ]);
  });

  it("el día cambia a las 00:00 hora de la Familia, no a medianoche UTC", async () => {
    const { casa, adultoId, reloj } = await familiaConfigurada("2026-11-17T20:00:00-03:00");
    await crearTarea(casa, { nombre: "Sacar la basura", miembroId: adultoId });
    const martes = (await hoy(casa)).ocurrencias[0]!;
    await casa.post(`/ocurrencias/${martes.id}/tildar`);

    reloj.fijar("2026-11-17T21:00:00-03:00"); // 00:00 UTC del miércoles: en Buenos Aires sigue siendo martes
    let h = await hoy(casa);
    expect(h.fecha).toBe("2026-11-17");
    expect(h.ocurrencias).toEqual([expect.objectContaining({ id: martes.id, estado: "cumplida" })]);

    reloj.fijar("2026-11-17T23:59:00-03:00");
    expect((await hoy(casa)).fecha).toBe("2026-11-17");

    reloj.fijar("2026-11-18T00:01:00-03:00");
    h = await hoy(casa);
    expect(h.fecha).toBe("2026-11-18");
    expect(h.ocurrencias).toEqual([expect.objectContaining({ inicio: "2026-11-18", estado: "pendiente" })]);
    expect(h.ocurrencias[0]!.id).not.toBe(martes.id);
  });

  it("sin sesión no se pueden crear Tareas", async () => {
    const { casa } = await familiaConfigurada();
    // Sin sesión de Adulto (después de "Cambiar de Miembro") no se pueden crear.
    await casa.post("/salir");
    expect((await casa.post("/tareas", { nombre: "x", frecuencia: "diaria", miembroId: 1 })).status).toBe(401);
  });
});
