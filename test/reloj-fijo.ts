import type { Reloj } from "../src/worker/reloj";

export interface RelojFijo extends Reloj {
  fijar(instante: string | Date): void;
  avanzar(milisegundos: number): void;
}

export function relojFijo(instante: string | Date): RelojFijo {
  let actual = new Date(instante);
  return {
    ahora: () => new Date(actual),
    fijar: (nuevo) => {
      actual = new Date(nuevo);
    },
    avanzar: (ms) => {
      actual = new Date(actual.getTime() + ms);
    },
  };
}
