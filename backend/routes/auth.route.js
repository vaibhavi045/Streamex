import express from "express";
import {
    signup,
    login,
    logout,
    authCheck,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

// Public Routes
router.post("/signup", signup); // User signup
router.post("/login", login); // User login
router.post("/logout", logout); // User logout

// Protected Routes
router.get("/authCheck", protectRoute, authCheck); // Check authentication status

export default router;
