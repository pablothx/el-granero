import { useState } from "react";
import { Campo, MensajeError } from "@/components/Pantalla";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { NOMBRES_DIAS, type DiaSemana, type Frecuencia } from "../../shared/periodos";
import { SUGERENCIAS_EMOJI } from "../tareas";
import { Avatar } from "./Avatar";

export interface DatosTarea {
  nombre: string;
  emoji: string | null;
  frecuencia: Frecuencia;
  dias: DiaSemana[];
  miembroId: number;
}

interface MiembroElegible {
  id: number;
  nombre: string;
  emoji: string;
  color: string;
}

const FRECUENCIAS: { valor: Frecuencia; nombre: string; ayuda: string }[] = [
  { valor: "diaria", nombre: "Diaria", ayuda: "Todos los días, o solo los días que elijas." },
  { valor: "semanal", nombre: "Semanal", ayuda: "Una vez por semana, cualquier día de lunes a domingo." },
  { valor: "mensual", nombre: "Mensual", ayuda: "Una vez por mes, cualquier día del mes." },
];

export function FormTarea({
  inicial,
  miembros,
  textoBoton,
  ocupado,
  error,
  onGuardar,
}: {
  inicial: DatosTarea;
  miembros: MiembroElegible[];
  textoBoton: string;
  ocupado: boolean;
  error: string | null;
  onGuardar: (datos: DatosTarea) => void;
}) {
  const [datos, setDatos] = useState(inicial);
  const cambiar = (parcial: Partial<DatosTarea>) => setDatos((d) => ({ ...d, ...parcial }));

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        onGuardar(datos);
      }}
    >
      <Campo etiqueta="Nombre">
        <Input value={datos.nombre} onChange={(e) => cambiar({ nombre: e.target.value })} required maxLength={40} placeholder="Sacar la basura" />
      </Campo>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm font-semibold">Emoji (opcional)</legend>
        <div className="flex flex-wrap gap-1.5">
          {SUGERENCIAS_EMOJI.map((e) => (
            <button
              key={e}
              type="button"
              aria-pressed={datos.emoji === e}
              onClick={() => cambiar({ emoji: datos.emoji === e ? null : e })}
              className={cn("flex size-11 items-center justify-center rounded-xl bg-muted text-2xl", datos.emoji === e && "bg-primary/15 ring-2 ring-primary")}
            >
              {e}
            </button>
          ))}
        </div>
        <Input
          aria-label="Otro emoji"
          value={datos.emoji ?? ""}
          onChange={(e) => cambiar({ emoji: e.target.value.trim() || null })}
          maxLength={16}
          placeholder="U otro emoji…"
          className="w-40"
        />
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm font-semibold">Frecuencia</legend>
        <div className="grid grid-cols-3 gap-2" role="radiogroup">
          {FRECUENCIAS.map((f) => (
            <button
              key={f.valor}
              type="button"
              role="radio"
              aria-checked={datos.frecuencia === f.valor}
              onClick={() => cambiar({ frecuencia: f.valor })}
              className={cn("rounded-xl bg-muted py-3 font-semibold", datos.frecuencia === f.valor && "bg-primary text-primary-foreground")}
            >
              {f.nombre}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{FRECUENCIAS.find((f) => f.valor === datos.frecuencia)!.ayuda}</p>
        {datos.frecuencia === "diaria" && (
          <div className="mt-1 flex flex-wrap gap-1.5" aria-label="Días de la semana">
            {([1, 2, 3, 4, 5, 6, 7] as const).map((d) => {
              const activo = datos.dias.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={activo}
                  aria-label={NOMBRES_DIAS[d]}
                  onClick={() => cambiar({ dias: activo ? datos.dias.filter((x) => x !== d) : [...datos.dias, d].sort() })}
                  className={cn("size-10 rounded-full bg-muted text-sm font-semibold", activo && "bg-primary text-primary-foreground")}
                >
                  {NOMBRES_DIAS[d].slice(0, 2)}
                </button>
              );
            })}
            <span className="w-full text-xs text-muted-foreground">
              {datos.dias.length === 0 ? "Sin días marcados: todos los días." : `Solo: ${datos.dias.map((d) => NOMBRES_DIAS[d]).join(", ")}.`}
            </span>
          </div>
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm font-semibold">¿A quién le toca?</legend>
        <div className="flex flex-wrap gap-2" role="radiogroup">
          {miembros.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={datos.miembroId === m.id}
              onClick={() => cambiar({ miembroId: m.id })}
              className={cn("flex items-center gap-2 rounded-full bg-muted py-1 pr-4 pl-1", datos.miembroId === m.id && "bg-primary/15 ring-2 ring-primary")}
            >
              <Avatar emoji={m.emoji} color={m.color} tamaño="sm" />
              <span className="font-medium">{m.nombre}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <MensajeError>{error}</MensajeError>
      <Button type="submit" size="lg" className="h-12 text-base" disabled={ocupado}>
        {textoBoton}
      </Button>
    </form>
  );
}
