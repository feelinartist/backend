/*
  Warnings:

  - You are about to drop the column `datos` on the `artistadonacion` table. All the data in the column will be lost.
  - You are about to drop the column `imagenQR` on the `artistadonacion` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[perfilArtistaId,metodoDonacionId]` on the table `ArtistaDonacion` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `artistadonacion` DROP COLUMN `datos`,
    DROP COLUMN `imagenQR`,
    ADD COLUMN `identificador` VARCHAR(191) NULL,
    ADD COLUMN `numeroTelefono` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `perfilartista` ADD COLUMN `imagenQR` VARCHAR(191) NULL,
    ADD COLUMN `nombreQR` VARCHAR(191) NULL,
    ADD COLUMN `urlPago` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `ArtistaDonacion_perfilArtistaId_metodoDonacionId_key` ON `ArtistaDonacion`(`perfilArtistaId`, `metodoDonacionId`);
