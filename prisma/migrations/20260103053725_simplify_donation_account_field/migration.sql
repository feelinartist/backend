/*
  Warnings:

  - You are about to drop the column `identificador` on the `artistadonacion` table. All the data in the column will be lost.
  - You are about to drop the column `numeroTelefono` on the `artistadonacion` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `artistadonacion` DROP COLUMN `identificador`,
    DROP COLUMN `numeroTelefono`,
    ADD COLUMN `numeroCuenta` VARCHAR(191) NULL;
