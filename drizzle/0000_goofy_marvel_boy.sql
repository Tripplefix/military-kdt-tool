CREATE TABLE `block` (
	`id` text PRIMARY KEY NOT NULL,
	`day_id` text NOT NULL,
	`title` text NOT NULL,
	`start_min` integer NOT NULL,
	`end_min` integer NOT NULL,
	`category_id` text,
	`location` text DEFAULT '' NOT NULL,
	`responsibility` text DEFAULT '' NOT NULL,
	`remark` text DEFAULT '' NOT NULL,
	`footnote_id` text,
	`lane_start_order` integer DEFAULT 0 NOT NULL,
	`lane_span` integer DEFAULT 1 NOT NULL,
	`sort_key` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`day_id`) REFERENCES `day`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`footnote_id`) REFERENCES `footnote`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `block_day` ON `block` (`day_id`);--> statement-breakpoint
CREATE TABLE `category` (
	`id` text PRIMARY KEY NOT NULL,
	`wk_id` text NOT NULL,
	`key` text NOT NULL,
	`label` text NOT NULL,
	`color` text NOT NULL,
	`text_color` text DEFAULT '#000000' NOT NULL,
	`shape` text DEFAULT 'rect' NOT NULL,
	`exclude_from_tagesbefehl` integer DEFAULT false NOT NULL,
	`tagesbefehl_section` text DEFAULT 'dienstbetrieb' NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`wk_id`) REFERENCES `wk`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `category_wk_key` ON `category` (`wk_id`,`key`);--> statement-breakpoint
CREATE TABLE `day` (
	`id` text PRIMARY KEY NOT NULL,
	`week_id` text NOT NULL,
	`date` text NOT NULL,
	`weekday` integer NOT NULL,
	`tagesof_personnel_id` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`week_id`) REFERENCES `week`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tagesof_personnel_id`) REFERENCES `personnel`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `day_week_date` ON `day` (`week_id`,`date`);--> statement-breakpoint
CREATE TABLE `footnote` (
	`id` text PRIMARY KEY NOT NULL,
	`day_id` text NOT NULL,
	`number` integer NOT NULL,
	`text` text DEFAULT '' NOT NULL,
	`start_min` integer NOT NULL,
	`end_min` integer NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`day_id`) REFERENCES `day`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `footnote_day` ON `footnote` (`day_id`);--> statement-breakpoint
CREATE TABLE `lane` (
	`id` text PRIMARY KEY NOT NULL,
	`week_id` text NOT NULL,
	`day_id` text,
	`key` text NOT NULL,
	`label` text NOT NULL,
	`order` integer NOT NULL,
	`width_weight` real DEFAULT 1 NOT NULL,
	`kind` text DEFAULT 'unit' NOT NULL,
	`zug_key` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`week_id`) REFERENCES `week`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`day_id`) REFERENCES `day`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `lane_week` ON `lane` (`week_id`);--> statement-breakpoint
CREATE INDEX `lane_day` ON `lane` (`day_id`);--> statement-breakpoint
CREATE TABLE `personnel` (
	`id` text PRIMARY KEY NOT NULL,
	`wk_id` text NOT NULL,
	`name` text NOT NULL,
	`rank` text DEFAULT '' NOT NULL,
	`role` text DEFAULT 'other' NOT NULL,
	`unit_id` text,
	`phone` text DEFAULT '' NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`wk_id`) REFERENCES `wk`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`unit_id`) REFERENCES `unit`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `personnel_wk` ON `personnel` (`wk_id`);--> statement-breakpoint
CREATE TABLE `settings` (
	`wk_id` text PRIMARY KEY NOT NULL,
	`company_name` text NOT NULL,
	`battalion_name` text DEFAULT '' NOT NULL,
	`kp_kdt_name` text DEFAULT '' NOT NULL,
	`kdt_stv_name` text DEFAULT '' NOT NULL,
	`bat_kdt_name` text DEFAULT '' NOT NULL,
	`standard_times` text DEFAULT '[]' NOT NULL,
	`standard_reports` text DEFAULT '[]' NOT NULL,
	`phone_kp` text DEFAULT '' NOT NULL,
	`phone_lvz_mcc` text DEFAULT '' NOT NULL,
	`phone_tagesof` text DEFAULT '' NOT NULL,
	`phone_wachtof` text DEFAULT '' NOT NULL,
	`distribution` text DEFAULT '{"eingesehenVon":"","gehtAn":[],"zKAn":[]}' NOT NULL,
	`remarks_default` text DEFAULT '' NOT NULL,
	`wochenziele_default` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`wk_id`) REFERENCES `wk`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tagesbefehl` (
	`id` text PRIMARY KEY NOT NULL,
	`day_id` text NOT NULL,
	`number` integer NOT NULL,
	`status` text DEFAULT 'entwurf' NOT NULL,
	`valid_from` text DEFAULT '' NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`replaces_version` text DEFAULT '-' NOT NULL,
	`besonderes_note` text DEFAULT '' NOT NULL,
	`generated_at` text,
	`last_regenerated_at` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`day_id`) REFERENCES `day`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tagesbefehl_day_id_unique` ON `tagesbefehl` (`day_id`);--> statement-breakpoint
CREATE TABLE `tagesbefehl_row` (
	`id` text PRIMARY KEY NOT NULL,
	`tagesbefehl_id` text NOT NULL,
	`section` text NOT NULL,
	`group_key` text,
	`group_label` text DEFAULT '' NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	`time_text` text DEFAULT '' NOT NULL,
	`start_min` integer,
	`end_min` integer,
	`activity` text DEFAULT '' NOT NULL,
	`responsibility` text DEFAULT '' NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`source_block_id` text,
	`source_kind` text DEFAULT 'manual' NOT NULL,
	`source_key` text,
	`source_snapshot` text,
	`overridden` integer DEFAULT false NOT NULL,
	`deleted` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`tagesbefehl_id`) REFERENCES `tagesbefehl`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_block_id`) REFERENCES `block`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `tbrow_tb` ON `tagesbefehl_row` (`tagesbefehl_id`);--> statement-breakpoint
