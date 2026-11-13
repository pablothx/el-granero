import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { Avatar } from "@/components/Avatar";
import { avatarAlAzar, type Color, type Emoji } from "@/components/ElegirAvatar";
import { FormMiembro, type DatosMiembro } from "@/components/FormMiembro";
import { MensajeError, Pantalla, Titulo } from "@/components/Pantalla";
import { Volver } from "@/components/Volver";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { api, mensajeDeError, pedir } from "../../api";
import { CLAVE_ESTADO } from "../../estado";
import { CLAVE_AVATARES, CLAVE_MIEMBROS, useMiembros, type MiembroAdmin } from "../../miembros";

export function AdminMiembros() {
  const miembros = useMiembros();
  const activos = miembros.data?.miembros.filter((m) => !m.archivado) ?? [];
  const archivados = miembros.data?.miembros.filter((m) => m.archivado) ?? [];
  return (
    <Pantalla>
      <Volver a="/admin" />
      <div className="flex items-center justify-between">
        <Titulo>Miembros</Titulo>
        <Button asChild className="mb-4">
          <Link to="/admin/miembros/nuevo">
            <Plus /> Nuevo
          </Link>
        </Button>
      </div>
      {miembros.isPending && <p className="text-muted-foreground">Cargando…</p>}
      <ul className="flex flex-col gap-2">
        {activos.map((m) => (
          <FilaMiembro key={m.id} miembro={m} />
        ))}
      </ul>
      {archivados.length > 0 && (
        <>
          <h2 className="mt-8 mb-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">Archivados</h2>
          <ul className="flex flex-col gap-2 opacity-70">
            {archivados.map((m) => (
              <FilaMiembro key={m.id} miembro={m} />
            ))}
          </ul>
        </>
      )}
    </Pantalla>
  );
}

function FilaMiembro({ miembro: m }: { miembro: MiembroAdmin }) {
  return (
    <li>
      <Link to={`/admin/miembros/${m.id}`} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-sm active:scale-[0.98]">
        <Avatar emoji={m.emoji} color={m.color} />
        <span className="flex-1">
          <span className="block text-lg font-semibold">{m.nombre}</span>
          <span className="block text-sm text-muted-foreground">{m.rol === "adulto" ? "Adulto" : "Chico"}</span>
        </span>
      </Link>
    </li>
  );
}

function useAlGuardarMiembro() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: CLAVE_MIEMBROS }),
      queryClient.invalidateQueries({ queryKey: CLAVE_AVATARES }),
      queryClient.invalidateQueries({ queryKey: CLAVE_ESTADO }),
    ]);
    navigate("/admin/miembros");
  };
}

export function NuevoMiembro() {
  const alGuardar = useAlGuardarMiembro();
  const crear = useMutation({
    mutationFn: (d: DatosMiembro) => pedir(() => api.miembros.$post({ json: { nombre: d.nombre, rol: d.rol, avatar: d.avatar, pin: d.pin ?? "" } })),
    onSuccess: alGuardar,
  });
  return (
    <Pantalla>
      <Volver a="/admin/miembros" />
      <Titulo>Nuevo Miembro</Titulo>
      <FormMiembro
        inicial={{ nombre: "", rol: "chico", avatar: avatarAlAzar(), pin: "" }}
        conPin
        textoBoton="Agregar"
        ocupado={crear.isPending}
        error={crear.isError ? mensajeDeError(crear.error) : null}
        onGuardar={(d) => crear.mutate(d)}
      />
    </Pantalla>
  );
}

export function EditarMiembro() {
  const { id } = useParams();
  const miembros = useMiembros();
  const miembro = miembros.data?.miembros.find((m) => m.id === Number(id));
  const alGuardar = useAlGuardarMiembro();
  const editar = useMutation({
    mutationFn: (d: DatosMiembro) => pedir(() => api.miembros[":id"].$patch({ param: { id: String(id) }, json: { nombre: d.nombre, rol: d.rol, avatar: d.avatar } })),
    onSuccess: alGuardar,
  });

  return (
    <Pantalla>
      <Volver a="/admin/miembros" />
      {miembros.isPending && <p className="text-muted-foreground">Cargando…</p>}
      {miembros.data && !miembro && <p>Ese Miembro no existe.</p>}
      {miembro && (
        <>
          <Titulo>{miembro.nombre}</Titulo>
          <FormMiembro
            inicial={{ nombre: miembro.nombre, rol: miembro.rol, avatar: { emoji: miembro.emoji as Emoji, color: miembro.color as Color } }}
            conPin={false}
            textoBoton="Guardar"
            ocupado={editar.isPending}
            error={editar.isError ? mensajeDeError(editar.error) : null}
            onGuardar={(d) => editar.mutate(d)}
          />
          <AccionesMiembro miembro={miembro} />
        </>
      )}
    </Pantalla>
  );
}

/** Acciones extra sobre un Miembro: cambiar el PIN (y archivar, ticket 11). */
function AccionesMiembro({ miembro }: { miembro: MiembroAdmin }) {
  return (
    <div className="mt-8 flex flex-col gap-6 border-t pt-6">
      <CambiarPin miembro={miembro} />
    </div>
  );
}

function CambiarPin({ miembro }: { miembro: MiembroAdmin }) {
  const [pin, setPin] = useState("");
  const cambiar = useMutation({
    mutationFn: () => pedir(() => api.miembros[":id"].pin.$put({ param: { id: String(miembro.id) }, json: { pin } })),
    onSuccess: () => {
      setPin("");
      toast.success(`Listo: ${miembro.nombre} tiene PIN nuevo`);
    },
  });
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        cambiar.mutate();
      }}
    >
      <h2 className="text-lg font-bold">Cambiar PIN</h2>
      <div className="flex gap-2">
        <Input
          aria-label="PIN nuevo"
          type="password"
          inputMode="numeric"
          pattern="\d{4}"
          maxLength={4}
          placeholder="PIN nuevo"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          required
          autoComplete="off"
        />
        <Button type="submit" variant="secondary" disabled={cambiar.isPending || pin.length !== 4}>
          Cambiar
        </Button>
      </div>
      <MensajeError>{cambiar.isError && mensajeDeError(cambiar.error)}</MensajeError>
    </form>
  );
}
