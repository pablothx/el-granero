export const LISTAS = ["super", "generales"] as const;
export type Lista = (typeof LISTAS)[number];
export const NOMBRES_LISTAS: Record<Lista, string> = { super: "Súper", generales: "Generales" };

/** Un Ítem Comprado deja de mostrarse (y el Cron lo borra) a las 24 h. */
export const VIDA_COMPRADO_MS = 24 * 60 * 60 * 1000;

/** Para comparar Ítems: sin mayúsculas, sin tildes y sin espacios de más. */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Un Ítem sin comprar parecido al texto que se está escribiendo: igual
 * ignorando mayúsculas y tildes, o uno contenido en el otro ("azúcar" y
 * "falta azucar"). Solo avisa; no impide anotar.
 */
export function buscarParecido<T extends { texto: string }>(texto: string, sinComprar: readonly T[]): T | undefined {
  const buscado = normalizar(texto);
  if (buscado.length < 3) return undefined;
  return sinComprar.find((item) => {
    const existente = normalizar(item.texto);
    return existente === buscado || (existente.length >= 3 && (existente.includes(buscado) || buscado.includes(existente)));
  });
}
