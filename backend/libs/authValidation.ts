import { body } from "express-validator";

export const registerValidator = [
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
