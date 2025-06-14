import express from "express";
import { createRoom, joinRoom, getRoomDetails } from "../controllers/room.controller.js";
import { protectRoute } from "../middleware/protectRoute.js";
import { isUserVerified } from "../middleware/isUserVerified.js";

const router = express.Router();

/**
 * Route to create a room
 * Ensures the user is authenticated and verified.
 * The roomId and videoUrl are passed in the request body.
 */
router.post("/create-room", protectRoute, isUserVerified, createRoom);

/**
 * Route to join an existing room
 * Ensures the user is authenticated and verified.
 * The roomId and username are passed in the request body.
 */
router.post("/join-room", protectRoute, isUserVerified, joinRoom);

/**
 * Route to get room details (video URL, current users, video state, host)
 * Ensures the user is authenticated and verified.
 * The roomId is passed as a URL parameter.
 */
router.get(
    "/room-details/:roomId",
    protectRoute,
    isUserVerified,
    getRoomDetails
);

export default router;
