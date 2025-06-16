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