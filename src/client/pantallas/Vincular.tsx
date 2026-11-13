import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Campo, MensajeError, Pantalla, Titulo } from "@/components/Pantalla";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, mensajeDeError, pedir } from "../api";
import { adivinarNombreDispositivo, CLAVE_ESTADO } from "../estado";

export function Vincular() {
  const queryClient = useQueryClient();
  const [clave, setClave] = useState("");
  const [nombre, setNombre] = useState(adivinarNombreDispositivo);

  const vincular = useMutation({
    mutationFn: () => pedir(() => api.vincular.$post({ json: { clave, nombre } })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLAVE_ESTADO }),
  });

  return (
    <Pantalla className="justify-center pb-10">
      <img src="/favicon.svg" alt="" className="mx-auto mb-4 size-24" />
      <Titulo>Vincular este dispositivo</Titulo>
      <p className="mb-6 text-muted-foreground">Un Adulto tiene que ingresar la Clave de la casa. Se pide una sola vez en este celular.</p>
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          vincular.mutate();
        }}
      >
        <Campo etiqueta="Clave de la casa">
          <Input type="password" value={clave} onChange={(e) => setClave(e.target.value)} required autoComplete="current-password" />
        </Campo>
        <Campo etiqueta="Nombre de este dispositivo" ayuda="Para reconocerlo en la lista de dispositivos.">
          <Input value={nombre} onChange={(e) => setNombre(e.target.value)} required maxLength={60} />
        </Campo>
        <MensajeError>{vincular.isError && mensajeDeError(vincular.error)}</MensajeError>
        <Button type="submit" size="lg" className="h-14 text-lg" disabled={vincular.isPending}>
          Vincular
        </Button>
      </form>
    </Pantalla>
  );
}
