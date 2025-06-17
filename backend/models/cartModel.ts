import pool from "../config/db";
import { RowDataPacket, ResultSetHeader, PoolConnection } from "mysql2/promise";

// #region Cart Entity
// ======================================================================================
// Cart Interfaces & Types
// ======================================================================================

/**
 * Represents a Cart in the system.
 */
export interface Cart {
    id: number;
    userId: number;
}

/**
 * Input for creating a new Cart.
 */
export interface CreateCartInput {
    userId: number;
}

/**
 * Input for updating an existing Cart.
 * Only 'userId' can be updated, though this is generally not a common operation for a cart.
 */
export type UpdateCartInput = Partial<Pick<Cart, "userId">>;

// ======================================================================================
// Cart Helper Function
// ======================================================================================

/**
 * Maps a RowDataPacket to a Cart object.
 * @param {RowDataPacket} row - The raw row data from the database.
 * @returns {Cart} The mapped Cart object.
 */
const mapRowToCart = (row: RowDataPacket): Cart => ({
    id: row.id,
    userId: row.userId,
});

// ======================================================================================
// Cart CRUD Functions
// ======================================================================================

/**
 * Creates a new cart.
 * @param {CreateCartInput} data - The data for the new cart.
 * @param {PoolConnection} [internalConnection] - Optional connection for transactions.
 * @returns {Promise<Cart>} The created cart.
 * @throws {Error} If the cart could not be created.
 */
export const createCart = async (
    data: CreateCartInput,
    internalConnection?: PoolConnection
): Promise<Cart> => {
    const connection = internalConnection || (await pool.getConnection());
    try {
        if (!internalConnection) await connection.beginTransaction();

        const [result] = await connection.execute<ResultSetHeader>(
            "INSERT INTO `Cart` (userId) VALUES (?)",
            [data.userId]
        );

        if (result.insertId) {
            const newCart = await findCartById(result.insertId, connection);
            if (!newCart) {
                throw new Error("Failed to retrieve newly created cart.");
            }
            if (!internalConnection) await connection.commit();
            return newCart;
        } else {
            throw new Error("Cart creation failed, no insertId returned.");
        }
    } catch (error) {
        if (!internalConnection) await connection.rollback();
        console.error("[cartModel.ts] createCart: Error occurred.", error);
        throw new Error("Could not create cart.");
    } finally {
        if (!internalConnection) connection.release();
    }
};

/**
 * Finds a cart by its ID.
 * @param {number} id - The ID of the cart.
 * @param {PoolConnection} [internalConnection] - Optional connection for transactions.
 * @returns {Promise<Cart | null>} The cart object or null if not found.
 * @throws {Error} If there's an issue fetching the cart.
 */
export const findCartById = async (
    id: number,
    internalConnection?: PoolConnection
): Promise<Cart | null> => {
    const connection = internalConnection || (await pool.getConnection());
    try {
        const [rows] = await connection.execute<RowDataPacket[]>(
            "SELECT * FROM `Cart` WHERE id = ?",
            [id]
        );
        if (rows.length > 0) {
            return mapRowToCart(rows[0]);
        }
        return null;
    } catch (error) {
        console.error(
            `[cartModel.ts] findCartById: Error fetching cart with id ${id}.`,
            error
        );
        throw new Error("Could not fetch cart.");
    } finally {
        if (!internalConnection) connection.release();
    }
};

/**
 * Finds a cart by user ID.
 * @param {number} userId - The ID of the user.
 * @param {PoolConnection} [internalConnection] - Optional connection for transactions.
 * @returns {Promise<Cart | null>} The cart object or null if not found.
 * @throws {Error} If there's an issue fetching the cart.
 */
export const findCartByUserId = async (
    userId: number,
    internalConnection?: PoolConnection
): Promise<Cart | null> => {
    const connection = internalConnection || (await pool.getConnection());
    try {
        const [rows] = await connection.execute<RowDataPacket[]>(
            "SELECT * FROM `Cart` WHERE userId = ?",
            [userId]
        );
        if (rows.length > 0) {
            return mapRowToCart(rows[0]);
        }
        return null;
    } catch (error) {
        console.error(
            `[cartModel.ts] findCartByUserId: Error fetching cart for user ${userId}.`,
            error
        );
        throw new Error("Could not fetch cart by user ID.");
    } finally {
        if (!internalConnection) connection.release();
    }
};

