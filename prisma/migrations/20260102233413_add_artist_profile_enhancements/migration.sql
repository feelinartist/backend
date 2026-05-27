/*
  Warnings:

  - You are about to drop the column `ciudadId` on the `perfilartista` table. All the data in the column will be lost.
  - You are about to drop the column `enlacesDonacion` on the `perfilartista` table. All the data in the column will be lost.
  - You are about to drop the column `nombreArtistico` on the `perfilartista` table. All the data in the column will be lost.
  - You are about to drop the column `paisId` on the `perfilartista` table. All the data in the column will be lost.
  - You are about to drop the column `redesSociales` on the `perfilartista` table. All the data in the column will be lost.
  - You are about to drop the column `urlAvatar` on the `perfilartista` table. All the data in the column will be lost.
  - You are about to drop the column `categorias` on the `perfildiscoteca` table. All the data in the column will be lost.
  - You are about to drop the column `ciudadId` on the `perfildiscoteca` table. All the data in the column will be lost.
  - You are about to drop the column `nombre` on the `perfildiscoteca` table. All the data in the column will be lost.
  - You are about to drop the column `paisId` on the `perfildiscoteca` table. All the data in the column will be lost.
  - You are about to drop the column `rangoPrecios` on the `perfildiscoteca` table. All the data in the column will be lost.
  - You are about to drop the column `ciudadId` on the `perfilpublico` table. All the data in the column will be lost.
  - You are about to drop the column `paisId` on the `perfilpublico` table. All the data in the column will be lost.
  - You are about to drop the `ciudad` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pais` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `seguidor` DROP FOREIGN KEY `Seguidor_artistaSeguidoId_fkey`;

-- DropIndex
DROP INDEX `PerfilArtista_nombreArtistico_key` ON `perfilartista`;

-- AlterTable
ALTER TABLE `perfilartista` DROP COLUMN `ciudadId`,
    DROP COLUMN `enlacesDonacion`,
    DROP COLUMN `nombreArtistico`,
    DROP COLUMN `paisId`,
    DROP COLUMN `redesSociales`,
    DROP COLUMN `urlAvatar`,
    ADD COLUMN `ciudad` VARCHAR(191) NULL,
    ADD COLUMN `pais` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `perfildiscoteca` DROP COLUMN `categorias`,
    DROP COLUMN `ciudadId`,
    DROP COLUMN `nombre`,
    DROP COLUMN `paisId`,
    DROP COLUMN `rangoPrecios`,
    ADD COLUMN `ciudad` VARCHAR(191) NULL,
    ADD COLUMN `codigoTelefono` VARCHAR(191) NULL,
    ADD COLUMN `numeroTelefono` VARCHAR(191) NULL,
    ADD COLUMN `pais` VARCHAR(191) NULL,
    ADD COLUMN `zonaHoraria` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `perfilpublico` DROP COLUMN `ciudadId`,
    DROP COLUMN `paisId`,
    ADD COLUMN `ciudad` VARCHAR(191) NULL,
    ADD COLUMN `pais` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `seguidor` ADD COLUMN `perfilDiscotecaId` VARCHAR(191) NULL,
    MODIFY `artistaSeguidoId` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `ciudad`;

-- DropTable
DROP TABLE `pais`;

-- CreateTable
CREATE TABLE `RedSocial` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `urlBase` VARCHAR(191) NOT NULL,
    `icono` VARCHAR(191) NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    UNIQUE INDEX `RedSocial_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ArtistaRedSocial` (
    `id` VARCHAR(191) NOT NULL,
    `perfilArtistaId` VARCHAR(191) NOT NULL,
    `redSocialId` VARCHAR(191) NOT NULL,
    `nombreUsuario` VARCHAR(191) NOT NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ArtistaRedSocial_perfilArtistaId_redSocialId_key`(`perfilArtistaId`, `redSocialId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MetodoDonacion` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    UNIQUE INDEX `MetodoDonacion_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ArtistaDonacion` (
    `id` VARCHAR(191) NOT NULL,
    `perfilArtistaId` VARCHAR(191) NOT NULL,
    `metodoDonacionId` VARCHAR(191) NOT NULL,
    `datos` VARCHAR(191) NULL,
    `imagenQR` VARCHAR(191) NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Seguidor` ADD CONSTRAINT `Seguidor_artistaSeguidoId_fkey` FOREIGN KEY (`artistaSeguidoId`) REFERENCES `PerfilArtista`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Seguidor` ADD CONSTRAINT `Seguidor_perfilDiscotecaId_fkey` FOREIGN KEY (`perfilDiscotecaId`) REFERENCES `PerfilDiscoteca`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtistaRedSocial` ADD CONSTRAINT `ArtistaRedSocial_perfilArtistaId_fkey` FOREIGN KEY (`perfilArtistaId`) REFERENCES `PerfilArtista`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtistaRedSocial` ADD CONSTRAINT `ArtistaRedSocial_redSocialId_fkey` FOREIGN KEY (`redSocialId`) REFERENCES `RedSocial`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtistaDonacion` ADD CONSTRAINT `ArtistaDonacion_perfilArtistaId_fkey` FOREIGN KEY (`perfilArtistaId`) REFERENCES `PerfilArtista`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtistaDonacion` ADD CONSTRAINT `ArtistaDonacion_metodoDonacionId_fkey` FOREIGN KEY (`metodoDonacionId`) REFERENCES `MetodoDonacion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
