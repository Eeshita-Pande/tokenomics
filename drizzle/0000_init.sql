CREATE TABLE `ai_economics_facts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_ticker` text NOT NULL,
	`metric` text NOT NULL,
	`fiscal_year` integer NOT NULL,
	`value_usd` real NOT NULL,
	`value_low_usd` real,
	`value_high_usd` real,
	`data_quality` text NOT NULL,
	`methodology` text NOT NULL,
	`sources` text NOT NULL,
	`note` text,
	`last_verified_at` text NOT NULL,
	FOREIGN KEY (`company_ticker`) REFERENCES `companies`(`ticker`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uniq_ai_fact` ON `ai_economics_facts` (`company_ticker`,`metric`,`fiscal_year`);--> statement-breakpoint
CREATE INDEX `by_ai_metric` ON `ai_economics_facts` (`metric`,`fiscal_year`);--> statement-breakpoint
CREATE TABLE `companies` (
	`cik` text PRIMARY KEY NOT NULL,
	`ticker` text NOT NULL,
	`name` text NOT NULL,
	`segment` text,
	`is_public` integer DEFAULT true,
	`fiscal_year_end` text,
	`ppe_useful_life_years` real,
	`notes` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `companies_ticker_unique` ON `companies` (`ticker`);--> statement-breakpoint
CREATE TABLE `data_points` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cik` text,
	`ticker` text,
	`claim_type` text NOT NULL,
	`claim` text NOT NULL,
	`value` real,
	`unit` text,
	`period` text,
	`source_url` text NOT NULL,
	`source_name` text,
	`confidence` real,
	`retrieved_at` text NOT NULL,
	FOREIGN KEY (`cik`) REFERENCES `companies`(`cik`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `financial_facts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cik` text NOT NULL,
	`segment` text,
	`concept` text NOT NULL,
	`fiscal_year` integer NOT NULL,
	`fiscal_period` text NOT NULL,
	`period_start` text,
	`period_end` text NOT NULL,
	`value` real NOT NULL,
	`unit` text NOT NULL,
	`form` text NOT NULL,
	`accn` text,
	`filed_at` text,
	`source_url` text,
	FOREIGN KEY (`cik`) REFERENCES `companies`(`cik`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uniq_fact` ON `financial_facts` (`cik`,`segment`,`concept`,`fiscal_year`,`fiscal_period`,`accn`);--> statement-breakpoint
CREATE INDEX `by_cik_concept` ON `financial_facts` (`cik`,`segment`,`concept`);--> statement-breakpoint
CREATE TABLE `ingest_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`occurred_at` text NOT NULL,
	`source` text NOT NULL,
	`kind` text NOT NULL,
	`summary` text NOT NULL,
	`detail_url` text,
	`cik` text
);
--> statement-breakpoint
CREATE TABLE `source_feeds` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`kind` text NOT NULL,
	`last_seen_guid` text,
	`last_etag` text,
	`last_modified` text,
	`last_checked_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `source_feeds_url_unique` ON `source_feeds` (`url`);