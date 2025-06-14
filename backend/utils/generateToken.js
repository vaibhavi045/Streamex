import jwt from "jsonwebtoken";
import { ENV_VARS } from "../config/envVars.js";

export const generateTokenAndSetCookie = (userId, res) => {
    // Generate the JWT token with the user's ID as payload
    const token = jwt.sign({ userId }, ENV_VARS.JWT_SECRET, {
        expiresIn: "15d", // Token validity for 15 days
    });

    // Set the token in an HTTP-only cookie with security options
    res.cookie("jwt-streamex", token, {
        maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days in milliseconds
        httpOnly: true, // Prevent access by JavaScript to mitigate XSS attacks
        sameSite: "strict", // Mitigate CSRF attacks
        secure: ENV_VARS.NODE_ENV === "production", // Ensure cookies are secure in production
    });

    return token; // Return the token for further use (if needed)
};

