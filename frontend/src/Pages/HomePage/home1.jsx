import React, {useEffect, useState, useRef} from 'react'
import Heather from '../../Components/Headers/header.jsx'
import Empty from '../../assets/empty.png'
import './index.css'
import { useNavigate } from 'react-router-dom'
import config from '../../config';

const home1 = () => {
  const navigate = useNavigate();
    const [songs, setSongs] = React.useState([]);
  
    const [offset, setOffset] = useState(0);
    const limit = 30;
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
  
      
  
  
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
  
   const getSongs = async (reset = false, customOffset = offset) => {
      try {
          setLoading(true);
  
          const response = await fetch(`${config.apiUrl}/songs?offset=${customOffset}&limit=${limit}`, {
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
              setOffset(limit);
          } else {
              setSongs((prevSongs) => {
                  const newSongs = data.filter(song => !prevSongs.some(prev => prev.track_id === song.track_id));
                  return [...prevSongs, ...newSongs];
              });
              setOffset((prevOffset) => prevOffset + limit);
          }
  
          if (data.length < limit) {
              setHasMore(false);
          }
      } catch (error) {
          console.error('Error fetching songs:', error);
      } finally {
          setLoading(false);
      }
  };
  
  
  const fetchMoreSongs = () => {
      const currentOffset = offset;
      getSongs(false, currentOffset);
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
        <Heather />
        <div className = "song-list">
            <p className = "song-list-title">Library</p>
            <hr className="line"></hr>
            <div className = "scrolable-song-list" ref={songListRef}>
                <ul className = "songs">
                {songs.map((song, index) => (
                  <li key={song.id} onClick={() => handleSongClick(song.track_id)} className="song-item">
                    <strong>{index + 1}. {song.track_name}</strong> - {song.artist_name}
                  </li>
                ))}
                </ul>
            </div>
        </div>
        <div className = "song-details">
            <img src = {Empty} alt="empty" className = "empty-image" />
            <b className = "discover-text">Discover Your Next Favorite Song</b>
            <p className = "discover-description">Browse our extensive library, <br/> choose a track, and uncover details about the music you love.</p>
            <hr className="line2"></hr>
        </div>
    </div>
  )
}

export default home1
