CREATE TABLE `org_member` (
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`organization_id`, `user_id`),
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `org_member_user_idx` ON `org_member` (`user_id`);--> statement-breakpoint
CREATE TABLE `organization` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`owner_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `board` ADD `organization_id` text REFERENCES organization(id);--> statement-breakpoint
ALTER TABLE `user` ADD `active_organization_id` text REFERENCES organization(id);--> statement-breakpoint
-- Backfill: a personal organization for every existing user.
INSERT INTO `organization` (`id`, `name`, `owner_id`, `created_at`)
SELECT lower(hex(randomblob(16))), `name` || '''s Workspace', `id`, unixepoch() FROM `user`;--> statement-breakpoint
-- Each user owns their personal organization.
INSERT INTO `org_member` (`organization_id`, `user_id`, `role`, `created_at`)
SELECT o.`id`, o.`owner_id`, 'owner', unixepoch() FROM `organization` o;--> statement-breakpoint
-- Point every user at their new personal organization.
UPDATE `user` SET `active_organization_id` = (SELECT o.`id` FROM `organization` o WHERE o.`owner_id` = `user`.`id`);--> statement-breakpoint
-- Assign existing boards to their owner's personal organization.
UPDATE `board` SET `organization_id` = (SELECT o.`id` FROM `organization` o WHERE o.`owner_id` = `board`.`owner_id`);--> statement-breakpoint
-- Preserve existing per-board shares as members of the board's organization.
INSERT OR IGNORE INTO `org_member` (`organization_id`, `user_id`, `role`, `created_at`)
SELECT b.`organization_id`, bm.`user_id`, 'member', unixepoch()
FROM `board_member` bm JOIN `board` b ON b.`id` = bm.`board_id`
WHERE bm.`role` != 'owner' AND b.`organization_id` IS NOT NULL;