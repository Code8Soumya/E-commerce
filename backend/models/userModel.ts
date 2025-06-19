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
 * @returns {Promise<UserOutput>} The newly created user object, without the password hash.
 * @throws {Error} If user creation fails or the new user cannot be retrieved.
 */
export async function createUser(data: CreateUserInput): Promise<UserOutput> {
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
                    "[userModel.ts] createUser: Failed to retrieve user after creation (within transaction)."
                );
                await connection.rollback(); // Rollback before throwing
                throw new Error("Failed to retrieve user after creation.");
            }
        } else {
            await connection.rollback(); // Rollback before throwing
            throw new Error("User creation failed, no insertId returned.");
        }
    } catch (error) {
        if (connection) {
            console.error(
                "[userModel.ts] createUser: Error occurred. Rolling back transaction..."
            );
            await connection.rollback();
        }
        console.error("[userModel.ts] Error in createUser:", error);
        throw new Error("Could not create user.");
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
 * @throws {Error} If there's an issue querying the database.
 */
export async function findUserById(
    id: number,
    internalConnection?: PoolConnection
): Promise<UserOutput | null> {
    const sql = "SELECT * FROM `User` WHERE `id` = ?";
    let connection: PoolConnection | null = null;

    try {
        // Use internalConnection if provided, otherwise get a new one
        connection = internalConnection || (await pool.getConnection());

        const [rows] = await connection.execute<RowDataPacket[]>(sql, [id]);

        if (rows.length > 0) {
            const user: User = mapRowToUser(rows[0]);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { passwordHash, ...userOutput } = user;
            return userOutput;
        }
        return null;
    } catch (error) {
        console.error(
            `[userModel.ts] findUserById: Error finding user by ID ${id}:`,
            error
        );
        throw new Error(`Could not find user by ID ${id}.`);
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
 * @throws {Error} If there's an issue querying the database.
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
 * Retrieves all users from the database.
 * @returns {Promise<User[]>} An array of user objects.
 * @throws {Error} If there's an issue querying the database.
 */
export async function findAllUsers(): Promise<User[]> {
    const sql = "SELECT * FROM `User`";
    let connection: PoolConnection | null = null;

    try {
        connection = await pool.getConnection();
        const [rows] = await connection.execute<RowDataPacket[]>(sql);
        return rows.map(mapRowToUser);
    } catch (error) {
        console.error("[userModel.ts] findAllUsers: Error retrieving all users:", error);
        throw new Error("Could not retrieve all users.");
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
 * @returns {Promise<UserOutput>} The updated user object, without the password hash.
 * @throws {Error} If the user is not found, no changes are made, or the update fails.
 */
export async function updateUser(
    id: number,
    updates: UpdateUserInput
): Promise<UserOutput> {
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
        // No valid fields to update, retrieve and return current user or throw if not found
        const currentUser = await findUserById(id); // Uses its own connection management
        if (!currentUser) {
            throw new Error(
                `User with id ${id} not found, and no update fields provided.`
            );
        }
        return currentUser; // Return current user if no updates are to be made
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
                await connection.rollback();
                throw new Error(`User with id ${id} not found for update.`);
            }
            // If user exists but affectedRows is 0, it means data was same
            // In this case, we can commit and return the user
            // Or, if strict "change must occur" is needed, throw error.
            // For now, let's assume "no change" is not an error if user exists.
            // The prompt says: "If the update affects 0 rows (and the entity should exist), throw an error"
            // So, if userExists, this means no actual data change.
            console.warn(
                `[userModel.ts] updateUser ID: ${id}: No changes made to user data.`
            );
            await connection.rollback(); // As per instruction to throw error if 0 rows affected and entity should exist
            throw new Error(
                `User with id ${id} found, but no data was changed by the update.`
            );
        }

        const updatedUser = await findUserById(id, connection); // Use the same transaction connection
        if (!updatedUser) {
            // This should not happen if affectedRows > 0
            console.error(
                `[userModel.ts] updateUser ID: ${id}: Failed to retrieve user after update (within transaction).`
            );
            await connection.rollback();
            throw new Error("Failed to retrieve user after update.");
        }

        await connection.commit();
        return updatedUser;
    } catch (error) {
        if (connection) {
            console.error(
                `[userModel.ts] updateUser ID: ${id}: Error occurred. Rolling back transaction...`
            );
            await connection.rollback();
        }
        // Avoid re-throwing generic error if a specific one was already thrown
        if (error instanceof Error && error.message.startsWith("User with id")) {
            throw error;
        }
        if (
            error instanceof Error &&
            error.message.startsWith("Failed to retrieve user after update")
        ) {
            throw error;
        }
        console.error(`[userModel.ts] Error in updateUser for ID ${id}:`, error);
        throw new Error(`Could not complete user update for ID ${id}.`);
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
 * @returns {Promise<void>} Resolves if deletion is successful.
 * @throws {Error} If the user is not found or deletion fails.
 */
export async function deleteUser(id: number): Promise<void> {
    const sql = "DELETE FROM `User` WHERE `id` = ?";
    let connection: PoolConnection | null = null;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [result] = await connection.execute<ResultSetHeader>(sql, [id]);

        if (result.affectedRows === 0) {
            await connection.rollback(); // Rollback before throwing
            console.warn(
                `[userModel.ts] deleteUser ID: ${id}: User not found for deletion.`
            );
            throw new Error(`User with id ${id} not found for deletion.`);
        }

        await connection.commit();
    } catch (error) {
        if (connection) {
            console.error(
                `[userModel.ts] deleteUser ID: ${id}: Error occurred. Rolling back transaction...`
            );
            await connection.rollback();
        }
        if (error instanceof Error && error.message.startsWith("User with id")) {
            throw error;
        }
        console.error(`[userModel.ts] Error in deleteUser for ID ${id}:`, error);
        throw new Error(`Could not delete user with ID ${id}.`);
    } finally {
        if (connection) {
            connection.release();
        }
    }
}
