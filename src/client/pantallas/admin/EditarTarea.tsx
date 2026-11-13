import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { BotonConfirmar } from "@/components/BotonConfirmar";
import { FormTarea, type DatosTarea } from "@/components/FormTarea";
import { MensajeError, Pantalla, Titulo } from "@/components/Pantalla";
import { Volver } from "@/components/Volver";
import type { DiaSemana } from "../../../shared/periodos";
import { api, mensajeDeError, pedir } from "../../api";
import { useMiembrosActivos } from "../../miembros";
import { CLAVE_TAREAS, useTareas } from "../../tareas";

export function EditarTarea() {
  const { id = "" } = useParams();
  const tareas = useTareas();
  const miembros = useMiembrosActivos();
  const tarea = tareas.data?.tareas.find((t) => t.id === Number(id));
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const refrescar = async () => {
    await queryClient.invalidateQueries({ queryKey: CLAVE_TAREAS });
    await queryClient.invalidateQueries({ queryKey: ["hoy"] });
  };
  const param = { param: { id } };
  const guardar = useMutation({
    mutationFn: (d: DatosTarea) => pedir(() => api.tareas[":id"].$patch({ ...param, json: d })),
    onSuccess: async () => {
      await refrescar();
      toast.success("Tarea guardada");
      navigate("/admin/tareas");
    },
  });
  const archivar = useMutation({
    mutationFn: () => pedir(() => api.tareas[":id"].archivar.$post(param)),
    onSuccess: refrescar,
    onError: (e) => toast.error(mensajeDeError(e)),
  });
  const reactivar = useMutation({
    mutationFn: () => pedir(() => api.tareas[":id"].reactivar.$post(param)),
    onSuccess: refrescar,
    onError: (e) => toast.error(mensajeDeError(e)),
  });
  const borrar = useMutation({
    mutationFn: () => pedir(() => api.tareas[":id"].$delete(param)),
    onSuccess: async () => {
      await refrescar();
      navigate("/admin/tareas");
    },
  });

  if (tareas.isPending || miembros.isPending) return <Pantalla>Cargando…</Pantalla>;
  if (!tarea) {
    return (
      <Pantalla>
        <Volver a="/admin/tareas" />
        <p>Esa Tarea no existe.</p>
      </Pantalla>
    );
  }
  // Si el Miembro asignado está archivado, igual se muestra para poder reasignar.
  const elegibles = miembros.data?.miembros ?? [];

  return (
    <Pantalla>
      <Volver a="/admin/tareas" />
      <Titulo>
        {tarea.emoji} {tarea.nombre}
      </Titulo>
      {tarea.archivada && (
        <p className="mb-4 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">Esta Tarea está Archivada: no genera Ocurrencias.</p>
      )}
      <FormTarea
        key={`${tarea.id}-${tarea.archivada}`}
        inicial={{
          nombre: tarea.nombre,
          emoji: tarea.emoji,
          frecuencia: tarea.frecuencia,
          dias: tarea.dias as DiaSemana[],
          miembroId: tarea.miembro?.id ?? elegibles[0]?.id ?? 0,
        }}
        miembros={elegibles}
        textoBoton="Guardar cambios"
        ocupado={guardar.isPending}
        error={guardar.isError ? mensajeDeError(guardar.error) : null}
        onGuardar={(d) => guardar.mutate(d)}
      />
      <p className="mt-2 text-xs text-muted-foreground">
        Reasignar o cambiar la Frecuencia aplica enseguida a la Ocurrencia Pendiente de este Período. Lo ya pasado no cambia.
      </p>

      <div className="mt-8 flex flex-col gap-3 border-t pt-6">
        {tarea.archivada ? (
          <BotonConfirmar variant="secondary" confirmar="Tocá de nuevo para reactivar" onConfirmar={() => reactivar.mutate()} disabled={reactivar.isPending}>
            Reactivar
          </BotonConfirmar>
        ) : (
          <BotonConfirmar confirmar="Tocá de nuevo para archivar" onConfirmar={() => archivar.mutate()} disabled={archivar.isPending}>
            Archivar
          </BotonConfirmar>
        )}
        <BotonConfirmar confirmar="Tocá de nuevo para borrar" onConfirmar={() => borrar.mutate()} disabled={borrar.isPending}>
          Borrar
        </BotonConfirmar>
        <MensajeError>{borrar.isError && mensajeDeError(borrar.error)}</MensajeError>
        <p className="text-xs text-muted-foreground">Solo se puede borrar una Tarea sin historial. Si ya tiene, archivala.</p>
      </div>
    </Pantalla>
  );
}
