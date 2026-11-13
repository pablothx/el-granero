import { useQuery } from "@tanstack/react-query";
import { api, pedir } from "./api";

export const CLAVE_AVATARES = ["avatares"] as const;

/** Miembros activos (los mismos de la pantalla de Avatares). */
export function useMiembrosActivos() {
  return useQuery({ queryKey: CLAVE_AVATARES, queryFn: () => pedir(() => api.avatares.$get()) });
}
