-- AlterTable
ALTER TABLE `pedidocancion` ADD COLUMN `artista` VARCHAR(191) NULL,
    ADD COLUMN `nombreSolicitante` VARCHAR(191) NULL,
    ADD COLUMN `titulo` VARCHAR(191) NULL,
    MODIFY `usuarioId` VARCHAR(191) NULL,
    MODIFY `spotifyId` VARCHAR(191) NULL;
