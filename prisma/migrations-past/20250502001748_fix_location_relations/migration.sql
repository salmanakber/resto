-- DropForeignKey
ALTER TABLE `Location` DROP FOREIGN KEY `Location_userId_fkey`;

-- DropForeignKey
ALTER TABLE `User` DROP FOREIGN KEY `User_locationId_fkey`;

-- CreateTable
CREATE TABLE `_LocationUsers` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_LocationUsers_AB_unique`(`A`, `B`),
    INDEX `_LocationUsers_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Location` ADD CONSTRAINT `Location_creator_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_LocationUsers` ADD CONSTRAINT `_LocationUsers_A_fkey` FOREIGN KEY (`A`) REFERENCES `Location`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_LocationUsers` ADD CONSTRAINT `_LocationUsers_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
