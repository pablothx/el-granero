import { useQuery } from "@tanstack/react-query";
import { ListaHoy } from "@/components/ListaHoy";
import { Pantalla, Titulo } from "@/components/Pantalla";
import { useMiembroActual } from "../estado";
import { cargarHoy, claveHoy, useTildar } from "../ocurrencias";

export function formatearFecha(fecha: string) {
  return new Date(`${fecha}T12:00:00Z`).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
}

export function Hoy() {
  const miembro = useMiembroActual();
  const hoy = useQuery({ queryKey: claveHoy(), queryFn: () => cargarHoy() });
  const tildar = useTildar(claveHoy());

  return (
    <Pantalla>
      <Titulo>Hoy</Titulo>
      {hoy.data && <p className="-mt-3 mb-5 text-muted-foreground first-letter:uppercase">{formatearFecha(hoy.data.fecha)}</p>}
      {hoy.isPending && <p className="text-muted-foreground">Cargando…</p>}
      {hoy.data && (
        <ListaHoy
          ocurrencias={hoy.data.ocurrencias}
          onTildar={(o) => tildar.mutate({ id: o.id, tildar: o.estado !== "cumplida" })}
          vacio={`No tenés nada para hoy, ${miembro.nombre}. 🌾`}
        />
      )}
    </Pantalla>
  );
}
