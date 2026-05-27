-- AlterTable
ALTER TABLE `pedidocancion` ADD COLUMN `nombreSolicitante` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `EstadisticasGlobalesCancion` (
    `id` VARCHAR(191) NOT NULL,
    `spotifyId` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `artista` VARCHAR(191) NOT NULL,
    `totalPedidos` INTEGER NOT NULL DEFAULT 0,
    `vecesAceptada` INTEGER NOT NULL DEFAULT 0,
    `vecesRechazada` INTEGER NOT NULL DEFAULT 0,
    `ultimaSolicitud` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    UNIQUE INDEX `EstadisticasGlobalesCancion_spotifyId_key`(`spotifyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
