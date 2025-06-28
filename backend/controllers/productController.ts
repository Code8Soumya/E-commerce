import { Request, Response } from "express";
import * as ProductModel from "../models/productModel";
import { validationResult } from "express-validator";
import { UserOutput } from "../models/userModel"; // For req.user type

// Extend Express Request type to include 'user' and 'files'
// Make 'files' compatible with the general Express.Request.files type
interface AuthenticatedRequest extends Request {
    user?: UserOutput; // User object from authMiddleware
    // files type from express.Request is: { [fieldname: string]: Express.Multer.File[]; } | Express.Multer.File[] | undefined;
    // We primarily expect Express.Multer.File[] when using upload.array()
}
// When using req.files in handlers, cast to Express.Multer.File[] if upload.array() was used.

/**
 * Creates a new product for the authenticated user.
 */
export async function createProductHandler(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const ownerId = req.user?.id;
    if (!ownerId) {
        res.status(401).json({ message: "Unauthorized - User ID not found" });
        return;
    }

    const { title, description, price, stock } = req.body;

    // req.files will be an array of files if using upload.array()
    const imagesData: Buffer[] = [];
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        for (const file of req.files) {
            // No need to cast if Array.isArray is true
            imagesData.push(file.buffer);
        }
    } else {
        // Handle case where no images are uploaded, if images are optional.
        // If at least one image is mandatory, return a 400 error here.
        // For now, assuming images are optional or handled by validation.
        // If you require images:
        // res.status(400).json({ message: "At least one product image is required." });
        // return;
    }

    try {
        const productData: ProductModel.CreateProductInput = {
            ownerId,
            title,
            description: description ?? null,
            price: parseFloat(price),
            stock: parseInt(stock, 10),
            imagesData, // Use the array of buffers
        };
        const newProduct = await ProductModel.createProduct(productData);
        res.status(201).json(newProduct);
    } catch (error) {
        console.error("[productController.ts] Error in createProductHandler:", error);
        if (
            error instanceof Error &&
            error.message.startsWith("Could not create product:")
        ) {
            res.status(400).json({ message: error.message });
        } else {
            res.status(500).json({ message: "Failed to create product." });
        }
    }
}

/**
 * Retrieves a product by its ID.
 */
export async function getProductByIdHandler(req: Request, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const productId = parseInt(req.params.productId, 10);

    try {
        const product = await ProductModel.findProductById(productId);
        if (!product) {
            res.status(404).json({ message: `Product with ID ${productId} not found.` });
            return;
        }
        res.status(200).json(product);
    } catch (error) {
        console.error(
            `[productController.ts] Error in getProductByIdHandler for ID ${productId}:`,
            error
        );
        res.status(500).json({ message: "Failed to retrieve product." });
    }
}

/**
 * Retrieves all products.
 */
export async function getAllProductsHandler(req: Request, res: Response): Promise<void> {
    try {
        const products = await ProductModel.findAllProducts();
        res.status(200).json(products);
    } catch (error) {
        console.error("[productController.ts] Error in getAllProductsHandler:", error);
        res.status(500).json({ message: "Failed to retrieve products." });
    }
}

/**
 * Retrieves all products for the authenticated user.
 */
export async function getMyProductsHandler(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    const ownerId = req.user?.id;
    if (!ownerId) {
        res.status(401).json({ message: "Unauthorized - User ID not found" });
        return;
    }

    try {
        const products = await ProductModel.findProductsByOwnerId(ownerId);
        res.status(200).json(products);
    } catch (error) {
        console.error(
            `[productController.ts] Error in getMyProductsHandler for owner ${ownerId}:`,
            error
        );
        res.status(500).json({ message: "Failed to retrieve your products." });
    }
}

/**
 * Updates an existing product owned by the authenticated user.
 */
export async function updateProductHandler(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const productId = parseInt(req.params.productId, 10);
    const ownerId = req.user?.id;

    if (!ownerId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    const { title, description, price, stock } = req.body;
    const updates: ProductModel.UpdateProductInput = {};

    if (title !== undefined) updates.title = title;
    if (description !== undefined)
        updates.description = description === "" ? null : description;
    if (price !== undefined) updates.price = parseFloat(price);
    if (stock !== undefined) updates.stock = parseInt(stock, 10);

    const imagesData: Buffer[] = [];
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        for (const file of req.files) {
            // No need to cast
            imagesData.push(file.buffer);
        }
        updates.imagesData = imagesData; // Add new images data to updates
    } else if (
        req.body.clearImages === "true" ||
        (req.body.imagesData && JSON.parse(req.body.imagesData).length === 0)
    ) {
        // If a specific field indicates to clear images, or an empty imagesData array is explicitly passed
        updates.imagesData = []; // Set to empty array to signify deleting all existing images
    }
    // If req.files is empty and no clearImages flag, images are not being updated.

    if (Object.keys(updates).length === 0) {
        try {
            const existingProduct = await ProductModel.findProductById(productId);
            if (!existingProduct || existingProduct.ownerId !== ownerId) {
                res.status(404).json({
                    message: `Product with ID ${productId} not found or not owned by user.`,
                });
                return;
            }
            res.status(200).json(existingProduct);
        } catch (error) {
            res.status(500).json({ message: "Failed to retrieve product." });
        }
        return;
    }

    try {
        const updatedProduct = await ProductModel.updateProduct(
            productId,
            ownerId,
            updates
        );
        res.status(200).json(updatedProduct);
    } catch (error) {
        console.error(
            `[productController.ts] Error in updateProductHandler for ID ${productId}:`,
            error
        );
        if (error instanceof Error) {
            if (error.message.includes("not found")) {
                res.status(404).json({ message: error.message });
            } else if (error.message.includes("User does not own product")) {
                res.status(403).json({ message: error.message });
            } else if (
                error.message.startsWith("Could not complete product update") ||
                error.message.startsWith("Could not update product:")
            ) {
                res.status(400).json({ message: error.message });
            } else {
                res.status(500).json({ message: "Failed to update product." });
            }
        } else {
            res.status(500).json({
                message: "An unexpected error occurred during product update.",
            });
        }
    }
}

/**
 * Deletes a product owned by the authenticated user.
 */
export async function deleteProductHandler(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const productId = parseInt(req.params.productId, 10);
    const ownerId = req.user?.id;

    if (!ownerId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    try {
        await ProductModel.deleteProduct(productId, ownerId);
        res.status(200).json({
            message: `Product with ID ${productId} deleted successfully.`,
        });
    } catch (error) {
        console.error(
            `[productController.ts] Error in deleteProductHandler for ID ${productId}:`,
            error
        );
        if (error instanceof Error) {
            if (error.message.includes("not found")) {
                res.status(404).json({ message: error.message });
            } else if (error.message.includes("User does not own product")) {
                res.status(403).json({ message: error.message });
            } else {
                res.status(500).json({ message: "Failed to delete product." });
            }
        } else {
            res.status(500).json({
                message: "An unexpected error occurred during product deletion.",
            });
        }
    }
}
