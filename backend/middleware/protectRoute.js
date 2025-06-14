import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ENV_VARS } from "../config/envVars.js";

export const protectRoute = async (req, res, next) => {
    try {
        // Get the token from cookies
        const token = req.cookies["jwt-streamex"];
        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized - No token provided" });
        }

        // Verify the token
        let decoded;
        try {
            decoded = jwt.verify(token, ENV_VARS.JWT_SECRET);
        } catch (err) {
            if (err.name === "JsonWebTokenError") {
                return res.status(401).json({ success: false, message: "Unauthorized - Invalid token" });
            } else if (err.name === "TokenExpiredError") {
                return res.status(401).json({ success: false, message: "Unauthorized - Token expired" });
            } else {
                throw err; // Re-throw other unexpected errors
            }
        }

        // Find the user from the database
        const user = await User.findById(decoded.userId).select("-password").lean();
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Attach user to the request object
        req.user = user;

        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        if (ENV_VARS.NODE_ENV === "development") {
            console.error("Error in protectRoute middleware:", error.message);
        }
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

