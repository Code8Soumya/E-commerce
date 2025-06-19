import express from "express";
import { vendorChecker } from "../middlewares/vendorChecker";
import * as ProductController from "../controllers/productController";
import {
    createProductValidator,
    productIdValidator,
    updateProductValidator,
    // We might need more specific validators or adjust existing ones
    // e.g., for query params if any, or for published products route.
    // For now, using existing ones where applicable.
} from "../libs/productsValidation"; // Assuming this path is correct and validators are suitable

// Multer setup for image uploads
import multer from "multer";
const storage = multer.memoryStorage(); // Stores files in memory as Buffer objects
const upload = multer({ storage: storage });

const productRouter = express.Router();

// GET /products/myproducts - Get all products for stores owned by the authenticated vendor
productRouter.get(
    "/myproducts",
    vendorChecker, // Ensures user is a vendor
    ProductController.getMyProductsHandler
);

// GET /products - Get all published products (public route)
productRouter.get(
    "/",
    ProductController.getAllPublishedProductsHandler
);

// GET /products/category/:categoryId - Get products by category ID
// Assuming a route like this might be useful.
// Needs a validator for categoryId if we add it.
// For now, this is a placeholder if you want to add it.
// productRouter.get("/category/:categoryId", ProductController.getProductsByCategoryIdHandler);


// POST /products - Create a new product
productRouter.post(
    "/",
    vendorChecker,
    upload.single("image"), // Middleware for handling single image upload from field 'image'
    createProductValidator, // Validates other product fields
    ProductController.createProductHandler
);

// GET /products/:productId - Get a specific product by ID
productRouter.get(
    "/:productId", // Changed from :id to :productId to match controller
    productIdValidator, // Validates :productId
    ProductController.getProductByIdHandler
);

// PUT /products/:productId - Update a specific product by ID
productRouter.put(
    "/:productId", // Changed from :id to :productId
    vendorChecker,
    upload.single("image"), // For optional image update
    updateProductValidator, // Validates other fields and :productId
    ProductController.updateProductHandler
);

// DELETE /products/:productId - Delete a specific product by ID
productRouter.delete(
    "/:productId", // Changed from :id to :productId
    vendorChecker,
    productIdValidator, // Validates :productId
    ProductController.deleteProductHandler
);

export default productRouter;
