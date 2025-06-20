import pool from "../config/db";
import { RowDataPacket, ResultSetHeader, PoolConnection } from "mysql2/promise";

export interface User {
    id: number;
    name: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
}

export type UserOutput = Omit<User, "passwordHash">;

export interface CreateUserInput {
    name: string;
    email: string;
    passwordHash: string;
}

export type UpdateUserInput = Partial<Pick<User, "name" | "email" | "passwordHash">>;

/**
 * Maps a RowDataPacket from the database to a User object.
 * Handles type conversion, especially for Date fields.
 * @param {RowDataPacket} row - The raw data packet from a MySQL query result.
 * @returns {User} The mapped User object.
 */
const mapRowToUser = (row: RowDataPacket): User => ({
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.passwordHash,
    createdAt: new Date(row.createdAt),
});

/**
 * Creates a new user in the database.
 * Uses a transaction to ensure atomicity.
 * @param {CreateUserInput} data - The data for the new user.
 * @returns {Promise<UserOutput | null>} The newly created user object (without password hash), or null on failure.
 */
export async function createUser(data: CreateUserInput): Promise<UserOutput | null> {
    const { name, email, passwordHash } = data;
    const sql = "INSERT INTO `User` (`name`, `email`, `passwordHash`) VALUES (?, ?, ?)";
    let connection: PoolConnection | null = null;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [result] = await connection.execute<ResultSetHeader>(sql, [
            name,
            email,
            passwordHash,
        ]);

        if (result.insertId) {
            // Pass the existing connection to findUserById
            const newUser = await findUserById(result.insertId, connection);
            if (newUser) {
                await connection.commit();
                return newUser;
            } else {
                // This case should ideally not be reached if insertId is valid
                // and findUserById is correct.
                console.error(
                    "[userModel.ts] createUser: Failed to retrieve user after creation or findUserById failed (within transaction)."
                );
                await connection.rollback();
                return null;
            }
        } else {
            console.error(
                "[userModel.ts] createUser: User creation failed, no insertId returned."
            );
            await connection.rollback();
            return null;
        }
    } catch (error) {
        if (connection) {
            // console.error already part of the original log, no need to repeat if it's the same message
            // However, ensuring it's logged before returning null is key.
            // The existing console.error("[userModel.ts] Error in createUser:", error); handles this.
            await connection.rollback();
        }
        console.error("[userModel.ts] Error in createUser:", error); // This will log the error
        return null;
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

/**
 * Finds a user by their ID.
 * Can use an existing database connection if provided (for transactions).
 * @param {number} id - The ID of the user to find.
 * @param {PoolConnection} [internalConnection] - Optional existing database connection.
 * @returns {Promise<UserOutput | null>} The user object (without password hash) if found, otherwise null.
 */
export async function findUserById(
    id: number,
    internalConnection?: PoolConnection
): Promise<UserOutput | null> {
    const sql = "SELECT `id`, `name`, `email`, `createdAt` FROM `User` WHERE `id` = ?"; // Select specific fields
    let connection: PoolConnection | null = null;

    try {
        // Use internalConnection if provided, otherwise get a new one
        connection = internalConnection || (await pool.getConnection());

        const [rows] = await connection.execute<RowDataPacket[]>(sql, [id]);

        if (rows.length > 0) {
            const row = rows[0];
            // Directly map to UserOutput
            return {
                id: row.id,
                name: row.name,
                email: row.email,
                createdAt: new Date(row.createdAt),
            };
        }
        return null;
    } catch (error) {
        console.error(
            `[userModel.ts] findUserById: Error finding user by ID ${id}:`,
            error
        );
        return null; // Return null on error
    } finally {
        // Only release connection if it was established within this function
        if (connection && !internalConnection) {
            connection.release();
        }
    }
}

/**
 * Finds a user by their email address.
 * Can use an existing database connection if provided.
 * @param {string} email - The email of the user to find.
 * @param {PoolConnection} [internalConnection] - Optional existing database connection.
 * @returns {Promise<User | null>} The user object if found, otherwise null.
 */
export async function findUserByEmail(
    email: string,
    internalConnection?: PoolConnection
): Promise<User | null> {
    const sql = "SELECT * FROM `User` WHERE `email` = ?";
    let connection: PoolConnection | null = null;

    try {
        connection = internalConnection || (await pool.getConnection());
        const [rows] = await connection.execute<RowDataPacket[]>(sql, [email]);
        if (rows.length > 0) {
            return mapRowToUser(rows[0]);
        }
        return null;
    } catch (error) {
        console.error(
            `[userModel.ts] findUserByEmail: Error finding user by email ${email}:`,
            error
        );
        return null;
    } finally {
        if (connection && !internalConnection) {
            connection.release();
        }
    }
}

/**
 * Retrieves all users from the database, without password hashes.
 * @returns {Promise<UserOutput[] | null>} An array of user objects (without password hashes), or null on error.
 */
export async function findAllUsers(): Promise<UserOutput[] | null> {
    const sql = "SELECT `id`, `name`, `email`, `createdAt` FROM `User`"; // Select specific fields
    let connection: PoolConnection | null = null;

    try {
        connection = await pool.getConnection();
        const [rows] = await connection.execute<RowDataPacket[]>(sql);
        return rows.map((row: RowDataPacket) => ({
            // Map directly to UserOutput
            id: row.id,
            name: row.name,
            email: row.email,
            createdAt: new Date(row.createdAt),
        }));
    } catch (error) {
        console.error("[userModel.ts] findAllUsers: Error retrieving all users:", error);
        return null; // Return null on error
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

/**
 * Updates an existing user's information.
 * Uses a transaction to ensure atomicity.
 * Dynamically builds the SET clause based on provided updates.
 * @param {number} id - The ID of the user to update.
 * @param {UpdateUserInput} updates - An object containing the fields to update.
 * @returns {Promise<boolean>} True if update was successful, false otherwise.
 */
export async function updateUser(id: number, updates: UpdateUserInput): Promise<boolean> {
    const fieldsToUpdate: string[] = [];
    const values: (string | number)[] = [];
    let connection: PoolConnection | null = null;

    // Dynamically build query
    (Object.keys(updates) as Array<keyof UpdateUserInput>).forEach((key) => {
        if (updates[key] !== undefined && updates[key] !== null) {
            fieldsToUpdate.push(`\`${key}\` = ?`);
            values.push(updates[key] as string | number); // Type assertion
        }
    });

    if (fieldsToUpdate.length === 0) {
        console.warn(`[userModel.ts] updateUser ID: ${id}: No update fields provided.`);
        // Optionally, check if user exists to provide more context, but problem implies just return false.
        // const currentUser = await findUserById(id);
        // if (!currentUser) {
        //     console.error(`[userModel.ts] updateUser ID: ${id}: User not found and no update fields provided.`);
        // }
        return false; // No update performed
    }

    values.push(id); // Add id for the WHERE clause
    const sql = `UPDATE \`User\` SET ${fieldsToUpdate.join(", ")} WHERE \`id\` = ?`;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [result] = await connection.execute<ResultSetHeader>(sql, values);

        if (result.affectedRows === 0) {
            // Check if user exists to differentiate between "not found" and "no actual change"
            const userExists = await findUserById(id, connection);
            if (!userExists) {
                console.warn(
                    `[userModel.ts] updateUser ID: ${id}: User not found for update.`
                );
                await connection.rollback();
                return false;
            }
            // If user exists but affectedRows is 0, it means data was same
            console.warn(
                `[userModel.ts] updateUser ID: ${id}: User found, but no data was changed by the update (data might be identical).`
            );
            await connection.rollback(); // No actual update occurred
            return false;
        }

        // No need to fetch the user again if we are just returning a boolean
        // const updatedUser = await findUserById(id, connection);
        // if (!updatedUser) {
        //     console.error(
        //         `[userModel.ts] updateUser ID: ${id}: Failed to retrieve user after update (within transaction), though affectedRows > 0.`
        //     );
        //     await connection.rollback();
        //     return false;
        // }

        await connection.commit();
        return true;
    } catch (error) {
        if (connection) {
            // console.error already part of the original log
            await connection.rollback();
        }
        console.error(`[userModel.ts] Error in updateUser for ID ${id}:`, error);
        return false;
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

/**
 * Deletes a user from the database by their ID.
 * Uses a transaction to ensure atomicity.
 * @param {number} id - The ID of the user to delete.
 * @returns {Promise<boolean>} True if deletion was successful, false otherwise.
 */
export async function deleteUser(id: number): Promise<boolean> {
    const sql = "DELETE FROM `User` WHERE `id` = ?";
    let connection: PoolConnection | null = null;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [result] = await connection.execute<ResultSetHeader>(sql, [id]);

        if (result.affectedRows === 0) {
            console.warn(
                `[userModel.ts] deleteUser ID: ${id}: User not found for deletion, or no rows affected.`
            );
            await connection.rollback();
            return false;
        }

        await connection.commit();
        return true;
    } catch (error) {
        if (connection) {
            // console.error already part of the original log
            await connection.rollback();
        }
        console.error(`[userModel.ts] Error in deleteUser for ID ${id}:`, error);
        return false;
    } finally {
        if (connection) {
            connection.release();
        }
    }
}
