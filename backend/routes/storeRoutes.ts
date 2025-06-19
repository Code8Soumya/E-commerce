import express, { Request, Response } from "express";
import {
    createStoreValidator,
    storeIdValidator,
    updateStoreValidator,
} from "../libs/storesValidation";
import * as StoreController from "../controllers/storeController";
import * as ProductController from "../controllers/productController"; // Import ProductController
import { validationResult } from "express-validator"; // Keep for /:id/products route

const storeRouter = express.Router();

// POST /stores - Create a new store
storeRouter.post(
    "/",
    createStoreValidator,
    StoreController.createStoreHandler
);

// GET /stores - Get all stores for the authenticated user
storeRouter.get(
    "/",
    StoreController.getAllStoresHandler
);

// GET /stores/:id/products - Get all products for a specific store
// This route remains as it's specific to products and uses Prisma directly.
// It also has its own validation result handling (though this will now be in ProductController).
storeRouter.get(
    "/:id/products", // Corresponds to getProductsByStoreIdHandler which expects req.params.id
    storeIdValidator, // Validates :id param (which is storeId for this route)
    ProductController.getProductsByStoreIdHandler
);

// GET /stores/:id - Get a specific store by ID
storeRouter.get(
    "/:id",
    storeIdValidator,
    StoreController.getStoreByIdHandler
);

// PUT /stores/:id - Update a specific store by ID
storeRouter.put(
    "/:id",
    storeIdValidator, // Ensures ID is present and valid
    updateStoreValidator, // Validates body content for update
    StoreController.updateStoreHandler
);

// DELETE /stores/:id - Delete a specific store by ID
storeRouter.delete(
    "/:id",
    storeIdValidator,
    StoreController.deleteStoreHandler
);

export default storeRouter;
