import React, { useRef, useState } from "react";
import Draggable from "react-draggable";
import { X } from "lucide-react";
import "./index.css";
import config from '../../config';

const AddSong = ({ setAddSong, songs, setSongs }) => {
  const nodeRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB limit

  const validateFile = (file, type) => {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`${type} file is too large. Maximum size is 50MB`);
    }
  };

  const handleAddSong = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setUploadProgress(0);

    try {
      // Validate files
      const imageFile = e.target.image.files[0];
      const audioFile = e.target.audio.files[0];

      validateFile(imageFile, 'Image');
      validateFile(audioFile, 'Audio');

      const formData = new FormData();
      formData.append('trackName', e.target.title.value);
      formData.append('artistName', e.target.artist.value);
      formData.append('albumName', e.target.album.value);
      formData.append('genres', e.target.genre.value);
      formData.append('rating', '0');
      formData.append('albumCover', imageFile);
      formData.append('audioFile', audioFile);

      const response = await fetch(`${config.apiUrl}/addSong`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add song');
      }

      const result = await response.json();
      alert(result.message || 'Song added successfully!');
      
      // Refresh the songs list
      const songsResponse = await fetch(`${config.apiUrl}/songs`);
      if (songsResponse.ok) {
        const updatedSongs = await songsResponse.json();
        setSongs(updatedSongs);
      }

      setAddSong(false);
    } catch (error) {
      console.error('Error adding song:', error);
      setError(error.message || 'Failed to add song. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (size) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let unitIndex = 0;
    let fileSize = size;

    while (fileSize >= 1024 && unitIndex < units.length - 1) {
      fileSize /= 1024;
      unitIndex++;
    }

    return `${fileSize.toFixed(2)} ${units[unitIndex]}`;
  };

  return (
    <Draggable nodeRef={nodeRef}>
      <div
        className="song"
        ref={nodeRef}
        style={{
          position: "fixed",
          top: "50px",
          left: "50px",
          width: "400px",
          height: loading ? "600px" : "500px",
          background: "rgb(61, 2, 2)",
          color: "black",
          padding: "20px",
          zIndex: 1000,
          cursor: "grab",
          boxShadow: "0px 15px 10px rgba(0, 0, 0, 0.192)",
          borderRadius: "20px",
        }}
      >
        <div style={{marginLeft:"370px"}}>
            <X size={30} style={{ cursor: "pointer", color: "white" }} onClick={() => setAddSong(false)} />
        </div>
        <b style={{ color: "white", fontSize: "30px" }}>Add Song</b>
        
        {error && (
          <div style={{ color: "red", marginBottom: "10px", fontSize: "14px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleAddSong}>
          <input type="text" name="title" placeholder="Title" required style={inputStyle} disabled={loading} />
          <input type="text" name="artist" placeholder="Artist" required style={inputStyle} disabled={loading} />
          <input type="text" name="album" placeholder="Album" required style={inputStyle} disabled={loading} />
          <input type="text" name="genre" placeholder="Genre" required style={inputStyle} disabled={loading} />
          
          <div style={{ marginTop: "20px", color: "white" }}>
            <label>
              Album Cover (Max {formatFileSize(MAX_FILE_SIZE)}):
              <input
                type="file"
                name="image"
                accept="image/*"
                required
                style={{...inputStyle, color: "white"}}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    try {
                      validateFile(file, 'Image');
                      setError('');
                    } catch (err) {
                      setError(err.message);
                      e.target.value = '';
                    }
                  }
                }}
                disabled={loading}
              />
            </label>
          </div>

          <div style={{ marginTop: "20px", color: "white" }}>
            <label>
              Audio File (Max {formatFileSize(MAX_FILE_SIZE)}):
              <input
                type="file"
                name="audio"
                accept="audio/*"
                required
                style={{...inputStyle, color: "white"}}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    try {
                      validateFile(file, 'Audio');
                      setError('');
                    } catch (err) {
                      setError(err.message);
                      e.target.value = '';
                    }
                  }
                }}
                disabled={loading}
              />
            </label>
          </div>

          {loading && (
            <div style={{ marginTop: "20px", color: "white" }}>
              <div>Uploading: {uploadProgress}%</div>
              <div style={{
                width: "100%",
                height: "10px",
                backgroundColor: "#444",
                borderRadius: "5px",
                marginTop: "5px"
              }}>
                <div style={{
                  width: `${uploadProgress}%`,
                  height: "100%",
                  backgroundColor: "white",
                  borderRadius: "5px",
                  transition: "width 0.3s ease-in-out"
                }} />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            style={{ 
              width: "300px", 
              height: "50px", 
              marginTop: "20px",
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
              backgroundColor: error ? "#ff6b6b" : undefined
            }}
            disabled={loading || !!error}
          >
            {loading ? `Uploading... ${uploadProgress}%` : 'Add Song'}
          </button>
        </form>
      </div>
    </Draggable>
  );
};

const inputStyle = {
  width: "300px",
  height: "30px",
  marginTop: "20px",
  background: "transparent",
  border: "none",
  borderBottom: "1px solid black",
};

export default AddSong;
