import React, { useState, useEffect } from 'react';
import { Search, User, Heart } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../../utils/auth';
import Logo from "../../assets/logo.png";
import './index.css';
import config from '../../config';

const Header = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSongs, setFilteredSongs] = useState([]);

  const handleProtectedNavigation = async (path) => {
    const authResult = await isAuthenticated();
    
    if (!authResult) {
      navigate('/login');
      return;
    }
    
    if (typeof authResult === 'object' && authResult.needsVerification) {
      navigate('/verify-email', { state: { email: authResult.email } });
      return;
    }
    
    navigate(path);
  };
  useEffect(() => {
    const fetchFilteredSongs = async () => {
      if (searchTerm.trim() === "") {
        setFilteredSongs([]);
        return;
      }
  
      try {
        console.log('Searching for:', searchTerm);
        const response = await fetch(`${config.apiUrl}/songs/search/${encodeURIComponent(searchTerm)}`);
        if (!response.ok) {
          const error = await response.text();
          console.error('Search error:', response.status, error);
          return;
        }
        const data = await response.json();
        setFilteredSongs(data);
      } catch (error) {
        console.error('Error fetching filtered songs:', error);
      }
    };
  
    fetchFilteredSongs();
  }, [searchTerm]);

  return (
    <header className="header">
      <img 
        src={Logo} 
        alt="logo" 
        className="logo" 
        onClick={() => navigate('/home2')} 
      />

      <div className="search-container">
        <Search className="search-icon" size={16} />
        <input 
          type="text" 
          placeholder="Search for a song" 
          className="search-input" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {filteredSongs.length > 0 && (
          <ul className="dropdown">
            {filteredSongs.map((song, index) => (
              <li 
                key={index} 
                onClick={() => navigate(`/song2/${song.track_id}`)} 
                className="dropdown-item"
              >
                {song.track_name} - {song.artist_name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <Heart 
        size={40} 
        className="heart" 
        onClick={() => handleProtectedNavigation('/favorites')} 
      />
      <User 
        size={40} 
        className="user" 
        onClick={() => handleProtectedNavigation('/account')} 
      />
    </header>
  );
}

export default Header;
