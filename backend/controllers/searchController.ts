import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { searchProductsInPinecone } from "../utils/pineconeService";
import * as ProductModel from "../models/productModel";

/**
 * Search for products using text query
 */
export async function searchProductsHandler(req: Request, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { query, limit = 10 } = req.body;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
        res.status(400).json({
            message: "Search query is required and must be a non-empty string",
        });
        return;
    }

    const topK = Math.min(Math.max(parseInt(limit as string) || 10, 1), 50); // Limit between 1 and 50

    try {
        // Search in Pinecone to get product IDs
        const productIds = await searchProductsInPinecone(query.trim(), topK);

        if (productIds.length === 0) {
            res.status(200).json({ products: [], total: 0 });
            return;
        }

        // Fetch full product data from database using the IDs
        const products = [];
        for (const productId of productIds) {
            try {
                const product = await ProductModel.findProductById(
                    parseInt(productId, 10)
                ); // Convert ID to number
                if (product) {
                    products.push(product);
                }
            } catch (error) {
                console.error(
                    `[searchController] Error fetching product ${productId}:`,
                    error
                );
                // Continue with other products even if one fails
            }
        }

        res.status(200).json(products);
    } catch (error) {
        console.error("[searchController] Error in searchProductsHandler:", error);
        res.status(500).json({ message: "Failed to search products." });
    }
}
