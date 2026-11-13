import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { Pantalla, Titulo } from "@/components/Pantalla";
import { TecladoPin } from "@/components/TecladoPin";
import { Button } from "@/components/ui/button";
import type { MiembroPublico } from "../../shared/dominio";
import { api, ErrorApi, mensajeDeError, pedir } from "../api";
import { reiniciarSesion } from "../estado";

export function Entrar() {
  const avatares = useQuery({ queryKey: ["avatares"], queryFn: () => pedir(() => api.avatares.$get()) });
  const [elegido, setElegido] = useState<MiembroPublico | null>(null);

  if (elegido) return <PedirPin miembro={elegido} onVolver={() => setElegido(null)} />;

  return (
    <Pantalla className="pb-10">
      <Titulo>¿Quién sos?</Titulo>
      {avatares.isPending && <p className="text-muted-foreground">Cargando…</p>}
      <ul className="grid grid-cols-2 gap-4">
        {avatares.data?.miembros.map((m) => (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => setElegido(m)}
              className="flex w-full flex-col items-center gap-2 rounded-2xl bg-card p-4 shadow-sm transition active:scale-95"
            >
              <Avatar emoji={m.emoji} color={m.color} tamaño="xl" />
              <span className="text-lg font-semibold">{m.nombre}</span>
            </button>
          </li>
        ))}
      </ul>
    </Pantalla>
  );
}

function PedirPin({ miembro, onVolver }: { miembro: MiembroPublico; onVolver: () => void }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const entrar = useMutation({
    mutationFn: (pin: string) => pedir(() => api.entrar.$post({ json: { miembroId: miembro.id, pin } })),
    onSuccess: () => reiniciarSesion(queryClient),
    onError: (e) => setError(e instanceof ErrorApi && e.codigo === "pin_incorrecto" ? "PIN incorrecto. Probá otra vez." : mensajeDeError(e)),
  });

  return (
    <Pantalla className="items-center pb-10">
      <Button variant="ghost" className="self-start" onClick={onVolver}>
        <ArrowLeft /> Volver
      </Button>
      <div className="mt-4 mb-6 flex flex-col items-center gap-2">
        <Avatar emoji={miembro.emoji} color={miembro.color} tamaño="xl" />
        <p className="text-2xl font-bold">Hola, {miembro.nombre}</p>
        <p className="text-muted-foreground">Poné tu PIN</p>
      </div>
      <TecladoPin
        ocupado={entrar.isPending}
        error={error}
        onCompletar={(pin) => {
          setError(null);
          entrar.mutate(pin);
        }}
      />
    </Pantalla>
  );
}
