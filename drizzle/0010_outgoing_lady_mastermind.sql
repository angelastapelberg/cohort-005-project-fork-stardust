DROP INDEX `refunds_purchase_idx`;--> statement-breakpoint
-- SQLite cannot add a NOT NULL column without a default. Existing rows are
-- backfilled below with what the learner paid for the purchase.
ALTER TABLE `refunds` ADD `refund_amount` integer NOT NULL DEFAULT 0;--> statement-breakpoint
UPDATE `refunds` SET `refund_amount` = (SELECT `amount_paid` FROM `purchases` WHERE `purchases`.`id` = `refunds`.`purchase_id`);--> statement-breakpoint
ALTER TABLE `refunds` ADD `decline_reason` text;--> statement-breakpoint
CREATE UNIQUE INDEX `refunds_purchase_idx` ON `refunds` (`purchase_id`);
