import { describe, expect, it } from "vitest";
import { buscarParecido, normalizar } from "../src/shared/listas";
import { crearMiembro, dispositivoDe, familiaConfigurada, HORA, MINUTO } from "./ayudantes";

type Item = { id: number; texto: string; comprado: boolean; anotadoPor: string; compradoPor: string | null };

async function conChico() {
  const f = await familiaConfigurada("2026-11-17T10:00:00-03:00");
  const tomi = await crearMiembro(f.casa, { nombre: "Tomi", pin: "4321" });
  return { ...f, celuTomi: await dispositivoDe(f.sistema, tomi, "4321") };
}

async function lista(d: { get: (r: string) => Promise<{ cuerpo: { items: Item[] } }> }, cual = "super") {
  return (await d.get(`/listas/${cual}`)).cuerpo.items;
}

describe("Listas de compras", () => {
  it("cualquier Miembro (incluso un Chico) anota Ítems y queda quién los anotó", async () => {
    const { celuTomi, casa } = await conChico();
    expect((await celuTomi.post("/listas/super/items", { texto: "Falta azúcar" })).status).toBe(201);
    expect(await lista(casa)).toEqual([expect.objectContaining({ texto: "Falta azúcar", anotadoPor: "Tomi", comprado: false })]);
    expect(await lista(casa, "generales")).toEqual([]);
  });

  it("orden: sin comprar con el más nuevo arriba; Comprados abajo", async () => {
    const { casa, reloj } = await conChico();
    for (const texto of ["Leche", "Pan", "Yerba"]) {
      await casa.post("/listas/super/items", { texto });
      reloj.avanzar(MINUTO);
    }
    const pan = (await lista(casa)).find((i) => i.texto === "Pan")!;
    await casa.post(`/items/${pan.id}/comprar`);
    expect((await lista(casa)).map((i) => [i.texto, i.comprado])).toEqual([
      ["Yerba", false],
      ["Leche", false],
      ["Pan", true],
    ]);
  });

  it("tildar deja el Ítem Comprado con quién lo compró; destildar lo vuelve atrás", async () => {
    const { casa, celuTomi } = await conChico();
    await casa.post("/listas/super/items", { texto: "Azúcar" });
    const [azucar] = await lista(casa);
    await celuTomi.post(`/items/${azucar!.id}/comprar`);
    expect((await lista(casa))[0]).toMatchObject({ comprado: true, compradoPor: "Tomi" });
    await celuTomi.post(`/items/${azucar!.id}/descomprar`);
    expect((await lista(casa))[0]).toMatchObject({ comprado: false, compradoPor: null });
  });

  it("cualquier Miembro edita y borra cualquier Ítem", async () => {
    const { casa, celuTomi } = await conChico();
    await casa.post("/listas/generales/items", { texto: "Pilas" });
    const [pilas] = await lista(casa, "generales");
    expect((await celuTomi.patch(`/items/${pilas!.id}`, { texto: "Pilas AA para el control" })).status).toBe(200);
    expect((await lista(casa, "generales"))[0]!.texto).toBe("Pilas AA para el control");
    expect((await celuTomi.delete(`/items/${pilas!.id}`)).status).toBe(200);
    expect(await lista(casa, "generales")).toEqual([]);
  });

  it("los Comprados hace más de 24 h no aparecen, y el Cron los borra", async () => {
    const { casa, sistema, reloj } = await conChico();
    await casa.post("/listas/super/items", { texto: "Leche" });
    await casa.post("/listas/super/items", { texto: "Pan" });
    const leche = (await lista(casa)).find((i) => i.texto === "Leche")!;
    await casa.post(`/items/${leche.id}/comprar`);

    reloj.avanzar(23 * HORA);
    expect((await lista(casa)).map((i) => i.texto)).toEqual(["Pan", "Leche"]);
    reloj.avanzar(2 * HORA);
    expect((await lista(casa)).map((i) => i.texto)).toEqual(["Pan"]);

    await sistema.correrCron();
    expect((await casa.patch(`/items/${leche.id}`, { texto: "x" })).status).toBe(404);
    expect((await lista(casa)).map((i) => i.texto)).toEqual(["Pan"]);
  });

  it("sin Dispositivo vinculado o sin sesión no se ven las Listas", async () => {
    const { sistema, casa } = await conChico();
    expect((await sistema.dispositivo().get("/listas/super")).status).toBe(401);
    await casa.post("/salir");
    expect((await casa.get("/listas/super")).status).toBe(401);
  });

  it("valida la Lista y el texto", async () => {
    const { casa } = await conChico();
    expect((await casa.get("/listas/farmacia")).status).toBe(400);
    expect((await casa.post("/listas/super/items", { texto: "   " })).status).toBe(400);
  });
});

describe("Ítems parecidos", () => {
  const sinComprar = [{ texto: "Azúcar" }, { texto: "Leche entera" }];

  it("compara sin mayúsculas ni tildes", () => {
    expect(normalizar("  AZÚCAR   rubia ")).toBe("azucar rubia");
    expect(buscarParecido("azucar", sinComprar)).toEqual({ texto: "Azúcar" });
  });

  it("encuentra uno contenido en el otro", () => {
    expect(buscarParecido("falta azucar", sinComprar)).toEqual({ texto: "Azúcar" });
    expect(buscarParecido("leche", sinComprar)).toEqual({ texto: "Leche entera" });
  });

  it("no avisa con textos muy cortos ni distintos", () => {
    expect(buscarParecido("az", sinComprar)).toBeUndefined();
    expect(buscarParecido("yerba", sinComprar)).toBeUndefined();
  });
});
