import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OcurrenciaVista } from "../ocurrencias";

const TITULOS = { diaria: "Hoy", semanal: "Esta semana", mensual: "Este mes" } as const;

/** Las Ocurrencias de un Hoy: Pendientes agrupadas por tipo y, abajo, lo Cumplido hoy. */
export function ListaHoy({
  ocurrencias,
  onTildar,
  vacio,
}: {
  ocurrencias: OcurrenciaVista[];
  onTildar: (o: OcurrenciaVista) => void;
  vacio: React.ReactNode;
}) {
  if (ocurrencias.length === 0) return <div className="rounded-2xl bg-muted p-6 text-center text-muted-foreground">{vacio}</div>;
  const pendientes = ocurrencias.filter((o) => o.estado !== "cumplida");
  const cumplidas = ocurrencias.filter((o) => o.estado === "cumplida");

  return (
    <div className="flex flex-col gap-6">
      {(["diaria", "semanal", "mensual"] as const).map((tipo) => {
        const grupo = pendientes.filter((o) => o.tipo === tipo);
        if (!grupo.length) return null;
        return (
          <section key={tipo}>
            <h2 className="mb-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">{TITULOS[tipo]}</h2>
            <ul className="flex flex-col gap-2">
              {grupo.map((o) => (
                <Fila key={o.id} ocurrencia={o} onTildar={onTildar} />
              ))}
            </ul>
          </section>
        );
      })}
      {pendientes.length === 0 && (
        <p className="rounded-2xl bg-exito/15 p-5 text-center text-lg font-semibold">¡Terminaste todo! 🎉</p>
      )}
      {cumplidas.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">Hecho</h2>
          <ul className="flex flex-col gap-2">
            {cumplidas.map((o) => (
              <Fila key={o.id} ocurrencia={o} onTildar={onTildar} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Fila({ ocurrencia: o, onTildar }: { ocurrencia: OcurrenciaVista; onTildar: (o: OcurrenciaVista) => void }) {
  const cumplida = o.estado === "cumplida";
  return (
    <li>
      <button
        type="button"
        role="checkbox"
        aria-checked={cumplida}
        onClick={() => onTildar(o)}
        className={cn(
          "flex min-h-16 w-full items-center gap-3 rounded-2xl bg-card px-4 py-3 text-left shadow-sm transition active:scale-[0.98]",
          cumplida && "bg-muted shadow-none",
        )}
      >
        <span className="w-9 shrink-0 text-center text-3xl">{o.emoji ?? "✨"}</span>
        <span className="flex-1">
          <span className={cn("block text-lg font-semibold", cumplida && "text-muted-foreground line-through")}>{o.nombre}</span>
          {cumplida && o.tildadaPor && <span className="block text-xs text-muted-foreground">Tildó {o.tildadaPor.nombre}</span>}
        </span>
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-primary/50",
            cumplida && "border-exito bg-exito text-white",
          )}
        >
          {cumplida && <Check className="size-6" strokeWidth={3} />}
        </span>
      </button>
    </li>
  );
}
