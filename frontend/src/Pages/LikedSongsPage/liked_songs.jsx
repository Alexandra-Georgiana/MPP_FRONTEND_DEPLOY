import React, { useEffect, useRef, useState } from 'react';
import Header from '../../Components/Headers/header_loged.jsx';
import { ArrowUpDown } from 'lucide-react';
import PlayCd from '../../Components/Players/CDPlayer.jsx';
import PlayPickUp from '../../Components/Players/VinylPlayer.jsx';
import './liked_songs.css';
import Draggable from 'react-draggable';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/auth';
import Review from '../../Components/ReviewWidget/Review.jsx';
import config from '../../config';


const LikedSongs = () => {
    const [songs, setSongs] = useState([]);
    const [displaySongs, setDisplaySongs] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: null, ascending: true });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const songListRef = useRef(null);
    const { isAuthenticated, getToken } = useAuth();
    
    // Player functionality state variables
    const [showPlayerSelector, setShowPlayerSelector] = useState(false);
    const [playCD, setPlayCD] = useState(false);
    const [playPickUp, setPlayPickUp] = useState(false);
    const [review, setReview] = useState(false);
    const [currentSongIndex, setCurrentSongIndex] = useState(0);

    useEffect(() => {
    const init = async () => {
        try {
        const token = getToken();
        if (!token) {
            navigate('/login');
            return;
        }
        await fetchLikedSongs();
        } catch (err) {
        console.error('Error in init:', err);
        setError(err.message);
        }
    };
    init();    }, [navigate, getToken]);  // added getToken as dependency
    
    const renderStars = (rating) => {
        return "★★★★★☆☆☆☆☆".slice(5 - rating, 10 - rating);
    };
    
    // Function to handle song changes in the player
    const handleSongChange = (index) => {
        setCurrentSongIndex(index);
    };
    
    const handleSort = (key) => {
        // Toggle sorting order if clicking same column, otherwise default to ascending
        const isAscending = sortConfig.key === key ? !sortConfig.ascending : true;
        setSortConfig({ key, ascending: isAscending });
        
        // Apply sort to current songs
        const sortedSongs = [...songs].sort((a, b) => {
            let aValue = a[key === 'title' ? 'track_name' : key === 'artist' ? 'artist_name' : key === 'album' ? 'album_name' : key];
            let bValue = b[key === 'title' ? 'track_name' : key === 'artist' ? 'artist_name' : key === 'album' ? 'album_name' : key];
            
            // Handle undefined or null values
            aValue = aValue || '';
            bValue = bValue || '';
            
            // Convert to strings for comparison
            aValue = String(aValue).toLowerCase();
            bValue = String(bValue).toLowerCase();
            
            if (isAscending) {
                return aValue.localeCompare(bValue);
            } else {
                return bValue.localeCompare(aValue);
            }
        });
        
        setDisplaySongs(sortedSongs);
    };
    
    const fetchLikedSongs = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = getToken();
            console.log('Fetching liked songs with token:', token ? 'Token exists' : 'No token');
            if (!token) {
                navigate('/login');
                return;
            }
              const response = await fetch(`${config.apiUrl}/songs/liked`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({}) // Empty object as body is required for POST
            });

            if (!response.ok) {
                if (response.status === 401) {
                    navigate('/login');
                    return;
                }
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch liked songs');
            }
            
            const data = await response.json();
            if (!Array.isArray(data)) {
                setSongs([]);
                return;
            }

            // Log the first song to verify that audio_url is present
            if (data.length > 0) {
                console.log("First liked song data:", data[0]);
            }

            setSongs(data);
            setDisplaySongs(data);
        } catch (err) {
            setError(err.message || 'Failed to fetch liked songs. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    if (loading) {
        return (
            <div className="basic-page" style={{ backgroundColor: "#561B21", width: "100%", minHeight: "100vh", position: "relative" }}>
                <Header />
                <div style={{ 
                    display: "flex", 
                    justifyContent: "center", 
                    alignItems: "center", 
                    height: "60vh", 
                    color: "white",
                    fontSize: "24px" 
                }}>
                    Loading...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="basic-page" style={{ backgroundColor: "#561B21", width: "100%", minHeight: "100vh", position: "relative" }}>
                <Header />
                <div style={{ 
                    display: "flex", 
                    flexDirection: "column",
                    justifyContent: "center", 
                    alignItems: "center", 
                    height: "60vh", 
                    color: "white"
                }}>
                    <div style={{ 
                        backgroundColor: "rgba(0, 0, 0, 0.5)", 
                        padding: "20px", 
                        borderRadius: "10px",
                        maxWidth: "500px" 
                    }}>
                        <p style={{ fontSize: "20px", marginBottom: "15px" }}>Error: {error}</p>
                        <button 
                            onClick={fetchLikedSongs} 
                            style={{ 
                                backgroundColor: "#1A1111", 
                                color: "white", 
                                padding: "10px 20px",
                                borderRadius: "20px",
                                border: "none",
                                cursor: "pointer"
                            }}
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (songs.length === 0) {
        return (
            <div className="basic-page" style={{ backgroundColor: "#561B21", width: "100%", minHeight: "100vh", position: "relative" }}>
                <Header />
                <div style={{ 
                    display: "flex", 
                    justifyContent: "center", 
                    alignItems: "center", 
                    height: "60vh", 
                    color: "white",
                    fontSize: "24px" 
                }}>
                    You haven't liked any songs yet.
                </div>
            </div>
        );
    }    return (
        <div className="basic-page" style={{ backgroundColor: "#561B21", width: "100%", marginLeft:"21vh", minHeight: "120vh", transform: "translateX(-10%)" }}>
            <Header />
            <div className="liked_title" style={{ marginTop: "-70px", marginBottom: "20px", textAlign: "center" }}>
                <h1 className="title-text" style={{ color: "white", fontSize: "36px" }}>Your Liked Songs</h1>
            </div>
              {/* Desktop-optimized layout with table-like header */}            <div className="liked-songs-container" style={{ width: "98%", margin: "20px auto" }}>
                {/* Table header with fixed column widths */}                <div className="liked-songs-header" style={{ 
                    display: "grid", 
                    gridTemplateColumns: "80px 3fr 2fr 2fr 1fr", 
                    padding: "10px 20px",
                    borderRadius: "10px 10px 0 0",
                    backgroundColor: "rgba(36, 19, 19, 0.8)",
                    color: "white",
                    fontWeight: "bold",
                    alignItems: "center",
                    textAlign: "center"
                }}>
                    <div style={{ display: "flex", justifyContent: "center" }}></div>
                    <div 
                        onClick={() => handleSort("title")} 
                        style={{ 
                            cursor: "pointer", 
                            display: "flex", 
                            justifyContent: "center",
                            alignItems: "center", 
                            gap: "5px",
                            color: sortConfig.key === "title" ? "#e2b1b8" : "white"
                        }}
                    >
                        <span>Title</span>
                        <ArrowUpDown size={16} />
                    </div>
                    <div 
                        onClick={() => handleSort("artist")} 
                        style={{ 
                            cursor: "pointer", 
                            display: "flex", 
                            justifyContent: "center",
                            alignItems: "center", 
                            gap: "5px",
                            color: sortConfig.key === "artist" ? "#e2b1b8" : "white"
                        }}
                    >
                        <span>Artist</span>
                        <ArrowUpDown size={16} />
                    </div>
                    <div 
                        onClick={() => handleSort("album")} 
                        style={{ 
                            cursor: "pointer", 
                            display: "flex", 
                            justifyContent: "center",
                            alignItems: "center", 
                            gap: "5px",
                            color: sortConfig.key === "album" ? "#e2b1b8" : "white"
                        }}
                    >
                        <span>Album</span>
                        <ArrowUpDown size={16} />
                    </div>
                    <div 
                        onClick={() => handleSort("rating")} 
                        style={{ 
                            cursor: "pointer", 
                            display: "flex", 
                            justifyContent: "center",
                            alignItems: "center", 
                            gap: "5px",
                            color: sortConfig.key === "rating" ? "#e2b1b8" : "white"
                        }}
                    >
                        <span>Rating</span>
                        <ArrowUpDown size={16} />
                    </div>
                </div>                {/* Song list with desktop-optimized row layout */}                <div 
                    className="fav_song-list" 
                    style={{ 
                        height: "45vh", /* Fixed height instead of maxHeight */
                        overflowY: "auto",
                        overflowX: "hidden",
                        borderRadius: "0 0 10px 10px",
                        backgroundColor: "rgba(36, 19, 19, 0.3)",
                        scrollbarWidth: "none", /* Firefox */
                        msOverflowStyle: "none", /* IE and Edge */
                    }}
                    ref={songListRef}
                >{displaySongs.map((song, index) => (                        <div 
                            key={song.track_id} 
                            className="fav_song-item"
                            onClick={() => {
                                setCurrentSongIndex(index);
                                setPlayCD(true);
                            }}
                            style={{
                                display: "grid",
                                gridTemplateColumns: "80px 3fr 2fr 2fr 1fr", /* Match header column widths */
                                alignItems: "center",
                                padding: "15px 20px",
                                margin: "5px 0",
                                borderBottom: index === displaySongs.length - 1 ? "none" : "1px solid rgba(255, 255, 255, 0.1)",
                                transition: "background-color 0.2s",
                                cursor: "pointer",
                                backgroundColor: index % 2 === 0 ? "rgba(86, 27, 33, 0.4)" : "transparent"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "rgba(126, 47, 53, 0.6)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = index % 2 === 0 ? "rgba(86, 27, 33, 0.4)" : "transparent";
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "center" }}>
                                <img 
                                    src={song.album_image} 
                                    alt={song.track_name} 
                                    className="fav_album-cover"
                                    style={{
                                        width: "60px",
                                        height: "60px",
                                        objectFit: "cover",
                                        borderRadius: "8px"
                                    }}
                                />
                            </div>
                            <div className="fav_song-title" style={{ 
                                color: "white", 
                                fontWeight: "bold",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                padding: "0 5px"
                            }}>
                                {song.track_name}
                            </div>
                            <div className="fav_song-artist" style={{ 
                                color: "#e2b1b8",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                padding: "0 5px"
                            }}>
                                {song.artist_name}
                            </div>
                            <div className="fav_song-album" style={{ 
                                color: "white", 
                                opacity: 0.8,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                padding: "0 5px"
                            }}>
                                {song.album_name}
                            </div>
                            <div className="fav_song-rating" style={{ 
                                color: "gold", 
                                fontSize: "18px",
                                padding: "0 5px"
                            }}>
                                {renderStars(song.rating || 0)}
                            </div>                        </div>
                    ))}
                </div>
                
                {/* Play All Songs Button */}
                <div style={{ 
                    display: "flex", 
                    justifyContent: "center", 
                    marginTop: "20px",
                    marginBottom: "20px"
                }}>
                    {!showPlayerSelector ? (
                        <button 
                            onClick={() => setShowPlayerSelector(true)}
                            style={{
                                backgroundColor: "#1A1111",
                                color: "white",
                                padding: "12px 30px",
                                borderRadius: "30px",
                                border: "2px solid #e2b1b8",
                                cursor: "pointer",
                                fontSize: "16px",
                                fontWeight: "bold",
                                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
                                transition: "all 0.3s ease",
                                display: "flex",
                                alignItems: "center",
                                gap: "10px"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "scale(1.05)";
                                e.currentTarget.style.backgroundColor = "#3a1f1f";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "scale(1)";
                                e.currentTarget.style.backgroundColor = "#1A1111";
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 3L19 12L5 21V3Z" fill="currentColor" />
                            </svg>
                            Play All Songs
                        </button>
                    ) : (
                        <div style={{
                            backgroundColor: "rgba(26, 17, 17, 0.9)",
                            borderRadius: "15px",
                            padding: "20px",
                            boxShadow: "0 6px 12px rgba(0, 0, 0, 0.4)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "15px",
                            maxWidth: "400px"
                        }}>
                            <h3 style={{ color: "white", margin: "0 0 10px 0" }}>Choose Player</h3>
                            
                            <div style={{ 
                                display: "flex", 
                                gap: "15px", 
                                width: "100%", 
                                justifyContent: "center" 
                            }}>
                                <button 
                                    onClick={() => {
                                        setPlayCD(true);
                                        setShowPlayerSelector(false);
                                    }}
                                    style={{
                                        backgroundColor: "#561B21",
                                        color: "white",
                                        padding: "15px 25px",
                                        borderRadius: "10px",
                                        border: "1px solid #e2b1b8",
                                        cursor: "pointer",
                                        fontSize: "16px",
                                        fontWeight: "bold",
                                        transition: "all 0.2s ease",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: "8px",
                                        flex: 1
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = "#75242e";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = "#561B21";
                                    }}
                                >
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                                        <circle cx="12" cy="12" r="3" fill="currentColor"/>
                                        <circle cx="12" cy="12" r="1" fill="#1A1111"/>
                                    </svg>
                                    CD Player
                                </button>
                                
                                <button 
                                    onClick={() => {
                                        setPlayPickUp(true);
                                        setShowPlayerSelector(false);
                                    }}
                                    style={{
                                        backgroundColor: "#561B21",
                                        color: "white",
                                        padding: "15px 25px",
                                        borderRadius: "10px",
                                        border: "1px solid #e2b1b8",
                                        cursor: "pointer",
                                        fontSize: "16px",
                                        fontWeight: "bold",
                                        transition: "all 0.2s ease",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: "8px",
                                        flex: 1
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = "#75242e";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = "#561B21";
                                    }}
                                >
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                                        <circle cx="12" cy="12" r="6" stroke="currentColor" fill="none"/>
                                        <circle cx="12" cy="12" r="1" fill="currentColor"/>
                                    </svg>
                                    Vinyl Player
                                </button>
                            </div>
                            
                            <button
                                onClick={() => setShowPlayerSelector(false)}
                                style={{
                                    backgroundColor: "transparent",
                                    color: "#e2b1b8",
                                    border: "none",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    marginTop: "5px"
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            {/* CD Player */}
            {playCD && (
                <PlayCd
                    songs={displaySongs}
                    currentSongIndex={currentSongIndex}
                    onSongChange={handleSongChange}
                    setReview={setReview}
                    setPlayCD={setPlayCD}
                    calledFrom={0}
                />
            )}
            
            {/* Vinyl Player */}
            {playPickUp && (
                <PlayPickUp
                    songs={displaySongs}
                    currentSongIndex={currentSongIndex}
                    onSongChange={handleSongChange}
                    setPlayPickUp={setPlayPickUp}
                    setReview={setReview}
                    calledFrom={0}
                />
            )}
            
            {/* Review component */}
            {review && (
                <Review
                    songs={displaySongs}
                    currentSongIndex={currentSongIndex}
                    setReview={setReview}
                />
            )}
        </div>
    );
};

export default LikedSongs;
