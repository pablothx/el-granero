import { Pantalla, Titulo } from "@/components/Pantalla";
import { useMiembroActual } from "../estado";

export function Hoy() {
  const miembro = useMiembroActual();
  return (
    <Pantalla>
      <Titulo>Hoy</Titulo>
      <p className="text-muted-foreground">Hola, {miembro.nombre}. Todavía no hay Tareas.</p>
    </Pantalla>
  );
}
