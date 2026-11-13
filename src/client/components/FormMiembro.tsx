import { useState } from "react";
import { Campo, MensajeError } from "@/components/Pantalla";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Rol } from "../../shared/dominio";
import { ElegirAvatar, type Color, type Emoji } from "./ElegirAvatar";

export interface DatosMiembro {
  nombre: string;
  rol: Rol;
  avatar: { emoji: Emoji; color: Color };
  pin?: string;
}

export function FormMiembro({
  inicial,
  conPin,
  textoBoton,
  ocupado,
  error,
  onGuardar,
}: {
  inicial: DatosMiembro;
  conPin: boolean;
  textoBoton: string;
  ocupado: boolean;
  error: string | null;
  onGuardar: (datos: DatosMiembro) => void;
}) {
  const [datos, setDatos] = useState(inicial);
  const cambiar = (parcial: Partial<DatosMiembro>) => setDatos((d) => ({ ...d, ...parcial }));

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        onGuardar(datos);
      }}
    >
      <Campo etiqueta="Nombre">
        <Input value={datos.nombre} onChange={(e) => cambiar({ nombre: e.target.value })} required maxLength={40} />
      </Campo>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm font-semibold">Rol</legend>
        <div className="grid grid-cols-2 gap-2" role="radiogroup">
          {(
            [
              ["adulto", "Adulto", "Administra Tareas y Miembros"],
              ["chico", "Chico", "Ve y tilda lo suyo"],
            ] as const
          ).map(([valor, nombre, ayuda]) => (
            <button
              key={valor}
              type="button"
              role="radio"
              aria-checked={datos.rol === valor}
              onClick={() => cambiar({ rol: valor })}
              className={cn("rounded-xl bg-muted p-3 text-left", datos.rol === valor && "bg-primary text-primary-foreground")}
            >
              <span className="block font-semibold">{nombre}</span>
              <span className="block text-xs opacity-80">{ayuda}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <ElegirAvatar emoji={datos.avatar.emoji} color={datos.avatar.color} onCambiar={(avatar) => cambiar({ avatar })} />
      {conPin && (
        <Campo etiqueta="PIN" ayuda="4 números. Se lo tiene que acordar.">
          <Input
            type="password"
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            value={datos.pin ?? ""}
            onChange={(e) => cambiar({ pin: e.target.value.replace(/\D/g, "") })}
            required
            autoComplete="off"
          />
        </Campo>
      )}
      <MensajeError>{error}</MensajeError>
      <Button type="submit" size="lg" className="h-12 text-base" disabled={ocupado}>
        {textoBoton}
      </Button>
    </form>
  );
}
