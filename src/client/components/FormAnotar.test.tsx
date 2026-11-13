import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FormAnotar } from "./FormAnotar";

afterEach(cleanup);

describe("FormAnotar", () => {
  it("avisa si ya hay un Ítem parecido sin comprar, pero deja anotarlo igual", async () => {
    const onAnotar = vi.fn();
    render(<FormAnotar sinComprar={[{ texto: "Azúcar" }, { texto: "Pan" }]} onAnotar={onAnotar} />);

    await userEvent.type(screen.getByLabelText("Qué falta"), "azucar");
    expect(screen.getByRole("status").textContent).toBe("Ya está: Azúcar");

    await userEvent.click(screen.getByRole("button", { name: "Anotar" }));
    expect(onAnotar).toHaveBeenCalledWith("azucar");
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("no avisa cuando no hay nada parecido", async () => {
    render(<FormAnotar sinComprar={[{ texto: "Azúcar" }]} onAnotar={() => {}} />);
    await userEvent.type(screen.getByLabelText("Qué falta"), "Yerba");
    expect(screen.queryByRole("status")).toBeNull();
  });
});
