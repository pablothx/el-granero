import { useQuery } from "@tanstack/react-query";
import { api, pedir } from "./api";

export const CLAVE_AVATARES = ["avatares"] as const;

/** Miembros activos (los mismos de la pantalla de Avatares). */
export function useMiembrosActivos() {
  return useQuery({ queryKey: CLAVE_AVATARES, queryFn: () => pedir(() => api.avatares.$get()) });
}

export const CLAVE_MIEMBROS = ["miembros"] as const;
export type MiembroAdmin = Awaited<ReturnType<typeof cargarMiembros>>["miembros"][number];

function cargarMiembros() {
  return pedir(() => api.miembros.$get());
}

/** Todos los Miembros, incluidos los Archivados (solo Adultos). */
export function useMiembros() {
  return useQuery({ queryKey: CLAVE_MIEMBROS, queryFn: cargarMiembros });
}
