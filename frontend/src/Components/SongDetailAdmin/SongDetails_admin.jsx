import React, {useState,useRef} from 'react'
import Draggable from 'react-draggable';
import {X} from 'lucide-react'
import Update from '../AddUpdateWidgets/UpdateSong.jsx'
import axios from 'axios';
import config from '../../config';

const SongDetails_admin = ({song, setIsOpened}) => {
  const nodeRef = useRef(null);

  const[isUpdate, setIsUpdate] = useState(false);

  const renderStars = (rating) => {
    return "★★★★★☆☆☆☆☆".slice(5 - rating, 10 - rating);
  };
  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${song.track_name}" by ${song.artist_name}?\nThis action cannot be undone.`
    );

    if (confirmDelete) {
      try {      const response = await fetch(
        `${config.apiUrl}/songs/delete/${song.track_id}`, 
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        }
      );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to delete song');
        }

        setIsOpened(false);
        // Show success message before reload
        alert(`"${song.track_name}" was successfully deleted!`);
        window.location.reload(); 
      } catch (error) {
        console.error("Error deleting song:", error);
        alert(
          `Failed to delete "${song.track_name}". ${error.message || 'Please try again later.'}`
        );
      }
    }
  };

  const handleUpdate = async (updatedSongData) => {
    try {
      await axios.put(`${config.apiUrl}/songs/${song.id}`, updatedSongData);
      alert("Song updated successfully!");
      setIsUpdate(false);
    } catch (error) {
      console.error("Error updating song:", error);
      alert("Failed to update the song. Please try again later.");
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
          width: "700px",
          height: "500px",
          background: "#531B21",
          color: "black",
          padding: "20px",
          zIndex: 1000,
          cursor: "grab",
          boxShadow: "0px 15px 10px rgba(0, 0, 0, 0.192)",
          borderRadius: "20px"
        }}
      >
        <div style ={{background:"linear-gradient(to bottom,rgb(61, 2, 2) 0%, transparent 100%)", borderRadius: "20px", height: "100%"}}>
            <div style = {{marginLeft: "650px"}}>
                <X size={30} style={{cursor: "pointer", color: "white", marginTop: "10px"}} onClick={() => setIsOpened(false)}/>
            </div>
            <div>
                <img src={song.album_image} alt="Song" style={{width: "140px", height: "140px", marginTop: "20px", marginLeft: "-500px"}}/>
            </div>
            <div style = {{marginTop: "-130px", marginLeft: "-150px"}}>
                <div style={{fontFamily:"Economica", fontSize: "50px", color: "white", marginRight:"-300px"}}>
                    <b>{song.track_name}</b>
                </div>
                <div style = {{marginTop: "-20px", marginLeft: "500px", fontFamily:"Economica", fontSize: "30px", color: "white"}}>
                    <b>{song.artist_name}</b>
                </div>
            </div>
            <div>
                <p style = {{fontFamily:"Albert Sans", fontSize: "20px", fontWeight:"100", color: "white", marginTop: "7%", marginLeft:"-30%" }}>{song.description}</p>
            </div>
            <hr style={{border: "1px solid rgba(26, 12, 7, 0.34)", width: "90%"}}/>
            <div style = {{ marginLeft: "-470px"}}>
                <b style = {{color:"white", fontSize:"33px"}}>{renderStars(song.rating)}</b>
            </div>
            <div className="song-genre">
                <p style = {{color:"white",fontFamily:"Albert Sans", fontSize: "20px", fontWeight:"100", marginLeft: "-450px"}}>Genre: {song.genres}</p>
            </div>
            <button style = {{borderRadius: "20px", marginTop: "50px", marginRight: "10px", width:"120px"}} onClick={()=>handleDelete()} >Remove </button>
            <button style = {{borderRadius: "20px", marginTop: "50px", marginRight: "-400px", width:"120px"}} onClick={()=>setIsUpdate(true)}>Update </button>
            {isUpdate && <Update song={song} setIsUpdate={setIsUpdate} onUpdate={handleUpdate}/>}
        </div>
      </div>
    </Draggable>
  )
}

export default SongDetails_admin