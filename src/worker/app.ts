import { count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { familia } from "../shared/esquema";
import type { Reloj } from "./reloj";

export interface Dependencias {
  reloj: Reloj;
}

export function crearApp({ reloj }: Dependencias) {
  return new Hono<{ Bindings: Env }>()
    .basePath("/api")
    .get("/estado", async (c) => {
      const db = drizzle(c.env.DB);
      const [fila] = await db.select({ total: count() }).from(familia);
      return c.json({
        app: "El Granero",
        familiaConfigurada: (fila?.total ?? 0) > 0,
        ahora: reloj.ahora().toISOString(),
      });
    });
}

export type AppType = ReturnType<typeof crearApp>;
