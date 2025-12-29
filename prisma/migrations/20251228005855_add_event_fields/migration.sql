-- AlterTable
ALTER TABLE `event` ADD COLUMN `failedAt` DATETIME(3) NULL,
    ADD COLUMN `response` JSON NULL;
