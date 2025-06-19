import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import {
    createUser,
    findUserByEmail,
    updateUser,
    CreateUserInput,
    UpdateUserInput,
} from "../models/userModel";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined in environment variables.");
    process.exit(1); // Exit the process if JWT_SECRET is not set
}

const SALT_ROUNDS = 10;

// Helper function to generate JWT
const generateToken = (userId: number) => {
    return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "1h" });
};

export const register = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { name, email, password } = req.body;

    try {
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            res.status(400).json({
                message: "User already exists with this email try to login.",
            });
            return;
        }

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        const newUserInput: CreateUserInput = { name, email, passwordHash };
        const user = await createUser(newUserInput);

        const token = generateToken(user.id);

        // user is already UserOutput, so passwordHash is not present
        res.status(201).json({
            message: "User registered successfully",
            token,
            user: user, // user is already UserOutput
        });
    } catch (error) {
        console.error("Register error:", error);
        // Check if error is an instance of Error to safely access message
        const errorMessage =
            error instanceof Error ? error.message : "Could not register user.";
        res.status(500).json({
            message: "Could not register user.",
            error: errorMessage,
        });
    }
};

export const login = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { email, password } = req.body;

    try {
        const user = await findUserByEmail(email);
        if (!user) {
            res.status(401).json({ message: "Invalid credentials." }); // User not found
            return;
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            res.status(401).json({ message: "Invalid credentials." }); // Password incorrect
            return;
        }

        const token = generateToken(user.id);

        // Return only necessary user fields, exclude passwordHash
        const { passwordHash: _, ...userResponse } = user;
        res.status(200).json({ message: "Login successful", token, user: userResponse });
    } catch (error) {
        console.error("Login error:", error);
        const errorMessage =
            error instanceof Error ? error.message : "Could not log in user.";
        res.status(500).json({ message: "Could not log in user.", error: errorMessage });
    }
};

export const getProfile = async (req: Request, res: Response) => {
    // authMiddleware should have populated req.user
    if (!req.user) {
        // This case should ideally be caught by authMiddleware itself
        res.status(401).json({ message: "Not authenticated or user not found." });
        return;
    }
    // req.user is already UserOutput, so passwordHash is not present
    res.status(200).json({ message: "Profile fetched successfully", user: req.user });
};

export const logout = async (req: Request, res: Response) => {
    // For JWT, logout is primarily client-side (e.g., clearing the token).
    // No server-side session invalidation is strictly necessary unless implementing a token blacklist.
    res.status(200).json({ message: "Logout successful. Please clear your token." });
};

export const updateProfile = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    if (!req.user || typeof req.user.id !== "number") {
        // This should be caught by authMiddleware, but as a safeguard:
        res.status(401).json({ message: "Not authenticated or user ID missing." });
        return;
    }
    const userId = req.user.id;
    const { name, email } = req.body; // Assuming these are the fields to update

    // Construct the update object based on what's provided
    const updates: UpdateUserInput = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    // Note: Password updates should ideally be a separate, more secure endpoint.
    // Role updates are not supported by the current userModel.

    if (Object.keys(updates).length === 0) {
        res.status(400).json({ message: "No update information provided." });
        return;
    }

    try {
        // If email is being updated, check if the new email is already taken by another user
        if (email && email !== req.user.email) {
            const existingUserWithNewEmail = await findUserByEmail(email);
            if (existingUserWithNewEmail && existingUserWithNewEmail.id !== userId) {
                res.status(400).json({
                    message: "This email is already in use by another account.",
                });
                return;
            }
        }

        const updatedUser = await updateUser(userId, updates);
        // updatedUser is already UserOutput, so passwordHash is not present
        res.status(200).json({
            message: "Profile updated successfully",
            user: updatedUser, // updatedUser is already UserOutput
        });
    } catch (error) {
        console.error(`Update profile error for user ${userId}:`, error);
        const errorMessage =
            error instanceof Error ? error.message : "Could not update profile.";
        // Differentiate between "user not found" and other errors if possible from userModel
        if (errorMessage.includes("not found")) {
            res.status(404).json({
                message: "User not found for update.",
                error: errorMessage,
            });
        } else {
            res.status(500).json({
                message: "Could not update profile.",
                error: errorMessage,
            });
        }
    }
};
