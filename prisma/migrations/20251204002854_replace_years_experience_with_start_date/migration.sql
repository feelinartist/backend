/*
  Warnings:

  - You are about to drop the column `yearsExperience` on the `artistprofile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `artistprofile` DROP COLUMN `yearsExperience`,
    ADD COLUMN `startDate` DATETIME(3) NULL;
