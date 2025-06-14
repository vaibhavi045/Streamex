import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useContentStore } from "../store/content";
import axios from "axios";
import { useNavigate } from 'react-router-dom';

import Navbar from "../components/Navbar";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ReactPlayer from "react-player";
import io from "socket.io-client";
import { ORIGINAL_IMG_BASE_URL, SMALL_IMG_BASE_URL } from "../utils/constants";
import { formatReleaseDate } from "../utils/dateFunction";
import WatchPageSkeleton from "../components/skeletons/WatchPageSkeleton";

// Initialize Socket.IO
const socket = io("http://localhost:3001");

const WatchPage = () => {
    const { id } = useParams();
    const [trailers, setTrailers] = useState([]);
    const [currentTrailerIdx, setCurrentTrailerIdx] = useState(0);
    const [loading, setLoading] = useState(true);
    const [content, setContent] = useState({});
    const [similarContent, setSimilarContent] = useState([]);
    const { contentType } = useContentStore();

    const sliderRef = useRef(null);
    const playerRef = useRef(null);

    // Virtual Theatre States
    const [virtualTheatre, setVirtualTheatre] = useState(false);
    const [roomId, setRoomId] = useState("");
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);

    useEffect(() => {
        const getTrailers = async () => {
            try {
                const res = await axios.get(`/api/v1/${contentType}/${id}/trailers`);
                setTrailers(res.data.trailers);
            } catch (error) {
                if (error.message.includes("404")) {
                    setTrailers([]);
                }
            }
        };

        getTrailers();
    }, [contentType, id]);

    useEffect(() => {
        const getSimilarContent = async () => {
            try {
                const res = await axios.get(`/api/v1/${contentType}/${id}/similar`);
                setSimilarContent(res.data.similar);
            } catch (error) {
                if (error.message.includes("404")) {
                    setSimilarContent([]);
                }
            }
        };

        getSimilarContent();
    }, [contentType, id]);

    useEffect(() => {
        const getContentDetails = async () => {
            try {
                const res = await axios.get(`/api/v1/${contentType}/${id}/details`);
                setContent(res.data.content);
            } catch (error) {
                if (error.message.includes("404")) {
                    setContent(null);
                }
            } finally {
                setLoading(false);
            }
        };

        getContentDetails();
    }, [contentType, id]);

    // Socket.IO event handlers for Virtual Theatre
    useEffect(() => {
        if (!virtualTheatre) return;

        socket.on("playPause", (status) => setIsPlaying(status));
        socket.on("seek", (time) => playerRef.current.seekTo(time, "seconds"));

        return () => {
            socket.off("playPause");
            socket.off("seek");
        };
    }, [virtualTheatre]);

    const handleNext = () => {
        if (currentTrailerIdx < trailers.length - 1) setCurrentTrailerIdx(currentTrailerIdx + 1);
    };
    const handlePrev = () => {
        if (currentTrailerIdx > 0) setCurrentTrailerIdx(currentTrailerIdx - 1);
    };

    const scrollLeft = () => {
        if (sliderRef.current) sliderRef.current.scrollBy({ left: -sliderRef.current.offsetWidth, behavior: "smooth" });
    };
    const scrollRight = () => {
        if (sliderRef.current) sliderRef.current.scrollBy({ left: sliderRef.current.offsetWidth, behavior: "smooth" });
    };

    // Virtual Theatre Functions
    const handlePlayPause = () => {
        const newStatus = !isPlaying;
        setIsPlaying(newStatus);
        if (virtualTheatre) socket.emit("playPause", { roomId, isPlaying: newStatus });
    };

    const handleSeek = (time) => {
        setCurrentTime(time);
        if (virtualTheatre) socket.emit("seek", { roomId, currentTime: time });
    };

    const navigate = useNavigate();
    const handleJoinRoom = () => {
        if (roomId.trim() !== "") {
            // Navigate to the Virtual Theatre page with the roomId as a query parameter
            navigate(`/virtual-theatre?roomId=${roomId}`);
        } else {
            alert("Please enter a Room ID");
        }
    };

    // const joinVirtualTheatre = () => {
    //     if (roomId.trim() === "") {
    //         alert("Enter a valid Room ID to join!");
    //         return;
    //     }
    //     // Get the YouTube URL of the selected trailer
    //     const trailerUrl = `https://www.youtube.com/watch?v=${trailers[currentTrailerIdx].key}`;

    //     // Navigate to Virtual Theatre page with the room ID and trailer URL
    //     navigate(`/virtual-theatre?roomId=${roomId}&videoUrl=${trailerUrl}`);
    // };

    const createVirtualTheatreRoom = () => {
        const newRoomId = `Room_${Math.random().toFixed(3).substring(2)}`;
        setRoomId(newRoomId);
        setVirtualTheatre(true);

        // Retrieve the trailer URL based on the current trailer
        const trailerUrl = `https://www.youtube.com/watch?v=${trailers[currentTrailerIdx].key}`;  // This is the URL to be passed

        // Emit the 'joinRoom' event to the socket with the roomId and video URL
        socket.emit("joinRoom", {
            roomId: newRoomId,
            username: `User_${Math.random().toFixed(3)}`,
            videoUrl: trailerUrl  // Pass the video URL here
        });

        // Navigate to the virtual theatre page with roomId and videoUrl as query params
        navigate(`/virtual-theatre?roomId=${newRoomId}&videoUrl=${trailerUrl}`);
    };


    if (loading)
        return (
            <div className='min-h-screen bg-black p-10'>
                <WatchPageSkeleton />
            </div>
        );

    if (!content) {
        return (
            <div className='bg-black text-white h-screen'>
                <div className='max-w-6xl mx-auto'>
                    <Navbar />
                    <div className='text-center mx-auto px-4 py-8 h-full mt-40'>
                        <h2 className='text-2xl sm:text-5xl font-bold text-balance'>Content not found 😥</h2>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='bg-black min-h-screen text-white'>
            <div className='mx-auto container px-4 py-8 h-full'>
                <Navbar />

                {/* Virtual Theatre Section */}
                <div className='flex items-center justify-between my-4'>
                    <div>
                        <input
                            type="text"
                            placeholder="Enter Room ID"
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                            className="p-2 border border-gray-500 rounded-md mr-4 text-white bg-gray-800"
                            style={{ color: 'white' }} // Ensure the text color is white
                        />


                        <button
                            onClick={createVirtualTheatreRoom}
                            className='bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 ml-4'
                        >
                            Create Virtual Theatre Room
                        </button>
                    </div>
                    {virtualTheatre && <p className='text-green-500'>In Virtual Theatre Mode (Room: {roomId})</p>}
                </div>
                {trailers.length > 0 && (
                    <div className='flex justify-between items-center mb-4'>
                        <button
                            className={`
							bg-gray-500/70 hover:bg-gray-500 text-white py-2 px-4 rounded ${currentTrailerIdx === 0 ? "opacity-50 cursor-not-allowed " : ""
                                }}
							`}
                            disabled={currentTrailerIdx === 0}
                            onClick={handlePrev}
                        >
                            <ChevronLeft size={24} />
                        </button>

                        <button
                            className={`
							bg-gray-500/70 hover:bg-gray-500 text-white py-2 px-4 rounded ${currentTrailerIdx === trailers.length - 1 ? "opacity-50 cursor-not-allowed " : ""
                                }}
							`}
                            disabled={currentTrailerIdx === trailers.length - 1}
                            onClick={handleNext}
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>
                )}
                {/* Trailers */}

                <div className='aspect-video mb-8 p-2 sm:px-10 md:px-32'>
                    {trailers.length > 0 && (
                        <ReactPlayer
                            ref={playerRef}
                            controls={true}
                            playing={isPlaying}
                            onPlay={handlePlayPause}
                            onPause={handlePlayPause}
                            onProgress={({ playedSeconds }) => setCurrentTime(playedSeconds)}
                            onSeek={handleSeek}
                            width={"100%"}
                            height={"70vh"}
                            className='mx-auto overflow-hidden rounded-lg'
                            url={`https://www.youtube.com/watch?v=${trailers[currentTrailerIdx].key}`}
                        />
                    )}

                    {trailers?.length === 0 && (
                        <h2 className='text-xl text-center mt-5'>
                            No trailers available for{" "}
                            <span className='font-bold text-red-600'>{content?.title || content?.name}</span> 😥
                        </h2>
                    )}
                </div>

                {/* Movie Details */}
                <div className='flex flex-col md:flex-row items-center justify-between gap-20 max-w-6xl mx-auto'>
                    <div className='mb-4 md:mb-0'>
                        <h2 className='text-5xl font-bold text-balance'>{content?.title || content?.name}</h2>

                        <p className='mt-2 text-lg'>
                            {formatReleaseDate(content?.release_date || content?.first_air_date)} |{" "}
                            {content?.adult ? (
                                <span className='text-red-600'>18+</span>
                            ) : (
                                <span className='text-green-600'>PG-13</span>
                            )}{" "}
                        </p>
                        <p className='mt-4 text-lg'>{content?.overview}</p>
                    </div>
                    <img
                        src={ORIGINAL_IMG_BASE_URL + content?.poster_path}
                        alt='Poster image'
                        className='max-h-[600px] rounded-md'
                    />
                </div>

                {/* Similar Movies */}
                {similarContent.length > 0 && (
                    <div className='mt-12 max-w-5xl mx-auto relative'>
                        <h3 className='text-3xl font-bold mb-4'>Similar Movies/Tv Show</h3>

                        <div className='flex overflow-x-scroll scrollbar-hide gap-4 pb-4 group' ref={sliderRef}>
                            {similarContent.map((content) => {
                                if (content.poster_path === null) return null;
                                return (
                                    <Link key={content.id} to={`/watch/${content.id}`} className='w-52 flex-none'>
                                        <img
                                            src={SMALL_IMG_BASE_URL + content.poster_path}
                                            alt='Poster path'
                                            className='w-full h-auto rounded-md'
                                        />
                                        <h4 className='mt-2 text-lg font-semibold'>{content.title || content.name}</h4>
                                    </Link>
                                );
                            })}

                            <ChevronRight
                                className='absolute top-1/2 -translate-y-1/2 right-2 w-8 h-8 opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer bg-red-600 text-white rounded-full'
                                onClick={scrollRight}
                            />
                            <ChevronLeft
                                className='absolute top-1/2 -translate-y-1/2 left-2 w-8 h-8 opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer bg-red-600 text-white rounded-full'
                                onClick={scrollLeft}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WatchPage;







