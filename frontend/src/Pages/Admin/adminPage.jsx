import React, { useState, useEffect, useRef } from "react";
import { ArrowUpDown, Search } from "lucide-react";
import SongDetails from "../../Components/SongDetailAdmin/SongDetails_admin.jsx";
import AddSong from "../../Components/AddUpdateWidgets/AddSong.jsx";
import Draggable from "react-draggable";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from "recharts"; 
import { X } from 'lucide-react';
import { useNavigate, BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MonitoredUsers from './monitoredUsers';
import config from '../../config';

const AdminPage = () => {
  const nodeRef = useRef(null);
  const lastSongRef = useRef(null);
  const [songs, setSongs] = useState([]);
  const [displaySongs, setDisplaySongs] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, ascending: true });
  const [showSong, setShowSong] = useState();
  const [isOpened, setIsOpened] = useState(false);
  const [addSong, setAddSong] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [openStatistics, setOpenStatistics] = useState(false);
  
  const [isOffline, setIsOffline] = useState(!navigator.onLine); // Track offline status
  console.log("Offline status:", navigator.onLine);

  const [isServerDown, setIsServerDown] = useState(false);

  const navigate = useNavigate();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
    };

    const handleOffline = () => {
      setIsOffline(true);
      alert("You are currently offline. Some features may not work.");
    };


    // Add event listeners for online and offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup event listeners when component unmounts
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
 
  
  useEffect(() => {
    const checkServer = async () => {

      try {
        const response = await fetch('/api/health', {
          method: 'GET',
          cache: 'no-cache',
        });

        if (response.status === 404) {
          console.warn("Health check endpoint not found (404). Please verify the server configuration.");
          setIsServerDown(true);
          return;
        }

        if (!response.ok) {
          throw new Error(`Status ${response.status}`);
        }

        setIsServerDown(false);
      } catch (error) {
        console.error("Server check failed:", error.message);
        setIsServerDown(true);
      }
    };

    checkServer(); // Initial check

    const interval = setInterval(checkServer, 15000); // Check every 15s
    return () => clearInterval(interval);
  }, []);

  const renderStars = (rating) => "★★★★★☆☆☆☆☆".slice(5 - rating, 10 - rating);

  const ratingCounts = [1, 2, 3, 4, 5].map((rating) => ({
    rating: `${rating}★`,
    count: songs.filter((song) => song.rating === rating).length,
  }));
  
  const songsPerBatch = 1; 
  const intervalTime = 3000; 

 
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const response = await fetch('/api/songs');
        if (!response.ok) {
          throw new Error(`Error fetching songs: ${response.status}`);
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          setSongs(data);
          setDisplaySongs(data);
        } else {
          console.error('Fetched data is not an array:', data);
        }
      } catch (error) {
        console.error('Error fetching songs:', error);
        setSongs([]);
      }
    };

    fetchSongs();
  }, []);


  const getColor = (rating) => {
    if (rating <= 2) return "white";
    if (rating === 3) return "darkred";
    return "black";
  };

  const handleSort = (key) => {
    // Convert key to match backend field names
    let sortBy = key;
    if (key === 'title') sortBy = 'track_name';
    else if (key === 'artist') sortBy = 'artist_name';
    else if (key === 'album') sortBy = 'album_name';

    // Toggle sorting order if clicking same column, otherwise default to ascending
    const isAscending = sortConfig.key === key ? !sortConfig.ascending : true;
    setSortConfig({ key, ascending: isAscending });
    
    // Reset pagination
    setOffset(0);
    setHasMore(true);
    
    // Fetch sorted data
    getSongs(true);
  };

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredSongs([]); 
      return;
    }

    if (navigator.onLine) {
      fetch(`/api/songs/search/${encodeURIComponent(searchTerm)}`)
        .then(response => response.json())	
        .then(data => {
          console.log('Fetched songs:', data);
          if (Array.isArray(data)) {
            setFilteredSongs(data);  
          } else {
            console.error('Error: Fetched data is not an array:', data);
          }
        })
        .catch(error => {
          console.error('Error fetching songs:', error);
          setFilteredSongs([]); // Reset filtered songs on error
        });
    }
  }, [searchTerm]);

  const [mostCommonLow, setMostCommonLow] = useState("none");
  const [mostCommonMedium, setMostCommonMedium] = useState("none");
  const [mostCommonHigh, setMostCommonHigh] = useState("none");

  useEffect(() => {
    const fetchMostCommonGenres = async () => {
      try {
        const lowResponse = await fetch('/api/mostCommonGenre/1');
        const mediumResponse = await fetch('/api/mostCommonGenre/2');
        const highResponse = await fetch('/api/mostCommonGenre/3');

        if (lowResponse.ok) {
          const lowData = await lowResponse.json();
          setMostCommonLow(lowData.most_common_genre);
        }

        if (mediumResponse.ok) {
          const mediumData = await mediumResponse.json();
          setMostCommonMedium(mediumData.most_common_genre);
        }

        if (highResponse.ok) {
          const highData = await highResponse.json();
          setMostCommonHigh(highData.most_common_genre);
        }
      } catch (error) {
        console.error('Error fetching most common genres:', error);
      }
    };

    fetchMostCommonGenres();
  }, []);

  const [hoveredRating, setHoveredRating] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const songListRef = useRef(null);

  useEffect(() => {
    getSongs(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
        const list = songListRef.current;
        if (list) {
            const scrollTop = list.scrollTop;
            const scrollHeight = list.scrollHeight;
            const clientHeight = list.clientHeight;

            if (scrollTop + clientHeight >= scrollHeight - 50 && !loading && hasMore) {
                fetchMoreSongs();
            }
        }
    };

    const list = songListRef.current;
    if (list) {
        list.addEventListener('scroll', handleScroll);
    }
    return () => {
        if (list) {
            list.removeEventListener('scroll', handleScroll);
        }
    };
}, [loading, hasMore]);

