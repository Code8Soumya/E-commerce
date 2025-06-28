import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import {
    loginValidator,
    registerValidator,
    updateProfileValidator,
} from "../libs/authValidation"; // Added updateProfileValidator
import {
    register,
    login,
    getProfile,
    updateProfile,
} from "../controllers/authController";

const authRouter = express.Router();

// POST /api/auth/register
authRouter.post("/register", registerValidator, register);

// POST /api/auth/login
authRouter.post("/login", loginValidator, login);

// GET /api/auth/profile - Protected
authRouter.get("/profile", authMiddleware, getProfile);

// PUT /api/auth/profile - Protected (for updating profile)
authRouter.put("/UpdateProfile", authMiddleware, updateProfileValidator, updateProfile);

export default authRouter;
