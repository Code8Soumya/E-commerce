import pool from "../config/db";
import { RowDataPacket, ResultSetHeader, PoolConnection } from "mysql2/promise";

// Main Product interface based on 'Product' table
export interface Product {
    id: number;
    ownerId: number; // Foreign key to User.id
    title: string;
    description: string | null;
    price: number;
    stock: number;
    createdAt: Date;
}

// Interface for ProductImage table
export interface ProductImage {
    id: number;
    productId: number;
    imageData: Buffer;
    createdAt: Date;
}

// Interface for product data returned with its images
export interface ProductWithImages extends Product {
    images: ProductImage[]; // Array of ProductImage objects
}

// Input for creating a new product
export interface CreateProductInput {
    ownerId: number;
    title: string;
    description?: string | null;
    price: number;
    stock: number;
    imagesData: Buffer[]; // Array of image data for ProductImage table
}

// Input for updating an existing product
export type UpdateProductInput = Partial<
    Pick<Product, "title" | "description" | "price" | "stock"> & { imagesData?: Buffer[] }
>;

// -------------------- Helper Functions --------------------

const mapRowToProductImage = (row: RowDataPacket): ProductImage => ({
    id: row.id,
    productId: row.productId,
    imageData: row.imageData,
    createdAt: new Date(row.createdAt),
});

// -------------------- CRUD Functions --------------------

/**
 * Creates a new product and its images in the database.
 * @param {CreateProductInput} data - The data for the new product.
 * @returns {Promise<ProductWithImages>} The newly created product with its images.
 * @throws {Error} If the product could not be created.
 */