CREATE INDEX `tbrow_source` ON `tagesbefehl_row` (`tagesbefehl_id`,`source_key`);--> statement-breakpoint
CREATE TABLE `term_template` (
	`id` text PRIMARY KEY NOT NULL,
	`wk_id` text NOT NULL,
	`kind` text NOT NULL,
	`de` text NOT NULL,
	`it` text DEFAULT '' NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`wk_id`) REFERENCES `wk`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `term_wk_kind` ON `term_template` (`wk_id`,`kind`);--> statement-breakpoint
CREATE TABLE `unit` (
	`id` text PRIMARY KEY NOT NULL,
	`wk_id` text NOT NULL,
	`key` text NOT NULL,
	`label` text NOT NULL,
	`tagesbefehl_label` text NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	`kvk_only` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`wk_id`) REFERENCES `wk`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unit_wk_key` ON `unit` (`wk_id`,`key`);--> statement-breakpoint
CREATE TABLE `week` (
	`id` text PRIMARY KEY NOT NULL,
	`wk_id` text NOT NULL,
	`index` integer NOT NULL,
	`label` text NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`start_date` text NOT NULL,
	`kind` text DEFAULT 'normal' NOT NULL,
	`wachtof_personnel_id` text,
	`wochenziele` text DEFAULT '' NOT NULL,
	`remarks` text DEFAULT '' NOT NULL,
	`stand_date` text,
	`status` text DEFAULT 'entwurf' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`wk_id`) REFERENCES `wk`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`wachtof_personnel_id`) REFERENCES `personnel`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `week_wk_index` ON `week` (`wk_id`,`index`);--> statement-breakpoint
CREATE TABLE `wk` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`owner_id` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
