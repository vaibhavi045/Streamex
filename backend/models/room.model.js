import mongoose from "mongoose";

// Define the schema for the Room model
const roomSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        unique: true // Ensure that each room has a unique roomId
    },
    videoUrl: {
        type: String,
        required: true, // Store the video URL as a required field
        validate: {
            validator: (value) => /^(https?:\/\/[^\s$.?#].[^\s]*)$/i.test(value),
            message: "Invalid video URL format."
        }
    },
    users: [
        {
            username: {
                type: String,
                required: true // Username of the user
            },
            socketId: {
                type: String,
                required: true // Store the socketId for real-time communication
            }
        }
    ],
    videoState: {
        isPlaying: {
            type: Boolean,
            default: false // Default value for isPlaying is false (paused state)
        },
        currentTime: {
            type: Number,
            default: 0 // Default time is 0 (video starts from the beginning)
        }
    },
    host: {
        type: String,
        required: true // Store the host's username
    },
    createdAt: {
        type: Date,
        default: Date.now // Automatically set the room creation timestamp
    }
});

// Create the Room model from the schema
const Room = mongoose.model("Room", roomSchema);

export default Room;
