import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MENSAJE_SIN_CONEXION } from "./api";
import { AvisoSinConexion } from "./components/AvisoSinConexion";
import { ListaHoy } from "./components/ListaHoy";
import { claveHoy, useTildar, type DatosHoy } from "./ocurrencias";

const { toastError } = vi.hoisted(() => ({ toastError: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: toastError, success: vi.fn() } }));

const HOY: DatosHoy = {
  fecha: "2026-11-17",
  ocurrencias: [
    {
      id: 1,
      tareaId: 1,
      nombre: "Sacar la basura",
      emoji: "🗑️",
      tipo: "diaria",
      estado: "pendiente",
      inicio: "2026-11-17",
      fin: "2026-11-18",
      miembroId: 1,
      tildadaEn: null,
      tildadaPor: null,
    },
  ],
};

function PantallaDePrueba() {
  const hoy = useQuery({ queryKey: claveHoy(), queryFn: () => Promise.resolve(HOY), enabled: false });
  const tildar = useTildar(claveHoy());
  return <ListaHoy ocurrencias={hoy.data?.ocurrencias ?? []} onTildar={(o) => tildar.mutate({ id: o.id, tildar: o.estado !== "cumplida" })} vacio="nada" />;
}

function montar() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false }, mutations: { networkMode: "always" } } });
  queryClient.setQueryData(["estado"], {
    familiaConfigurada: true,
    dispositivoVinculado: true,
    miembro: { id: 1, nombre: "Tomi", rol: "chico", emoji: "🐸", color: "#22c55e" },
  });
  queryClient.setQueryData(claveHoy(), HOY);
  render(
    <QueryClientProvider client={queryClient}>
      <PantallaDePrueba />
    </QueryClientProvider>,
  );
  return screen.getByRole("checkbox", { name: /Sacar la basura/ });
}

function enLinea(valor: boolean) {
  Object.defineProperty(navigator, "onLine", { value: valor, configurable: true });
}

beforeEach(() => {
  toastError.mockReset();
  enLinea(true);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("tildar con actualización optimista", () => {
  it("cambia antes de la respuesta y vuelve atrás (con aviso) si la API falla", async () => {
    let responder!: (r: Response) => void;
    const fetch = vi.fn(() => new Promise<Response>((r) => (responder = r)));
    vi.stubGlobal("fetch", fetch);
    const casilla = montar();

    await userEvent.click(casilla);
    expect(screen.getByRole("checkbox", { name: /Sacar la basura/ }).getAttribute("aria-checked")).toBe("true");
    expect(fetch).toHaveBeenCalledTimes(1);

    await act(async () => responder(new Response(JSON.stringify({ error: "interno", mensaje: "Se cayó algo" }), { status: 500 })));
    await waitFor(() => expect(screen.getByRole("checkbox", { name: /Sacar la basura/ }).getAttribute("aria-checked")).toBe("false"));
    expect(toastError).toHaveBeenCalledWith("Se cayó algo");
  });

  it("si la API responde bien, queda tildada", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } })));
    await userEvent.click(montar());
    await waitFor(() => expect(screen.getByRole("checkbox", { name: /Sacar la basura/ }).getAttribute("aria-checked")).toBe("true"));
    expect(toastError).not.toHaveBeenCalled();
  });
});

describe("sin conexión", () => {
  it("tildar avisa que no se guardó, vuelve atrás y no queda nada pendiente", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    enLinea(false);
    await userEvent.click(montar());
    await waitFor(() => expect(toastError).toHaveBeenCalledWith(MENSAJE_SIN_CONEXION));
    expect(screen.getByRole("checkbox", { name: /Sacar la basura/ }).getAttribute("aria-checked")).toBe("false");
    expect(fetch).not.toHaveBeenCalled();

    // Al volver la conexión no se manda nada por su cuenta: no hay cola de cambios.
    enLinea(true);
    await act(async () => window.dispatchEvent(new Event("online")));
    expect(fetch).not.toHaveBeenCalled();
  });

  it("muestra la franja de 'Sin conexión' mientras no hay red", async () => {
    enLinea(false);
    render(<AvisoSinConexion />);
    expect(screen.getByRole("status").textContent).toMatch(/Sin conexión/);
    enLinea(true);
    await act(async () => window.dispatchEvent(new Event("online")));
    expect(screen.queryByRole("status")).toBeNull();
  });
});
