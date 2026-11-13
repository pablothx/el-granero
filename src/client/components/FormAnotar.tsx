import { Plus } from "lucide-react";
import { useState } from "react";
import { buscarParecido } from "../../shared/listas";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

/**
 * Anotar un Ítem. Mientras se escribe, avisa si ya hay uno parecido sin
 * comprar en la Lista, pero deja anotarlo igual.
 */
export function FormAnotar({ sinComprar, onAnotar }: { sinComprar: readonly { texto: string }[]; onAnotar: (texto: string) => void }) {
  const [texto, setTexto] = useState("");
  const parecido = buscarParecido(texto, sinComprar);

  return (
    <form
      className="flex flex-col gap-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        const limpio = texto.trim();
        if (!limpio) return;
        onAnotar(limpio);
        setTexto("");
      }}
    >
      <div className="flex gap-2">
        <Input
          aria-label="Qué falta"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="¿Qué falta?"
          maxLength={120}
          className="h-12 text-base"
          enterKeyHint="done"
        />
        <Button type="submit" size="lg" className="h-12 px-4" aria-label="Anotar" disabled={!texto.trim()}>
          <Plus className="size-6" />
        </Button>
      </div>
      {parecido && (
        <p role="status" className="px-1 text-sm font-medium text-primary">
          Ya está: {parecido.texto}
        </p>
      )}
    </form>
  );
}
