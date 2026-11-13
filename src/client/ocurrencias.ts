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

/**
 * Tildar o destildar con actualización optimista: la interfaz cambia antes de
 * la respuesta y vuelve atrás (con un aviso) si la API falla.
 */
export function useTildar(clave: QueryKey) {
  const queryClient = useQueryClient();
  const miembro = useMiembroActual();
  return useMutation({
    mutationFn: ({ id, tildar }: { id: number; tildar: boolean }) =>
      pedir(() => (tildar ? api.ocurrencias[":id"].tildar.$post({ param: { id: String(id) } }) : api.ocurrencias[":id"].destildar.$post({ param: { id: String(id) } }))),
    onMutate: async ({ id, tildar }) => {
      await queryClient.cancelQueries({ queryKey: clave });
      const anterior = queryClient.getQueryData<DatosHoy>(clave);
      queryClient.setQueryData<DatosHoy>(clave, (datos) =>
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
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["hoy"] }),
  });
}
