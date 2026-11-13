import { hc } from "hono/client";
import type { AppType } from "../worker/app";

/** Cliente RPC de la API: los tipos de cada endpoint vienen directo del Worker. */
export const api = hc<AppType>("/").api;
