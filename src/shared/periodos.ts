/**
 * Cálculo de Períodos: funciones puras sobre fechas locales de la Familia.
 * Una Fecha es "YYYY-MM-DD" en la zona horaria de la Familia; los Períodos
 * van de `inicio` (incluido) a `fin` (excluido).
 */

export const FRECUENCIAS = ["diaria", "semanal", "mensual"] as const;
export type Frecuencia = (typeof FRECUENCIAS)[number];
export type Fecha = string;

/** Días de la semana: 1 = lunes … 7 = domingo. */
export type DiaSemana = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export const NOMBRES_DIAS: Record<DiaSemana, string> = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  7: "Domingo",
};

export interface Regla {
  frecuencia: Frecuencia;
  /** Solo para Diaria: días en que corresponde. Vacío = todos los días. */
  dias: readonly DiaSemana[];
}

export interface Periodo {
  inicio: Fecha;
  fin: Fecha;
}

export type EstadoOcurrencia = "pendiente" | "cumplida" | "no_cumplida";

const formateadores = new Map<string, Intl.DateTimeFormat>();

/** La fecha local de un instante en la zona horaria dada. */
export function fechaLocal(instante: Date, zonaHoraria: string): Fecha {
  let f = formateadores.get(zonaHoraria);
  if (!f) {
    f = new Intl.DateTimeFormat("en-CA", { timeZone: zonaHoraria, year: "numeric", month: "2-digit", day: "2-digit" });
    formateadores.set(zonaHoraria, f);
  }
  return f.format(instante);
}

function aUTC(fecha: Fecha): Date {
  return new Date(`${fecha}T00:00:00Z`);
}

function deUTC(d: Date): Fecha {
  return d.toISOString().slice(0, 10);
}

export function sumarDias(fecha: Fecha, dias: number): Fecha {
  const d = aUTC(fecha);
  d.setUTCDate(d.getUTCDate() + dias);
  return deUTC(d);
}

export function diaDeSemana(fecha: Fecha): DiaSemana {
  const domingoCero = aUTC(fecha).getUTCDay();
  return (domingoCero === 0 ? 7 : domingoCero) as DiaSemana;
}

/** El Período de la regla que contiene a `hoy`, o null si ese día no corresponde (Diaria con días elegidos). */
export function periodoDe(regla: Regla, hoy: Fecha): Periodo | null {
  switch (regla.frecuencia) {
    case "diaria":
      if (regla.dias.length > 0 && !regla.dias.includes(diaDeSemana(hoy))) return null;
      return { inicio: hoy, fin: sumarDias(hoy, 1) };
    case "semanal": {
      const lunes = sumarDias(hoy, 1 - diaDeSemana(hoy));
      return { inicio: lunes, fin: sumarDias(lunes, 7) };
    }
    case "mensual": {
      const [anio, mes] = hoy.split("-").map(Number) as [number, number];
      const inicio = `${anio}-${String(mes).padStart(2, "0")}-01`;
      const siguiente = mes === 12 ? `${anio + 1}-01-01` : `${anio}-${String(mes + 1).padStart(2, "0")}-01`;
      return { inicio, fin: siguiente };
    }
  }
}

/** A qué tipo de Período corresponde, según su largo. */
export function tipoDePeriodo({ inicio, fin }: Periodo): Frecuencia {
  const dias = (aUTC(fin).getTime() - aUTC(inicio).getTime()) / 86_400_000;
  return dias <= 1 ? "diaria" : dias <= 7 ? "semanal" : "mensual";
}

export function periodoTerminado(periodo: Periodo, hoy: Fecha): boolean {
  return periodo.fin <= hoy;
}

export function periodoActual(periodo: Periodo, hoy: Fecha): boolean {
  return periodo.inicio <= hoy && hoy < periodo.fin;
}

export function estadoDe(ocurrencia: Periodo & { tildadaEn: Date | string | null }, hoy: Fecha): EstadoOcurrencia {
  if (ocurrencia.tildadaEn) return "cumplida";
  return periodoTerminado(ocurrencia, hoy) ? "no_cumplida" : "pendiente";
}

/** Días elegidos ⇄ máscara de bits (bit 0 = lunes); 0 = todos los días. */
export function diasAMascara(dias: readonly DiaSemana[]): number {
  return dias.reduce((m, d) => m | (1 << (d - 1)), 0);
}

export function mascaraADias(mascara: number): DiaSemana[] {
  return ([1, 2, 3, 4, 5, 6, 7] as const).filter((d) => mascara & (1 << (d - 1)));
}
