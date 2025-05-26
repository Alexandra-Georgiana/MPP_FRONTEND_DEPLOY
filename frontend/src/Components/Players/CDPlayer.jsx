import React, { useEffect, useRef, useState } from 'react';
import Draggable from 'react-draggable';
import ReactPlayer from 'react-player';
import { X } from 'lucide-react';

// Import SVGs as URLs
import AstroPlayerSvg from "../../assets/AstroPlayer.svg?url";
import CDSvg from "../../assets/CD.svg?url";
import Review from '../ReviewWidget/Review.jsx';
import "./index.css";

const CDPlayer = ({ songs, currentSongIndex, onSongChange, setReview, setPlayCD, calledFrom }) => {
  const playerRef = useRef(null);  // Use ref for ReactPlayer
  const nodeRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);  const currentSong = songs[currentSongIndex] || {};

  // Ensure we have a valid audio URL
  useEffect(() => {
    if (!currentSong || !currentSong.audio_url) {
      console.error('Missing audio URL for song:', currentSong);
    }
  }, [currentSong]);

  const togglePlayPause = () => {
    setIsPlaying((prevState) => {
      const newState = !prevState;
      if (newState && playerRef.current) {
        playerRef.current.seekTo(playerRef.current.getCurrentTime());  // Ensure the play position is correct
      }
      return newState;
    });
  };

  const handleNext = () => {
    const nextIndex = (currentSongIndex + 1) % songs.length;
    onSongChange(nextIndex);
  };

  const handlePrev = () => {
    const prevIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    onSongChange(prevIndex);
  };

  const handleTimeUpdate = (state) => {
    setProgress(state.played * 100);
  };

  const handleSeek = (e) => {
    if (playerRef.current) {
      const seekTime = (e.target.value / 100) * playerRef.current.getDuration();
      playerRef.current.seekTo(seekTime);
    }
  };

  const handleSongEnd = () => {
    if (calledFrom === 1) {
      setReview(true);  
      setPlayCD(false);
    } else { 
      handleNext();
    }
  };

  useEffect(() => {
    setProgress(0);
    setIsPlaying(true); // Reset play state when the song changes
  }, [currentSongIndex]);
  if (!setPlayCD || !currentSong) {
    return null;
  }

  return (
    <>
      <Draggable nodeRef={nodeRef}>
        <div ref={nodeRef} className="music-widget">
          <div className="cd-widget-content">
            <button 
              className="close-button" 
              onClick={() => setPlayCD(false)} 
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'transparent',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                zIndex: '10',
              }} 
            >
              <X size={20} />
            </button>
            <div className="play-bar">              <img src={CDSvg} alt="CD" style={{width: "60%", height: "60%", marginTop:"-130px", position: "absolute", animation: "rotate 6s linear infinite"}}/>
              <img src={AstroPlayerSvg} alt="AstroPlayer" style={{width: "70%", height: "70%", marginTop:"15px"}}/>
              <input type="range" value={progress} onChange={handleSeek} />
              <div className="buttons">
                <button onClick={handlePrev}>⏮</button>
                <button onClick={togglePlayPause}>
                  {isPlaying ? '⏸' : '▶'}
                </button>
                <button onClick={handleNext}>⏭</button>
              </div>
            </div>          <div className="controls">
              <div className="cd-image">
                <img src={currentSong.album_image} alt="album cover" style={{color: "white"}}/>
              </div>
              <p>{currentSong.track_name} - {currentSong.artist_name}</p>
              {!currentSong.audio_url && (
                <p style={{ color: "red", fontSize: "12px" }}>Audio URL not available</p>
              )}
            </div>
          </div>          <ReactPlayer
            ref={playerRef}  // Use ref for ReactPlayer
            url={currentSong.audio_url || ''}
            playing={isPlaying && !!currentSong.audio_url}
            onEnded={handleSongEnd}
            onProgress={handleTimeUpdate}
            width="0"
            height="0"  // Hiding the ReactPlayer controls as it's being used purely for audio
          />
        </div>
      </Draggable>
    </>
  );
};

export default CDPlayer;
