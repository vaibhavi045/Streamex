import Room from "../models/room.model.js";

export const syncRoomState = async (socket, roomId) => {
    try {
        const room = await Room.findOne({ roomId });
        if (room) {
            // Emit video state (play/pause, current time) to the new user
            socket.emit("syncState", room.videoState);
        }
    } catch (error) {
        console.error("Error syncing room state:", error);
        socket.emit("error", "Failed to sync room state.");
    }
};
