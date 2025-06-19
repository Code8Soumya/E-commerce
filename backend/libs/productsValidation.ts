import { body, param } from "express-validator";

export const createProductValidator = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Product title is required")
    .matches(/^[^<>]+$/)
    .withMessage("Title must not contain HTML tags"),

  body("description")
    .optional()
    .trim()
    .matches(/^[^<>]*$/)
    .withMessage("Description must not contain HTML tags"),

  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isFloat({ gt: 0 })
    .withMessage("Price must be a number greater than 0"),

  body("stock")
    .notEmpty()
    .withMessage("Stock is required")
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),

  // body("imageUrl") // Removed as we are handling file uploads
  //   .notEmpty()
  //   .withMessage("Image URL is required")
  //   .isURL()
  //   .withMessage("Image URL must be a valid URL"),

  body("storeId")
    .trim()
    .notEmpty()
    .withMessage("Store ID is required")
    .isInt({ min: 1 }) // Changed to isInt
    .withMessage("Store ID must be a valid integer"),

  body("categoryId")
    .optional({ nullable: true }) // Allow null or undefined
    .trim()
    .isInt({ min: 1 }) // Changed to isInt
    .withMessage("Category ID must be a valid integer"),
  
  body("isPublished") // Added for completeness, though not in CreateProductInput directly
    .optional()
    .isBoolean()
    .withMessage("isPublished must be a boolean"),
];

export const productIdValidator = [
  param("productId") // Changed from "id" to "productId"
    .trim()
    .notEmpty()
    .withMessage("Product ID is required")
    .isInt({ min: 1 }) // Changed to isInt
    .withMessage("Product ID must be a valid integer"),
];

export const updateProductValidator = [
  param("productId") // Added productId validation
    .trim()
    .notEmpty()
    .withMessage("Product ID is required")
    .isInt({ min: 1 })
    .withMessage("Product ID must be a valid integer"),
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Title must not be empty")
    .matches(/^[^<>]+$/)
    .withMessage("Title must not contain HTML tags"),

  body("description")
    .optional()
    .trim()
    .matches(/^[^<>]*$/)
    .withMessage("Description must not contain HTML tags"),

  body("price")
    .optional()
    .isFloat({ gt: 0 })
    .withMessage("Price must be a number greater than 0"),

  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),

  // body("imageUrl") // Removed as we are handling file uploads
  //   .optional()
  //   .isURL()
  //   .withMessage("Image URL must be a valid URL"),

  body("isPublished")
    .optional()
    .isBoolean()
    .withMessage("isPublished must be a boolean"),

  body("categoryId")
    .optional({ nullable: true }) // Allow null or undefined
    .trim()
    .isInt({ min: 1 }) // Changed to isInt
    .withMessage("Category ID must be a valid integer when provided"),
];
