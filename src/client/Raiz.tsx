import { Navigate, Outlet, ScrollRestoration } from "react-router";
import { Marco } from "./Marco";
import { useEstado, useMiembroActual } from "./estado";
import { ConfiguracionInicial } from "./pantallas/ConfiguracionInicial";
import { Entrar } from "./pantallas/Entrar";
import { Vincular } from "./pantallas/Vincular";

/** Decide qué mostrar según el estado del dispositivo: configurar, vincular, entrar o la app. */
export function Raiz() {
  const estado = useEstado();

  if (estado.isPending) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <img src="/favicon.svg" alt="Cargando El Granero" className="size-24 animate-pulse" />
      </div>
    );
  }
  if (estado.isError) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
        <img src="/favicon.svg" alt="" className="size-24 opacity-60" />
        <p className="text-lg">No pudimos conectarnos con El Granero.</p>
        <button className="font-semibold text-primary underline" onClick={() => estado.refetch()}>
          Reintentar
        </button>
      </div>
    );
  }
  const { familiaConfigurada, dispositivoVinculado, miembro } = estado.data;
  if (!familiaConfigurada) return <ConfiguracionInicial />;
  if (!dispositivoVinculado) return <Vincular />;
  if (!miembro) return <Entrar />;
  return (
    <Marco>
      <ScrollRestoration />
      <Outlet />
    </Marco>
  );
}

/** Rutas solo para Adultos: un Chico vuelve a Hoy. */
export function SoloAdultos() {
  const miembro = useMiembroActual();
  return miembro.rol === "adulto" ? <Outlet /> : <Navigate to="/hoy" replace />;
}