/**
 * Updates an existing cart.
 * @param {number} id - The ID of the cart to update.
 * @param {UpdateCartInput} updates - The updates to apply.
 * @returns {Promise<Cart>} The updated cart.
 * @throws {Error} If the cart could not be updated or not found.
 */
export const updateCart = async (id: number, updates: UpdateCartInput): Promise<Cart> => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const validUpdateFields = Object.keys(updates).filter(
            (key) => updates[key as keyof UpdateCartInput] !== undefined
        );
        if (validUpdateFields.length === 0) {
            const currentCart = await findCartById(id, connection);
            if (!currentCart) throw new Error(`Cart with ID ${id} not found.`);
            await connection.commit(); // Commit as no update was made but cart exists
            return currentCart;
        }

        const setClauses = validUpdateFields
            .map((field) => `\`${field}\` = ?`)
            .join(", ");
        const values = validUpdateFields.map(
            (field) => updates[field as keyof UpdateCartInput]
        );

        const [result] = await connection.execute<ResultSetHeader>(
            `UPDATE \`Cart\` SET ${setClauses} WHERE id = ?`,
            [...values, id]
        );

        if (result.affectedRows === 0) {
            // Check if cart exists, if not, it's a "not found" error.
            // If it exists but no rows affected, it means data was same.
            const existingCart = await findCartById(id, connection);
            if (!existingCart) {
                throw new Error(`Cart with ID ${id} not found for update.`);
            }
        }

        const updatedCart = await findCartById(id, connection);
        if (!updatedCart) {
            throw new Error("Failed to retrieve cart after update.");
        }
        await connection.commit();
        return updatedCart;
    } catch (error) {
        await connection.rollback();
        console.error(
            `[cartModel.ts] updateCart: Error updating cart with id ${id}.`,
            error
        );
        throw new Error("Could not update cart.");
    } finally {
        connection.release();
    }
};

/**
 * Deletes a cart by its ID.
 * @param {number} id - The ID of the cart to delete.
 * @returns {Promise<void>}
 * @throws {Error} If the cart could not be deleted or not found.
 */
export const deleteCart = async (id: number): Promise<void> => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        // Related cart items are deleted by CASCADE constraint
        const [result] = await connection.execute<ResultSetHeader>(
            "DELETE FROM `Cart` WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            throw new Error(`Cart with ID ${id} not found for deletion.`);
        }
        await connection.commit();
    } catch (error) {
        await connection.rollback();
        console.error(
            `[cartModel.ts] deleteCart: Error deleting cart with id ${id}.`,
            error
        );
        throw new Error("Could not delete cart.");
    } finally {
        connection.release();
    }
};

// #endregion Cart Entity

// #region CartItem Entity
// ======================================================================================
// CartItem Interfaces & Types
// ======================================================================================

/**
 * Represents a CartItem in the system.
 */
export interface CartItem {
    id: number;
    cartId: number;
    productId: number;
    quantity: number;
}

/**
 * Input for creating a new CartItem.
 */
export interface CreateCartItemInput {
    cartId: number;
    productId: number;
    quantity: number;
}

/**
 * Input for updating an existing CartItem.
 * Typically, only 'quantity' is updatable.
 */
export type UpdateCartItemInput = Partial<Pick<CartItem, "quantity">>;

// ======================================================================================
// CartItem Helper Function
// ======================================================================================

/**
 * Maps a RowDataPacket to a CartItem object.
 * @param {RowDataPacket} row - The raw row data from the database.
 * @returns {CartItem} The mapped CartItem object.
 */
const mapRowToCartItem = (row: RowDataPacket): CartItem => ({
    id: row.id,
    cartId: row.cartId,
    productId: row.productId,
    quantity: row.quantity,
});

// ======================================================================================
// CartItem CRUD Functions
// ======================================================================================

/**
 * Creates a new cart item.
 * @param {CreateCartItemInput} data - The data for the new cart item.
 * @param {PoolConnection} [internalConnection] - Optional connection for transactions.
 * @returns {Promise<CartItem>} The created cart item.
 * @throws {Error} If the cart item could not be created.
 */
