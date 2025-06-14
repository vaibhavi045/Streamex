import { useEffect, useState, useRef, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import ReactPlayer from "react-player";
import "../store/vtapp.css";

const socket = io("http://localhost:5000"); // Ensure this points to the correct server

const VirtualTheatre = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);

    const roomIdFromParams = queryParams.get("roomId") || "";
    const videoUrlFromParams = queryParams.get("videoUrl") || ""; // Extract videoUrl from query params
    const [roomId, setRoomId] = useState(roomIdFromParams);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [chatMessages, setChatMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [roomFull, setRoomFull] = useState(false);
    const [users, setUsers] = useState([]);
    const [isChatVisible, setIsChatVisible] = useState(false);
    const [isUsersVisible, setIsUsersVisible] = useState(false);
    const [videoUrl, setVideoUrl] = useState(videoUrlFromParams); // Set initial videoUrl from query params
    const [host, setHost] = useState("");
    const playerRef = useRef();
    const navigate = useNavigate();

    useEffect(() => {
        if (roomId) {
            socket.emit("joinRoom", { roomId, username: `User_${Math.random().toFixed(3)}` });
        }

        socket.on("playPause", (playStatus) => {
            setIsPlaying(playStatus);
        });

        socket.on("seek", (time) => {
            if (playerRef.current) {
                playerRef.current.seekTo(time, "seconds");
            }
        });

        socket.on("chatMessage", (newMessage) => {
            setChatMessages((prev) => [...prev, newMessage]);
        });

        socket.on("syncState", (state) => {
            setIsPlaying(state.isPlaying || false);
            setCurrentTime(state.currentTime || 0);
            if (playerRef.current) {
                playerRef.current.seekTo(state.currentTime || 0, "seconds");
            }
        });

        socket.on("roomFull", (message) => {
            setRoomFull(true);
            alert(message);
        });

        socket.on("updateUserList", (updatedUsers) => {
            setUsers(updatedUsers);
        });

        socket.on("roomDetails", ({ videoUrl, users, host }) => {
            setVideoUrl(videoUrl); // Set the video URL if it's updated from the server
            setUsers(users); // Set the list of users
            setHost(host); // Set the host
        });

        return () => {
            socket.disconnect();
        };
    }, [roomId]);

    const handlePlayPause = () => {
        const newStatus = !isPlaying;
        setIsPlaying(newStatus);
        socket.emit("playPause", { roomId, isPlaying: newStatus });
    };

    const handleSeek = (time) => {
        setCurrentTime(time);
        socket.emit("seek", { roomId, currentTime: time });
    };

    const handleBackButton = () => {
        navigate(-1);
    };

    const handleShareRoom = () => {
        const shareableLink = `${window.location.origin}/virtual-theatre?roomId=${roomId}&videoUrl=${encodeURIComponent(videoUrl)}`;
        navigator.clipboard.writeText(shareableLink).then(() => {
            alert("Room link copied to clipboard!");
        }).catch(() => {
            alert("Failed to copy the room link.");
        });
    };

    const handleEndVirtualTheatre = () => {
        navigate('/');
    };

    const sendMessage = () => {
        if (message.trim() !== "") {
            const newMessage = `You: ${message}`;
            socket.emit("chatMessage", { roomId, message: newMessage });
            setChatMessages((prev) => [...prev, newMessage]);
            setMessage("");
        }
    };

    const [isEmojiPickerVisible, setIsEmojiPickerVisible] = useState(false);

    // Function to handle emoji selection
    const handleEmojiSelect = (emoji) => {
        const newMessage = message + emoji; // Append emoji to current message
        setMessage(newMessage);
        setIsEmojiPickerVisible(false); // Hide emoji picker after selection
    };

    const toggleChat = () => {
        setIsChatVisible(true);
        setIsUsersVisible(false);
    };

    const toggleUsers = () => {
        setIsUsersVisible(true);
        setIsChatVisible(false);
    };

    // Filter users based on search
    const filteredUsers = useMemo(() => {
        return users.filter(user => user.username.toLowerCase().includes(message.toLowerCase()));
    }, [users, message]);

    if (roomFull) {
        return (
            <div className="room-full">
                <h2>The room is full. Please try again later.</h2>
                <button onClick={handleBackButton}>Go Back</button>
            </div>
        );
    }

    return (
        <div className="virtual-theatre">
            <div className="header">
                <button onClick={handleBackButton} className="back-button">Back</button>
                <div className="title-container">
                    <h1>Streamex Virtual Theatre</h1>
                    <p>Room ID: <strong>{roomId}</strong></p>
                    <p>Host: <strong>{host}</strong></p>
                </div>
                <div className="header-buttons">
                    <button onClick={handleShareRoom} className="share-room-button">Share Room</button>
                    <button onClick={handleEndVirtualTheatre} className="end-theatre-button">End Virtual Theatre</button>
                </div>
            </div>

            <div className="main-content">
                <div className="player-container">
                    {videoUrl ? (
                        <ReactPlayer
                            ref={playerRef}
                            url={videoUrl}
                            playing={isPlaying}
                            onPlay={handlePlayPause}
                            onPause={handlePlayPause}
                            onProgress={({ playedSeconds }) => setCurrentTime(playedSeconds)}
                            onSeek={handleSeek}
                            controls
                            width="100%"
                            height="100%"
                        />
                    ) : (
                        <p>No video URL provided</p>
                    )}

                    <div className="controls">
                        <button onClick={handlePlayPause}>{isPlaying ? "Pause" : "Play"}</button>
                    </div>
                </div>

                <div className="toggle-section">
                    {isChatVisible && (
                        <div className="chat-section">
                            <h3 className="chat-header">Chats</h3>
                            <div className="chat-box">
                                {chatMessages.map((msg, index) => (
                                    <div className={`chat-message ${msg.includes("You:") ? "user" : ""}`} key={index}>
                                        <p>{msg}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="chat-input">
                                <input
                                    type="text"
                                    placeholder="Type a message"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                />
                                <button onClick={sendMessage}>Send</button>
                                <div className="emoji-picker">
                                    <button
                                        className="emoji-button"
                                        onClick={() => setIsEmojiPickerVisible((prev) => !prev)}
                                    >
                                        😀
                                    </button>
                                    {isEmojiPickerVisible && (
                                        <div className="emoji-dropdown">
                                            <span onClick={() => handleEmojiSelect("😀")}>😀</span>
                                            <span onClick={() => handleEmojiSelect("❤️")}>❤️</span>
                                            <span onClick={() => handleEmojiSelect("😂")}>😂</span>
                                            <span onClick={() => handleEmojiSelect("👍")}>👍</span>
                                            <span onClick={() => handleEmojiSelect("👎")}>👎</span>
                                            <span onClick={() => handleEmojiSelect("😮")}>😮</span>
                                            <span onClick={() => handleEmojiSelect("😢")}>😢</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {isUsersVisible && (
                        <div className="user-list">
                            <h3>Users in the Room:</h3>
                            <input
                                type="text"
                                placeholder="Search users"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                            <ul>
                                {filteredUsers.map((user, index) => (
                                    <li key={index}>
                                        <div className="user-avatar"></div>
                                        <span className="user-name">{user.username}</span>
                                        <div className="online-status"></div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            {/* Buttons in horizontal layout at bottom-right */}
            <div className="circle-buttons">
                <button className="circle-button" onClick={toggleChat}>
                    <img src="chatbutton.jpg" alt="Chat" />
                </button>
                <button className="circle-button" onClick={toggleUsers}>
                    <img src="userbutton.jpg" alt="Users" />
                </button>
            </div>
        </div>
    );
};

export default VirtualTheatre;
