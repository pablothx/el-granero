CREATE TABLE `dispositivos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`token_hash` text NOT NULL,
	`nombre` text NOT NULL,
	`created_at` integer NOT NULL,
	`ultimo_uso_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dispositivos_token_hash_unique` ON `dispositivos` (`token_hash`);--> statement-breakpoint
CREATE TABLE `familia` (
	`id` integer PRIMARY KEY NOT NULL,
	`zona_horaria` text NOT NULL,
	`clave_hash` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `intentos_pin` (
	`dispositivo_id` integer NOT NULL,
	`miembro_id` integer NOT NULL,
	`fallos` integer NOT NULL,
	`bloqueado_hasta` integer,
	PRIMARY KEY(`dispositivo_id`, `miembro_id`),
	FOREIGN KEY (`dispositivo_id`) REFERENCES `dispositivos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`miembro_id`) REFERENCES `miembros`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `miembros` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`rol` text NOT NULL,
	`avatar_emoji` text NOT NULL,
	`avatar_color` text NOT NULL,
	`pin_hash` text NOT NULL,
	`archivado` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sesiones` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`token_hash` text NOT NULL,
	`dispositivo_id` integer NOT NULL,
	`miembro_id` integer NOT NULL,
	`ultimo_pin_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`dispositivo_id`) REFERENCES `dispositivos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`miembro_id`) REFERENCES `miembros`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sesiones_token_hash_unique` ON `sesiones` (`token_hash`);