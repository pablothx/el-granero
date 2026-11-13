import { useQuery } from "@tanstack/react-query";
import { api } from "../api";

export function Inicio() {
  const estado = useQuery({
    queryKey: ["estado"],
    queryFn: async () => {
      const respuesta = await api.estado.$get();
      if (!respuesta.ok) throw new Error(`La API respondió ${respuesta.status}`);
      return respuesta.json();
    },
  });

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-4 py-10 text-center">
      <img src="/favicon.svg" alt="" className="size-28 drop-shadow-sm" />
      <h1 className="text-4xl font-bold tracking-tight">El Granero</h1>
      {estado.isPending && <p className="text-muted-foreground">Cargando…</p>}
      {estado.isError && (
        <p className="rounded-lg bg-muted px-4 py-3 text-muted-foreground">
          No pudimos conectarnos. Probá de nuevo en un rato.
        </p>
      )}
      {estado.data && (
        <p className="rounded-lg bg-muted px-4 py-3 text-lg">
          {estado.data.familiaConfigurada
            ? "La Familia ya está configurada."
            : "Todavía no hay ninguna Familia configurada."}
        </p>
      )}
    </main>
  );
}
