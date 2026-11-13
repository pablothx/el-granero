import { useQuery } from "@tanstack/react-query";
import { api, pedir } from "./api";

export const CLAVE_TAREAS = ["tareas"] as const;
export type TareaVista = Awaited<ReturnType<typeof cargarTareas>>["tareas"][number];

export function cargarTareas() {
  return pedir(() => api.tareas.$get());
}

export function useTareas() {
  return useQuery({ queryKey: CLAVE_TAREAS, queryFn: cargarTareas });
}

export const SUGERENCIAS_EMOJI = ["🗑️", "🐶", "🐱", "🌿", "🧹", "🧺", "🍽️", "🛏️", "🚿", "🪴", "📚", "🧸", "🚗", "🛒", "🧽", "👕"];
