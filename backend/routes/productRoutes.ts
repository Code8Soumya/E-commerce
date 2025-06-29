import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import * as ProductController from "../controllers/productController";
import * as AIController from "../controllers/aiController";
import * as SearchController from "../controllers/searchController";
import {
    createProductValidator,
    productIdValidator,
    updateProductValidator,
} from "../libs/productsValidation";
import { searchValidator } from "../libs/searchValidation";

import multer from "multer";
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const productRouter = express.Router();

// GET /products/myproducts - Get all products for stores owned by the authenticated vendor
productRouter.get("/myproducts", authMiddleware, ProductController.getMyProductsHandler);

// GET /products - Get all products (public route)
productRouter.get("/", ProductController.getAllProductsHandler);

// POST /products/search - Search products using vector search
productRouter.post("/search", searchValidator, SearchController.searchProductsHandler);

// POST /products - Create a new product
productRouter.post(
    "/",
    authMiddleware,
    upload.array("images", 10),
    createProductValidator,
    ProductController.createProductHandler
);

// GET /products/:productId - Get a specific product by ID
productRouter.get(
    "/:productId",
    productIdValidator,
    ProductController.getProductByIdHandler
);

// PUT /products/:productId - Update a specific product by ID
productRouter.put(
    "/:productId",
    authMiddleware,
    upload.array("images", 10),
    updateProductValidator,
    ProductController.updateProductHandler
);

// DELETE /products/:productId - Delete a specific product by ID
productRouter.delete(
    "/:productId",
    authMiddleware,
    productIdValidator,
    ProductController.deleteProductHandler
);

// POST /products/generate-title - Generate a title based on images
productRouter.post(
    "/generate-title",
    authMiddleware,
    upload.array("images", 10),
    AIController.generateTitleHandler
);

// POST /products/generate-description - Generate a description based on images
productRouter.post(
    "/generate-description",
    authMiddleware,
    upload.array("images", 10),
    AIController.generateDescriptionHandler
);

export default productRouter;