export const createCartItem = async (
    data: CreateCartItemInput,
    internalConnection?: PoolConnection
): Promise<CartItem> => {
    const connection = internalConnection || (await pool.getConnection());
    try {
        if (!internalConnection) await connection.beginTransaction();

        const [result] = await connection.execute<ResultSetHeader>(
            "INSERT INTO `CartItem` (cartId, productId, quantity) VALUES (?, ?, ?)",
            [data.cartId, data.productId, data.quantity]
        );

        if (result.insertId) {
            const newItem = await findCartItemById(result.insertId, connection);
            if (!newItem) {
                throw new Error("Failed to retrieve newly created cart item.");
            }
            if (!internalConnection) await connection.commit();
            return newItem;
        } else {
            throw new Error("Cart item creation failed, no insertId returned.");
        }
    } catch (error) {
        if (!internalConnection) await connection.rollback();
        console.error("[cartModel.ts] createCartItem: Error occurred.", error);
        throw new Error("Could not create cart item.");
    } finally {
        if (!internalConnection) connection.release();
    }
};

/**
 * Finds a cart item by its ID.
 * @param {number} id - The ID of the cart item.
 * @param {PoolConnection} [internalConnection] - Optional connection for transactions.
 * @returns {Promise<CartItem | null>} The cart item object or null if not found.
 * @throws {Error} If there's an issue fetching the cart item.
 */
export const findCartItemById = async (
    id: number,
    internalConnection?: PoolConnection
): Promise<CartItem | null> => {
    const connection = internalConnection || (await pool.getConnection());
    try {
        const [rows] = await connection.execute<RowDataPacket[]>(
            "SELECT * FROM `CartItem` WHERE id = ?",
            [id]
        );
        if (rows.length > 0) {
            return mapRowToCartItem(rows[0]);
        }
        return null;
    } catch (error) {
        console.error(
            `[cartModel.ts] findCartItemById: Error fetching cart item with id ${id}.`,
            error
        );
        throw new Error("Could not fetch cart item.");
    } finally {
        if (!internalConnection) connection.release();
    }
};

/**
 * Finds all cart items for a given cart ID.
 * @param {number} cartId - The ID of the cart.
 * @param {PoolConnection} [internalConnection] - Optional connection for transactions.
 * @returns {Promise<CartItem[]>} An array of cart items.
 * @throws {Error} If there's an issue fetching cart items.
 */
export const findCartItemsByCartId = async (
    cartId: number,
    internalConnection?: PoolConnection
): Promise<CartItem[]> => {
    const connection = internalConnection || (await pool.getConnection());
    try {
        const [rows] = await connection.execute<RowDataPacket[]>(
            "SELECT * FROM `CartItem` WHERE cartId = ?",
            [cartId]
        );
        return rows.map(mapRowToCartItem);
    } catch (error) {
        console.error(
            `[cartModel.ts] findCartItemsByCartId: Error fetching items for cart ${cartId}.`,
            error
        );
        throw new Error("Could not fetch cart items.");
    } finally {
        if (!internalConnection) connection.release();
    }
};

/**
 * Finds a specific cart item by cart ID and product ID.
 * @param {number} cartId - The ID of the cart.
 * @param {number} productId - The ID of the product.
 * @param {PoolConnection} [internalConnection] - Optional connection for transactions.
 * @returns {Promise<CartItem | null>} The cart item or null if not found.
 * @throws {Error} If there's an issue fetching the cart item.
 */
export const findCartItemByCartIdAndProductId = async (
    cartId: number,
    productId: number,
    internalConnection?: PoolConnection
): Promise<CartItem | null> => {
    const connection = internalConnection || (await pool.getConnection());
    try {
        const [rows] = await connection.execute<RowDataPacket[]>(
            "SELECT * FROM `CartItem` WHERE cartId = ? AND productId = ?",
            [cartId, productId]
        );
        if (rows.length > 0) {
            return mapRowToCartItem(rows[0]);
        }
        return null;
    } catch (error) {
        console.error(
            `[cartModel.ts] findCartItemByCartIdAndProductId: Error fetching item for cart ${cartId}, product ${productId}.`,
            error
        );
        throw new Error("Could not fetch specific cart item.");
    } finally {
        if (!internalConnection) connection.release();
    }
};

/**
 * Updates an existing cart item.
 * @param {number} id - The ID of the cart item to update.
 * @param {UpdateCartItemInput} updates - The updates to apply (typically quantity).
 * @param {PoolConnection} [internalConnection] - Optional connection for transactions.
 * @returns {Promise<CartItem>} The updated cart item.
 * @throws {Error} If the cart item could not be updated or not found.
 */
