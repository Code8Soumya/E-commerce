import pool from "../config/db";
import { RowDataPacket, ResultSetHeader, PoolConnection } from "mysql2/promise";

export interface Store {
    id: number;
    ownerId: number;
    name: string;
    description: string | null;
    createdAt: Date;
    stripeAccountId: string | null;
}

export interface CreateStoreInput {
    ownerId: number;
    name: string;
    description?: string | null;
    stripeAccountId?: string | null;
}

export type UpdateStoreInput = Partial<
    Pick<Store, "name" | "description" | "stripeAccountId">
>;

/**
 * Maps a database row (RowDataPacket) to a Store object.
 * @param row - The RowDataPacket from the database.
 * @returns A Store object.
 */
const mapRowToStore = (row: RowDataPacket): Store => ({
    id: row.id,
    ownerId: row.ownerId,
    name: row.name,
    description: row.description,
    createdAt: new Date(row.createdAt),
    stripeAccountId: row.stripeAccountId,
});

export async function createStore(data: CreateStoreInput): Promise<Store> {
    let connection: PoolConnection | null = null;
    const { ownerId, name, description, stripeAccountId } = data;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const sql =
            "INSERT INTO `Store` (`ownerId`, `name`, `description`, `stripeAccountId`) VALUES (?, ?, ?, ?)";
        const [result] = await connection.execute<ResultSetHeader>(sql, [
            ownerId,
            name,
            description ?? null,
            stripeAccountId ?? null,
        ]);
        const insertedId = result.insertId;

        const newStore = await findStoreById(insertedId, connection);
        if (!newStore) {
            await connection.rollback();
            console.error(
                "[StoreModel.ts] createStore: Failed to retrieve store after insert."
            );
            throw new Error("Could not create store: failed to retrieve after insert.");
        }

        await connection.commit();
        return newStore;
    } catch (error) {
        if (connection) {
            console.error(
                "[StoreModel.ts] createStore: Error occurred. Rolling back transaction..."
            );
            await connection.rollback();
        }
        console.error(
            `[StoreModel.ts] Error in createStore with data ${JSON.stringify(data)}:`,
            error
        );
        throw new Error("Could not complete store creation.");
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

/**
 * Finds a store by its ID.
 * @param id - The ID of the store to find.
 * @param internalConnection - Optional connection to use (e.g., within a transaction).
 * @returns The store if found, otherwise null.
 * @throws Error if the database query fails.
 */
export async function findStoreById(
    id: number,
    internalConnection?: PoolConnection
): Promise<Store | null> {
    let connection: PoolConnection | null = null;
    try {
        connection = internalConnection || (await pool.getConnection());

        const sql = "SELECT * FROM `Store` WHERE `id` = ?";
        const [rows] = await connection.execute<RowDataPacket[]>(sql, [id]);

        if (rows.length === 0) {
            return null;
        }
        return mapRowToStore(rows[0]);
    } catch (error) {
        console.error(`[StoreModel.ts] Error in findStoreById for ID ${id}:`, error);
        if (internalConnection) {
            throw error;
        }
        throw new Error(`Could not retrieve store with ID ${id}.`);
    } finally {
        if (connection && !internalConnection) {
            connection.release();
        }
    }
}

/**
 * Retrieves all stores from the database.
 * @returns A list of all stores.
 * @throws Error if the database query fails.
 */
export async function findAllStores(): Promise<Store[]> {
    let connection: PoolConnection | null = null;
    try {
        connection = await pool.getConnection();
        const sql = "SELECT * FROM `Store`";
        const [rows] = await connection.execute<RowDataPacket[]>(sql);
        return rows.map(mapRowToStore);
    } catch (error) {
        console.error("[StoreModel.ts] Error in findAllStores:", error);
        throw new Error("Could not retrieve stores.");
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

/**
 * Retrieves all stores owned by a specific user.
 * @param ownerId - The ID of the owner.
 * @returns A list of stores owned by the user.
 * @throws Error if the database query fails.
 */
export async function findStoresByOwnerId(ownerId: number): Promise<Store[]> {
    let connection: PoolConnection | null = null;
    try {
        connection = await pool.getConnection();
        const sql = "SELECT * FROM `Store` WHERE `ownerId` = ?";
        const [rows] = await connection.execute<RowDataPacket[]>(sql, [ownerId]);
        return rows.map(mapRowToStore);
    } catch (error) {
        console.error(
            `[StoreModel.ts] Error in findStoresByOwnerId for owner ID ${ownerId}:`,
            error
        );
        throw new Error(`Could not retrieve stores for owner ID ${ownerId}.`);
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

/**
 * Updates an existing store.
 * @param id - The ID of the store to update.
 * @param updates - An object containing the fields to update.
 * @returns The updated store.
 * @throws Error if the update fails or the store is not found.
 */
export async function updateStore(id: number, updates: UpdateStoreInput): Promise<Store> {
    const validUpdateKeys: Array<keyof UpdateStoreInput> = [
        "name",
        "description",
        "stripeAccountId",
    ];
    const fieldsToUpdateClause: string[] = [];
    const valuesToUpdate: (string | number | null)[] = [];

    validUpdateKeys.forEach((key) => {
        if (updates[key] !== undefined) {
            fieldsToUpdateClause.push(`\`${key}\` = ?`);
            valuesToUpdate.push(updates[key] as string | null);
        }
    });

    if (fieldsToUpdateClause.length === 0) {
        console.warn(
            `[StoreModel.ts] updateStore ID: ${id}: No valid fields to update. Returning current store.`
        );
        const currentStore = await findStoreById(id);
        if (!currentStore) {
            console.warn(
                `[StoreModel.ts] updateStore ID: ${id}: Store not found when attempting to return current due to no updates.`
            );
            throw new Error(`Store with ID ${id} not found.`);
        }
        return currentStore;
    }

    let connection: PoolConnection | null = null;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const setClause = fieldsToUpdateClause.join(", ");
        const sql = `UPDATE \`Store\` SET ${setClause} WHERE \`id\` = ?`;

        const [result] = await connection.execute<ResultSetHeader>(sql, [
            ...valuesToUpdate,
            id,
        ]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            console.warn(
                `[StoreModel.ts] updateStore ID: ${id}: Store not found or no changes made.`
            );
            const storeExists = await findStoreById(id, connection);
            if (!storeExists) {
                throw new Error(`Store with ID ${id} not found.`);
            }
            throw new Error(`No effective changes to apply for store ID ${id}.`);
        }

        await connection.commit();

        const updatedStore = await findStoreById(id, connection);
        if (!updatedStore) {
            console.error(
                `[StoreModel.ts] updateStore ID: ${id}: Failed to retrieve store after update, though update reported success.`
            );
            throw new Error("Store updated, but failed to retrieve the updated record.");
        }
        return updatedStore;
    } catch (error) {
        if (connection) {
            console.error(
                `[StoreModel.ts] updateStore: Error occurred. Rolling back transaction...`
            );
            await connection.rollback();
        }
        console.error(
            `[StoreModel.ts] Error in updateStore for ID ${id} with updates ${JSON.stringify(
                updates
            )}:`,
            error
        );
        throw new Error("Could not complete store update.");
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

/**
 * Deletes a store from the database.
 * @param id - The ID of the store to delete.
 * @returns Promise resolving if deletion is successful.
 * @throws Error if deletion fails or store not found.
 */
export async function deleteStore(id: number): Promise<void> {
    let connection: PoolConnection | null = null;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const sql = "DELETE FROM `Store` WHERE `id` = ?";
        const [result] = await connection.execute<ResultSetHeader>(sql, [id]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            console.warn(`[StoreModel.ts] deleteStore ID: ${id}: Store not found.`);
            throw new Error(`Store with ID ${id} not found for deletion.`);
        }

        await connection.commit();
    } catch (error) {
        if (connection) {
            console.error(
                "[StoreModel.ts] deleteStore: Error occurred. Rolling back transaction..."
            );
            await connection.rollback();
        }
        console.error(`[StoreModel.ts] Error in deleteStore for ID ${id}:`, error);
        throw new Error("Could not complete store deletion.");
    } finally {
        if (connection) {
            connection.release();
        }
    }
}
