import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Define the user schema
const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: [3, "Username must be at least 3 characters long"],
            maxlength: [20, "Username cannot exceed 20 characters"],
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true, // Store email in lowercase
            trim: true, // Remove leading/trailing whitespace
            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                "Please enter a valid email address",
            ], // Regex for email validation
        },
        password: {
            type: String,
            required: true,
            validate: {
                validator: function (value) {
                    // Ensure password has at least 8 characters, including uppercase, lowercase, number, and special character
                    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value);
                },
                message: "Password must be at least 8 characters long, with uppercase, lowercase, number, and special character",
            },
        },
        image: {
            type: String,
            default: "/default-avatar.png", // Default profile image
        },
        searchHistory: {
            type: [String], // Array of strings for storing search history
            default: [],
        },
        resetPasswordToken: {
            type: String,
            default: null, // Token for resetting password
        },
        resetPasswordExpiresAt: {
            type: Date,
            default: null, // Expiry time for reset password token
        },
        isVerified: {
            type: Boolean,
            default: true, // Set to `true` since email verification is no longer required
        },
    },
    { timestamps: true } // Add createdAt and updatedAt fields automatically
);

// Add indexes to frequently queried fields for performance optimization
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ isVerified: 1 });

// Hash the password before saving the user
userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        const salt = await bcrypt.genSalt(10); // Generate a salt for the hash
        this.password = await bcrypt.hash(this.password, salt); // Hash the password
    }
    next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password); // Compare plain text with hashed password
};

// Export the User model
export const User = mongoose.model("User", userSchema);


