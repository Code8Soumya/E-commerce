import pool from "../config/db";
import { RowDataPacket, ResultSetHeader, PoolConnection } from "mysql2/promise";

export interface Category {
    id: number;
    name: string;
    parentId: number | null;
}

export interface CreateCategoryInput {
    name: string;
    parentId?: number | null;
}

export type UpdateCategoryInput = Partial<Pick<Category, "name" | "parentId">>;

/**
 * Maps a RowDataPacket from the database to a Category object.
 * @param {RowDataPacket} row - The raw row data from the database.
 * @returns {Category} The mapped Category object.
 */
const mapRowToCategory = (row: RowDataPacket): Category => ({
    id: row.id,
    name: row.name,
    parentId: row.parentId === undefined ? null : row.parentId,
});

/**
 * Creates a new category in the database.
 * @param {CreateCategoryInput} data - The data for the new category.
 * @returns {Promise<Category>} The newly created category.
 * @throws {Error} If the category could not be created.
 */
export const createCategory = async (data: CreateCategoryInput): Promise<Category> => {
    let connection: PoolConnection | undefined;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [result] = await connection.execute<ResultSetHeader>(
            "INSERT INTO `Category` (name, parentId) VALUES (?, ?)",
            [data.name, data.parentId === undefined ? null : data.parentId]
        );

        if (result.insertId) {
            const newCategory = await findCategoryById(result.insertId, connection);
            if (!newCategory) {
                throw new Error("Failed to retrieve the newly created category.");
            }
            await connection.commit();
            return newCategory;
        } else {
            throw new Error("Category creation failed, no insertId returned.");
        }
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error("[CategoryModel.ts] createCategory: Error occurred.", error);
        throw new Error("Could not create category.");
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

/**
 * Finds a category by its ID.
 * @param {number} id - The ID of the category to find.
 * @param {PoolConnection} [internalConnection] - Optional connection for transactions.
 * @returns {Promise<Category | null>} The category object or null if not found.
 * @throws {Error} If there's an issue fetching the category.
 */
export const findCategoryById = async (
    id: number,
    internalConnection?: PoolConnection
): Promise<Category | null> => {
    const connection = internalConnection || (await pool.getConnection());
    try {
        const [rows] = await connection.execute<RowDataPacket[]>(
            "SELECT * FROM `Category` WHERE id = ?",
            [id]
        );
        if (rows.length > 0) {
            return mapRowToCategory(rows[0]);
        }
        return null;
    } catch (error) {
        console.error(
            `[CategoryModel.ts] findCategoryById: Error fetching category with id ${id}.`,
            error
        );
        throw new Error("Could not fetch category.");
    } finally {
        if (!internalConnection && connection) {
            (connection as PoolConnection).release();
        }
    }
};

/**
 * Retrieves all categories from the database.
 * @returns {Promise<Category[]>} An array of all categories.
 * @throws {Error} If there's an issue fetching categories.
 */
export const findAllCategories = async (): Promise<Category[]> => {
    let connection: PoolConnection | undefined;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.execute<RowDataPacket[]>(
            "SELECT * FROM `Category`"
        );
        return rows.map(mapRowToCategory);
    } catch (error) {
        console.error(
            "[CategoryModel.ts] findAllCategories: Error fetching all categories.",
            error
        );
        throw new Error("Could not fetch categories.");
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

/**
 * Finds categories by their parent ID.
 * @param {number | null} parentId - The ID of the parent category. Use null to find top-level categories.
 * @returns {Promise<Category[]>} An array of categories matching the parent ID.
 * @throws {Error} If there's an issue fetching categories.
 */
export const findCategoriesByParentId = async (
    parentId: number | null
): Promise<Category[]> => {
    let connection: PoolConnection | undefined;
    try {
        connection = await pool.getConnection();
        let query = "SELECT * FROM `Category` WHERE parentId = ?";
        let params: (number | null)[] = [parentId];
        if (parentId === null) {
            query = "SELECT * FROM `Category` WHERE parentId IS NULL";
            params = [];
        }

        const [rows] = await connection.execute<RowDataPacket[]>(query, params);
        return rows.map(mapRowToCategory);
    } catch (error) {
        console.error(
            `[CategoryModel.ts] findCategoriesByParentId: Error fetching categories with parentId ${parentId}.`,
            error
        );
        throw new Error("Could not fetch categories by parent ID.");
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

/**
 * Updates an existing category.
 * @param {number} id - The ID of the category to update.
 * @param {UpdateCategoryInput} updates - An object containing the fields to update.
 * @returns {Promise<Category>} The updated category.
 * @throws {Error} If the category could not be updated or not found.
 */
export const updateCategory = async (
    id: number,
    updates: UpdateCategoryInput
): Promise<Category> => {
    let connection: PoolConnection | undefined;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const validUpdateFields: (keyof UpdateCategoryInput)[] = ["name", "parentId"];
        const fieldsToUpdate = Object.keys(updates).filter(
            (key) =>
                validUpdateFields.includes(key as keyof UpdateCategoryInput) &&
                updates[key as keyof UpdateCategoryInput] !== undefined
        );

        if (fieldsToUpdate.length === 0) {
            const currentCategory = await findCategoryById(id, connection);
            if (!currentCategory) {
                throw new Error(`Category with id ${id} not found.`);
            }
            // No actual commit needed if no changes, but we must release the connection if acquired internally.
            // However, findCategoryById handles its own connection if not passed one.
            // If we are here, it means we started a transaction, so we should commit or rollback.
            await connection.commit(); // Commit to release transaction state
            return currentCategory;
        }

        const setClause = fieldsToUpdate.map((key) => `\`${key}\` = ?`).join(", ");
        const values = fieldsToUpdate.map(
            (key) => updates[key as keyof UpdateCategoryInput]
        );
        values.push(id); // For the WHERE clause

        const [result] = await connection.execute<ResultSetHeader>(
            `UPDATE \`Category\` SET ${setClause} WHERE id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            // Check if the category actually exists
            const exists = await findCategoryById(id, connection);
            if (!exists) {
                throw new Error(`Category with id ${id} not found.`);
            }
            // If it exists but affectedRows is 0, it means no change was made (e.g., same values provided)
            // or a concurrent modification issue. For simplicity, we'll assume it means "no effective change".
            // The requirement is to throw if "Entity not found or no changes made."
            // If it exists, it means no changes were made.
            // We can retrieve and return it.
        }

        const updatedCategory = await findCategoryById(id, connection);
        if (!updatedCategory) {
            throw new Error(`Failed to retrieve updated category with id ${id}.`);
        }

        await connection.commit();
        return updatedCategory;
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error(
            `[CategoryModel.ts] updateCategory: Error updating category with id ${id}.`,
            error
        );
        throw new Error("Could not complete category update.");
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

/**
 * Deletes a category by its ID.
 * @param {number} id - The ID of the category to delete.
 * @returns {Promise<void>}
 * @throws {Error} If the category could not be deleted or not found.
 */
export const deleteCategory = async (id: number): Promise<void> => {
    let connection: PoolConnection | undefined;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [result] = await connection.execute<ResultSetHeader>(
            "DELETE FROM `Category` WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            throw new Error(`Category with id ${id} not found or already deleted.`);
        }

        await connection.commit();
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error(
            `[CategoryModel.ts] deleteCategory: Error deleting category with id ${id}.`,
            error
        );
        throw new Error("Could not delete category.");
    } finally {
        if (connection) {
            connection.release();
        }
    }
};
