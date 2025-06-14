import { v4 as uuidv4 } from "uuid";

/**
 * Function to generate a unique ID for either a Room or Movie
 * @param {string} type - The type of ID to generate ('room' or 'movie')
 * @returns {string} - A unique ID with a specific prefix
 * @throws {Error} - If an invalid type is provided
 */
export const generateId = (type) => {
    if (type === "room") {
        return `ROOM_${uuidv4()}`; // Generate a unique Room ID with a 'ROOM_' prefix
    } else if (type === "movie") {
        return `MOVIE_${uuidv4()}`; // Generate a unique Movie ID with a 'MOVIE_' prefix
    } else {
        throw new Error("Invalid type. Please specify 'room' or 'movie'.");
    }
};

