import { body } from "express-validator";

export const searchValidator = [
    body("query")
        .trim()
        .isLength({ min: 1, max: 500 })
        .withMessage("Search query must be between 1 and 500 characters"),
    body("limit")
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage("Limit must be an integer between 1 and 50"),
]; 