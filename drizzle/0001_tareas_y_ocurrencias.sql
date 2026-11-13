CREATE TABLE `ocurrencias` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tarea_id` integer NOT NULL,
	`miembro_id` integer NOT NULL,
	`inicio` text NOT NULL,
	`fin` text NOT NULL,
	`tildada_por_id` integer,
	`tildada_en` integer,
	FOREIGN KEY (`tarea_id`) REFERENCES `tareas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`miembro_id`) REFERENCES `miembros`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tildada_por_id`) REFERENCES `miembros`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ocurrencias_tarea_inicio` ON `ocurrencias` (`tarea_id`,`inicio`);--> statement-breakpoint
CREATE INDEX `ocurrencias_miembro_fin` ON `ocurrencias` (`miembro_id`,`fin`);--> statement-breakpoint
CREATE TABLE `tareas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`emoji` text,
	`frecuencia` text NOT NULL,
	`dias_semana` integer DEFAULT 0 NOT NULL,
	`miembro_id` integer NOT NULL,
	`archivada` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`miembro_id`) REFERENCES `miembros`(`id`) ON UPDATE no action ON DELETE no action
);
