import { body, param } from "express-validator";

export const createStoreValidator = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Store name is required")
        .matches(/^[^<>]+$/)
        .withMessage("Email must not contain HTML tags"),

    body("description")
        .optional()
        .matches(/^[^<>]+$/)
        .withMessage("Description must not contain HTML tags"),

    body("stripeAccountId")
        .optional()
        .isString()
        .withMessage("Stripe Account ID must be a string")
        .trim()
        .matches(/^[^<>]*$/)
        .withMessage("Stripe Account ID must not contain HTML tags"),
];

export const storeIdValidator = [
    param("id")
        .trim()
        .notEmpty()
        .withMessage("Store ID is required")
        .isInt({ min: 1 })
        .withMessage("Store ID must be a valid integer"),
];

export const updateStoreValidator = [
    param("id")
        .trim()
        .notEmpty()
        .withMessage("Store ID is required")
        .isInt({ min: 1 })
        .withMessage("Store ID must be a valid integer"),

    body("name")
        .optional()
        .matches(/^[^<>]+$/)
        .withMessage("Name must not contain HTML tags"),

    body("description")
        .optional()
        .matches(/^[^<>]+$/)
        .withMessage("Description must not contain HTML tags"),

    body("stripeAccountId")
        .optional()
        .isString()
        .withMessage("Stripe Account ID must be a string")
        .trim()
        .matches(/^[^<>]*$/)
        .withMessage("Stripe Account ID must not contain HTML tags"),
];
