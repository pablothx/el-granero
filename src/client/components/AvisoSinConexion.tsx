import { WifiOff } from "lucide-react";
import { useSyncExternalStore } from "react";

function suscribir(avisar: () => void) {
  window.addEventListener("online", avisar);
  window.addEventListener("offline", avisar);
  return () => {
    window.removeEventListener("online", avisar);
    window.removeEventListener("offline", avisar);
  };
}

export function useEnLinea() {
  return useSyncExternalStore(
    suscribir,
    () => navigator.onLine,
    () => true,
  );
}

/** Franja visible mientras no hay conexión: se ve lo último cargado, pero no se guarda nada. */
export function AvisoSinConexion() {
  const enLinea = useEnLinea();
  if (enLinea) return null;
  return (
    <div role="status" className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 mx-auto flex max-w-md items-center justify-center gap-2 rounded-2xl bg-foreground px-4 py-2.5 text-center text-sm font-medium text-background shadow-lg">
      <WifiOff className="size-4 shrink-0" />
      Sin conexión: ves lo último que cargaste. Los cambios no se guardan.
    </div>
  );
}
