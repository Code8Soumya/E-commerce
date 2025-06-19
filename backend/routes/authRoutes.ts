import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { loginValidator, registerValidator } from "../libs/authValidation";
import {
    register,
    login,
    getProfile,
    logout,
    updateProfile,
} from "../controllers/authController";

const authRouter = express.Router();

// POST /api/auth/register
authRouter.post("/register", registerValidator, register);

// POST /api/auth/login
authRouter.post("/login", loginValidator, login);

// GET /api/auth/profile - Protected
authRouter.get("/profile", authMiddleware, getProfile);

authRouter.get("/UpdateProfile", authMiddleware, updateProfile);

export default authRouter;
