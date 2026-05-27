/*
  Warnings:

  - You are about to drop the column `username` on the `artistprofile` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `publicprofile` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `ArtistProfile_username_key` ON `artistprofile`;

-- DropIndex
DROP INDEX `PublicProfile_username_key` ON `publicprofile`;

-- AlterTable
ALTER TABLE `artistprofile` DROP COLUMN `username`;

-- AlterTable
ALTER TABLE `publicprofile` DROP COLUMN `username`;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `username` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_username_key` ON `User`(`username`);