export const updateCartItem = async (
    id: number,
    updates: UpdateCartItemInput,
    internalConnection?: PoolConnection
): Promise<CartItem> => {
    const connection = internalConnection || (await pool.getConnection());
    try {
        if (!internalConnection) await connection.beginTransaction();

        const validUpdateFields = (
            Object.keys(updates) as Array<keyof UpdateCartItemInput>
        ).filter((key) => updates[key] !== undefined);

        if (validUpdateFields.length === 0) {
            const currentItem = await findCartItemById(id, connection);
            if (!currentItem) throw new Error(`CartItem with ID ${id} not found.`);
            if (!internalConnection) await connection.commit();
            return currentItem;
        }

        const setClauses = validUpdateFields
            .map((field) => `\`${field}\` = ?`)
            .join(", ");
        const values = validUpdateFields.map(
            (field) => updates[field as keyof UpdateCartItemInput]
        );

        const [result] = await connection.execute<ResultSetHeader>(
            `UPDATE \`CartItem\` SET ${setClauses} WHERE id = ?`,
            [...values, id]
        );

        if (result.affectedRows === 0) {
            const existingItem = await findCartItemById(id, connection);
            if (!existingItem) {
                throw new Error(`CartItem with ID ${id} not found for update.`);
            }
        }

        const updatedItem = await findCartItemById(id, connection);
        if (!updatedItem) {
            throw new Error("Failed to retrieve cart item after update.");
        }
        if (!internalConnection) await connection.commit();
        return updatedItem;
    } catch (error) {
        if (!internalConnection) await connection.rollback();
        console.error(
            `[cartModel.ts] updateCartItem: Error updating cart item with id ${id}.`,
            error
        );
        throw new Error("Could not update cart item.");
    } finally {
        if (!internalConnection) connection.release();
    }
};

/**
 * Deletes a cart item by its ID.
 * @param {number} id - The ID of the cart item to delete.
 * @param {PoolConnection} [internalConnection] - Optional connection for transactions.
 * @returns {Promise<void>}
 * @throws {Error} If the cart item could not be deleted or not found.
 */
export const deleteCartItem = async (
    id: number,
    internalConnection?: PoolConnection
): Promise<void> => {
    const connection = internalConnection || (await pool.getConnection());
    try {
        if (!internalConnection) await connection.beginTransaction();
        const [result] = await connection.execute<ResultSetHeader>(
            "DELETE FROM `CartItem` WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            throw new Error(`CartItem with ID ${id} not found for deletion.`);
        }
        if (!internalConnection) await connection.commit();
    } catch (error) {
        if (!internalConnection) await connection.rollback();
        console.error(
            `[cartModel.ts] deleteCartItem: Error deleting cart item with id ${id}.`,
            error
        );
        throw new Error("Could not delete cart item.");
    } finally {
        if (!internalConnection) connection.release();
    }
};

/**
 * Deletes all cart items for a given cart ID.
 * @param {number} cartId - The ID of the cart.
 * @param {PoolConnection} [internalConnection] - Optional connection for transactions.
 * @returns {Promise<void>}
 * @throws {Error} If cart items could not be deleted.
 */
export const deleteCartItemsByCartId = async (
    cartId: number,
    internalConnection?: PoolConnection
): Promise<void> => {
    const connection = internalConnection || (await pool.getConnection());
    try {
        if (!internalConnection) await connection.beginTransaction();
        await connection.execute<ResultSetHeader>(
            "DELETE FROM `CartItem` WHERE cartId = ?",
            [cartId]
        );
        // Not checking affectedRows here, as it's okay if a cart has no items.
        if (!internalConnection) await connection.commit();
    } catch (error) {
        if (!internalConnection) await connection.rollback();
        console.error(
            `[cartModel.ts] deleteCartItemsByCartId: Error deleting items for cart ${cartId}.`,
            error
        );
        throw new Error("Could not clear cart items.");
    } finally {
        if (!internalConnection) connection.release();
    }
};

// #endregion CartItem Entity

// #region Combined Cart Logic
// ======================================================================================
// Cart With Items Interface
// ======================================================================================

export interface CartWithItems extends Cart {
    items: CartItem[];
}

// ======================================================================================
// Business Logic Functions
// ======================================================================================

/**
 * Retrieves a cart along with its items for a given user ID.
 * @param {number} userId - The ID of the user.
 * @param {PoolConnection} [internalConnection] - Optional connection for transactions.
 * @returns {Promise<CartWithItems | null>} The cart with items, or null if no cart exists for the user.
 * @throws {Error} If an error occurs during fetching.
 */
