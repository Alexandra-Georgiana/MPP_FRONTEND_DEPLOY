import React, {useState} from 'react'
import Header from '../../Components/Headers/header.jsx'
import Left from "../../assets/login.jpg"
import './index.css'
import { useNavigate } from 'react-router-dom'
import config from '../../config';

const signin = () => {
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const bio = '';
  const favoriteGenre = '';
  const favoriteArtist = '';
  const avatar = '';

  const validatePassword = () => {
    const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !email || !password || !confirmPassword) {
      alert('All fields are required');
      return;   
    }

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (!validatePassword()) {
      alert('Password must contain at least 8 characters, one uppercase letter, one number and one special character');
      return;
    }

    const newUser = {
      username,
      email,
      password,
      bio,
      favoriteGenre,
      favoriteArtist,
      avatar,
    };

    try {      const response = await fetch(`${config.apiUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });      

      const data = await response.json();

      if (response.ok) {
        // Store the registration token
        if (remember) {
          localStorage.setItem('userToken', data.token);
          localStorage.setItem('userEmail', email);
          localStorage.setItem('username', username);
          localStorage.setItem('pendingVerificationEmail', email);
        } else {
          sessionStorage.setItem('userToken', data.token);
          sessionStorage.setItem('userEmail', email);
          sessionStorage.setItem('username', username);
          sessionStorage.setItem('pendingVerificationEmail', email);
        }

        // Navigate to verification page
        navigate('/verify-email', { state: { email } });
      } else {
        alert(data.error || 'Sign up failed');
      }
    }
    catch (error) {
      console.error(error);
      alert(error.response?.data?.error || 'Sign up failed');
    }
  };

  return (
    <div className = "basic-page">
      <div className = "image-gradient">
        <img src={Left} alt="left" className = "left-image"/>
      </div>
      <div className = "login-form">
        <p className = "login-form-title">Sign in</p>
        <input type = "text" placeholder = "Username" className = "form-input" value = {username} onChange ={(e) => setUsername(e.target.value)} />
        <input type = "text" placeholder = "Email" className = "form-input" value = {email} onChange ={(e) => setEmail(e.target.value)}/>
        <input type = "password" placeholder = "Password" className = "form-input" value = {password} onChange ={(e) => setPassword(e.target.value)}/>
        <input type = "password" placeholder = "Confirm Password" className = "form-input" value = {confirmPassword} onChange ={(e) => setConfirmPassword(e.target.value)}/>
        <div className = "remember-me">
          <input 
            type = "checkbox" 
            className = "checkbox" 
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <label>Remember me</label>
        </div>
        <hr className="line3"></hr>
        <div className="have-account1">
          <p style={{color: "black", fontSize: "1.2vw"}}>Already have an account?</p>
          <b style={{color: "white", fontSize:"1.3vw", cursor: "pointer"}} onClick = {() => navigate('/login')}>Log in</b>
        </div>
        <button className = "login" onClick = {handleSubmit}>Sign In</button>
      </div>
      <Header />
    </div>
  )
}

export default signin