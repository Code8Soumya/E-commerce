import express from "express";
import {
    addCartItemValidator,
    cartItemIdValidator,
    updateCartItemValidator,
} from "../libs/cartValidation";
import { authMiddleware } from "../middlewares/authMiddleware";
import {
    getCartHandler,
    addItemToCartHandler,
    updateCartItemHandler,
    removeCartItemHandler,
    clearCartHandler,
} from "../controllers/cartController";

const cartRouter = express.Router();

// All cart routes should be protected
cartRouter.use(authMiddleware);

// --- Cart Level Operations ---

// GET /api/cart - Get the user's cart
cartRouter.get("/", getCartHandler);

// DELETE /api/cart - Clear all items from the user's cart
cartRouter.delete("/", clearCartHandler);

// --- Cart Item Level Operations ---

// POST /api/cart/items - Add an item to the cart
cartRouter.post("/items", addCartItemValidator, addItemToCartHandler);

// PUT /api/cart/items/:itemId - Update a specific item's quantity in the cart
cartRouter.put("/items/:itemId", updateCartItemValidator, updateCartItemHandler);

// DELETE /api/cart/items/:itemId - Remove a specific item from the cart
cartRouter.delete("/items/:itemId", cartItemIdValidator, removeCartItemHandler);

export default cartRouter;
