import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { findUserById, UserOutput } from "../models/userModel"; // Import UserOutput, removed User

// It's crucial to use a strong, unique secret and store it in environment variables
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined in environment variables.");
    process.exit(1); // Exit the process if JWT_SECRET is not set
}

// Extend Express Request type to include 'user'
declare global {
    namespace Express {
        interface Request {
            user?: UserOutput; // Changed to UserOutput
        }
    }
}

interface JwtPayload {
    id: number;
    // Add other properties you might include in the JWT payload, e.g., role
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ message: "Access denied. No token provided." });
        return;
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        res.status(401).json({ message: "Access denied. Token missing." });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

        if (!decoded || typeof decoded.id !== "number") {
            res.status(401).json({ message: "Invalid token payload." });
            return;
        }

        const user = await findUserById(decoded.id);

        if (!user) {
            res.status(401).json({ message: "User not found for the provided token." });
            return;
        }

        req.user = user;
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({ message: "Token expired." });
            return;
        }
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({ message: "Invalid token." });
            return;
        }
        console.error("Auth middleware error:", error);
        res.status(500).json({ message: "Failed to authenticate token." });
        return;
    }
};
