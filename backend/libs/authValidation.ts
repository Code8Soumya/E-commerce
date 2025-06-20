import { body } from "express-validator";

export const registerValidator = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Name is required")
        .isString()
        .withMessage("Name must be a string")
        .isLength({ min: 2 })
        .withMessage("Name must be at least 2 characters long")
        .matches(/^[^<>]+$/)
        .withMessage("Name must not contain HTML tags"),

    body("email")
        .trim()
        .isEmail()
        .withMessage("Invalid email address")
        .matches(/^[^<>]+$/)
        .withMessage("Email must not contain HTML tags"),

    body("password")
        .trim()
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters long")
        .matches(/^[^<>]+$/)
        .withMessage("Password must not contain HTML tags"),
];

export const loginValidator = [
    body("email").trim().isEmail().withMessage("Invalid email address"),

    body("password").trim().notEmpty().withMessage("Password is required"),
];

export const updateProfileValidator = [
    body("name")
        .optional()
        .trim()
        .isString()
        .withMessage("Name must be a string")
        .isLength({ min: 2 })
        .withMessage("Name must be at least 2 characters long")
        .matches(/^[^<>]+$/)
        .withMessage("Name must not contain HTML tags"),

    body("email")
        .optional()
        .trim()
        .isEmail()
        .withMessage("Invalid email address")
        .matches(/^[^<>]+$/)
        .withMessage("Email must not contain HTML tags"),

    body("password")
        .optional()
        .trim()
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters long")
        .matches(/^[^<>]+$/)
        .withMessage("Password must not contain HTML tags"),
];
