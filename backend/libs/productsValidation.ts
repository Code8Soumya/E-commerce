import { body, param } from "express-validator";

export const createProductValidator = [
    body("title")
        .trim()
        .notEmpty()
        .withMessage("Product title is required")
        .isLength({ min: 3, max: 1000 })
        .withMessage("Title must be between 3 and 1000 characters")
        .matches(/^[^<>]+$/)
        .withMessage("Title must not contain HTML tags"),

    body("description")
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 5000 })
        .withMessage("Description must not exceed 5000 characters")
        .matches(/^[^<>]*$/)
        .withMessage("Description must not contain HTML tags"),

    body("price")
        .notEmpty()
        .withMessage("Price is required")
        .isFloat({ gt: 0 })
        .withMessage("Price must be a number greater than 0")
        .isDecimal({ decimal_digits: "2" })
        .withMessage("Price must have exactly two digits after the decimal"),

    body("stock")
        .notEmpty()
        .withMessage("Stock is required")
        .isInt({ min: 1, max: 10000 })
        .withMessage("Stock must be an integer between 1 and 10000"),
];

export const productIdValidator = [
    param("productId")
        .trim()
        .notEmpty()
        .withMessage("Product ID is required")
        .isInt({ min: 1 })
        .withMessage("Product ID must be a valid integer"),
];

export const updateProductValidator = [
    param("productId")
        .trim()
        .notEmpty()
        .withMessage("Product ID is required")
        .isInt({ min: 1 })
        .withMessage("Product ID must be a valid integer"),

    body("title")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Title must not be empty if provided")
        .isLength({ min: 3, max: 1000 })
        .withMessage("Title must be between 3 and 1000 characters")
        .matches(/^[^<>]+$/)
        .withMessage("Title must not contain HTML tags"),

    body("description")
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 5000 })
        .withMessage("Description must not exceed 5000 characters")
        .matches(/^[^<>]*$/)
        .withMessage("Description must not contain HTML tags"),

    body("price")
        .optional()
        .isFloat({ gt: 0 })
        .withMessage("Price must be a number greater than 0 if provided")
        .isDecimal({ decimal_digits: "2" })
        .withMessage("Price must have exactly two digits after the decimal"),

    body("stock")
        .optional()
        .isInt({ min: 1, max: 10000 })
        .withMessage("Stock must be an integer between 1 and 10000"),
];
