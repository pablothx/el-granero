CREATE TABLE `items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lista` text NOT NULL,
	`texto` text NOT NULL,
	`anotado_por_id` integer NOT NULL,
	`anotado_en` integer NOT NULL,
	`comprado_por_id` integer,
	`comprado_en` integer,
	FOREIGN KEY (`anotado_por_id`) REFERENCES `miembros`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`comprado_por_id`) REFERENCES `miembros`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `items_lista` ON `items` (`lista`);