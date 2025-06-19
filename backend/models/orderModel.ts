import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import pool from "../config/db";

// -------------------- Interfaces & Types --------------------

/**
 * Represents an Order in the system.
 */
export interface Order {
    id: number;
    userId: number;
    totalAmount: number;
    status: "pending" | "paid" | "shipped";
    shippingAddressId: number;
    billingAddressId: number;
    createdAt: Date;
}

/**
 * Input for creating a new Order.
 */
export interface CreateOrderInput {
    userId: number;
    totalAmount: number;
    status?: "pending" | "paid" | "shipped"; // Optional, defaults to 'pending' in DB
    shippingAddressId: number;
    billingAddressId: number;
}

/**
 * Input for updating an existing Order.
 * Allows partial updates to specific fields.
 */
export type UpdateOrderInput = Partial<
    Pick<Order, "totalAmount" | "status" | "shippingAddressId" | "billingAddressId">
>;

// -------------------- Helper Function --------------------

/**
 * Maps a RowDataPacket from the database to an Order object.
 * @param row - The RowDataPacket to map.
 * @returns The mapped Order object.
 */
const mapRowToOrder = (row: RowDataPacket): Order => ({
    id: row.id,
    userId: row.userId,
    totalAmount: row.totalAmount,
    status: row.status,
    shippingAddressId: row.shippingAddressId,
    billingAddressId: row.billingAddressId,
    createdAt: new Date(row.createdAt),
});

// -------------------- CRUD Functions --------------------

/**
 * Creates a new order in the database.
 * Uses a transaction to ensure atomicity.
 * @param data - The data for the new order.
 * @returns A promise that resolves to the newly created Order.
 * @throws Error if the order could not be created or retrieved.
 */
