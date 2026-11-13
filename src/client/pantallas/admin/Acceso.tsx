import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Smartphone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { BotonConfirmar } from "@/components/BotonConfirmar";
import { Campo, MensajeError, Pantalla, Titulo } from "@/components/Pantalla";
import { Volver } from "@/components/Volver";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, mensajeDeError, pedir } from "../../api";

const CLAVE_DISPOSITIVOS = ["dispositivos"] as const;

function haceCuanto(iso: string) {
  const minutos = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutos < 2) return "recién";
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  return `hace ${Math.round(horas / 24)} días`;
}

export function AdminAcceso() {
  const queryClient = useQueryClient();
  const dispositivos = useQuery({ queryKey: CLAVE_DISPOSITIVOS, queryFn: () => pedir(() => api.dispositivos.$get()) });
  const desvincular = useMutation({
    mutationFn: (id: number) => pedir(() => api.dispositivos[":id"].$delete({ param: { id: String(id) } })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLAVE_DISPOSITIVOS }),
    onError: (e) => toast.error(mensajeDeError(e)),
  });

  return (
    <Pantalla>
      <Volver a="/admin" />
      <Titulo>Dispositivos y Clave</Titulo>
      <h2 className="mb-2 text-lg font-bold">Dispositivos vinculados</h2>
      {dispositivos.isPending && <p className="text-muted-foreground">Cargando…</p>}
      <ul className="flex flex-col gap-2">
        {dispositivos.data?.dispositivos.map((d) => (
          <li key={d.id} className="flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Smartphone className="size-6 text-primary" />
              <span className="flex-1">
                <span className="block font-semibold">
                  {d.nombre} {d.actual && <span className="ml-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">Este</span>}
                </span>
                <span className="block text-sm text-muted-foreground">Último uso: {haceCuanto(d.ultimoUso)}</span>
              </span>
            </div>
            {!d.actual && (
              <BotonConfirmar confirmar="Tocá de nuevo para desvincular" onConfirmar={() => desvincular.mutate(d.id)}>
                Desvincular
              </BotonConfirmar>
            )}
          </li>
        ))}
      </ul>
      <CambiarClave />
    </Pantalla>
  );
}

function CambiarClave() {
  const queryClient = useQueryClient();
  const [clave, setClave] = useState("");
  const [repetida, setRepetida] = useState("");
  const cambiar = useMutation({
    mutationFn: () => pedir(() => api.clave.$post({ json: { clave } })),
    onSuccess: async () => {
      setClave("");
      setRepetida("");
      toast.success("Clave cambiada. Los demás dispositivos tienen que vincularse de nuevo.");
      await queryClient.invalidateQueries({ queryKey: CLAVE_DISPOSITIVOS });
    },
  });
  const noCoinciden = repetida.length > 0 && clave !== repetida;
  return (
    <form
      className="mt-10 flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!noCoinciden) cambiar.mutate();
      }}
    >
      <h2 className="text-lg font-bold">Cambiar la Clave de la casa</h2>
      <p className="text-sm text-muted-foreground">Al cambiarla se desvinculan todos los dispositivos menos este. Cada uno tiene que ingresar la Clave nueva.</p>
      <Campo etiqueta="Clave nueva" ayuda="Mínimo 6 caracteres.">
        <Input type="password" value={clave} onChange={(e) => setClave(e.target.value)} required minLength={6} autoComplete="new-password" />
      </Campo>
      <Campo etiqueta="Repetila">
        <Input type="password" value={repetida} onChange={(e) => setRepetida(e.target.value)} required autoComplete="new-password" />
      </Campo>
      <MensajeError>{noCoinciden ? "Las claves no coinciden" : cambiar.isError && mensajeDeError(cambiar.error)}</MensajeError>
      <Button type="submit" size="lg" className="h-12" disabled={cambiar.isPending || noCoinciden}>
        Cambiar Clave
      </Button>
    </form>
  );
}
