import { useQuery } from "@tanstack/react-query";
import { Check, ChevronRight } from "lucide-react";
import { Link, useParams } from "react-router";
import { Avatar } from "@/components/Avatar";
import { ListaHoy } from "@/components/ListaHoy";
import { Pantalla, Titulo } from "@/components/Pantalla";
import { Volver } from "@/components/Volver";
import { cn } from "@/lib/utils";
import { CLAVE_FAMILIA, cargarHoyDe, cargarTerminadas, claveHoy, claveTerminadas, useTildar, type OcurrenciaVista } from "../ocurrencias";
import { api, pedir } from "../api";
import { formatearFecha } from "./Hoy";

export function Familia() {
  const familia = useQuery({ queryKey: CLAVE_FAMILIA, queryFn: () => pedir(() => api.familia.$get()) });
  return (
    <Pantalla>
      <Titulo>Familia</Titulo>
      {familia.data && <p className="-mt-3 mb-5 text-muted-foreground first-letter:uppercase">{formatearFecha(familia.data.fecha)}</p>}
      {familia.isPending && <p className="text-muted-foreground">Cargando…</p>}
      <ul className="flex flex-col gap-2">
        {familia.data?.miembros.map(({ miembro, cumplidas, total }) => {
          const completo = total > 0 && cumplidas === total;
          return (
            <li key={miembro.id}>
              <Link to={`/familia/${miembro.id}`} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-sm active:scale-[0.98]">
                <Avatar emoji={miembro.emoji} color={miembro.color} />
                <span className="flex-1">
                  <span className="block text-lg font-semibold">{miembro.nombre}</span>
                  <span className="mt-1 block h-2 overflow-hidden rounded-full bg-muted">
                    <span className={cn("block h-full rounded-full bg-primary transition-all", completo && "bg-exito")} style={{ width: total ? `${(cumplidas / total) * 100}%` : "0%" }} />
                  </span>
                </span>
                <span className={cn("w-14 text-right text-lg font-bold tabular-nums", completo && "text-exito")} aria-label={`${cumplidas} de ${total}`}>
                  {total === 0 ? "—" : `${cumplidas}/${total}`}
                </span>
                <ChevronRight className="text-muted-foreground" />
              </Link>
            </li>
          );
        })}
      </ul>
    </Pantalla>
  );
}

export function HoyDeMiembro() {
  const id = Number(useParams().id);
  const hoy = useQuery({ queryKey: claveHoy(id), queryFn: () => cargarHoyDe(id) });
  const terminadas = useQuery({ queryKey: claveTerminadas(id), queryFn: () => cargarTerminadas(id) });
  const tildarHoy = useTildar(claveHoy(id));
  const tildarPasada = useTildar(claveTerminadas(id));
  const miembro = hoy.data?.miembro;

  return (
    <Pantalla>
      <Volver a="/familia" texto="Familia" />
      {miembro && (
        <div className="mb-5 flex items-center gap-3">
          <Avatar emoji={miembro.emoji} color={miembro.color} tamaño="lg" />
          <h1 className="text-3xl font-bold">{miembro.nombre}</h1>
        </div>
      )}
      {hoy.isPending && <p className="text-muted-foreground">Cargando…</p>}
      {hoy.data && (
        <ListaHoy
          ocurrencias={hoy.data.ocurrencias}
          onTildar={(o) => tildarHoy.mutate({ id: o.id, tildar: o.estado !== "cumplida" })}
          vacio="No tiene nada para hoy."
        />
      )}
      {terminadas.data && terminadas.data.ocurrencias.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold">Días anteriores</h2>
          <p className="mb-3 text-sm text-muted-foreground">Últimas 2 semanas. Tocá una para corregirla si se hizo y no se tildó (o al revés).</p>
          <Pasadas ocurrencias={terminadas.data.ocurrencias} onCorregir={(o) => tildarPasada.mutate({ id: o.id, tildar: o.estado !== "cumplida" })} />
        </section>
      )}
    </Pantalla>
  );
}

function etiquetaPeriodo(o: OcurrenciaVista) {
  if (o.tipo === "diaria") return formatearFecha(o.inicio);
  if (o.tipo === "semanal") return `Semana del ${new Date(`${o.inicio}T12:00:00Z`).toLocaleDateString("es-AR", { day: "numeric", month: "long", timeZone: "UTC" })}`;
  return new Date(`${o.inicio}T12:00:00Z`).toLocaleDateString("es-AR", { month: "long", year: "numeric", timeZone: "UTC" });
}

function Pasadas({ ocurrencias, onCorregir }: { ocurrencias: OcurrenciaVista[]; onCorregir: (o: OcurrenciaVista) => void }) {
  const grupos = new Map<string, OcurrenciaVista[]>();
  for (const o of ocurrencias) {
    const clave = etiquetaPeriodo(o);
    grupos.set(clave, [...(grupos.get(clave) ?? []), o]);
  }
  return (
    <div className="flex flex-col gap-4">
      {[...grupos].map(([periodo, lista]) => (
        <div key={periodo}>
          <h3 className="mb-1.5 text-sm font-semibold text-muted-foreground first-letter:uppercase">{periodo}</h3>
          <ul className="flex flex-col gap-1.5">
            {lista.map((o) => {
              const cumplida = o.estado === "cumplida";
              return (
                <li key={o.id}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={cumplida}
                    onClick={() => onCorregir(o)}
                    className="flex w-full items-center gap-3 rounded-xl bg-card px-3 py-2 text-left shadow-sm active:scale-[0.98]"
                  >
                    <span className="w-7 text-center text-xl">{o.emoji ?? "✨"}</span>
                    <span className="flex-1">
                      <span className="block font-medium">{o.nombre}</span>
                      <span className={cn("block text-xs", cumplida ? "text-exito" : "text-destructive")}>
                        {cumplida ? `Cumplida${o.tildadaPor ? ` · tildó ${o.tildadaPor.nombre}` : ""}` : "No cumplida"}
                      </span>
                    </span>
                    <span className={cn("flex size-7 items-center justify-center rounded-full border-2 border-muted-foreground/40", cumplida && "border-exito bg-exito text-white")}>
                      {cumplida && <Check className="size-4" strokeWidth={3} />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
