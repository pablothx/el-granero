import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

const instante = (nombre: string) => integer(nombre, { mode: "timestamp_ms" });

/**
 * Configuración de la Familia: una sola fila con id 1 (ver ADR 0001).
 */
export const familia = sqliteTable("familia", {
  id: integer("id").primaryKey(),
  zonaHoraria: text("zona_horaria").notNull(),
  claveHash: text("clave_hash").notNull(),
  createdAt: instante("created_at").notNull(),
});

export const miembros = sqliteTable("miembros", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nombre: text("nombre").notNull(),
  rol: text("rol", { enum: ["adulto", "chico"] }).notNull(),
  avatarEmoji: text("avatar_emoji").notNull(),
  avatarColor: text("avatar_color").notNull(),
  pinHash: text("pin_hash").notNull(),
  archivado: integer("archivado", { mode: "boolean" }).notNull().default(false),
  createdAt: instante("created_at").notNull(),
});

export const dispositivos = sqliteTable("dispositivos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tokenHash: text("token_hash").notNull().unique(),
  nombre: text("nombre").notNull(),
  createdAt: instante("created_at").notNull(),
  ultimoUsoAt: instante("ultimo_uso_at").notNull(),
});

export const sesiones = sqliteTable("sesiones", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tokenHash: text("token_hash").notNull().unique(),
  dispositivoId: integer("dispositivo_id")
    .notNull()
    .references(() => dispositivos.id, { onDelete: "cascade" }),
  miembroId: integer("miembro_id")
    .notNull()
    .references(() => miembros.id, { onDelete: "cascade" }),
  ultimoPinAt: instante("ultimo_pin_at").notNull(),
  createdAt: instante("created_at").notNull(),
});

/** Intentos fallidos de PIN de un Miembro en un Dispositivo vinculado. */
export const intentosPin = sqliteTable(
  "intentos_pin",
  {
    dispositivoId: integer("dispositivo_id")
      .notNull()
      .references(() => dispositivos.id, { onDelete: "cascade" }),
    miembroId: integer("miembro_id")
      .notNull()
      .references(() => miembros.id, { onDelete: "cascade" }),
    fallos: integer("fallos").notNull(),
    bloqueadoHasta: instante("bloqueado_hasta"),
  },
  (t) => [primaryKey({ columns: [t.dispositivoId, t.miembroId] })],
);