export const createOrder = async (data: CreateOrderInput): Promise<Order> => {
    let connection: PoolConnection | null = null;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const query = `
      INSERT INTO \`Order\` (userId, totalAmount, status, shippingAddressId, billingAddressId)
      VALUES (?, ?, ?, ?, ?)
    `;
        const params = [
            data.userId,
            data.totalAmount,
            data.status || "pending", // Default status if not provided
            data.shippingAddressId,
            data.billingAddressId,
        ];

        const [result] = await connection.execute<ResultSetHeader>(query, params);
        const insertId = result.insertId;

        if (insertId <= 0) {
            await connection.rollback();
            console.error(
                "[OrderModel.ts] createOrder: Insert failed, no insertId returned."
            );
            throw new Error("Could not create order: Insert operation failed.");
        }

        // Retrieve the newly created order using the same connection
        const newOrder = await findOrderById(insertId, connection);
        if (!newOrder) {
            await connection.rollback();
            console.error(
                `[OrderModel.ts] createOrder: Failed to retrieve created order with id ${insertId}.`
            );
            throw new Error("Could not create order: Failed to retrieve after insert.");
        }

        await connection.commit();
        return newOrder;
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error("[OrderModel.ts] createOrder: Error occurred.", error);
        throw new Error("Could not create order.");
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

/**
 * Finds an order by its ID.
 * @param id - The ID of the order to find.
 * @param internalConnection - Optional. A database connection to use if called within a transaction.
 * @returns A promise that resolves to the Order object or null if not found.
 * @throws Error if there's an issue fetching the order.
 */
export const findOrderById = async (
    id: number,
    internalConnection?: PoolConnection
): Promise<Order | null> => {
    const connection = internalConnection || (await pool.getConnection());
    try {
        const query = "SELECT * FROM `Order` WHERE id = ?";
        const [rows] = await connection.execute<RowDataPacket[]>(query, [id]);

        if (rows.length === 0) {
            return null;
        }
        return mapRowToOrder(rows[0]);
    } catch (error) {
        console.error(
            `[OrderModel.ts] findOrderById: Error fetching order with id ${id}.`,
            error
        );
        throw new Error("Could not fetch order by ID.");
    } finally {
        if (!internalConnection && connection) {
            (connection as PoolConnection).release();
        }
    }
};

/**
 * Retrieves all orders from the database.
 * @returns A promise that resolves to an array of Order objects.
 * @throws Error if there's an issue fetching orders.
 */
export const findAllOrders = async (): Promise<Order[]> => {
    let connection: PoolConnection | null = null;
    try {
        connection = await pool.getConnection();
        const query = "SELECT * FROM `Order` ORDER BY createdAt DESC";
        const [rows] = await connection.execute<RowDataPacket[]>(query);
        return rows.map(mapRowToOrder);
    } catch (error) {
        console.error("[OrderModel.ts] findAllOrders: Error fetching all orders.", error);
        throw new Error("Could not fetch all orders.");
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

/**
 * Finds all orders for a specific user.
 * @param userId - The ID of the user whose orders to find.
 * @returns A promise that resolves to an array of Order objects.
 * @throws Error if there's an issue fetching orders.
 */
export const findOrdersByUserId = async (userId: number): Promise<Order[]> => {
    let connection: PoolConnection | null = null;
    try {
        connection = await pool.getConnection();
        const query = "SELECT * FROM `Order` WHERE userId = ? ORDER BY createdAt DESC";
        const [rows] = await connection.execute<RowDataPacket[]>(query, [userId]);
        return rows.map(mapRowToOrder);
    } catch (error) {
        console.error(
            `[OrderModel.ts] findOrdersByUserId: Error fetching orders for user ${userId}.`,
            error
        );
        throw new Error("Could not fetch orders for user.");
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

/**
 * Finds all orders associated with a specific shipping address.
 * @param shippingAddressId - The ID of the shipping address.
 * @returns A promise that resolves to an array of Order objects.
 * @throws Error if there's an issue fetching orders.
 */
export const findOrdersByShippingAddressId = async (
    shippingAddressId: number
): Promise<Order[]> => {
    let connection: PoolConnection | null = null;
    try {
        connection = await pool.getConnection();
        const query =
            "SELECT * FROM `Order` WHERE shippingAddressId = ? ORDER BY createdAt DESC";
        const [rows] = await connection.execute<RowDataPacket[]>(query, [
            shippingAddressId,
        ]);
        return rows.map(mapRowToOrder);
    } catch (error) {
        console.error(
            `[OrderModel.ts] findOrdersByShippingAddressId: Error fetching orders for shipping address ${shippingAddressId}.`,
            error
        );
        throw new Error("Could not fetch orders by shipping address.");
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

/**
 * Finds all orders associated with a specific billing address.
 * @param billingAddressId - The ID of the billing address.
 * @returns A promise that resolves to an array of Order objects.
 * @throws Error if there's an issue fetching orders.
 */
export const findOrdersByBillingAddressId = async (
    billingAddressId: number
): Promise<Order[]> => {
    let connection: PoolConnection | null = null;
    try {
        connection = await pool.getConnection();
        const query =
            "SELECT * FROM `Order` WHERE billingAddressId = ? ORDER BY createdAt DESC";
        const [rows] = await connection.execute<RowDataPacket[]>(query, [
            billingAddressId,
        ]);
        return rows.map(mapRowToOrder);
    } catch (error) {
        console.error(
            `[OrderModel.ts] findOrdersByBillingAddressId: Error fetching orders for billing address ${billingAddressId}.`,
            error
        );
        throw new Error("Could not fetch orders by billing address.");
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

/**
 * Updates an existing order in the database.
 * Uses a transaction to ensure atomicity.
 * @param id - The ID of the order to update.
 * @param updates - An object containing the fields to update.
 * @returns A promise that resolves to the updated Order.
 * @throws Error if the order is not found, no valid fields are provided for update, or the update fails.
 */
export const updateOrder = async (
    id: number,
    updates: UpdateOrderInput
): Promise<Order> => {
    let connection: PoolConnection | null = null;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const validUpdateFields: (keyof UpdateOrderInput)[] = [
            "totalAmount",
            "status",
            "shippingAddressId",
            "billingAddressId",
        ];
        const fieldsToUpdate = Object.keys(updates).filter(
            (key) =>
                validUpdateFields.includes(key as keyof UpdateOrderInput) &&
                updates[key as keyof UpdateOrderInput] !== undefined
        );

        if (fieldsToUpdate.length === 0) {
            // No valid fields to update, retrieve and return current order or throw if not found
            const currentOrder = await findOrderById(id, connection);
            if (!currentOrder) {
                await connection.rollback();
                throw new Error(`Order with ID ${id} not found.`);
            }
            await connection.commit(); // Commit as no update was needed but order exists
            return currentOrder;
        }

        const setClause = fieldsToUpdate.map((field) => `\`${field}\` = ?`).join(", ");
        const params = fieldsToUpdate.map(
            (field) => updates[field as keyof UpdateOrderInput]
        );
        params.push(id); // For the WHERE clause

        const query = `UPDATE \`Order\` SET ${setClause} WHERE id = ?`;

        const [result] = await connection.execute<ResultSetHeader>(query, params);

        if (result.affectedRows === 0) {
            // Check if the order actually exists
            const existingOrder = await findOrderById(id, connection);
            if (!existingOrder) {
                await connection.rollback();
                throw new Error(`Order with ID ${id} not found.`);
            }
            // If it exists but affectedRows is 0, it means no actual change in values occurred.
            // We can consider this a success and return the (unchanged) order.
        }

        const updatedOrder = await findOrderById(id, connection);
        if (!updatedOrder) {
            await connection.rollback();
            console.error(
                `[OrderModel.ts] updateOrder: Failed to retrieve updated order with id ${id}.`
            );
            throw new Error(
                "Could not complete order update: Failed to retrieve after update."
            );
        }

        await connection.commit();
        return updatedOrder;
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error(
            `[OrderModel.ts] updateOrder: Error updating order with id ${id}.`,
            error
        );
        if (error instanceof Error && error.message.startsWith("Order with ID")) {
            throw error; // Re-throw specific "not found" errors
        }
        throw new Error("Could not complete order update.");
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

/**
 * Deletes an order from the database by its ID.
 * Uses a transaction to ensure atomicity.
 * @param id - The ID of the order to delete.
 * @returns A promise that resolves when the deletion is successful.
 * @throws Error if the order is not found or the deletion fails.
 */
export const deleteOrder = async (id: number): Promise<void> => {
    let connection: PoolConnection | null = null;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const query = "DELETE FROM `Order` WHERE id = ?";
        const [result] = await connection.execute<ResultSetHeader>(query, [id]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            throw new Error(`Order with ID ${id} not found for deletion.`);
        }

        await connection.commit();
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error(
            `[OrderModel.ts] deleteOrder: Error deleting order with id ${id}.`,
            error
        );
        if (error instanceof Error && error.message.startsWith("Order with ID")) {
            throw error; // Re-throw specific "not found" errors
        }
        throw new Error("Could not delete order.");
    } finally {
        if (connection) {
            connection.release();
        }
    }
};
