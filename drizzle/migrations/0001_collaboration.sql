CREATE TABLE `board_member` (
	`board_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'editor' NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`board_id`, `user_id`),
	FOREIGN KEY (`board_id`) REFERENCES `board`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `board_member_user_idx` ON `board_member` (`user_id`);--> statement-breakpoint
CREATE TABLE `checklist_item` (
	`id` text PRIMARY KEY NOT NULL,
	`card_id` text NOT NULL,
	`text` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`position` real NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`card_id`) REFERENCES `card`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `checklist_card_idx` ON `checklist_item` (`card_id`);--> statement-breakpoint
ALTER TABLE `card` ADD `assignee_id` text REFERENCES user(id);--> statement-breakpoint
-- Backfill: every existing board's owner becomes an "owner" member.
INSERT INTO `board_member` (`board_id`, `user_id`, `role`, `created_at`)
SELECT `id`, `owner_id`, 'owner', `created_at` FROM `board`;