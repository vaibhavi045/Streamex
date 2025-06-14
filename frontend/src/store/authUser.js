import axios from "axios";
import toast from "react-hot-toast";
import { create } from "zustand";

export const useAuthStore = create((set) => ({
    user: null,
    isSigningUp: false,
    isCheckingAuth: true,
    isLoggingOut: false,
    isLoggingIn: false,

    // Signup function
    signup: async (credentials) => {
        set({ isSigningUp: true });
        try {
            const { data } = await axios.post("/api/v1/auth/signup", credentials);
            set({ user: data.user, isSigningUp: false });
            toast.success("Account created successfully!");
        } catch (error) {
            const message =
                error.response?.data?.message || "Signup failed. Please try again.";
            toast.error(message);
            set({ isSigningUp: false, user: null });
        }
    },

    // Login function
    login: async (credentials) => {
        set({ isLoggingIn: true });
        try {
            const { data } = await axios.post("/api/v1/auth/login", credentials);
            set({ user: data.user, isLoggingIn: false });
            toast.success("Logged in successfully!");
        } catch (error) {
            const message =
                error.response?.data?.message || "Login failed. Please try again.";
            toast.error(message);
            set({ isLoggingIn: false, user: null });
        }
    },

    // Logout function
    logout: async () => {
        set({ isLoggingOut: true });
        try {
            await axios.post("/api/v1/auth/logout");
            set({ user: null, isLoggingOut: false });
            toast.success("Logged out successfully!");
        } catch (error) {
            const message =
                error.response?.data?.message || "Logout failed. Please try again.";
            toast.error(message);
            set({ isLoggingOut: false });
        }
    },

    // Authentication check
    authCheck: async () => {
        set({ isCheckingAuth: true });
        try {
            const { data } = await axios.get("/api/v1/auth/authCheck");
            set({ user: data.user, isCheckingAuth: false });
        } catch (error) {
            const message =
                error.response?.data?.message || "Failed to verify authentication.";
            toast.error(message);
            set({ isCheckingAuth: false, user: null });
        }
    },
}));
