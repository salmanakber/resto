-- Add stripeCustomerId to User table
ALTER TABLE `User` ADD COLUMN `stripeCustomerId` VARCHAR(191) UNIQUE;

-- Update PaymentMethod table
ALTER TABLE `PaymentMethod` 
  MODIFY COLUMN `cardNumber` VARCHAR(191) NOT NULL,
  MODIFY COLUMN `expiryMonth` INT NOT NULL,
  MODIFY COLUMN `expiryYear` INT NOT NULL,
  MODIFY COLUMN `cardHolderName` VARCHAR(191) NOT NULL; 