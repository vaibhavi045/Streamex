import Room from "../models/room.model.js";

// Create a new room
export const createRoom = async (req, res) => {
    try {
        const { roomId, videoUrl } = req.body;

        // Check if the room already exists
        const roomExists = await Room.findOne({ roomId });
        if (roomExists) {
            return res.status(400).json({ message: "Room already exists." });
        }

        // Validate video URL format if provided
        const isValidUrl = videoUrl ? /^(https?:\/\/[^\s$.?#].[^\s]*)$/i.test(videoUrl) : true;
        if (videoUrl && !isValidUrl) {
            return res.status(400).json({ message: "Invalid video URL format." });
        }

        // Create a new room
        const newRoom = new Room({
            roomId,
            users: [], // Empty initially
            videoUrl, // Store video URL in the room
            videoState: { isPlaying: false, currentTime: 0 },
            host: req.user.username // Assign the creator as the host
        });

        // Save the new room to the database
        await newRoom.save();

        res.status(201).json({ message: "Room created successfully.", room: newRoom });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating room." });
    }
};

// Join an existing room
export const joinRoom = async (req, res) => {
    try {
        const { roomId, username, socketId } = req.body;

        // Find the room by roomId
        let room = await Room.findOne({ roomId });
        if (!room) {
            return res.status(404).json({ message: "Room not found." });
        }

        // Check if room has space (limit to 5 users)
        if (room.users.length >= 5) {
            return res.status(400).json({ message: "Room is full. Maximum 5 users allowed." });
        }

        // Check if the user is already in the room (prevent duplicates)
        const userExists = room.users.some((user) => user.username === username);
        if (!userExists) {
            // Add the new user to the room
            room.users.push({ username, socketId });
            await room.save();
        }

        // Emit the updated room details (video URL, users, host) to all clients in the room
        req.io.to(roomId).emit("roomDetails", {
            videoUrl: room.videoUrl,
            users: room.users,
            host: room.host,
        });

        res.status(200).json({
            message: "Joined room successfully.",
            room: {
                videoUrl: room.videoUrl,
                users: room.users,
                host: room.host,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error joining room." });
    }
};

// Get room details (for sync)
export const getRoomDetails = async (req, res) => {
    try {
        const { roomId } = req.params;

        // Find the room by roomId
        const room = await Room.findOne({ roomId });

        if (!room) {
            return res.status(404).json({ message: "Room not found." });
        }

        // Send room details as response
        res.status(200).json({
            room: {
                videoUrl: room.videoUrl,
                users: room.users,
                videoState: room.videoState,
                host: room.host,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error retrieving room details." });
    }
};
