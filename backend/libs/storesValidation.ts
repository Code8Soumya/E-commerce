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
        .matches(/^[^<>]*$/) // Allow empty string if optional, but no HTML tags
        .withMessage("Stripe Account ID must not contain HTML tags"),
];

export const storeIdValidator = [
    param("id")
        .trim()
        .notEmpty()
        .withMessage("Store id is required")
        .matches(/^[^<>]+$/)
        .withMessage("Store id must not contain HTML tags"),
];

export const updateStoreValidator = [
    param("id").trim().notEmpty().withMessage("Store id is required"),
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
        .matches(/^[^<>]*$/) // Allow empty string if optional, but no HTML tags
        .withMessage("Stripe Account ID must not contain HTML tags"),
];
