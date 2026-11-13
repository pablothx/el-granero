import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { FormTarea, type DatosTarea } from "@/components/FormTarea";
import { Pantalla, Titulo } from "@/components/Pantalla";
import { Volver } from "@/components/Volver";
import { api, mensajeDeError, pedir } from "../../api";
import { useMiembroActual } from "../../estado";
import { useMiembrosActivos } from "../../miembros";
import { CLAVE_TAREAS } from "../../tareas";

export function NuevaTarea() {
  const yo = useMiembroActual();
  const miembros = useMiembrosActivos();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const crear = useMutation({
    mutationFn: (datos: DatosTarea) => pedir(() => api.tareas.$post({ json: datos })),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CLAVE_TAREAS });
      await queryClient.invalidateQueries({ queryKey: ["hoy"] });
      navigate("/admin/tareas");
    },
  });

  return (
    <Pantalla>
      <Volver a="/admin/tareas" />
      <Titulo>Nueva Tarea</Titulo>
      {miembros.data && (
        <FormTarea
          inicial={{ nombre: "", emoji: null, frecuencia: "diaria", dias: [], miembroId: yo.id }}
          miembros={miembros.data.miembros}
          textoBoton="Crear Tarea"
          ocupado={crear.isPending}
          error={crear.isError ? mensajeDeError(crear.error) : null}
          onGuardar={(datos) => crear.mutate(datos)}
        />
      )}
    </Pantalla>
  );
}