export const createProduct = async (
    data: CreateProductInput
): Promise<ProductWithImages> => {
    let connection: PoolConnection | null = null;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const productSql =
            "INSERT INTO `Product` (ownerId, title, description, price, stock) VALUES (?, ?, ?, ?, ?)";
        const [productResult] = await connection.execute<ResultSetHeader>(productSql, [
            data.ownerId,
            data.title,
            data.description === undefined ? null : data.description,
            data.price,
            data.stock,
        ]);

        const productId = productResult.insertId;
        if (!productId) {
            await connection.rollback();
            throw new Error("Could not create product: Product insert failed.");
        }

        if (data.imagesData && data.imagesData.length > 0) {
            const imageSql = "INSERT INTO `ProductImage` (productId, imageData) VALUES ?";
            const imageValues = data.imagesData.map((imgData) => [productId, imgData]);
            const [imageResult] = await connection.query(imageSql, [imageValues]); // Using query for bulk insert

            if (
                (imageResult as ResultSetHeader).affectedRows !== data.imagesData.length
            ) {
                await connection.rollback();
                throw new Error(
                    "Could not create product: Failed to insert all product images."
                );
            }
        } else {
            // Optional: decide if at least one image is mandatory
            // For now, allowing product creation without images if imagesData is empty or not provided
        }

        await connection.commit();

        const newProduct = await findProductById(productId, connection);
        if (!newProduct) {
            throw new Error("Could not create product: Failed to retrieve after insert.");
        }
        return newProduct;
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error("[ProductModel.ts] createProduct: Error occurred.", error);
        if (
            error instanceof Error &&
            error.message.startsWith("Could not create product:")
        ) {
            throw error;
        }
        throw new Error("Could not create product due to a server error.");
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

/**
 * Finds a product by its ID, including all its images.
 * @param {number} id - The ID of the product to find.
 * @param {PoolConnection} [internalConnection] - Optional connection for transactions.
 * @returns {Promise<ProductWithImages | null>} The product with images if found, otherwise null.
 */
export const findProductById = async (
    id: number,
    internalConnection?: PoolConnection
): Promise<ProductWithImages | null> => {
    const conn = internalConnection || (await pool.getConnection());
    try {
        const productSql = "SELECT * FROM `Product` WHERE id = ?";
        const [productRows] = await conn.execute<RowDataPacket[]>(productSql, [id]);

        if (productRows.length === 0) {
            return null;
        }
        const productData = productRows[0] as Product;

        const imagesSql =
            "SELECT * FROM `ProductImage` WHERE productId = ? ORDER BY createdAt ASC";
        const [imageRows] = await conn.execute<RowDataPacket[]>(imagesSql, [id]);

        const images = imageRows.map(mapRowToProductImage);

        return {
            ...productData,
            createdAt: new Date(productData.createdAt), // Ensure Date type
            images,
        };
    } catch (error) {
        console.error(
            `[ProductModel.ts] findProductById: Error querying product with id ${id}.`,
            error
        );
        throw new Error("Error fetching product by ID.");
    } finally {
        if (!internalConnection && conn) {
            (conn as PoolConnection).release();
        }
    }
};

/**
 * Retrieves all products from the database, including their images.
 * WARNING: This can be inefficient (N+1 problem). For production, consider a JOIN or batching image fetches.
 * @returns {Promise<ProductWithImages[]>} An array of all products with their images.
 */
export const findAllProducts = async (): Promise<ProductWithImages[]> => {
    let connection: PoolConnection | null = null;
    try {
        connection = await pool.getConnection();
        const productsSql = "SELECT * FROM `Product` ORDER BY createdAt DESC";
        const [productRows] = await connection.execute<RowDataPacket[]>(productsSql);

        const productsWithImages: ProductWithImages[] = [];
        for (const productRow of productRows) {
            const productData = productRow as Product;
            const imagesSql =
                "SELECT * FROM `ProductImage` WHERE productId = ? ORDER BY createdAt ASC";
            const [imageRows] = await connection.execute<RowDataPacket[]>(imagesSql, [
                productData.id,
            ]);
            const images = imageRows.map(mapRowToProductImage);
            productsWithImages.push({
                ...productData,
                createdAt: new Date(productData.createdAt),
                images,
            });
        }
        return productsWithImages;
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
 * Finds products by their owner's ID, including their images.
 * WARNING: This can be inefficient (N+1 problem).
 * @param {number} ownerId - The ID of the owner (User.id).
 * @returns {Promise<ProductWithImages[]>} An array of products belonging to the user.
 */
export const findProductsByOwnerId = async (
    ownerId: number
): Promise<ProductWithImages[]> => {
    let connection: PoolConnection | null = null;
    try {
        connection = await pool.getConnection();
        const productsSql =
            "SELECT * FROM `Product` WHERE ownerId = ? ORDER BY createdAt DESC";
        const [productRows] = await connection.execute<RowDataPacket[]>(productsSql, [
            ownerId,
        ]);

        const productsWithImages: ProductWithImages[] = [];
        for (const productRow of productRows) {
            const productData = productRow as Product;
            const imagesSql =
                "SELECT * FROM `ProductImage` WHERE productId = ? ORDER BY createdAt ASC";
            const [imageRows] = await connection.execute<RowDataPacket[]>(imagesSql, [
                productData.id,
            ]);
            const images = imageRows.map(mapRowToProductImage);
            productsWithImages.push({
                ...productData,
                createdAt: new Date(productData.createdAt),
                images,
            });
        }
        return productsWithImages;
    } catch (error) {
        console.error(
            `[ProductModel.ts] findProductsByOwnerId: Error for ownerId ${ownerId}.`,
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
 * Updates an existing product and optionally its images.
 * If imagesData is provided, all existing images for the product are replaced.
 * @param {number} productId - The ID of the product to update.
 * @param {number} ownerId - The ID of the user attempting the update.
 * @param {UpdateProductInput} updates - The fields to update.
 * @returns {Promise<ProductWithImages>} The updated product with images.
 */
export const updateProduct = async (
    productId: number,
    ownerId: number,
    updates: UpdateProductInput
): Promise<ProductWithImages> => {
    let connection: PoolConnection | null = null;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const existingProductSql = "SELECT ownerId FROM `Product` WHERE id = ?";
        const [existingRows] = await connection.execute<RowDataPacket[]>(
            existingProductSql,
            [productId]
        );

        if (existingRows.length === 0) {
            await connection.rollback();
            throw new Error(`Product with ID ${productId} not found.`);
        }
        if (existingRows[0].ownerId !== ownerId) {
            await connection.rollback();
            throw new Error(`User does not own product with ID ${productId}.`);
        }

        const { imagesData, ...productUpdates } = updates;
        const productFieldsToUpdate = Object.keys(productUpdates).filter(
            (key) => productUpdates[key as keyof typeof productUpdates] !== undefined
        );

        if (productFieldsToUpdate.length > 0) {
            const setClause = productFieldsToUpdate
                .map((key) => `\`${key}\` = ?`)
                .join(", ");
            const values = productFieldsToUpdate.map(
                (key) => productUpdates[key as keyof typeof productUpdates]
            );
            values.push(productId);

            const updateProductSql = `UPDATE \`Product\` SET ${setClause} WHERE id = ?`;
            await connection.execute<ResultSetHeader>(updateProductSql, values);
        }

        if (imagesData) {
            // If imagesData is provided (even an empty array, meaning delete all)
            const deleteImagesSql = "DELETE FROM `ProductImage` WHERE productId = ?";
            await connection.execute(deleteImagesSql, [productId]);

            if (imagesData.length > 0) {
                const imageSql =
                    "INSERT INTO `ProductImage` (productId, imageData) VALUES ?";
                const imageValues = imagesData.map((imgData) => [productId, imgData]);
                const [imageResult] = await connection.query(imageSql, [imageValues]);

                if ((imageResult as ResultSetHeader).affectedRows !== imagesData.length) {
                    await connection.rollback();
                    throw new Error(
                        "Could not update product: Failed to insert all new product images."
                    );
                }
            }
        }

        await connection.commit();

        const updatedProduct = await findProductById(productId, connection);
        if (!updatedProduct) {
            throw new Error(
                "Could not complete product update: Failed to retrieve after update."
            );
        }
        return updatedProduct;
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error(
            `[ProductModel.ts] updateProduct: Error updating product ID ${productId}.`,
            error
        );
        if (
            error instanceof Error &&
            (error.message.includes("not found") ||
                error.message.includes("User does not own product") ||
                error.message.startsWith("Could not update product:"))
        ) {
            throw error;
        }
        throw new Error("Could not complete product update due to a server error.");
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

/**
 * Deletes a product and its associated images by its ID.
 * @param {number} productId - The ID of the product to delete.
 * @param {number} ownerId - The ID of the user attempting deletion.
 * @returns {Promise<void>}
 */
export const deleteProduct = async (
    productId: number,
    ownerId: number
): Promise<void> => {
    let connection: PoolConnection | null = null;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const existingProductSql = "SELECT ownerId FROM `Product` WHERE id = ?";
        const [existingRows] = await connection.execute<RowDataPacket[]>(
            existingProductSql,
            [productId]
        );

        if (existingRows.length === 0) {
            await connection.rollback();
            throw new Error(`Product with ID ${productId} not found for deletion.`);
        }
        if (existingRows[0].ownerId !== ownerId) {
            await connection.rollback();
            throw new Error(
                `User does not own product with ID ${productId} for deletion.`
            );
        }

        // ProductImages are deleted by CASCADE constraint. If not, delete them explicitly first.
        // const deleteImagesSql = "DELETE FROM `ProductImage` WHERE productId = ?";
        // await connection.execute(deleteImagesSql, [productId]);

        const deleteProductSql = "DELETE FROM `Product` WHERE id = ?";
        const [result] = await connection.execute<ResultSetHeader>(deleteProductSql, [
            productId,
        ]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            throw new Error(`Product with ID ${productId} not found (affectedRows 0).`);
        }

        await connection.commit();
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error(
            `[ProductModel.ts] deleteProduct: Error deleting product ID ${productId}.`,
            error
        );
        if (
            error instanceof Error &&
            (error.message.includes("not found") ||
                error.message.includes("User does not own product"))
        ) {
            throw error;
        }
        throw new Error("Could not delete product due to a server error.");
    } finally {
        if (connection) {
            connection.release();
        }
    }
};
