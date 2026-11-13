import { ChevronRight, ClipboardList, KeyRound, Users } from "lucide-react";
import { Link } from "react-router";
import { Pantalla, Titulo } from "@/components/Pantalla";

const OPCIONES = [
  { a: "/admin/tareas", titulo: "Tareas", detalle: "Crear, editar, reasignar y archivar", icono: ClipboardList },
  { a: "/admin/miembros", titulo: "Miembros", detalle: "Agregar, editar, PIN y archivar", icono: Users },
  { a: "/admin/acceso", titulo: "Dispositivos y Clave", detalle: "Dispositivos vinculados y Clave de la casa", icono: KeyRound },
];

export function Admin() {
  return (
    <Pantalla>
      <Titulo>Administrar</Titulo>
      <ul className="flex flex-col gap-2">
        {OPCIONES.map(({ a, titulo, detalle, icono: Icono }) => (
          <li key={a}>
            <Link to={a} className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-sm active:scale-[0.98]">
              <Icono className="size-7 text-primary" />
              <span className="flex-1">
                <span className="block text-lg font-semibold">{titulo}</span>
                <span className="block text-sm text-muted-foreground">{detalle}</span>
              </span>
              <ChevronRight className="text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </Pantalla>
  );
}
