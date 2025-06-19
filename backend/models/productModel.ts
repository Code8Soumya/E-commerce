import pool from "../config/db";
import { RowDataPacket, ResultSetHeader, PoolConnection } from "mysql2/promise";

export interface Product {
    id: number;
    storeId: number;
    categoryId: number | null;
    title: string;
    description: string | null;
    price: number;
    stock: number;
    image: Buffer;
    isPublished?: boolean; // Added isPublished
    createdAt: Date;
}

// Assumed Category interface (based on productRoutes.ts including category)
export interface Category {
    id: number;
    name: string;
    // Add other category fields as necessary
}

export interface ProductWithCategory extends Product {
    category?: Category | null;
}

export interface CreateProductInput {
    storeId: number;
    categoryId?: number | null;
    title: string;
    description?: string | null;
    price: number;
    stock: number;
    image: Buffer;
}

export type UpdateProductInput = Partial<
    Pick<Product, "title" | "description" | "price" | "stock" | "categoryId" | "image">
>;

// -------------------- Helper Function --------------------

/**
 * Maps a RowDataPacket from the database to a Product object.
 * @param {RowDataPacket} row - The raw row data from the database.
 * @returns {Product} The mapped Product object.
 */
const mapRowToProduct = (row: RowDataPacket): Product => ({
    id: row.id,
    storeId: row.storeId,
    categoryId: row.categoryId === undefined ? null : row.categoryId,
    title: row.title, // Renamed from name
    description: row.description === undefined ? null : row.description,
    price: row.price,
    stock: row.stock,
    image: row.image, // Added for LONGBLOB
    isPublished: row.isPublished === undefined ? false : Boolean(row.isPublished), // Assuming default false if not present
    createdAt: new Date(row.createdAt),
});

const mapRowToProductWithCategory = (row: RowDataPacket): ProductWithCategory => {
    const product = mapRowToProduct(row) as ProductWithCategory;
    if (row.category_id && row.category_name) {
        product.category = {
            id: row.category_id,
            name: row.category_name,
            // map other category fields if joined and selected
        };
    } else {
        product.category = null;
    }
    return product;
};

// -------------------- CRUD Functions --------------------

/**
 * Creates a new product in the database.
 * @param {CreateProductInput} data - The data for the new product.
 * @returns {Promise<Product>} The newly created product.
 * @throws {Error} If the product could not be created.
 */
