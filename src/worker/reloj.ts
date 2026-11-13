/**
 * Única fuente de "ahora" del Worker. Ningún otro código lee la hora del
 * sistema: así los tests pueden fijar y avanzar el tiempo.
 */
export interface Reloj {
  ahora(): Date;
}

export const relojDelSistema: Reloj = {
  ahora: () => new Date(),
};
