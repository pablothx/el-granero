import { Plus } from "lucide-react";
import { Link } from "react-router";
import { Avatar } from "@/components/Avatar";
import { Pantalla, Titulo } from "@/components/Pantalla";
import { Volver } from "@/components/Volver";
import { Button } from "@/components/ui/button";
import { NOMBRES_DIAS } from "../../../shared/periodos";
import { useMiembrosActivos } from "../../miembros";
import { useTareas, type TareaVista } from "../../tareas";

export function describirFrecuencia(t: Pick<TareaVista, "frecuencia" | "dias">) {
  if (t.frecuencia === "semanal") return "Semanal";
  if (t.frecuencia === "mensual") return "Mensual";
  return t.dias.length === 0 ? "Todos los días" : t.dias.map((d) => NOMBRES_DIAS[d as keyof typeof NOMBRES_DIAS].slice(0, 3)).join(", ");
}

export function AdminTareas() {
  const tareas = useTareas();
  const miembros = useMiembrosActivos();
  const avatarDe = (id: number) => miembros.data?.miembros.find((m) => m.id === id);
  const activas = tareas.data?.tareas.filter((t) => !t.archivada) ?? [];
  const archivadas = tareas.data?.tareas.filter((t) => t.archivada) ?? [];

  return (
    <Pantalla>
      <Volver a="/admin" />
      <div className="flex items-center justify-between">
        <Titulo>Tareas</Titulo>
        <Button asChild className="mb-4">
          <Link to="/admin/tareas/nueva">
            <Plus /> Nueva
          </Link>
        </Button>
      </div>
      {tareas.isPending && <p className="text-muted-foreground">Cargando…</p>}
      {tareas.data && activas.length === 0 && <p className="rounded-2xl bg-muted p-6 text-center text-muted-foreground">Todavía no hay Tareas.</p>}
      <ul className="flex flex-col gap-2">
        {activas.map((t) => (
          <FilaTarea key={t.id} tarea={t} avatar={t.miembro ? avatarDe(t.miembro.id) : undefined} />
        ))}
      </ul>
      {archivadas.length > 0 && (
        <>
          <h2 className="mt-8 mb-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">Archivadas</h2>
          <ul className="flex flex-col gap-2 opacity-70">
            {archivadas.map((t) => (
              <FilaTarea key={t.id} tarea={t} />
            ))}
          </ul>
        </>
      )}
    </Pantalla>
  );
}

function FilaTarea({ tarea: t, avatar }: { tarea: TareaVista; avatar?: { emoji: string; color: string } }) {
  return (
    <li>
      <Link to={`/admin/tareas/${t.id}`} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-sm active:scale-[0.98]">
        <span className="w-9 text-center text-3xl">{t.emoji ?? "✨"}</span>
        <span className="flex-1">
          <span className="block font-semibold">{t.nombre}</span>
          <span className="block text-sm text-muted-foreground">
            {describirFrecuencia(t)} · {t.miembro?.nombre}
          </span>
        </span>
        {avatar && <Avatar emoji={avatar.emoji} color={avatar.color} tamaño="sm" />}
      </Link>
    </li>
  );
}
