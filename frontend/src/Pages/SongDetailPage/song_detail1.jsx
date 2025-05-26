import React, {useEffect, useState, useRef} from "react";
import { useParams } from "react-router-dom";
import {FaStar} from "react-icons/fa";
import Heather from '../../Components/Headers/header.jsx'
import './index.css'
import { useNavigate } from 'react-router-dom'
import { FastForward } from "lucide-react";
import config from '../../config';

const SongDetails = () => {
  const navigate = useNavigate();
    const [songs, setSongs] = useState([]);
    const [averageRating, setAverageRating] = useState(0);
    const [comments, setComments] = useState([]);
    const [playCD, setPlayCD] = useState(false);
    const [playPickUp, setPlayPickUp] = useState(false);
    const [review, setReview] = useState(false);
    const { id } = useParams();
    const calledFrom = 1; // 0 for CD, 1 for Vinyl
  
    const [offset, setOffset] = useState(0);
    const limit = 30; // Updated to match the limit in home2.jsx
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [song, setSong] = useState(null); // State to store the fetched song
  
  
    useEffect(() => {
      getSongs(true);
    }, []);
    const songListRef = useRef(null);
  
    
      useEffect(() => {
          const handleScroll = () => {
            const list = songListRef.current;
            if (list) {
                const scrollTop = list.scrollTop;
                const scrollHeight = list.scrollHeight;
                const clientHeight = list.clientHeight;
  
                console.log('ScrollTop:', scrollTop);
                console.log('ClientHeight:', clientHeight);
                console.log('ScrollHeight:', scrollHeight);
                console.log('Loading:', loading);
                console.log('HasMore:', hasMore);
  
                // Trigger fetching more data when user scrolls near the bottom of the list container
                if (scrollTop + clientHeight >= scrollHeight - 50 && !loading && hasMore) {
                    console.log('Fetching more songs...');
                    fetchMoreSongs();
                } else {
                    console.log('Not fetching: Conditions not met');
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
  
   const getSongs = async (reset = false) => {
      try {          setLoading(true);
          // Pass offset and limit as query parameters
          const response = await fetch(`${config.apiUrl}/songs?offset=${offset}&limit=${limit}`, {
              method: 'GET',
              headers: {
                  'Content-Type': 'application/json'
              }
          });
  
          if (!response.ok) {
              console.error('Error fetching songs:', response.status, response.statusText);
              throw new Error(`Failed to fetch songs: ${response.status} ${response.statusText}`);
          }
  
          const data = await response.json();
  
          if (reset) {
              setSongs(data);
              setOffset(limit); // Reset offset to the limit
          } else {
              setSongs((prevSongs) => {
                  const newSongs = data.filter(song => !prevSongs.some(prev => prev.track_id === song.track_id));
                  return [...prevSongs, ...newSongs];
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
  
    const getSongDetails = async (trackId) => {
      try {
          const response = await fetch(`${config.apiUrl}/songs/${trackId}`); // Use the /songs/{id} endpoint
          if (!response.ok) {
              console.error('Error fetching song details:', response.status, response.statusText);
              throw new Error(`Failed to fetch song details: ${response.status} ${response.statusText}`);
          }
          const data = await response.json();
          setSong(data); // Set the fetched song details
          setAverageRating(data.average_rating || 0);
          setComments(data.comments || []); // Ensure comments is an array
      } catch (error) {
          console.error('Error fetching song details:', error);
      }
  };
  
  useEffect(() => {
      if (id) {
          getSongDetails(id); // Fetch song details by ID
      }
  }, [id]);
  
  if (!song) {
      return <p>Loading song details...</p>; // Show a loading message while fetching
  }
  
    const handleAddToLiked = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You must be logged in to like songs.');
        return;
      }
    
      try {
        const response = await fetch(`${config.apiUrl}/songs/like`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            songId: song.track_id,
          }),
        });
    
        if (!response.ok) {
          const error = await response.json();
          alert(error.error || 'Failed to add to liked songs');
        } else {
          alert('Song added to liked list successfully!');
        }
      } catch (err) {
        console.error('Error adding to liked list:', err);
        alert('Something went wrong');
      }
    };
  
    const handleSongClick = (id) => {
      const song = songs.find((s) => s.track_id === id);
      if (!song) {
          console.error(`Song with id ${id} not found in the current list.`);
          return;
      }
      navigate(`/song1/${id}`);
    };

  return (
    <div className="basic-page">
        <div className = "song-list">
            <p className = "song-list-title">Library</p>
            <hr className="line"></hr>
            <div className = "scrolable-song-list" ref={songListRef}>
                <ul className = "songs">
                {songs.map((song, index) => (
                  <li key={song.track_id} onClick={() => handleSongClick(song.track_id)} className="song-item">
                    <strong>{index + 1}. {song.track_name}</strong> - {song.artist_name}
                  </li>
                ))}
                </ul>
            </div>
        </div>
        <div className="song-details">
        <img src={song.album_image} style={{width: '10vw', height: '10vw'}} alt="album_cover" className="album-cover" />
        <div className="song-info">
          <b className="song-title">{song.track_name}</b>
          <p className="song-artist" style={{color: "white", fontSize: "4vh"}}>{song.artist_name}</p>
        </div>
        <hr className="line4"></hr>
        <p className="rating">Average Rating: {(averageRating || 0).toFixed(1)} ★</p>
        <ul className="reviews">
          <h3>Last 10 Comments:</h3>
          {comments.map((comment, index) => (
            <li key={index} className="review-item">
              <strong>{comment.username}</strong>: {comment.comment_text}
            </li>
          ))}
        </ul>
      </div>
        <button className="like-button" onClick = {() => navigate('/signin')}>Add to favorites</button>
        <button className="play-CD" onClick ={() => navigate('/signin')}>Play CD</button>
        <button className="play-PickUp" onClick={() => navigate('/signin')}>Play Vinyl</button>
        <Heather />
    </div>
  );
};

export default SongDetails;
