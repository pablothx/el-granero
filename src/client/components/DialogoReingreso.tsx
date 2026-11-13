import { useEffect, useRef, useState } from "react";
import { api, ErrorApi, registrarReingreso } from "../api";
import { mensajeDePin } from "../pantallas/Entrar";
import { useMiembroActual } from "../estado";
import { Avatar } from "./Avatar";
import { TecladoPin } from "./TecladoPin";
import { Button } from "./ui/button";

/**
 * Cuando una acción de Adulto necesita el PIN de nuevo (más de 5 minutos desde
 * el último ingreso), lo pide acá y la acción se reintenta sola.
 */
export function DialogoReingreso() {
  const miembro = useMiembroActual();
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const resolver = useRef<((ok: boolean) => void) | null>(null);
  const pendiente = useRef<Promise<boolean> | null>(null);

  useEffect(() => {
    registrarReingreso(() => {
      // Si varias llamadas piden reingreso a la vez, comparten el mismo diálogo.
      pendiente.current ??= new Promise<boolean>((r) => {
        resolver.current = r;
        setError(null);
        setAbierto(true);
      }).finally(() => {
        pendiente.current = null;
      });
      return pendiente.current;
    });
    return () => registrarReingreso(null);
  }, []);

  function cerrar(ok: boolean) {
    setAbierto(false);
    resolver.current?.(ok);
    resolver.current = null;
  }

  async function confirmar(pin: string) {
    setOcupado(true);
    setError(null);
    try {
      const r = await api.reingresar.$post({ json: { pin } });
      if (!r.ok) {
        const datos = (await r.json().catch(() => ({}))) as Record<string, unknown>;
        throw new ErrorApi((datos.error as never) ?? "interno", String(datos.mensaje ?? "Algo salió mal"), datos);
      }
      cerrar(true);
    } catch (e) {
      setError(mensajeDePin(e));
    } finally {
      setOcupado(false);
    }
  }

  if (!abierto) return null;
  return (
    <div role="dialog" aria-modal aria-label="Volvé a poner tu PIN" className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-md rounded-t-3xl bg-background px-4 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-xl sm:rounded-3xl">
        <div className="mb-4 flex flex-col items-center gap-2 text-center">
          <Avatar emoji={miembro.emoji} color={miembro.color} tamaño="lg" />
          <p className="text-xl font-bold">Volvé a poner tu PIN</p>
          <p className="text-sm text-muted-foreground">Para las acciones de Adulto, si pasaron más de 5 minutos.</p>
        </div>
        <TecladoPin onCompletar={confirmar} error={error} ocupado={ocupado} />
        <Button variant="ghost" className="mt-4 w-full" onClick={() => cerrar(false)}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
