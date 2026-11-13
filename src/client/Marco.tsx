import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, LogOut, Settings, type LucideIcon } from "lucide-react";
import { NavLink } from "react-router";
import { Avatar } from "@/components/Avatar";
import { DialogoReingreso } from "@/components/DialogoReingreso";
import { cn } from "@/lib/utils";
import { api, pedir } from "./api";
import { reiniciarSesion, useMiembroActual } from "./estado";

interface Seccion {
  ruta: string;
  nombre: string;
  icono: LucideIcon;
  soloAdultos?: boolean;
}

const SECCIONES: Seccion[] = [
  { ruta: "/hoy", nombre: "Hoy", icono: CalendarCheck },
  { ruta: "/admin", nombre: "Administrar", icono: Settings, soloAdultos: true },
];

/** Encabezado con el Miembro actual y barra de navegación inferior. */
export function Marco({ children }: { children: React.ReactNode }) {
  const miembro = useMiembroActual();
  const queryClient = useQueryClient();
  const salir = useMutation({
    mutationFn: () => pedir(() => api.salir.$post()),
    onSettled: () => reiniciarSesion(queryClient),
  });
  const secciones = SECCIONES.filter((s) => !s.soloAdultos || miembro.rol === "adulto");

  return (
    <>
      <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-2">
          <Avatar emoji={miembro.emoji} color={miembro.color} tamaño="sm" />
          <span className="flex-1 truncate font-semibold">{miembro.nombre}</span>
          <button
            type="button"
            onClick={() => salir.mutate()}
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-muted-foreground active:bg-muted"
          >
            <LogOut className="size-4" /> Cambiar de Miembro
          </button>
        </div>
      </header>
      {children}
      <DialogoReingreso />
      {secciones.length > 1 && (
        <nav className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
          <ul className="mx-auto flex max-w-md">
            {secciones.map(({ ruta, nombre, icono: Icono }) => (
              <li key={ruta} className="flex-1">
                <NavLink
                  to={ruta}
                  className={({ isActive }) =>
                    cn("flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium text-muted-foreground", isActive && "text-primary")
                  }
                >
                  <Icono className="size-6" />
                  {nombre}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  );
}

export { SECCIONES };
