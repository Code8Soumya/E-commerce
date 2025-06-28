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
    `Product` (
        `id` INT NOT NULL AUTO_INCREMENT,
        `title` VARCHAR(1000) NOT NULL,
        `description` TEXT,
        `price` DOUBLE NOT NULL,
        `stock` INT NOT NULL,
        `ownerId` INT NOT NULL,
        `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        KEY `idx_product_owner` (`ownerId`),
        CONSTRAINT `fk_product_owner` FOREIGN KEY (`ownerId`) REFERENCES `User` (`id`) ON DELETE CASCADE
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

CREATE TABLE
    `ProductImage` (
        `id` INT NOT NULL AUTO_INCREMENT,
        `productId` INT NOT NULL,
        `imageData` LONGBLOB NOT NULL,
        `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        KEY `idx_productimage_product` (`productId`),
        CONSTRAINT `fk_productimage_product` FOREIGN KEY (`productId`) REFERENCES `Product` (`id`) ON DELETE CASCADE
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