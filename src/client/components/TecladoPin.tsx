import { Delete } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Teclado numérico grande para el PIN de 4 dígitos. Llama a `onCompletar`
 * apenas se cargan los 4; si `error` cambia, se vacía para reintentar.
 */
export function TecladoPin({
  onCompletar,
  error,
  ocupado = false,
}: {
  onCompletar: (pin: string) => void;
  error?: string | null;
  ocupado?: boolean;
}) {
  const [pin, setPin] = useState("");

  useEffect(() => {
    if (error) setPin("");
  }, [error]);

  function tocar(digito: string) {
    if (ocupado || pin.length >= 4) return;
    const nuevo = pin + digito;
    setPin(nuevo);
    if (nuevo.length === 4) onCompletar(nuevo);
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className={cn("flex gap-4", error && "animate-[temblar_0.3s]")} aria-label={`${pin.length} de 4 dígitos`}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={cn("size-4 rounded-full border-2 border-foreground/60", i < pin.length && "bg-foreground/80")} />
        ))}
      </div>
      <p className="min-h-6 text-center text-sm font-medium text-destructive" role="alert">
        {error}
      </p>
      <div className="grid grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <Tecla key={d} onClick={() => tocar(d)} disabled={ocupado}>
            {d}
          </Tecla>
        ))}
        <span />
        <Tecla onClick={() => tocar("0")} disabled={ocupado}>
          0
        </Tecla>
        <Tecla onClick={() => setPin((p) => p.slice(0, -1))} disabled={ocupado} aria-label="Borrar">
          <Delete className="size-7" />
        </Tecla>
      </div>
    </div>
  );
}

function Tecla(props: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      {...props}
      className="flex size-18 items-center justify-center rounded-full bg-muted text-3xl font-semibold transition active:scale-95 active:bg-primary/20 disabled:opacity-50"
    />
  );
}
