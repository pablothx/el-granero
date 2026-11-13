import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { del, get, set } from "idb-keyval";
import { ErrorApi } from "./api";

export function crearQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Ver spec: los datos se refrescan al volver a la app, al recuperar la conexión y cada ~15 s.
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchInterval: 15_000,
        // Para que la última lectura sobreviva al cerrar la app (ver persistidor).
        gcTime: 7 * 24 * 60 * 60 * 1000,
        // Solo se reintentan los errores de red, no las respuestas de la API.
        retry: (intentos, error) => intentos < 1 && (!(error instanceof ErrorApi) || error.codigo === "sin_conexion"),
      },
      mutations: {
        // Sin conexión, las escrituras fallan enseguida con un aviso: no hay cola
        // de cambios pendientes (ADR 0003). TanStack por defecto las pausaría.
        networkMode: "always",
      },
    },
  });
}

/**
 * La caché de consultas se guarda en IndexedDB, así sin conexión la app
 * abre mostrando lo último que cargó (Hoy, Listas…).
 */
export const persistidor = createAsyncStoragePersister({
  storage: { getItem: get, setItem: set, removeItem: del },
  key: "el-granero-cache",
  throttleTime: 1000,
});
