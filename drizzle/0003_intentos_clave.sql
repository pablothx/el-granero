CREATE TABLE `intentos_clave` (
	`ip` text PRIMARY KEY NOT NULL,
	`fallos` integer NOT NULL,
	`bloqueado_hasta` integer
);
