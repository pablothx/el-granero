import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

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

export const tareas = sqliteTable("tareas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nombre: text("nombre").notNull(),
  emoji: text("emoji"),
  frecuencia: text("frecuencia", { enum: ["diaria", "semanal", "mensual"] }).notNull(),
  /** Solo Diaria: máscara de días de la semana (bit 0 = lunes); 0 = todos. */
  diasSemana: integer("dias_semana").notNull().default(0),
  miembroId: integer("miembro_id")
    .notNull()
    .references(() => miembros.id),
  archivada: integer("archivada", { mode: "boolean" }).notNull().default(false),
  createdAt: instante("created_at").notNull(),
});

/**
 * Cada Período concreto de una Tarea (ADR 0005). El estado se deriva:
 * Cumplida si tiene tilde; si no, Pendiente o No cumplida según el Período.
 */
export const ocurrencias = sqliteTable(
  "ocurrencias",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tareaId: integer("tarea_id")
      .notNull()
      .references(() => tareas.id, { onDelete: "cascade" }),
    /** Miembro asignado al crearse; no cambia si después se reasigna la Tarea. */
    miembroId: integer("miembro_id")
      .notNull()
      .references(() => miembros.id),
    /** Fechas locales de la Familia, YYYY-MM-DD; `fin` excluido. */
    inicio: text("inicio").notNull(),
    fin: text("fin").notNull(),
    tildadaPorId: integer("tildada_por_id").references(() => miembros.id),
    tildadaEn: instante("tildada_en"),
  },
  (t) => [uniqueIndex("ocurrencias_tarea_inicio").on(t.tareaId, t.inicio), index("ocurrencias_miembro_fin").on(t.miembroId, t.fin)],
);
