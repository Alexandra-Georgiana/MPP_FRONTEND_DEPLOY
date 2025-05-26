import React, {useState, useEffect} from 'react'
import Header from '../../Components/Headers/header_loged.jsx'
import {Heart} from "lucide-react"
import AvatarDrk from '../../assets/user-avatar-dark.png'
import './index.css'
import { useNavigate } from 'react-router-dom'
import { getToken, clearAuthData } from '../../utils/auth'

const Account = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [favoriteGenre, setFavoriteGenre] = useState('');
  const [favoriteArtist, setFavoriteArtist] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState(AvatarDrk);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserData = async () => {
    try {
      const token = getToken();
      console.log('Account page - token exists:', !!token);
      
      if (!token) {
        console.log('No token found, redirecting to login');
        clearAuthData();
        navigate('/login');
        return;
      }

      // First verify the token
      console.log('Verifying token...');
      const verifyResponse = await fetch(`${import.meta.env.VITE_API_URL}/verify-token`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        console.log('Token verification response:', verifyData);
        if (verifyResponse.status === 403 && verifyData.needsVerification) {
          console.log('Email needs verification, redirecting...');
          navigate('/verify-email', { state: { email: verifyData.email } });
          return;
        }
        console.log('Token invalid, redirecting to login');
        clearAuthData();
        navigate('/login');
        return;
      }

      // Then fetch profile data
      console.log('Fetching profile data...');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch user profile');
      }

      const data = await response.json();
      console.log('Profile data response:', data);

      setUsername(data.username || '');
      setFavoriteGenre(data.favoriteGenre || '');
      setFavoriteArtist(data.favoriteArtist || '');
      setBio(data.bio || '');
      // Only update avatar if we have a valid URL
      if (data.avatar) {
        setAvatar(data.avatar);
      }
      setError(null);
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Failed to load profile data');
      if (error.message === 'No token found') {
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeData = async () => {
      if (mounted) {
        await fetchUserData();
      }
    };

    initializeData();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const handleLogout = () => {
    clearAuthData();
    navigate('/login');
  };

  const handleImageError = () => {
    console.log('Failed to load avatar image, falling back to default');
    setAvatar(AvatarDrk);
  };

  if (isLoading) {
    return <div className="basic-page">Loading...</div>;
  }

  if (error) {
    return (
      <div className="basic-page">
        <p>Error: {error}</p>
        <button onClick={fetchUserData}>Retry</button>
        <button onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  return (
    <div className="basic-page">
      <Header/>
      <div className="account-info">
        <div className="title">
          <p className="title-text">Welcome</p>
          <span className="username">{username}</span>
        </div>
        <div className="user-info">
          <div className="info">
            <p className="info-class">Favourite Genre:</p>
            <p className="info-text">{favoriteGenre}</p>
          </div>
          <div className="info">
            <p className="info-class">Favourite Artist:</p>
            <p className="info-text">{favoriteArtist}</p>
          </div>
          <div className="info">
            <p className="info-class">Description:</p>
            <p className="info-text">{bio}</p>
          </div>
          <div className="info" onClick={() => navigate('/favorites')}>
            <Heart size={32}/>
            <b className="fav-text">See your favorite songs</b>
          </div>
        </div>
      </div>
      <div className="avatar">
        <img 
          src={avatar} 
          alt="Avatar" 
          className="avatar-img"
          onError={handleImageError}
        />
        <button className="edit" onClick={() => navigate('/edit_profile')}>Edit Profile</button>
        <button className="logout" onClick={handleLogout}>Logout</button>
      </div>
    </div>
  )
}

export default Account