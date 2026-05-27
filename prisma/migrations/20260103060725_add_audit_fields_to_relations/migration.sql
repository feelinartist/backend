-- AlterTable
ALTER TABLE `artistadonacion` ADD COLUMN `actualizadoPor` VARCHAR(191) NULL,
    ADD COLUMN `creadoPor` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `artistaredsocial` ADD COLUMN `actualizadoPor` VARCHAR(191) NULL,
    ADD COLUMN `creadoPor` VARCHAR(191) NULL;
