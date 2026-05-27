/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `ArtistProfile` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `username` to the `ArtistProfile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `artistprofile` ADD COLUMN `currency` VARCHAR(191) NULL,
    ADD COLUMN `hourlyRate` DECIMAL(65, 30) NULL,
    ADD COLUMN `knownVenues` JSON NULL,
    ADD COLUMN `phoneCode` VARCHAR(191) NULL,
    ADD COLUMN `phoneNumber` VARCHAR(191) NULL,
    ADD COLUMN `username` VARCHAR(191) NOT NULL,
    ADD COLUMN `yearsExperience` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `ArtistProfile_username_key` ON `ArtistProfile`(`username`);
