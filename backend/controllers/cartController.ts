import { Request, Response } from "express";
import * as CartModel from "../models/cartModel";
import * as ProductModel from "../models/productModel";
import { validationResult } from "express-validator";
import { UserOutput } from "../models/userModel";

interface AuthenticatedRequest extends Request {
    user?: UserOutput;
}

export async function getCartHandler(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    try {
        const cart = await CartModel.getCartWithItemsByUserId(userId);
        if (!cart) {
            // If no cart, we can either return 404 or an empty cart structure
            // Depending on frontend expectations. Let's create one.
            const newCart = await CartModel.getOrCreateCartWithItems(userId);
            res.status(200).json(newCart);
            return;
        }
        res.status(200).json(cart);
    } catch (error) {
        console.error("[cartController.ts] Error in getCartHandler:", error);
        res.status(500).json({ message: "Failed to retrieve cart." });
    }
}

export async function addItemToCartHandler(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    const { productId, quantity } = req.body;

    try {
        // Check if the product exists before adding to cart
        const product = await ProductModel.findProductById(productId);
        if (!product) {
            res.status(404).json({ message: `Product with ID ${productId} not found.` });
            return;
        }

        // Check if requested quantity exceeds available stock
        if (quantity > product.stock) {
            res.status(400).json({
                message: `Cannot add ${quantity} items. Only ${product.stock} are in stock.`,
            });
            return;
        }

        const cart = await CartModel.getOrCreateCartWithItems(userId);
        const addedItem = await CartModel.addItemToCart(cart.id, productId, quantity);
        res.status(201).json(addedItem);
    } catch (error) {
        console.error("[cartController.ts] Error in addItemToCartHandler:", error);
        res.status(500).json({ message: "Failed to add item to cart." });
    }
}

export async function updateCartItemHandler(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    const cartItemId = parseInt(req.params.itemId, 10);
    const { quantity } = req.body;

    try {
        // Ensure the item belongs to the user's cart
        const cart = await CartModel.findCartByUserId(userId);
        if (!cart) {
            res.status(404).json({ message: "Cart not found." });
            return;
        }

        const item = await CartModel.findCartItemById(cartItemId);
        if (!item || item.cartId !== cart.id) {
            res.status(404).json({
                message: "Cart item not found or does not belong to user.",
            });
            return;
        }

        // Check product stock before updating quantity
        const product = await ProductModel.findProductById(item.productId);
        if (!product) {
            // This case is unlikely if data is consistent but good for safety
            res.status(404).json({
                message: `Associated product with ID ${item.productId} not found.`,
            });
            return;
        }

        if (quantity > product.stock) {
            res.status(400).json({
                message: `Cannot update to ${quantity} items. Only ${product.stock} are in stock.`,
            });
            return;
        }

        if (quantity <= 0) {
            await CartModel.deleteCartItem(cartItemId);
            res.status(200).json({ message: "Item removed from cart." });
        } else {
            const updatedItem = await CartModel.updateCartItem(cartItemId, { quantity });
            res.status(200).json(updatedItem);
        }
    } catch (error) {
        console.error("[cartController.ts] Error in updateCartItemHandler:", error);
        res.status(500).json({ message: "Failed to update cart item." });
    }
}

export async function removeCartItemHandler(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    const cartItemId = parseInt(req.params.itemId, 10);

    try {
        // Ensure the item belongs to the user's cart for security
        const cart = await CartModel.findCartByUserId(userId);
        if (!cart) {
            res.status(404).json({ message: "Cart not found." });
            return;
        }

        const item = await CartModel.findCartItemById(cartItemId);
        if (!item || item.cartId !== cart.id) {
            res.status(404).json({
                message: "Cart item not found or does not belong to user.",
            });
            return;
        }

        await CartModel.deleteCartItem(cartItemId);
        res.status(200).json({ message: "Item removed from cart successfully." });
    } catch (error) {
        console.error("[cartController.ts] Error in removeCartItemHandler:", error);
        res.status(500).json({ message: "Failed to remove item from cart." });
    }
}

export async function clearCartHandler(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    try {
        const cart = await CartModel.findCartByUserId(userId);
        if (cart) {
            await CartModel.clearCart(cart.id);
        }
        // If no cart, it's already "clear", so we don't need to error.
        res.status(200).json({ message: "Cart cleared successfully." });
    } catch (error) {
        console.error("[cartController.ts] Error in clearCartHandler:", error);
        res.status(500).json({ message: "Failed to clear cart." });
    }
}
