CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`quantity` integer NOT NULL,
	`status` text DEFAULT 'reserved' NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`available` integer DEFAULT 0 NOT NULL,
	`location` text DEFAULT 'Campus shop' NOT NULL,
	`hours` text DEFAULT '' NOT NULL,
	`open` integer DEFAULT 0 NOT NULL
);
