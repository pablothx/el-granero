import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Configuración de la Familia: una sola fila (ver ADR 0001).
 * Los tickets siguientes le agregan la Clave de la casa.
 */
export const familia = sqliteTable("familia", {
  id: integer("id").primaryKey(),
  zonaHoraria: text("zona_horaria").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});