export const getCartWithItemsByUserId = async (
    userId: number,
    internalConnection?: PoolConnection
): Promise<CartWithItems | null> => {
    const connection = internalConnection || (await pool.getConnection());
    try {
        // No transaction needed for reads unless part of a larger operation passed via internalConnection
        const cart = await findCartByUserId(userId, connection);
        if (!cart) {
            return null;
        }
        const items = await findCartItemsByCartId(cart.id, connection);
        return { ...cart, items };
    } catch (error) {
        console.error(
            `[cartModel.ts] getCartWithItemsByUserId: Error for user ${userId}.`,
            error
        );
        throw new Error("Could not retrieve cart with items.");
    } finally {
        if (!internalConnection) connection.release();
    }
};

/**
 * Ensures a cart exists for a user and returns it with its items.
 * If no cart exists, one is created.
 * @param {number} userId - The ID of the user.
 * @returns {Promise<CartWithItems>} The user's cart with items.
 * @throws {Error} If cart cannot be fetched or created.
 */
export const getOrCreateCartWithItems = async (
    userId: number
): Promise<CartWithItems> => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        let cart = await findCartByUserId(userId, connection);
        if (!cart) {
            cart = await createCart({ userId }, connection);
        }

        const items = await findCartItemsByCartId(cart.id, connection);

        await connection.commit();
        return { ...cart, items };
    } catch (error) {
        await connection.rollback();
        console.error(
            `[cartModel.ts] getOrCreateCartWithItems: Error for user ${userId}.`,
            error
        );
        throw new Error("Could not get or create cart.");
    } finally {
        connection.release();
    }
};

/**
 * Adds an item to the cart or updates its quantity if it already exists.
 * If quantity is 0 or less, the item is removed.
 * @param {number} cartId - The ID of the cart.
 * @param {number} productId - The ID of the product.
 * @param {number} quantity - The desired quantity of the product.
 * @returns {Promise<CartItem | null>} The added/updated cart item, or null if removed.
 * @throws {Error} If the operation fails.
 */
export const addItemToCart = async (
    cartId: number,
    productId: number,
    quantity: number
): Promise<CartItem | null> => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const existingItem = await findCartItemByCartIdAndProductId(
            cartId,
            productId,
            connection
        );

        if (existingItem) {
            if (quantity <= 0) {
                await deleteCartItem(existingItem.id, connection);
                await connection.commit();
                return null; // Item removed
            } else {
                const updatedItem = await updateCartItem(
                    existingItem.id,
                    { quantity },
                    connection
                );
                await connection.commit();
                return updatedItem;
            }
        } else {
            if (quantity <= 0) {
                // Do nothing if trying to add a non-existent item with quantity <= 0
                await connection.commit();
                return null;
            }
            const newItem = await createCartItem(
                { cartId, productId, quantity },
                connection
            );
            await connection.commit();
            return newItem;
        }
    } catch (error) {
        await connection.rollback();
        console.error(
            `[cartModel.ts] addItemToCart: Error for cart ${cartId}, product ${productId}.`,
            error
        );
        throw new Error("Could not add item to cart.");
    } finally {
        connection.release();
    }
};

/**
 * Removes an item from the cart.
 * @param {number} cartItemId - The ID of the cart item to remove.
 * @returns {Promise<void>}
 * @throws {Error} If the item cannot be removed.
 */
export const removeItemFromCart = async (cartItemId: number): Promise<void> => {
    // deleteCartItem already handles its own transaction and connection
    try {
        await deleteCartItem(cartItemId);
    } catch (error) {
        console.error(
            `[cartModel.ts] removeItemFromCart: Error removing item ${cartItemId}.`,
            error
        );
        // Re-throw or handle as specific business logic dictates
        // deleteCartItem already throws an error, so this might be redundant unless transforming the error.
        // For now, let deleteCartItem's error propagate.
        if (error instanceof Error) {
            // Make sure it's an error object
            throw new Error(`Failed to remove item from cart: ${error.message}`);
        }
        throw new Error("Failed to remove item from cart due to an unknown error.");
    }
};

/**
 * Clears all items from a cart.
 * @param {number} cartId - The ID of the cart to clear.
 * @returns {Promise<void>}
 * @throws {Error} If the cart cannot be cleared.
 */
export const clearCart = async (cartId: number): Promise<void> => {
    // deleteCartItemsByCartId handles its own transaction and connection
    try {
        await deleteCartItemsByCartId(cartId);
    } catch (error) {
        console.error(`[cartModel.ts] clearCart: Error clearing cart ${cartId}.`, error);
        if (error instanceof Error) {
            throw new Error(`Failed to clear cart: ${error.message}`);
        }
        throw new Error("Failed to clear cart due to an unknown error.");
    }
};

// #endregion Combined Cart Logic
