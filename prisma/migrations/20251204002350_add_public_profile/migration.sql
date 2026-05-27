-- CreateTable
CREATE TABLE `PublicProfile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `phoneCode` VARCHAR(191) NULL,
    `phoneNumber` VARCHAR(191) NULL,
    `cityId` VARCHAR(191) NOT NULL,
    `countryId` VARCHAR(191) NOT NULL,
    `timezone` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PublicProfile_userId_key`(`userId`),
    UNIQUE INDEX `PublicProfile_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PublicProfile` ADD CONSTRAINT `PublicProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