export const createProduct = async (data: CreateProductInput): Promise<Product> => {
    let connection: PoolConnection | null = null;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const sql =
            "INSERT INTO Product (storeId, categoryId, title, description, price, stock, image) VALUES (?, ?, ?, ?, ?, ?, ?)"; // Added image, renamed name to title
        const [result] = await connection.execute<ResultSetHeader>(sql, [
            data.storeId,
            data.categoryId === undefined ? null : data.categoryId,
            data.title, // Renamed from data.name
            data.description === undefined ? null : data.description,
            data.price,
            data.stock,
            data.image, // Added data.image
        ]);

        if (result.insertId) {
            const newProduct = await findProductById(result.insertId, connection);
            if (!newProduct) {
                await connection.rollback();
                console.error(
                    "[ProductModel.ts] createProduct: Failed to retrieve the newly created product."
                );
                throw new Error(
                    "Could not create product: Failed to retrieve after insert."
                );
            }
            await connection.commit();
            return newProduct;
        } else {
            await connection.rollback();
            console.error(
                "[ProductModel.ts] createProduct: InsertId is missing after insert operation."
            );
            throw new Error("Could not create product: Insert failed.");
        }
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error("[ProductModel.ts] createProduct: Error occurred.", error);
        throw new Error("Could not create product.");
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

/**
 * Finds a product by its ID.
 * @param {number} id - The ID of the product to find.
 * @param {PoolConnection} [internalConnection] - Optional connection to use for transactions.
 * @returns {Promise<Product | null>} The product if found, otherwise null.
 * @throws {Error} If there is a database query error.
 */
export const findProductById = async (
    id: number,
    internalConnection?: PoolConnection
): Promise<Product | null> => {
    const connection = internalConnection || (await pool.getConnection());
    try {
        const sql = "SELECT * FROM Product WHERE id = ?";
        const [rows] = await connection.execute<RowDataPacket[]>(sql, [id]);
        if (rows.length > 0) {
            return mapRowToProduct(rows[0]);
        }
        return null;
    } catch (error) {
        console.error(
            `[ProductModel.ts] findProductById: Error querying product with id ${id}.`,
            error
        );
        throw new Error("Error fetching product by ID.");
    } finally {
        if (!internalConnection && connection) {
            (connection as PoolConnection).release();
        }
    }
};

/**
 * Retrieves all products from the database.
 * @returns {Promise<Product[]>} An array of all products.
 * @throws {Error} If there is a database query error.
 */
export const findAllProducts = async (): Promise<Product[]> => {
    let connection: PoolConnection | null = null;
    try {
        connection = await pool.getConnection();
        const sql = "SELECT * FROM Product ORDER BY createdAt DESC";
        const [rows] = await connection.execute<RowDataPacket[]>(sql);
        return rows.map(mapRowToProduct);
    } catch (error) {
        console.error(
            "[ProductModel.ts] findAllProducts: Error querying all products.",
            error
        );
        throw new Error("Error fetching all products.");
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

/**
 * Finds products by their store ID.
 * @param {number} storeId - The ID of the store.
 * @returns {Promise<Product[]>} An array of products belonging to the store.
 * @throws {Error} If there is a database query error.
 */
export const findProductsByStoreId = async (storeId: number): Promise<Product[]> => {
    let connection: PoolConnection | null = null;
    try {
        connection = await pool.getConnection();
        const sql = "SELECT * FROM Product WHERE storeId = ? ORDER BY createdAt DESC";
        const [rows] = await connection.execute<RowDataPacket[]>(sql, [storeId]);
        return rows.map(mapRowToProduct);
    } catch (error) {
        console.error(
            `[ProductModel.ts] findProductsByStoreId: Error querying products for storeId ${storeId}.`,
            error
        );
        throw new Error("Error fetching products by store ID.");
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

/**
 * Finds products by their category ID.
 * @param {number} categoryId - The ID of the category.
 * @returns {Promise<Product[]>} An array of products belonging to the category.
 * @throws {Error} If there is a database query error.
 */
export const findProductsByCategoryId = async (
    categoryId: number
): Promise<Product[]> => {
    let connection: PoolConnection | null = null;
    try {
        connection = await pool.getConnection();
        const sql = "SELECT * FROM Product WHERE categoryId = ? ORDER BY createdAt DESC";
        const [rows] = await connection.execute<RowDataPacket[]>(sql, [categoryId]);
        return rows.map(mapRowToProduct);
    } catch (error) {
        console.error(
            `[ProductModel.ts] findProductsByCategoryId: Error querying products for categoryId ${categoryId}.`,
            error
        );
        throw new Error("Error fetching products by category ID.");
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

/**
 * Updates an existing product.
 * @param {number} id - The ID of the product to update.
 * @param {UpdateProductInput} updates - The fields to update.
 * @returns {Promise<Product>} The updated product.
 * @throws {Error} If the product could not be updated, not found, or no changes were made.
 */
export const updateProduct = async (
    id: number,
    updates: UpdateProductInput
): Promise<Product> => {
    let connection: PoolConnection | null = null;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const validUpdateFields: (keyof UpdateProductInput)[] = [
            "title", // Renamed from name
            "description",
            "price",
            "stock",
            "categoryId",
            "image", // Added image
        ];
        const fieldsToUpdate = validUpdateFields.filter(
            (key) => updates[key] !== undefined
        );

        if (fieldsToUpdate.length === 0) {
            const currentProduct = await findProductById(id, connection);
            if (!currentProduct) {
                await connection.rollback();
                throw new Error(`Product with ID ${id} not found.`);
            }
            // No actual update to perform, but commit transaction if one was started implicitly by findProductById if it didn't use ours
            // However, findProductById with internalConnection doesn't commit.
            // So, if no fields, we can just return current product.
            await connection.commit(); // Commit to release the transaction lock
            return currentProduct;
        }

        const setClause = fieldsToUpdate.map((key) => `${key} = ?`).join(", ");
        const values = fieldsToUpdate.map((key) => {
            const value = updates[key];
            // Handle explicit null for nullable fields like categoryId or description
            if (value === null && (key === "categoryId" || key === "description")) {
                return null;
            }
            return value;
        });
        values.push(id);

        const sql = `UPDATE Product SET ${setClause} WHERE id = ?`;
        const [result] = await connection.execute<ResultSetHeader>(sql, values);

        if (result.affectedRows === 0) {
            await connection.rollback();
            // Check if product exists to differentiate between "not found" and "no changes made to existing product"
            const exists = await findProductById(id, connection); // Use same connection
            if (!exists) {
                throw new Error(`Product with ID ${id} not found.`);
            }
            // If it exists but affectedRows is 0, it means the provided data didn't change any values
            // This case might be acceptable, or an error, depending on requirements.
            // For now, let's assume it's an issue if an update was intended.
            console.warn(
                `[ProductModel.ts] updateProduct: Update for product ID ${id} resulted in 0 affected rows, possibly no actual changes.`
            );
            // Re-fetch and return current state if no change is not an error.
            // Or throw:
            throw new Error("Product not found or no changes were made.");
        }

        const updatedProduct = await findProductById(id, connection);
        if (!updatedProduct) {
            await connection.rollback();
            console.error(
                `[ProductModel.ts] updateProduct: Failed to retrieve product ID ${id} after update.`
            );
            throw new Error(
                "Could not complete product update: Failed to retrieve after update."
            );
        }

        await connection.commit();
        return updatedProduct;
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error(
            `[ProductModel.ts] updateProduct: Error updating product ID ${id}.`,
            error
        );
        if (
            error instanceof Error &&
            (error.message.includes("not found") || error.message.includes("no changes"))
        ) {
            throw error; // Re-throw specific errors
        }
        throw new Error("Could not complete product update.");
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

/**
 * Finds products by their owner's ID by joining with the Store table.
 * @param {number} ownerId - The ID of the owner.
 * @returns {Promise<Product[]>} An array of products belonging to stores owned by the user.
 * @throws {Error} If there is a database query error.
 */
export const findProductsByOwnerId = async (ownerId: number): Promise<Product[]> => {
    let connection: PoolConnection | null = null;
    try {
        connection = await pool.getConnection();
        // Ensure backticks around table and column names if they are reserved words or contain special characters
        const sql = `
            SELECT p.*
            FROM \`Product\` p
            JOIN \`Store\` s ON p.\`storeId\` = s.\`id\`
            WHERE s.\`ownerId\` = ?
            ORDER BY p.\`createdAt\` DESC
        `;
        const [rows] = await connection.execute<RowDataPacket[]>(sql, [ownerId]);
        return rows.map(mapRowToProduct);
    } catch (error) {
        console.error(
            `[ProductModel.ts] findProductsByOwnerId: Error querying products for ownerId ${ownerId}.`,
            error
        );
        throw new Error("Error fetching products by owner ID.");
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

/**
 * Retrieves all published products from the database, including their category.
 * @returns {Promise<ProductWithCategory[]>} An array of all published products with category details.
 * @throws {Error} If there is a database query error.
 */
export const findAllPublishedProducts = async (): Promise<ProductWithCategory[]> => {
    let connection: PoolConnection | null = null;
    try {
        connection = await pool.getConnection();
        // Assuming 'Category' table exists and 'Product.categoryId' links to 'Category.id'
        // Assuming 'Product' table has an 'isPublished' column.
        const sql = `
            SELECT 
                p.*, 
                c.\`id\` AS category_id, 
                c.\`name\` AS category_name
                -- Select other category fields if needed, e.g., c.description AS category_description
            FROM \`Product\` p
            LEFT JOIN \`Category\` c ON p.\`categoryId\` = c.\`id\`
            WHERE p.\`isPublished\` = TRUE  -- Or 1 if boolean is stored as int
            ORDER BY p.\`createdAt\` DESC
        `;
        const [rows] = await connection.execute<RowDataPacket[]>(sql);
        return rows.map(mapRowToProductWithCategory);
    } catch (error) {
        console.error(
            "[ProductModel.ts] findAllPublishedProducts: Error querying published products.",
            error
        );
        throw new Error("Error fetching published products.");
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

/**
 * Deletes a product by its ID.
 * @param {number} id - The ID of the product to delete.
 * @returns {Promise<void>}
 * @throws {Error} If the product could not be deleted or was not found.
 */
export const deleteProduct = async (id: number): Promise<void> => {
    let connection: PoolConnection | null = null;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const sql = "DELETE FROM Product WHERE id = ?";
        const [result] = await connection.execute<ResultSetHeader>(sql, [id]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            throw new Error(`Product with ID ${id} not found for deletion.`);
        }

        await connection.commit();
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error(
            `[ProductModel.ts] deleteProduct: Error deleting product ID ${id}.`,
            error
        );
        if (error instanceof Error && error.message.includes("not found")) {
            throw error;
        }
        throw new Error("Could not delete product.");
    } finally {
        if (connection) {
            connection.release();
        }
    }
};
