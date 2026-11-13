import { useQuery } from "@tanstack/react-query";
import { api, pedir } from "./api";

export const CLAVE_ESTADO = ["estado"] as const;

/** Qué sabe el dispositivo: si hay Familia, si está vinculado y quién tiene la sesión abierta. */
export function useEstado() {
  return useQuery({
    queryKey: CLAVE_ESTADO,
    queryFn: () => pedir(() => api.estado.$get()),
    refetchInterval: false,
  });
}

export function useMiembroActual() {
  const miembro = useEstado().data?.miembro;
  if (!miembro) throw new Error("useMiembroActual fuera de una sesión");
  return miembro;
}

export function adivinarNombreDispositivo(): string {
  const ua = navigator.userAgent;
  const sistema = /iPad/.test(ua)
    ? "iPad"
    : /iPhone/.test(ua)
      ? "iPhone"
      : /Android/.test(ua)
        ? "Android"
        : /Windows/.test(ua)
          ? "Windows"
          : /Mac/.test(ua)
            ? "Mac"
            : /Linux/.test(ua)
              ? "Linux"
              : "Dispositivo";
  const navegador = /Edg\//.test(ua) ? "Edge" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "";
  return navegador ? `${sistema} · ${navegador}` : sistema;
}

/** Al cambiar de Miembro: borra los datos del anterior y vuelve a pedir el estado. */
export async function reiniciarSesion(queryClient: import("@tanstack/react-query").QueryClient) {
  queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== CLAVE_ESTADO[0] });
  await queryClient.invalidateQueries({ queryKey: CLAVE_ESTADO });
}