const [offset, setOffset] = useState(0); // Initialize offset state
const limit = 10; // Define the limit for pagination

const getSongs = async (reset = false) => {
    try {
        setLoading(true);
        
        const sortParam = sortConfig.key ? `&sortBy=${sortConfig.key === 'title' ? 'track_name' : 
                                                   sortConfig.key === 'artist' ? 'artist_name' : 
                                                   sortConfig.key === 'album' ? 'album_name' : 
                                                   sortConfig.key}&order=${sortConfig.ascending ? 'asc' : 'desc'}` : '';
        
        const response = await fetch(`/api/songs?offset=${offset}&limit=${limit}${sortParam}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.error('Error fetching songs:', response.status, response.statusText);
            throw new Error(`Failed to fetch songs: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (reset) {
            setSongs(data);
            setDisplaySongs(data);
            setOffset(limit); // Reset offset to the limit
        } else {
            setSongs((prevSongs) => {
                const newSongs = data.filter(song => !prevSongs.some(prev => prev.track_id === song.track_id));
                return [...prevSongs, ...newSongs];
            });
            setDisplaySongs((prevDisplaySongs) => {
                const newDisplaySongs = data.filter(song => !prevDisplaySongs.some(prev => prev.track_id === song.track_id));
                return [...prevDisplaySongs, ...newDisplaySongs];
            });
            setOffset((prevOffset) => prevOffset + limit); // Increment offset
        }

        if (data.length < limit) {
            setHasMore(false); // No more songs to fetch
        }
    } catch (error) {
        console.error('Error fetching songs:', error);
    } finally {
        setLoading(false);
    }
};

const fetchMoreSongs = () => {
    getSongs(false);
};

  return (
    <div style={{ backgroundColor: "#561B21", width: "100%", height: "100vh", position: "absolute", top: 0, left: 0, overflow: "hidden" }}>
      <b style={{ color: "white", fontSize: "40px" }}> Admin Manager</b>

      {isOffline && (
        <div style={{
          position: "absolute",
          top: "0",
          backgroundColor: "rgba(73, 3, 3, 0.77)",
          color: "white",
          padding: "10px",
          borderRadius: "5px",
          width: "100%",
          textAlign: "center",
          zIndex: 1000,
        }}>
          <strong>You are currently offline. Some features may not work.</strong>
        </div>
      )}

      <div className="search-container" style={{ marginLeft: "120px", position: "relative" }}>
        <Search className="search-icon" size={16} />
        <input
          type="text"
          placeholder="   Search for song"
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {filteredSongs.length > 0 && (
          <ul
            className="dropdown"
            style={{
              position: "absolute",
              top: "40px",
              left: "0",
              width: "250px",
              background: "white",
              color: "black",
              listStyle: "none",
              padding: "10px",
              borderRadius: "5px",
              zIndex: 1000,
              boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
            }}
          >
            {filteredSongs.map((song, index) => (
              <li
                key={index}
                onClick={() => {
                  setShowSong(song);
                  setIsOpened(true);
                  setSearchTerm("");
                }}
                className="dropdown-item"
                style={{ padding: "5px", cursor: "pointer", borderBottom: "1px solid #ddd" }}
              >
                {song.track_name} - {song.artist_name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="cathegories" style={{ marginTop: "20px", marginLeft: "19%" }}>
        {["title", "artist", "album", "genre", "rating"].map((key) => (
          <div key={key} className="cathegory" onClick={() => handleSort(key)}>
            <b style={{ color: "white" }}>{key.charAt(0).toUpperCase() + key.slice(1)}</b>
            <ArrowUpDown size={20} style={{ color: "white" }}/>
          </div>
        ))}
      </div>

      <hr className="line5" style={{ marginTop: "-7%", marginLeft: "8%" }} />
      <div className="fav_song-list" style={{ marginTop: "-85%", marginLeft: "70px", maxHeight: "50vh", overflowY: "auto", overflowX: "hidden" }} ref={songListRef}>
        <div className="fav_songs">
          {displaySongs.map((song, index) => {
            const isLastSong = index === displaySongs.length - 1;
            return (
              <div
                key={song.track_id}
                className="fav_song-item"
                ref={isLastSong ? lastSongRef : null}
                style={{
                  background: "radial-gradient(ellipse 50% 60% at 50% 100%, rgba(36, 19, 19, 0.5),hsl(354, 52.20%, 22.20%)",
                  backgroundSize: "cover",
                  cursor: "pointer",
                }}
                onClick={() => {
                  setShowSong(song);
                  setIsOpened(true);
                }}
              >
                <img src={song.album_image} alt="fav-album_cover" className="fav_album-cover" />
                <div className="fav_song-details">
                  <b className="fav_song-title" style={{ color: "white" }}>{song.track_name}</b>
                  <p className="fav_song-artist" style={{ color: "white" }}>{song.artist_name}</p>
                  <p className="fav_song-album" style={{ color: "white" }}>{song.album_name}</p>
                  <p className="fav_song-genre" style={{ color: "white" }}>{song.genres || "Unknown Genre"}</p>
                  <p className="fav_song-rating" style={{ color: "white" }}>{renderStars(song.rating || 0)}</p>
                </div>
              </div>
            );
          })}
        </div>
        {isOpened && <SongDetails song={showSong} setIsOpened={setIsOpened} setSongs={setSongs} songs={songs} />}
      </div>

      <div style={{ display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: "10px" }}>
        <button style={{ fontSize: "20px", backgroundColor: "#141313", fontWeight: "bold", color: "white", borderRadius: "40px", marginRight: "3%" }} onClick={() => setAddSong(true)}>
          Add Song
        </button>
        <button style={{ backgroundColor: "white", color: "black", fontSize: "20px", fontWeight: "bold", borderRadius: "40px" }} onClick={() => {
          localStorage.removeItem("currentUser");
          navigate("/home2");
        }}>
          Exit Admin Mode
        </button>
        <button style={{ fontSize: "20px", fontWeight: "bold", backgroundColor: "#141313", borderRadius: "40px", color: "white", marginLeft: "-83%", marginRight: "20%" }} onClick={() => setOpenStatistics(true)}>
          See Statistics</button>
        <button onClick={() => navigate('/monitored_users')} style={{ fontSize: "20px", fontWeight: "bold", backgroundColor: "#141313", borderRadius: "40px", color: "white", marginLeft: "-15%" }}>
          View Monitored Users
        </button>
      </div>
      {addSong && <AddSong setAddSong={setAddSong} songs={songs} setSongs={setSongs} />}
      {openStatistics && 
        <Draggable nodeRef={nodeRef}>
          <div ref={nodeRef} style={{ position: "fixed", top: "50px", left: "50px", width: "700px", height: "500px", background: "#531B21", color: "black", padding: "20px", zIndex: 1000, cursor: "grab", boxShadow: "0px 15px 10px rgba(0, 0, 0, 0.192)", borderRadius: "20px" }}>
            <div style={{ marginLeft: "650px" }}>
                <X size={30} style={{ cursor: "pointer", color: "white", marginRight: "-30px" }} onClick={() => setOpenStatistics(false)} />
            </div>
            <h3 style={{ color: "white", textAlign: "center" }}>Song Ratings Distribution</h3>

            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={ratingCounts} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="rating" stroke="white" />
                <YAxis stroke="white" allowDecimals={false} />
                <Bar dataKey="count">
                  {ratingCounts.map((entry, index) => {
                    const ratingValue = index + 1;
                    const commonGenre =
                      ratingValue <= 2 ? mostCommonLow :
                      ratingValue === 3 ? mostCommonMedium :
                      mostCommonHigh;

                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={getColor(ratingValue)}
                        onMouseEnter={(e) => {
                          setHoveredRating(commonGenre);
                          setTooltipPos({ x: e.clientX, y: e.clientY - 40 });
                        }}
                        onMouseLeave={() => setHoveredRating(null)}
                      />
                    );
                  })}
                  <LabelList dataKey="count" position="top" fill="white" fontSize={18} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {hoveredRating && (
              <div
                style={{
                  position: "absolute",
                  left: `${tooltipPos.x}px`,
                  top: `${tooltipPos.y}px`,
                  backgroundColor: "#333",
                  color: "white",
                  padding: "10px",
                  borderRadius: "5px",
                  boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
                  fontSize: "14px",
                  whiteSpace: "nowrap",
                  pointerEvents: "none",
                }}
              >
                Most common genre: <b>{hoveredRating}</b>
              </div>
            )}
          </div>
        </Draggable>
      }
    </div>
  );
};

export default AdminPage;
