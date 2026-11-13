import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Lista } from "../shared/listas";
import { api, mensajeDeError, pedir } from "./api";
import { useMiembroActual } from "./estado";

export const claveLista = (lista: Lista) => ["lista", lista] as const;
export type DatosLista = Awaited<ReturnType<typeof cargarLista>>;
export type ItemVista = DatosLista["items"][number];

function cargarLista(lista: Lista) {
  return pedir(() => api.listas[":lista"].$get({ param: { lista } }));
}

export function useLista(lista: Lista) {
  return useQuery({ queryKey: claveLista(lista), queryFn: () => cargarLista(lista) });
}

/** Cambios sobre una Lista, con actualización optimista y vuelta atrás si fallan. */
export function useCambiosLista(lista: Lista) {
  const queryClient = useQueryClient();
  const miembro = useMiembroActual();
  const clave = claveLista(lista);

  function optimista<V>(mutationFn: (v: V) => Promise<unknown>, aplicar: (items: ItemVista[], v: V) => ItemVista[]) {
    return {
      mutationFn,
      onMutate: async (v: V) => {
        await queryClient.cancelQueries({ queryKey: clave });
        const anterior = queryClient.getQueryData<DatosLista>(clave);
        queryClient.setQueryData<DatosLista>(clave, (d) => d && { items: aplicar(d.items, v) });
        return { anterior };
      },
      onError: (error: unknown, _v: V, contexto?: { anterior?: DatosLista }) => {
        if (contexto?.anterior) queryClient.setQueryData(clave, contexto.anterior);
        toast.error(mensajeDeError(error));
      },
      onSettled: () => queryClient.invalidateQueries({ queryKey: clave }),
    };
  }

  const param = (id: number) => ({ param: { id: String(id) } });
  return {
    anotar: useMutation(
      optimista(
        (texto: string) => pedir(() => api.listas[":lista"].items.$post({ param: { lista }, json: { texto } })),
        (items, texto) => [
          { id: -Date.now(), texto, anotadoPor: miembro.nombre, anotadoEn: new Date().toISOString(), comprado: false, compradoPor: null, compradoEn: null },
          ...items,
        ],
      ),
    ),
    comprar: useMutation(
      optimista(
        ({ id, comprado }: { id: number; comprado: boolean }) =>
          pedir(() => (comprado ? api.items[":id"].comprar.$post(param(id)) : api.items[":id"].descomprar.$post(param(id)))),
        (items, { id, comprado }) => {
          const cambiados = items.map((i) =>
            i.id === id
              ? { ...i, comprado, compradoPor: comprado ? miembro.nombre : null, compradoEn: comprado ? new Date().toISOString() : null }
              : i,
          );
          return [...cambiados.filter((i) => !i.comprado), ...cambiados.filter((i) => i.comprado)];
        },
      ),
    ),
    editar: useMutation(
      optimista(
        ({ id, texto }: { id: number; texto: string }) => pedir(() => api.items[":id"].$patch({ ...param(id), json: { texto } })),
        (items, { id, texto }) => items.map((i) => (i.id === id ? { ...i, texto } : i)),
      ),
    ),
    borrar: useMutation(
      optimista(
        (id: number) => pedir(() => api.items[":id"].$delete(param(id))),
        (items, id) => items.filter((i) => i.id !== id),
      ),
    ),
  };
}
