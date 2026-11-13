import { describe, expect, it } from "vitest";
import { diaDeSemana, estadoDe, fechaLocal, periodoDe, tipoDePeriodo } from "../src/shared/periodos";

const ZONA = "America/Argentina/Buenos_Aires";

describe("Períodos", () => {
  it("la fecha local es la de la Familia, no la de UTC", () => {
    expect(fechaLocal(new Date("2026-11-18T02:59:00Z"), ZONA)).toBe("2026-11-17");
    expect(fechaLocal(new Date("2026-11-18T03:00:00Z"), ZONA)).toBe("2026-11-18");
  });

  it("los días de la semana van de lunes (1) a domingo (7)", () => {
    expect(diaDeSemana("2026-11-16")).toBe(1);
    expect(diaDeSemana("2026-11-22")).toBe(7);
  });

  it("Diaria: un día", () => {
    expect(periodoDe({ frecuencia: "diaria", dias: [] }, "2026-12-31")).toEqual({ inicio: "2026-12-31", fin: "2027-01-01" });
  });

  it("Diaria con días elegidos: solo esos días (lunes, miércoles y viernes)", () => {
    const regla = { frecuencia: "diaria", dias: [1, 3, 5] } as const;
    const semana = ["2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20", "2026-11-21", "2026-11-22"];
    expect(semana.map((d) => periodoDe(regla, d) !== null)).toEqual([true, false, true, false, true, false, false]);
  });

  it("Semanal: de lunes a lunes, también cruzando el cambio de domingo a lunes", () => {
    const regla = { frecuencia: "semanal", dias: [] } as const;
    expect(periodoDe(regla, "2026-11-16")).toEqual({ inicio: "2026-11-16", fin: "2026-11-23" });
    expect(periodoDe(regla, "2026-11-22")).toEqual({ inicio: "2026-11-16", fin: "2026-11-23" });
    expect(periodoDe(regla, "2026-11-23")).toEqual({ inicio: "2026-11-23", fin: "2026-11-30" });
    expect(periodoDe(regla, "2026-12-31")).toEqual({ inicio: "2026-12-28", fin: "2027-01-04" });
  });

  it("Mensual: mes calendario, incluido febrero en año común y bisiesto, y diciembre", () => {
    const regla = { frecuencia: "mensual", dias: [] } as const;
    expect(periodoDe(regla, "2026-02-28")).toEqual({ inicio: "2026-02-01", fin: "2026-03-01" });
    expect(periodoDe(regla, "2028-02-29")).toEqual({ inicio: "2028-02-01", fin: "2028-03-01" });
    expect(periodoDe(regla, "2026-12-15")).toEqual({ inicio: "2026-12-01", fin: "2027-01-01" });
  });

  it("el tipo de un Período se deduce de su largo", () => {
    expect(tipoDePeriodo({ inicio: "2026-11-17", fin: "2026-11-18" })).toBe("diaria");
    expect(tipoDePeriodo({ inicio: "2026-11-16", fin: "2026-11-23" })).toBe("semanal");
    expect(tipoDePeriodo({ inicio: "2026-02-01", fin: "2026-03-01" })).toBe("mensual");
  });

  it("estado: Cumplida con tilde; si no, Pendiente o No cumplida según el Período", () => {
    const p = { inicio: "2026-11-17", fin: "2026-11-18" };
    expect(estadoDe({ ...p, tildadaEn: null }, "2026-11-17")).toBe("pendiente");
    expect(estadoDe({ ...p, tildadaEn: null }, "2026-11-18")).toBe("no_cumplida");
    expect(estadoDe({ ...p, tildadaEn: new Date() }, "2026-11-18")).toBe("cumplida");
  });
});
