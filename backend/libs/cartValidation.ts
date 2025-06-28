import { body, param } from "express-validator";

export const addCartItemValidator = [
    body("productId")
        .trim()
        .notEmpty()
        .withMessage("Product ID is required")
        .isInt()
        .withMessage("Product ID must be a valid integer")
        .toInt(),

    body("quantity")
        .trim()
        .notEmpty()
        .withMessage("Quantity is required")
        .isInt({ min: 1 })
        .withMessage("Quantity must be at least 1")
        .isInt({ max: 200 })
        .withMessage("Quantity cannot exceed 100")
        .toInt(),
];

export const updateCartItemValidator = [
    param("itemId")
        .trim()
        .notEmpty()
        .withMessage("Item ID is required")
        .isInt()
        .withMessage("Item ID must be a valid integer")
        .toInt(),

    body("quantity")
        .trim()
        .notEmpty()
        .withMessage("Quantity is required")
        .isInt({ min: 1 })
        .withMessage("Quantity must be at least 1")
        .toInt(),
];

export const cartItemIdValidator = [
    param("itemId")
        .trim()
        .notEmpty()
        .withMessage("Item ID is required")
        .isInt()
        .withMessage("Item ID must be a valid integer")
        .toInt(),
];
