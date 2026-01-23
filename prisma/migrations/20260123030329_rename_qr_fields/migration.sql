/*
  Warnings:

  - You are about to drop the column `codigoQR` on the `perfilartista` table. All the data in the column will be lost.
  - You are about to drop the column `imagenQR` on the `perfilartista` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `PerfilArtista` RENAME COLUMN `codigoQR` TO `musicQR`;
ALTER TABLE `PerfilArtista` RENAME COLUMN `imagenQR` TO `pagoQR`;
