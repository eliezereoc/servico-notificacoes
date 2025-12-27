-- AlterTable
ALTER TABLE `event` ADD COLUMN `lastError` TEXT NULL,
    ADD COLUMN `processedAt` DATETIME(3) NULL;
