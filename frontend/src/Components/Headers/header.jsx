import {React, useState, useEffect} from 'react'
import { Search } from "lucide-react";
import Logo from "../../assets/logo.png"
import './index.css'
import {useNavigate} from 'react-router-dom'
import config from '../../config';

const heather = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredSongs, setFilteredSongs] = useState([]);
  
      useEffect(() => {
        const fetchFilteredSongs = async () => {
          if (searchTerm.trim() === "") {
            setFilteredSongs([]);
            return;
          }
      
          try {
            const response = await fetch(`${config.apiUrl}/songs/search/${searchTerm}`);
            const data = await response.json();
            setFilteredSongs(data);
          } catch (error) {
            console.error('Error fetching filtered songs:', error);
          }
        };
      
        fetchFilteredSongs();
      }, [searchTerm]);
      
  return (
    <header>
        <img src = {Logo} alt="logo" className="logo" onClick = {() => navigate('/home1')}/>
        <div className="search-container">
            <Search className="search-icon" size={16} />
            <input type="text" placeholder="   Search for song" className="search-input"/>
            {filteredSongs.length > 0 && (
              <ul className="dropdown">
                {filteredSongs.map((song, index) => (
                  <li 
                    key={index} 
                    onClick={() => navigate(`/song1/${song.id}`)} 
                    className="dropdown-item"
                  >
                    {song.title} - {song.artist}
                  </li>
                ))}
              </ul>
            )}
        </div>
        <button className = "log" onClick = {() => navigate('/login')}>LogIn</button>
        <button className = "sign" onClick = {() => navigate('/signin')}>Register</button>
    </header>
  )
}

export default heather