CREATE TABLE
    `User` (
        `id` INT NOT NULL AUTO_INCREMENT,
        `name` VARCHAR(200) NOT NULL,
        `email` VARCHAR(200) NOT NULL,
        `passwordHash` VARCHAR(500) NOT NULL,
        `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        UNIQUE KEY `idx_user_email` (`email`)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

CREATE TABLE
    `Store` (
        `id` INT NOT NULL AUTO_INCREMENT,
        `ownerId` INT NOT NULL,
        `name` VARCHAR(200) NOT NULL,
        `description` TEXT,
        `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `stripeAccountId` VARCHAR(200),
        PRIMARY KEY (`id`),
        KEY `idx_store_owner` (`ownerId`),
        CONSTRAINT `fk_store_owner` FOREIGN KEY (`ownerId`) REFERENCES `User` (`id`) ON DELETE CASCADE
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

CREATE TABLE
    `Product` (
        `id` INT NOT NULL AUTO_INCREMENT,
        `storeId` INT NOT NULL,
        `categoryId` INT DEFAULT NULL,
        `title` VARCHAR(191) NOT NULL,
        `description` TEXT,
        `price` DOUBLE NOT NULL,
        `stock` INT NOT NULL,
        `image` LONGBLOB NOT NULL,
        `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        KEY `idx_product_store` (`storeId`),
        KEY `idx_product_category` (`categoryId`),
        CONSTRAINT `fk_product_store` FOREIGN KEY (`storeId`) REFERENCES `Store` (`id`) ON DELETE CASCADE,
        CONSTRAINT `fk_product_category` FOREIGN KEY (`categoryId`) REFERENCES `Category` (`id`) ON DELETE SET NULL
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

CREATE TABLE
    `Category` (
        `id` INT NOT NULL AUTO_INCREMENT,
        `name` VARCHAR(200) NOT NULL,
        `parentId` INT DEFAULT NULL,
        PRIMARY KEY (`id`),
        UNIQUE KEY `idx_category_name` (`name`),
        KEY `idx_category_parent` (`parentId`),
        CONSTRAINT `fk_category_parent` FOREIGN KEY (`parentId`) REFERENCES `Category` (`id`) ON DELETE SET NULL
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

CREATE TABLE
    `Cart` (
        `id` INT NOT NULL AUTO_INCREMENT,
        `userId` INT NOT NULL,
        PRIMARY KEY (`id`),
        UNIQUE KEY `ux_cart_user` (`userId`),
        CONSTRAINT `fk_cart_user` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

CREATE TABLE
    `CartItem` (
        `id` INT NOT NULL AUTO_INCREMENT,
        `cartId` INT NOT NULL,
        `productId` INT NOT NULL,
        `quantity` INT NOT NULL,
        PRIMARY KEY (`id`),
        KEY `idx_cartitem_cart` (`cartId`),
        KEY `idx_cartitem_product` (`productId`),
        CONSTRAINT `fk_cartitem_cart` FOREIGN KEY (`cartId`) REFERENCES `Cart` (`id`) ON DELETE CASCADE,
        CONSTRAINT `fk_cartitem_product` FOREIGN KEY (`productId`) REFERENCES `Product` (`id`) ON DELETE CASCADE
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

CREATE TABLE
    `Order` (
        `id` INT NOT NULL AUTO_INCREMENT,
        `userId` INT NOT NULL,
        `totalAmount` DOUBLE NOT NULL,
        `status` ENUM ('pending', 'paid', 'shipped') NOT NULL DEFAULT 'pending',
        `shippingAddressId` INT NOT NULL,
        `billingAddressId` INT NOT NULL,
        `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        KEY `idx_order_user` (`userId`),
        KEY `idx_order_ship_addr` (`shippingAddressId`),
        KEY `idx_order_bill_addr` (`billingAddressId`),
        CONSTRAINT `fk_order_user` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE,
        CONSTRAINT `fk_order_ship_addr` FOREIGN KEY (`shippingAddressId`) REFERENCES `Address` (`id`) ON DELETE RESTRICT,
        CONSTRAINT `fk_order_bill_addr` FOREIGN KEY (`billingAddressId`) REFERENCES `Address` (`id`) ON DELETE RESTRICT
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;