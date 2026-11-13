import { Check, Trash2 } from "lucide-react";
import { useState } from "react";
import { NavLink, useParams } from "react-router";
import { FormAnotar } from "@/components/FormAnotar";
import { Pantalla, Titulo } from "@/components/Pantalla";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { LISTAS, NOMBRES_LISTAS, type Lista } from "../../shared/listas";
import { useCambiosLista, useLista, type ItemVista } from "../listas";

export function Listas() {
  const lista = (LISTAS as readonly string[]).includes(useParams().lista ?? "") ? (useParams().lista as Lista) : "super";
  const datos = useLista(lista);
  const cambios = useCambiosLista(lista);
  const sinComprar = datos.data?.items.filter((i) => !i.comprado) ?? [];
  const comprados = datos.data?.items.filter((i) => i.comprado) ?? [];

  return (
    <Pantalla>
      <Titulo>Compras</Titulo>
      <nav className="mb-4 grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1">
        {LISTAS.map((l) => (
          <NavLink
            key={l}
            to={`/listas/${l}`}
            className={({ isActive }) => cn("rounded-xl py-2.5 text-center font-semibold text-muted-foreground", isActive && "bg-card text-foreground shadow-sm")}
          >
            {NOMBRES_LISTAS[l]}
          </NavLink>
        ))}
      </nav>
      <FormAnotar key={lista} sinComprar={sinComprar} onAnotar={(texto) => cambios.anotar.mutate(texto)} />
      {datos.isPending && <p className="mt-4 text-muted-foreground">Cargando…</p>}
      {datos.data && sinComprar.length === 0 && comprados.length === 0 && (
        <p className="mt-6 rounded-2xl bg-muted p-6 text-center text-muted-foreground">No falta nada. 🛒</p>
      )}
      <ul className="mt-4 flex flex-col gap-2">
        {sinComprar.map((i) => (
          <FilaItem key={i.id} item={i} cambios={cambios} />
        ))}
      </ul>
      {comprados.length > 0 && (
        <>
          <h2 className="mt-6 mb-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">Comprado</h2>
          <ul className="flex flex-col gap-2">
            {comprados.map((i) => (
              <FilaItem key={i.id} item={i} cambios={cambios} />
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">Lo comprado se borra solo a las 24 horas.</p>
        </>
      )}
    </Pantalla>
  );
}

function FilaItem({ item, cambios }: { item: ItemVista; cambios: ReturnType<typeof useCambiosLista> }) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(item.texto);
  const temporal = item.id < 0;

  return (
    <li className={cn("flex min-h-14 items-center gap-2 rounded-2xl bg-card py-1.5 pr-1.5 pl-3 shadow-sm", item.comprado && "bg-muted shadow-none")}>
      <button
        type="button"
        role="checkbox"
        aria-checked={item.comprado}
        aria-label={item.comprado ? `Desmarcar ${item.texto}` : `Comprado: ${item.texto}`}
        disabled={temporal}
        onClick={() => cambios.comprar.mutate({ id: item.id, comprado: !item.comprado })}
        className={cn("flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-primary/50", item.comprado && "border-exito bg-exito text-white")}
      >
        {item.comprado && <Check className="size-5" strokeWidth={3} />}
      </button>
      {editando ? (
        <form
          className="flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            const limpio = texto.trim();
            if (limpio && limpio !== item.texto) cambios.editar.mutate({ id: item.id, texto: limpio });
            setEditando(false);
          }}
        >
          <Input autoFocus aria-label="Editar Ítem" value={texto} onChange={(e) => setTexto(e.target.value)} onBlur={(e) => e.currentTarget.form?.requestSubmit()} maxLength={120} />
        </form>
      ) : (
        <button type="button" disabled={temporal} onClick={() => setEditando(true)} className="flex-1 py-1 text-left">
          <span className={cn("block text-lg", item.comprado && "text-muted-foreground line-through")}>{item.texto}</span>
          <span className="block text-xs text-muted-foreground">
            {item.comprado ? `Compró ${item.compradoPor}` : `Anotó ${item.anotadoPor}`}
          </span>
        </button>
      )}
      <button
        type="button"
        aria-label={`Borrar ${item.texto}`}
        disabled={temporal}
        onClick={() => cambios.borrar.mutate(item.id)}
        className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground active:bg-muted"
      >
        <Trash2 className="size-5" />
      </button>
    </li>
  );
}
