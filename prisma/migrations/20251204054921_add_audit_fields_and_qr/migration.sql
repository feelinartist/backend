/*
  Warnings:

  - You are about to drop the column `createdAt` on the `log` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `log` table. All the data in the column will be lost.
  - You are about to drop the column `message` on the `log` table. All the data in the column will be lost.
  - You are about to drop the `ad` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `artistgallery` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `artistprofile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `city` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `country` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `event` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `follow` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `publicprofile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `reservation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `role` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `songrequest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `songstats` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `venue` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `venuebooking` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `actualizadoEn` to the `Log` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mensaje` to the `Log` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nivel` to the `Log` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `artistgallery` DROP FOREIGN KEY `ArtistGallery_artistId_fkey`;

-- DropForeignKey
ALTER TABLE `artistprofile` DROP FOREIGN KEY `ArtistProfile_userId_fkey`;

-- DropForeignKey
ALTER TABLE `event` DROP FOREIGN KEY `Event_artistId_fkey`;

-- DropForeignKey
ALTER TABLE `follow` DROP FOREIGN KEY `Follow_followingArtistId_fkey`;

-- DropForeignKey
ALTER TABLE `publicprofile` DROP FOREIGN KEY `PublicProfile_userId_fkey`;

-- DropForeignKey
ALTER TABLE `reservation` DROP FOREIGN KEY `Reservation_artistId_fkey`;

-- DropForeignKey
ALTER TABLE `reservation` DROP FOREIGN KEY `Reservation_eventId_fkey`;

-- DropForeignKey
ALTER TABLE `songrequest` DROP FOREIGN KEY `SongRequest_artistProfileId_fkey`;

-- DropForeignKey
ALTER TABLE `songrequest` DROP FOREIGN KEY `SongRequest_eventId_fkey`;

-- DropForeignKey
ALTER TABLE `songstats` DROP FOREIGN KEY `SongStats_songRequestId_fkey`;

-- DropForeignKey
ALTER TABLE `user` DROP FOREIGN KEY `User_roleId_fkey`;

-- DropForeignKey
ALTER TABLE `venue` DROP FOREIGN KEY `Venue_userId_fkey`;

-- DropForeignKey
ALTER TABLE `venuebooking` DROP FOREIGN KEY `VenueBooking_venueId_fkey`;

-- AlterTable
ALTER TABLE `log` DROP COLUMN `createdAt`,
    DROP COLUMN `level`,
    DROP COLUMN `message`,
    ADD COLUMN `actualizadoEn` DATETIME(3) NOT NULL,
    ADD COLUMN `actualizadoPor` VARCHAR(191) NULL,
    ADD COLUMN `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `creadoPor` VARCHAR(191) NULL,
    ADD COLUMN `mensaje` VARCHAR(191) NOT NULL,
    ADD COLUMN `nivel` ENUM('INFO', 'WARN', 'ERROR') NOT NULL;

-- DropTable
DROP TABLE `ad`;

-- DropTable
DROP TABLE `artistgallery`;

-- DropTable
DROP TABLE `artistprofile`;

-- DropTable
DROP TABLE `city`;

-- DropTable
DROP TABLE `country`;

-- DropTable
DROP TABLE `event`;

-- DropTable
DROP TABLE `follow`;

-- DropTable
DROP TABLE `publicprofile`;

-- DropTable
DROP TABLE `reservation`;

-- DropTable
DROP TABLE `role`;

-- DropTable
DROP TABLE `songrequest`;

-- DropTable
DROP TABLE `songstats`;

-- DropTable
DROP TABLE `user`;

-- DropTable
DROP TABLE `venue`;

-- DropTable
DROP TABLE `venuebooking`;

-- CreateTable
CREATE TABLE `Usuario` (
    `id` VARCHAR(191) NOT NULL,
    `correo` VARCHAR(191) NOT NULL,
    `nombreUsuario` VARCHAR(191) NULL,
    `nombre` VARCHAR(191) NULL,
    `imagen` VARCHAR(191) NULL,
    `rolId` VARCHAR(191) NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,
    `creadoPor` VARCHAR(191) NULL,
    `actualizadoPor` VARCHAR(191) NULL,

    UNIQUE INDEX `Usuario_correo_key`(`correo`),
    UNIQUE INDEX `Usuario_nombreUsuario_key`(`nombreUsuario`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PerfilPublico` (
    `id` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `codigoTelefono` VARCHAR(191) NULL,
    `numeroTelefono` VARCHAR(191) NULL,
    `ciudadId` VARCHAR(191) NOT NULL,
    `paisId` VARCHAR(191) NOT NULL,
    `zonaHoraria` VARCHAR(191) NOT NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,
    `creadoPor` VARCHAR(191) NULL,
    `actualizadoPor` VARCHAR(191) NULL,

    UNIQUE INDEX `PerfilPublico_usuarioId_key`(`usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Rol` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,
    `creadoPor` VARCHAR(191) NULL,
    `actualizadoPor` VARCHAR(191) NULL,

    UNIQUE INDEX `Rol_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PerfilArtista` (
    `id` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `nombreArtistico` VARCHAR(191) NOT NULL,
    `biografia` VARCHAR(191) NULL,
    `urlAvatar` VARCHAR(191) NULL,
    `codigoTelefono` VARCHAR(191) NULL,
    `numeroTelefono` VARCHAR(191) NULL,
    `fechaInicio` DATE NULL,
    `tarifaPorHora` DECIMAL(65, 30) NULL,
    `moneda` VARCHAR(191) NULL,
    `lugaresConocidos` JSON NULL,
    `redesSociales` JSON NULL,
    `enlacesDonacion` JSON NULL,
    `categoria` ENUM('DJ', 'BANDA', 'SOLISTA', 'ORQUESTA') NOT NULL,
    `ciudadId` VARCHAR(191) NOT NULL,
    `paisId` VARCHAR(191) NOT NULL,
    `zonaHoraria` VARCHAR(191) NOT NULL,
    `codigoQR` VARCHAR(191) NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,
    `creadoPor` VARCHAR(191) NULL,
    `actualizadoPor` VARCHAR(191) NULL,

    UNIQUE INDEX `PerfilArtista_usuarioId_key`(`usuarioId`),
    UNIQUE INDEX `PerfilArtista_nombreArtistico_key`(`nombreArtistico`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GaleriaArtista` (
    `id` VARCHAR(191) NOT NULL,
    `perfilArtistaId` VARCHAR(191) NOT NULL,
    `urlImagen` VARCHAR(191) NOT NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,
    `creadoPor` VARCHAR(191) NULL,
    `actualizadoPor` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Evento` (
    `id` VARCHAR(191) NOT NULL,
    `perfilArtistaId` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `horaInicio` DATETIME(3) NOT NULL,
    `horaFin` DATETIME(3) NULL,
    `codigoQR` VARCHAR(191) NOT NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,
    `creadoPor` VARCHAR(191) NULL,
    `actualizadoPor` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PedidoCancion` (
    `id` VARCHAR(191) NOT NULL,
    `eventoId` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `spotifyId` VARCHAR(191) NOT NULL,
    `estado` ENUM('PENDIENTE', 'ACEPTADO', 'RECHAZADO') NOT NULL DEFAULT 'PENDIENTE',
    `perfilArtistaId` VARCHAR(191) NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,
    `creadoPor` VARCHAR(191) NULL,
    `actualizadoPor` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EstadisticasCancion` (
    `id` VARCHAR(191) NOT NULL,
    `pedidoCancionId` VARCHAR(191) NOT NULL,
    `totalPedidos` INTEGER NOT NULL DEFAULT 0,
    `conteoAceptados` INTEGER NOT NULL DEFAULT 0,
    `conteoRechazados` INTEGER NOT NULL DEFAULT 0,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,
    `creadoPor` VARCHAR(191) NULL,
    `actualizadoPor` VARCHAR(191) NULL,

    UNIQUE INDEX `EstadisticasCancion_pedidoCancionId_key`(`pedidoCancionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Seguidor` (
    `id` VARCHAR(191) NOT NULL,
    `seguidorId` VARCHAR(191) NOT NULL,
    `artistaSeguidoId` VARCHAR(191) NOT NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,
    `creadoPor` VARCHAR(191) NULL,
    `actualizadoPor` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Reserva` (
    `id` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `perfilArtistaId` VARCHAR(191) NOT NULL,
    `eventoId` VARCHAR(191) NULL,
    `estado` ENUM('PENDIENTE', 'CONFIRMADA', 'RECHAZADA') NOT NULL DEFAULT 'PENDIENTE',
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,
    `creadoPor` VARCHAR(191) NULL,
    `actualizadoPor` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PerfilDiscoteca` (
    `id` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `ciudadId` VARCHAR(191) NOT NULL,
    `paisId` VARCHAR(191) NOT NULL,
    `categorias` JSON NULL,
    `rangoPrecios` VARCHAR(191) NULL,
    `fechaFundacion` DATE NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,
    `creadoPor` VARCHAR(191) NULL,
    `actualizadoPor` VARCHAR(191) NULL,

    UNIQUE INDEX `PerfilDiscoteca_usuarioId_key`(`usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Contratacion` (
    `id` VARCHAR(191) NOT NULL,
    `perfilDiscotecaId` VARCHAR(191) NOT NULL,
    `perfilArtistaId` VARCHAR(191) NOT NULL,
    `fechaEvento` DATETIME(3) NOT NULL,
    `precio` DECIMAL(65, 30) NOT NULL,
    `estado` ENUM('PENDIENTE', 'CONFIRMADA', 'RECHAZADA') NOT NULL DEFAULT 'PENDIENTE',
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,
    `creadoPor` VARCHAR(191) NULL,
    `actualizadoPor` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Anuncio` (
    `id` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `contenido` VARCHAR(191) NOT NULL,
    `regionObjetivo` VARCHAR(191) NULL,
    `fechaInicio` DATETIME(3) NOT NULL,
    `fechaFin` DATETIME(3) NOT NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,
    `creadoPor` VARCHAR(191) NULL,
    `actualizadoPor` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Ciudad` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `paisId` VARCHAR(191) NOT NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,
    `creadoPor` VARCHAR(191) NULL,
    `actualizadoPor` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Pais` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,
    `creadoPor` VARCHAR(191) NULL,
    `actualizadoPor` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Usuario` ADD CONSTRAINT `Usuario_rolId_fkey` FOREIGN KEY (`rolId`) REFERENCES `Rol`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PerfilPublico` ADD CONSTRAINT `PerfilPublico_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PerfilArtista` ADD CONSTRAINT `PerfilArtista_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GaleriaArtista` ADD CONSTRAINT `GaleriaArtista_perfilArtistaId_fkey` FOREIGN KEY (`perfilArtistaId`) REFERENCES `PerfilArtista`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Evento` ADD CONSTRAINT `Evento_perfilArtistaId_fkey` FOREIGN KEY (`perfilArtistaId`) REFERENCES `PerfilArtista`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PedidoCancion` ADD CONSTRAINT `PedidoCancion_eventoId_fkey` FOREIGN KEY (`eventoId`) REFERENCES `Evento`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PedidoCancion` ADD CONSTRAINT `PedidoCancion_perfilArtistaId_fkey` FOREIGN KEY (`perfilArtistaId`) REFERENCES `PerfilArtista`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EstadisticasCancion` ADD CONSTRAINT `EstadisticasCancion_pedidoCancionId_fkey` FOREIGN KEY (`pedidoCancionId`) REFERENCES `PedidoCancion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Seguidor` ADD CONSTRAINT `Seguidor_artistaSeguidoId_fkey` FOREIGN KEY (`artistaSeguidoId`) REFERENCES `PerfilArtista`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reserva` ADD CONSTRAINT `Reserva_perfilArtistaId_fkey` FOREIGN KEY (`perfilArtistaId`) REFERENCES `PerfilArtista`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reserva` ADD CONSTRAINT `Reserva_eventoId_fkey` FOREIGN KEY (`eventoId`) REFERENCES `Evento`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PerfilDiscoteca` ADD CONSTRAINT `PerfilDiscoteca_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Contratacion` ADD CONSTRAINT `Contratacion_perfilDiscotecaId_fkey` FOREIGN KEY (`perfilDiscotecaId`) REFERENCES `PerfilDiscoteca`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
