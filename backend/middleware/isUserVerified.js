import { User } from "../models/user.model.js";  // Assuming you have a User model

// Middleware to check if the user is verified
export const isUserVerified = async (req, res, next) => {
    try {
        const userId = req.user.id;  // Assuming the user ID is stored in the req.user after authentication

        // Find the user in the database
        const user = await User.findById(userId);

        // Check if the user exists and is verified
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        if (!user.isVerified) {
            return res.status(403).json({ success: false, message: "User is not verified." });
        }

        // If the user is verified, allow the request to proceed
        next();
    } catch (error) {
        console.error("Error checking user verification:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
