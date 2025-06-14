import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import authRoutes from "./routes/auth.route.js";
import movieRoutes from "./routes/movie.route.js";
import tvRoutes from "./routes/tv.route.js";
import searchRoutes from "./routes/search.route.js";
import roomRoutes from "./routes/room.routes.js"; // Import the room routes

import { ENV_VARS } from "./config/envVars.js";
import { connectDB } from "./config/db.js";
import { protectRoute } from "./middleware/protectRoute.js";

import {
    handleJoinRoom,
    handlePlayPause,
    handleSeek,
    handleChatMessage,
    handleUserDisconnect,
    syncRoomState
} from "./utils/socket.js";
import Room from "./models/room.model.js";
import { generateId } from "./utils/generateId.js"; // Updated helper to generate both Room ID and Movie ID

const app = express();
const __dirname = path.resolve();

// Middleware
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/movie", protectRoute, movieRoutes);
app.use("/api/v1/tv", protectRoute, tvRoutes);
app.use("/api/v1/search", protectRoute, searchRoutes);
app.use("/api/v1/room", roomRoutes); // Register the room routes

// Serve frontend in production
if (ENV_VARS.NODE_ENV === "production") {
    const staticPath = path.join(__dirname, "/frontend/dist");
    app.use(express.static(staticPath));
    app.get("*", (req, res) => {
        res.sendFile(path.resolve(staticPath, "index.html"));
    });
}

// Global Error Handling Middleware (catch all errors)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: "Internal Server Error. Please try again later.",
    });
});

// Connect to DB and Start the Server
connectDB()
    .then(() => {
        console.log("Connected to database successfully.");

        // Create HTTP server
        const server = createServer(app);

        // Initialize Socket.IO
        const io = new Server(server, {
            cors: {
                origin: ENV_VARS.NODE_ENV === "production" ? ENV_VARS.CLIENT_URL : "*",
                methods: ["GET", "POST"],
            },
        });

        // Socket.IO Events
        io.on("connection", (socket) => {
            console.log("A user connected:", socket.id);
            let currentRoom = null;

            // Handle user joining room
            socket.on("joinRoom", async ({ roomId, username }) => {
                try {
                    if (!roomId) {
                        // Generate a unique room ID if not provided
                        roomId = generateId("room");
                    }

                    // Check if room exists and if it's full
                    const existingRoom = await Room.findOne({ roomId });
                    if (existingRoom && existingRoom.users.length >= 10) {  // Assuming max 10 users per room
                        socket.emit("roomFull", "This room is full. Please try again later.");
                        return;
                    }

                    // Join the room
                    currentRoom = roomId;
                    await handleJoinRoom(socket, roomId, username);

                    // Sync room state with the new user
                    await syncRoomState(socket, roomId);
                } catch (error) {
                    console.error(`Error joining room: ${error.message}`);
                    socket.emit("error", "Failed to join the room. Please try again.");
                }
            });

            // Handle play/pause toggle
            socket.on("playPause", async ({ roomId, isPlaying }) => {
                try {
                    await Room.findOneAndUpdate(
                        { roomId },
                        { $set: { "videoState.isPlaying": isPlaying } },
                        { new: true }
                    );
                    socket.to(roomId).emit("playPause", isPlaying);
                } catch (error) {
                    console.error("Error updating play/pause state:", error);
                    socket.emit("error", "Failed to update play/pause state.");
                }
            });

            // Handle seeking to a specific time
            socket.on("seek", async ({ roomId, currentTime }) => {
                try {
                    await Room.findOneAndUpdate(
                        { roomId },
                        { $set: { "videoState.currentTime": currentTime } },
                        { new: true }
                    );
                    socket.to(roomId).emit("seek", currentTime);
                } catch (error) {
                    console.error("Error updating seek time:", error);
                    socket.emit("error", "Failed to update seek time.");
                }
            });

            // Handle chat messages
            socket.on("chatMessage", ({ roomId, message }) => {
                try {
                    handleChatMessage(socket, roomId, message);
                } catch (error) {
                    console.error("Error handling chat message:", error);
                    socket.emit("error", "Failed to send chat message.");
                }
            });

            // Handle user disconnect
            socket.on("disconnect", async () => {
                if (currentRoom) {
                    console.log(`User disconnected from room: ${currentRoom}`);
                    socket.to(currentRoom).emit("chatMessage", "A user has left the room.");
                    try {
                        await handleUserDisconnect(socket, currentRoom);
                    } catch (error) {
                        console.error(`Error handling user disconnect: ${error.message}`);
                    }
                }
            });
        });

        // Start server
        const port = ENV_VARS.PORT || 5000;
        server.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });

    })
    .catch((error) => {
        console.error("Error connecting to database:", error.message);
    });
