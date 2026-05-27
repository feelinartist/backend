/*
  Warnings:

  - You are about to drop the column `nombreSolicitante` on the `pedidocancion` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `pedidocancion` DROP COLUMN `nombreSolicitante`;

-- CreateTable
CREATE TABLE `ConfiguracionSistema` (
    `id` VARCHAR(191) NOT NULL,
    `clave` VARCHAR(191) NOT NULL,
    `valor` TEXT NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `categoria` ENUM('SPOTIFY', 'GENERAL', 'EMAIL', 'PAYMENT') NOT NULL,
    `esSecreta` BOOLEAN NOT NULL DEFAULT false,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,
    `creadoPor` VARCHAR(191) NULL,
    `actualizadoPor` VARCHAR(191) NULL,

    UNIQUE INDEX `ConfiguracionSistema_clave_key`(`clave`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
