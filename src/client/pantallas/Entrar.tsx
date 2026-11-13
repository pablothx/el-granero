import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Avatar } from "@/components/Avatar";
import { Campo, MensajeError, Pantalla, Titulo } from "@/components/Pantalla";
import { TecladoPin } from "@/components/TecladoPin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MiembroPublico } from "../../shared/dominio";
import { api, ErrorApi, mensajeDeError, pedir } from "../api";
import { reiniciarSesion } from "../estado";
import { CLAVE_AVATARES } from "../miembros";

export function Entrar() {
  const avatares = useQuery({ queryKey: CLAVE_AVATARES, queryFn: () => pedir(() => api.avatares.$get()) });
  const [elegido, setElegido] = useState<MiembroPublico | null>(null);

  if (elegido) {
    const unicoAdulto = avatares.data?.miembros.filter((m) => m.rol === "adulto").length === 1 && elegido.rol === "adulto";
    return <PedirPin miembro={elegido} unicoAdulto={unicoAdulto} onVolver={() => setElegido(null)} />;
  }

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

export function mensajeDePin(e: unknown): string {
  if (e instanceof ErrorApi && e.codigo === "bloqueado") {
    const hasta = typeof e.datos.hasta === "string" ? new Date(e.datos.hasta) : null;
    const minutos = hasta ? Math.max(1, Math.ceil((hasta.getTime() - Date.now()) / 60_000)) : 5;
    return `Demasiados intentos. Probá de nuevo en ${minutos} min.`;
  }
  if (e instanceof ErrorApi && e.codigo === "pin_incorrecto") {
    const quedan = e.datos.intentosRestantes;
    return typeof quedan === "number" && quedan <= 2 ? `PIN incorrecto. Te quedan ${quedan} intentos.` : "PIN incorrecto. Probá otra vez.";
  }
  return mensajeDeError(e);
}

function PedirPin({ miembro, unicoAdulto, onVolver }: { miembro: MiembroPublico; unicoAdulto: boolean; onVolver: () => void }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [olvido, setOlvido] = useState(false);
  const entrar = useMutation({
    mutationFn: (pin: string) => pedir(() => api.entrar.$post({ json: { miembroId: miembro.id, pin } })),
    onSuccess: async () => {
      navigate("/hoy", { replace: true });
      await reiniciarSesion(queryClient);
    },
    onError: (e) => setError(mensajeDePin(e)),
  });

  return (
    <Pantalla className="items-center pb-10">
      <Button variant="ghost" className="self-start" onClick={olvido ? () => setOlvido(false) : onVolver}>
        <ArrowLeft /> Volver
      </Button>
      <div className="mt-4 mb-6 flex flex-col items-center gap-2">
        <Avatar emoji={miembro.emoji} color={miembro.color} tamaño="xl" />
        <p className="text-2xl font-bold">Hola, {miembro.nombre}</p>
        {!olvido && <p className="text-muted-foreground">Poné tu PIN</p>}
      </div>
      {olvido ? (
        unicoAdulto ? (
          <RestablecerPin miembro={miembro} onListo={() => setOlvido(false)} />
        ) : (
          <p className="rounded-2xl bg-muted p-5 text-center text-lg">Pedile a un Adulto que te ponga un PIN nuevo desde Administrar → Miembros.</p>
        )
      ) : (
        <>
          <TecladoPin
            ocupado={entrar.isPending}
            error={error}
            onCompletar={(pin) => {
              setError(null);
              entrar.mutate(pin);
            }}
          />
          <Button variant="link" className="mt-4" onClick={() => setOlvido(true)}>
            ¿Olvidaste tu PIN?
          </Button>
        </>
      )}
    </Pantalla>
  );
}

function RestablecerPin({ miembro, onListo }: { miembro: MiembroPublico; onListo: () => void }) {
  const [clave, setClave] = useState("");
  const [pin, setPin] = useState("");
  const restablecer = useMutation({
    mutationFn: () => pedir(() => api["restablecer-pin"].$post({ json: { miembroId: miembro.id, clave, pin } })),
    onSuccess: onListo,
  });
  return (
    <form
      className="flex w-full flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        restablecer.mutate();
      }}
    >
      <p className="text-sm text-muted-foreground">Sos el único Adulto: podés poner un PIN nuevo con la Clave de la casa.</p>
      <Campo etiqueta="Clave de la casa">
        <Input type="password" value={clave} onChange={(e) => setClave(e.target.value)} required autoComplete="current-password" />
      </Campo>
      <Campo etiqueta="PIN nuevo" ayuda="4 números.">
        <Input type="password" inputMode="numeric" pattern="\d{4}" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} required autoComplete="off" />
      </Campo>
      <MensajeError>{restablecer.isError && mensajeDeError(restablecer.error)}</MensajeError>
      <Button type="submit" size="lg" className="h-12" disabled={restablecer.isPending}>
        Guardar PIN nuevo
      </Button>
    </form>
  );
}
