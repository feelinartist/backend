-- AlterTable
ALTER TABLE `usuario` ADD COLUMN `estadoCuenta` ENUM('ACTIVO', 'DESHABILITADO', 'ELIMINACION_PENDIENTE') NOT NULL DEFAULT 'ACTIVO',
    ADD COLUMN `fechaEliminacionProgramada` DATETIME(3) NULL,
    ADD COLUMN `ultimoCambioNombre` DATETIME(3) NULL,
    ADD COLUMN `ultimoCambioNombreUsuario` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `Bloqueo` (
    `id` VARCHAR(191) NOT NULL,
    `bloqueadorId` VARCHAR(191) NOT NULL,
    `bloqueadoId` VARCHAR(191) NOT NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,
    `creadoPor` VARCHAR(191) NULL,
    `actualizadoPor` VARCHAR(191) NULL,

    UNIQUE INDEX `Bloqueo_bloqueadorId_bloqueadoId_key`(`bloqueadorId`, `bloqueadoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Bloqueo` ADD CONSTRAINT `Bloqueo_bloqueadorId_fkey` FOREIGN KEY (`bloqueadorId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bloqueo` ADD CONSTRAINT `Bloqueo_bloqueadoId_fkey` FOREIGN KEY (`bloqueadoId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
