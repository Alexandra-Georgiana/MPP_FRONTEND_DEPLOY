import React, { useRef, useState } from "react";
import Draggable from "react-draggable";
import { X } from "lucide-react";
import "./index.css";
import config from '../../config';

const UpdateSong = ({ song, setIsUpdate }) => {
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

  const handleUpdateSong = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('trackName', e.target.title.value);
      formData.append('artistName', e.target.artist.value);
      formData.append('albumName', e.target.album.value);
      formData.append('genres', e.target.genre.value);

      // Handle file uploads if provided
      if (e.target.image.files[0]) {
        const imageFile = e.target.image.files[0];
        validateFile(imageFile, 'Image');
        formData.append('albumCover', imageFile);
      }      if (e.target.audio.files[0]) {
        const audioFile = e.target.audio.files[0];
        validateFile(audioFile, 'Audio');
        formData.append('audioFile', audioFile);
      }      // First, verify the song exists
      const checkResponse = await fetch(`${config.apiUrl}/songs/${song.track_id}`);
      if (!checkResponse.ok) {
        throw new Error('Song not found');
      }

      const xhr = new XMLHttpRequest();
      xhr.open('PUT', `${config.apiUrl}/songs/update/${song.track_id}`);
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setUploadProgress(Math.round(percentComplete));
        }
      };      const response = await new Promise((resolve, reject) => {
        xhr.onload = () => {
          console.log('XHR Response Status:', xhr.status);
          console.log('XHR Response Headers:', xhr.getAllResponseHeaders());
          console.log('XHR Response Text:', xhr.responseText);
          
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve({
                ok: true,
                json: async () => response
              });
            } catch (e) {
              console.error('Error parsing response:', e);
              console.log('Raw response:', xhr.responseText);
              reject(new Error('Server returned invalid JSON: ' + xhr.responseText.substring(0, 100)));
            }
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              reject(new Error(errorResponse.error || 'Upload failed'));
            } catch (e) {
              reject(new Error('Server error: ' + xhr.status + ' ' + xhr.statusText));
            }
          }
        };
        xhr.onerror = () => {
          console.error('XHR Error:', xhr.status, xhr.statusText);
          reject(new Error('Network error: ' + xhr.statusText));
        };
        xhr.send(formData);
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update song');
      }

      window.location.reload(); // Refresh to show updated data
      alert("Song updated successfully!");
      setIsUpdate(false);
    } catch (error) {
      console.error('Error updating song:', error);
      setError(error.message || 'Failed to update song. Please try again.');    } finally {
      setLoading(false);
    }
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
          height: "500px",
          background: "rgb(61, 2, 2)",
          color: "black",
          padding: "20px",
          zIndex: 1000,
          cursor: "grab",
          boxShadow: "0px 15px 10px rgba(0, 0, 0, 0.192)",
          borderRadius: "20px",
        }}
      >
        <div style={{ marginLeft: "370px" }}>
          <X size={30} style={{ cursor: "pointer", color: "white" }} onClick={() => setIsUpdate(false)} />
        </div>        <b style={{ color: "white", fontSize: "30px" }}>Update Song</b>
        
        {error && (
          <div style={{ color: "red", marginBottom: "10px", fontSize: "14px" }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleUpdateSong}>
          <input 
            type="text" 
            name="title" 
            defaultValue={song.track_name} 
            required 
            style={inputStyle} 
            disabled={loading} 
          />
          <input 
            type="text" 
            name="artist" 
            defaultValue={song.artist_name} 
            required 
            style={inputStyle} 
            disabled={loading} 
          />
          <input 
            type="text" 
            name="album" 
            defaultValue={song.album_name} 
            required 
            style={inputStyle} 
            disabled={loading} 
          />
          <input 
            type="text" 
            name="genre" 
            defaultValue={song.genres} 
            required 
            style={inputStyle} 
            disabled={loading} 
          />

          <div style={{ marginTop: "20px", color: "white" }}>
            <label>
              Album Cover (Max {formatFileSize(MAX_FILE_SIZE)}):
              <input
                type="file"
                name="image"
                accept="image/*"
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
            {loading ? `Uploading... ${uploadProgress}%` : 'Update Song'}
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

export default UpdateSong;
