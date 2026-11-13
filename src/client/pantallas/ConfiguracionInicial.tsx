import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { avatarAlAzar, ElegirAvatar } from "@/components/ElegirAvatar";
import { Campo, MensajeError, Pantalla, Titulo } from "@/components/Pantalla";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, mensajeDeError, pedir } from "../api";
import { adivinarNombreDispositivo, CLAVE_ESTADO } from "../estado";

export function ConfiguracionInicial() {
  const queryClient = useQueryClient();
  const [token, setToken] = useState("");
  const [clave, setClave] = useState("");
  const [zonaHoraria, setZonaHoraria] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [nombre, setNombre] = useState("");
  const [avatar, setAvatar] = useState(avatarAlAzar);
  const [pin, setPin] = useState("");

  const configurar = useMutation({
    mutationFn: () =>
      pedir(() =>
        api["configuracion-inicial"].$post({
          json: {
            token,
            clave,
            zonaHoraria,
            nombreDispositivo: adivinarNombreDispositivo(),
            adulto: { nombre, avatar, pin },
          },
        }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLAVE_ESTADO }),
  });

  return (
    <Pantalla className="pb-10">
      <div className="mb-6 flex items-center gap-3">
        <img src="/favicon.svg" alt="" className="size-14" />
        <div>
          <Titulo>El Granero</Titulo>
        </div>
      </div>
      <p className="mb-6 text-muted-foreground">Configuremos la app para tu Familia. Esto se hace una sola vez.</p>
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          configurar.mutate();
        }}
      >
        <Campo etiqueta="Token de instalación" ayuda="El que cargaste como secreto TOKEN_INSTALACION del Worker.">
          <Input value={token} onChange={(e) => setToken(e.target.value)} required autoComplete="off" />
        </Campo>
        <Campo etiqueta="Clave de la casa" ayuda="Se pide una sola vez en cada celular nuevo. Mínimo 6 caracteres.">
          <Input type="password" value={clave} onChange={(e) => setClave(e.target.value)} required minLength={6} autoComplete="new-password" />
        </Campo>
        <Campo etiqueta="Zona horaria" ayuda="Define a qué hora cambia el día.">
          <Input value={zonaHoraria} onChange={(e) => setZonaHoraria(e.target.value)} required />
        </Campo>

        <h2 className="mt-2 text-xl font-bold">Vos, el primer Adulto</h2>
        <Campo etiqueta="Tu nombre">
          <Input value={nombre} onChange={(e) => setNombre(e.target.value)} required maxLength={40} placeholder="Mamá" />
        </Campo>
        <ElegirAvatar emoji={avatar.emoji} color={avatar.color} onCambiar={setAvatar} />
        <Campo etiqueta="Tu PIN" ayuda="4 números.">
          <Input
            type="password"
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            required
            autoComplete="off"
          />
        </Campo>

        <MensajeError>{configurar.isError && mensajeDeError(configurar.error)}</MensajeError>
        <Button type="submit" size="lg" className="h-14 text-lg" disabled={configurar.isPending}>
          <Avatar emoji={avatar.emoji} color={avatar.color} tamaño="sm" /> Empezar
        </Button>
      </form>
    </Pantalla>
  );
}
