/*
  Warnings:

  - You are about to drop the column `categoria` on the `configuracionsistema` table. All the data in the column will be lost.
  - You are about to drop the column `esSecreta` on the `configuracionsistema` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `configuracionsistema` DROP COLUMN `categoria`,
    DROP COLUMN `esSecreta`;
