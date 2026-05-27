/*
  Warnings:

  - You are about to drop the `estadisticascancion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `estadisticasglobalescancion` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `estadisticascancion` DROP FOREIGN KEY `EstadisticasCancion_pedidoCancionId_fkey`;

-- AlterTable
ALTER TABLE `pedidocancion` ADD COLUMN `genero` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `estadisticascancion`;

-- DropTable
DROP TABLE `estadisticasglobalescancion`;
