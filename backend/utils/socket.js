import Room from "../models/room.model.js";

// Main socket.io instance should be passed or be globally accessible
let io; // Define io here to be used inside functions

// Set the socket instance to be used across functions
export const setIO = (socketIO) => {
    io = socketIO;
};

export const handleJoinRoom = async (socket, roomId, username) => {
    try {
        // Find the room
        const room = await Room.findOne({ roomId });

        if (!room) {
            socket.emit("roomNotFound", "Room not found.");
            return;
        }

        // Check if the user is already in the room
        const userExists = room.users.some((user) => user.socketId === socket.id);
        if (!userExists) {
            // Add user to the room's user list
            room.users.push({ username, socketId: socket.id });
            await room.save();

            // Notify others in the room about the new user
            socket.to(roomId).emit("userJoined", { username, users: room.users });
        }

        // Add the user to the socket.io room
        socket.join(roomId);

        // Emit the current video URL and user list to the joining user
        socket.emit("roomDetails", {
            videoUrl: room.videoUrl,
            users: room.users,
            host: room.host,
        });

        console.log(`${username} joined room ${roomId}`);
    } catch (error) {
        console.error("Error handling join room:", error);
        socket.emit("error", "Failed to join room.");
    }
};

export const syncRoomState = async (socket, roomId) => {
    try {
        const room = await Room.findOne({ roomId });

        if (room) {
            socket.emit("syncRoomState", {
                isPlaying: room.videoState.isPlaying,
                currentTime: room.videoState.currentTime,
            });
        }
    } catch (error) {
        console.error("Error syncing room state:", error);
        socket.emit("error", "Failed to sync room state.");
    }
};

// Handle play/pause state change
export const handlePlayPause = async (socket, roomId, isPlaying) => {
    try {
        await Room.findOneAndUpdate(
            { roomId },
            { $set: { "videoState.isPlaying": isPlaying } },
            { new: true }
        );
        io.to(roomId).emit("playPause", isPlaying); // Emit to everyone in the room
    } catch (err) {
        console.error("Error updating play/pause state:", err);
        socket.emit("error", "Error updating play/pause state.");
    }
};

// Handle video seek to a specific time
export const handleSeek = async (socket, roomId, currentTime) => {
    try {
        await Room.findOneAndUpdate(
            { roomId },
            { $set: { "videoState.currentTime": currentTime } },
            { new: true }
        );
        io.to(roomId).emit("seek", currentTime); // Emit to everyone in the room
    } catch (err) {
        console.error("Error updating seek time:", err);
        socket.emit("error", "Error updating seek time.");
    }
};

// Handle chat message
export const handleChatMessage = (socket, roomId, message) => {
    if (!message || message.trim() === "") return;

    if (message.length > 500) {
        socket.emit("error", "Message is too long.");
        return;
    }

    io.to(roomId).emit("chatMessage", {
        username: socket.username || "Anonymous",
        message,
    });
};

// Handle user disconnect
export const handleUserDisconnect = async (socket) => {
    try {
        // Find the room the user is in
        const room = await Room.findOne({ "users.socketId": socket.id });
        if (room) {
            // Remove the user from the room's user list
            room.users = room.users.filter((user) => user.socketId !== socket.id);
            await room.save();

            // Emit updated user list to all users in the room
            io.to(room.roomId).emit("updateUserList", room.users);

            console.log(`User ${socket.id} disconnected from room ${room.roomId}`);

            // If no users are left in the room, delete the room
            if (room.users.length === 0) {
                await Room.deleteOne({ roomId: room.roomId });
                console.log(`Room ${room.roomId} deleted as it is empty.`);
            } else {
                // Notify other users of the disconnection
                io.to(room.roomId).emit("chatMessage", `A user has left the room.`);
            }
        }
    } catch (error) {
        console.error("Error handling user disconnect:", error);
    }
};
