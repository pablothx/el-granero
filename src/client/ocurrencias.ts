import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, mensajeDeError, pedir } from "./api";
import { useMiembroActual } from "./estado";

export type DatosHoy = Awaited<ReturnType<typeof cargarHoy>>;
export type OcurrenciaVista = DatosHoy["ocurrencias"][number];

export function cargarHoy() {
  return pedir(() => api.hoy.$get());
}

export const claveHoy = (miembroId?: number): QueryKey => (miembroId ? ["hoy", miembroId] : ["hoy"]);
export const claveTerminadas = (miembroId: number): QueryKey => ["terminadas", miembroId];
export const CLAVE_FAMILIA = ["familia"] as const;

export function cargarHoyDe(miembroId: number) {
  return pedir(() => api.miembros[":id"].hoy.$get({ param: { id: String(miembroId) } }));
}

export function cargarTerminadas(miembroId: number) {
  return pedir(() => api.miembros[":id"].terminadas.$get({ param: { id: String(miembroId) }, query: { dias: "14" } }));
}

/**
 * Tildar o destildar con actualización optimista: la interfaz cambia antes de
 * la respuesta y vuelve atrás (con un aviso) si la API falla.
 */
interface ConOcurrencias {
  ocurrencias: OcurrenciaVista[];
}

export function useTildar(clave: QueryKey) {
  const queryClient = useQueryClient();
  const miembro = useMiembroActual();
  return useMutation({
    mutationFn: ({ id, tildar }: { id: number; tildar: boolean }) =>
      pedir(() => (tildar ? api.ocurrencias[":id"].tildar.$post({ param: { id: String(id) } }) : api.ocurrencias[":id"].destildar.$post({ param: { id: String(id) } }))),
    onMutate: async ({ id, tildar }) => {
      await queryClient.cancelQueries({ queryKey: clave });
      const anterior = queryClient.getQueryData<ConOcurrencias>(clave);
      queryClient.setQueryData<ConOcurrencias>(clave, (datos) =>
        datos && {
          ...datos,
          ocurrencias: datos.ocurrencias.map((o) =>
            o.id === id
              ? {
                  ...o,
                  estado: tildar ? "cumplida" : "pendiente",
                  tildadaEn: tildar ? new Date().toISOString() : null,
                  tildadaPor: tildar ? { id: miembro.id, nombre: miembro.nombre } : null,
                }
              : o,
          ),
        },
      );
      return { anterior };
    },
    onError: (error, _variables, contexto) => {
      if (contexto?.anterior) queryClient.setQueryData(clave, contexto.anterior);
      toast.error(mensajeDeError(error));
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["hoy"] }),
        queryClient.invalidateQueries({ queryKey: ["terminadas"] }),
        queryClient.invalidateQueries({ queryKey: CLAVE_FAMILIA }),
      ]),
  });
}
