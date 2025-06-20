import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import * as ProductController from "../controllers/productController";
import {
    createProductValidator,
    productIdValidator,
    updateProductValidator,
} from "../libs/productsValidation";

import multer from "multer";
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const productRouter = express.Router();

// GET /products/myproducts - Get all products for stores owned by the authenticated vendor
productRouter.get("/myproducts", authMiddleware, ProductController.getMyProductsHandler);

// GET /products - Get all products (public route)
// Changed from getAllPublishedProductsHandler to getAllProductsHandler
productRouter.get("/", ProductController.getAllProductsHandler);

productRouter.post(
    "/",
    authMiddleware, // Authenticate user
    upload.array("images", 10), // Middleware for handling multiple image uploads from field 'images', max 10
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
    authMiddleware, // Authenticate user
    upload.array("images", 10), // For optional multiple image update, max 10
    updateProductValidator, // Validates other fields and :productId
    ProductController.updateProductHandler
);

// DELETE /products/:productId - Delete a specific product by ID
productRouter.delete(
    "/:productId", // Changed from :id to :productId
    authMiddleware, // Authenticate user
    productIdValidator, // Validates :productId
    ProductController.deleteProductHandler
);

export default productRouter;
