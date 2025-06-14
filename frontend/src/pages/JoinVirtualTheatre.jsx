import { useState } from "react";
import { useNavigate } from "react-router-dom";

const JoinVirtualTheatre = () => {
    const [roomId, setRoomId] = useState(""); // State to store the room ID
    const [username, setUsername] = useState(""); // State to store the username
    const [videoUrl, setVideoUrl] = useState(""); // State to store the video URL
    const navigate = useNavigate();

    const handleJoinRoom = () => {
        if (roomId.trim() === "") {
            alert("Please enter a valid Room ID.");
            return;
        }

        if (username.trim() === "") {
            alert("Please enter a username.");
            return;
        }

        // If a video URL is provided, validate it
        const isValidUrl = videoUrl ? /^(https?:\/\/[^\s$.?#].[^\s]*)$/i.test(videoUrl) : true;

        if (videoUrl && !isValidUrl) {
            alert("Please enter a valid video URL.");
            return;
        }

        // Construct the URL to navigate to the room
        const roomUrl = `/virtual-theatre?roomId=${roomId}&username=${encodeURIComponent(
            username
        )}${videoUrl ? `&videoUrl=${encodeURIComponent(videoUrl)}` : ""}`;

        navigate(roomUrl);
    };

    return (
        <div className="h-screen bg-black text-white flex flex-col items-center justify-center">
            <h1 className="text-4xl font-bold mb-6">Join Virtual Theatre</h1>
            <div className="flex flex-col gap-4">
                <input
                    type="text"
                    placeholder="Enter Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="p-2 text-black rounded w-64"
                />
                <input
                    type="text"
                    placeholder="Enter Room ID"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    className="p-2 text-black rounded w-64"
                />
                <input
                    type="text"
                    placeholder="Enter Video URL (Optional)"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="p-2 text-black rounded w-64"
                />
                <button
                    onClick={handleJoinRoom}
                    className="bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded"
                >
                    Join Room
                </button>
            </div>
        </div>
    );
};

export default JoinVirtualTheatre;
