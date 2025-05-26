import React, { useState, useEffect } from 'react';
import Header from '../../Components/Headers/header_loged.jsx';
import User_light from '../../assets/user-avatar-light.png';
import './index.css';
import { useNavigate } from 'react-router-dom';
import { getToken, setToken } from '../../utils/auth';

const EditProfile = () => {
  const navigate = useNavigate();
  const [favoriteGenre, setFavoriteGenre] = useState('');
  const [favoriteArtist, setFavoriteArtist] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState(User_light);  
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = getToken();
        if (!token) {
          navigate('/login');
          return;
        }
  
        const response = await fetch(`${import.meta.env.VITE_API_URL}/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
  
        if (!response.ok) {
          const data = await response.json();
          if (response.status === 403 && data.needsVerification) {
            navigate('/verify-email', { state: { email: data.email } });
            return;
          }
          throw new Error(data.error || 'Failed to fetch user profile');
        }
  
        const data = await response.json();
        setFavoriteGenre(data.favoriteGenre || '');
        setFavoriteArtist(data.favoriteArtist || '');
        setBio(data.bio || '');
        // Only update avatar if we have a valid URL
        if (data.avatar) {
          setAvatar(data.avatar);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        if (error.message.includes('Failed to fetch user profile')) {
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchUserData();
  }, [navigate]);

  const handleSave = async () => {
    try {
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      const formData = new FormData();
      
      // Only append fields that have been changed
      if (favoriteGenre !== '') {
        formData.append('favoriteGenre', favoriteGenre.trim());
      }
      if (favoriteArtist !== '') {
        formData.append('favoriteArtist', favoriteArtist.trim());
      }
      if (bio !== '') {
        formData.append('bio', bio.trim());
      }
      if (selectedImage) {
        formData.append('avatar', selectedImage);
      }

      console.log('Sending profile update request...');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      console.log('Profile update response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      if (data.message === "No changes made") {
        alert('No changes were made to your profile.');
      } else {
        alert('Profile updated successfully!');
      }
      navigate('/account');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(error.message || 'Failed to update profile. Please try again.');
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      // Create a temporary URL for preview
      setAvatar(URL.createObjectURL(file));
    }
  };

  const handleImageError = () => {
    console.log('Failed to load avatar image, falling back to default');
    setAvatar(User_light);
  };

  const triggerFileInput = () => {
    document.getElementById('fileInput').click();
  };

  if (isLoading) {
    return <div className="background_gradient">Loading...</div>;
  }

  return (
    <div className="background_gradient">
      <Header />
      <div className="edit-info">
        <div className="field">
          <p className="info-class">What is your favorite genre?</p>
          <input
            type="text"
            className="field_input"
            value={favoriteGenre}
            style={{ color: 'white'}}
            onChange={(e) => setFavoriteGenre(e.target.value)}
          />
        </div>
        <div className="field">
          <p className="info-class">What is your favorite artist?</p>
          <input
            type="text"
            className="field_input"
            value={favoriteArtist}
            style={{ color: 'white'}}
            onChange={(e) => setFavoriteArtist(e.target.value)}
          />
        </div>
        <div className="field">
          <p className="info-class">Tell us something about yourself:</p>
          <input
            type="text"
            className="field_input"
            value={bio}
            style={{ color: 'white'}}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>
        <div className="upload_img">
          <p className="info-class" onClick={triggerFileInput}>UPLOAD PICTURE</p>
          
          <input
            type="file"
            accept="image/*"
            id="fileInput"
            style={{ display: 'none' }}
            onChange={handleImageUpload}
          />
        </div>
      </div>
      <div className="avatar">
        <img 
          src={avatar} 
          alt="Avatar" 
          className="avatar-img"
          onError={handleImageError}
        />
        <button className="cancel" onClick={() => navigate('/account')}>Cancel</button>
        <button className="save" onClick={handleSave}>Save</button>
      </div>
    </div>
  );
};

export default EditProfile;
