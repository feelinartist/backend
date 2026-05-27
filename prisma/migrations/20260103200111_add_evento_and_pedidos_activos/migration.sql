/*
  Warnings:

  - You are about to drop the column `codigoQR` on the `evento` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `evento` DROP COLUMN `codigoQR`,
    ADD COLUMN `activo` BOOLEAN NOT NULL DEFAULT true,
    MODIFY `horaInicio` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `metododonacion` ADD COLUMN `icono` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `perfilartista` ADD COLUMN `pedidosActivos` BOOLEAN NOT NULL DEFAULT false;
