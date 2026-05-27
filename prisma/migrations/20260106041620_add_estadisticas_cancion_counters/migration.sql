-- CreateTable
CREATE TABLE `EstadisticasCancion` (
    `id` VARCHAR(191) NOT NULL,
    `spotifyId` VARCHAR(191) NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `artista` VARCHAR(191) NOT NULL,
    `genero` VARCHAR(191) NULL,
    `perfilArtistaId` VARCHAR(191) NOT NULL,
    `totalPedidos` INTEGER NOT NULL DEFAULT 0,
    `totalAceptados` INTEGER NOT NULL DEFAULT 0,
    `totalRechazados` INTEGER NOT NULL DEFAULT 0,
    `ultimoPedido` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    INDEX `EstadisticasCancion_perfilArtistaId_idx`(`perfilArtistaId`),
    UNIQUE INDEX `EstadisticasCancion_spotifyId_perfilArtistaId_key`(`spotifyId`, `perfilArtistaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `EstadisticasCancion` ADD CONSTRAINT `EstadisticasCancion_perfilArtistaId_fkey` FOREIGN KEY (`perfilArtistaId`) REFERENCES `PerfilArtista`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
