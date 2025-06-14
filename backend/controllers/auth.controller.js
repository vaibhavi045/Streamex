import { User } from "../models/user.model.js";
import bcryptjs from "bcryptjs";
import { generateTokenAndSetCookie } from "../utils/generateToken.js";

const PASSWORD_MIN_LENGTH = 6; // Centralized password minimum length for consistency

// Signup Controller
export async function signup(req, res) {
    try {
        const { email, password, username } = req.body;

        // Validation: Check if all fields are provided
        if (!email || !password || !username) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        // Validation: Email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: "Invalid email format" });
        }

        // Validation: Password length
        if (password.length < PASSWORD_MIN_LENGTH) {
            return res
                .status(400)
                .json({ success: false, message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` });
        }

        // Check for existing email or username
        const existingUser = await User.findOne({
            $or: [{ email: email }, { username: username }],
        });
        if (existingUser) {
            const message =
                existingUser.email === email
                    ? "Email already exists"
                    : "Username already exists";
            return res.status(400).json({ success: false, message });
        }

        // Hash the password
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(password, salt);

        // Assign a random profile picture
        const PROFILE_PICS = ["/avatar1.png", "/avatar2.png", "/avatar3.png"];
        const image = PROFILE_PICS[Math.floor(Math.random() * PROFILE_PICS.length)] || "/default-avatar.png";

        // Create new user
        const newUser = new User({
            email,
            password: hashedPassword,
            username,
            image,
        });

        // Save the user and set the token
        await newUser.save();
        generateTokenAndSetCookie(newUser._id, res);

        res.status(201).json({
            success: true,
            user: { ...newUser._doc, password: "" }, // Return user data without the password
        });
    } catch (error) {
        console.error("Error in signup controller:", error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

// Login Controller
export async function login(req, res) {
    try {
        const { email, password } = req.body;

        // Validation: Check if all fields are provided
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        // Check if the user exists
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(404).json({ success: false, message: "Invalid credentials" });
        }

        // Validate the password
        const isPasswordCorrect = await bcryptjs.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }

        // Generate token and set cookie
        generateTokenAndSetCookie(user._id, res);

        res.status(200).json({
            success: true,
            user: { ...user._doc, password: "" }, // Return user data without the password
        });
    } catch (error) {
        console.error("Error in login controller:", error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

// Logout Controller
export async function logout(req, res) {
    try {
        // Clear the JWT cookie
        res.clearCookie("jwt-streamex", { httpOnly: true, secure: true });
        res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        console.error("Error in logout controller:", error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

// Auth Check Controller
export async function authCheck(req, res) {
    try {
        // Ensure the `req.user` is correctly populated by the middleware
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        res.status(200).json({ success: true, user: req.user });
    } catch (error) {
        console.error("Error in authCheck controller:", error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}
