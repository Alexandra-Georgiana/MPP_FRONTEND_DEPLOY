import React, {useState} from 'react'
import Header from '../../Components/Headers/header.jsx'
import Left from "../../assets/login.jpg"
import './index.css'
import { useNavigate } from 'react-router-dom'
import { setToken, clearAuthData, getToken } from '../../utils/auth'
import config from '../../config';

const login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!email || !password) {
      alert('All fields are required');
      return;
    }

    if (isLoading) return;
    setIsLoading(true);
  
    try {
      // Clear any existing auth data before login attempt
      clearAuthData();

      console.log('Attempting login...');
      const response = await fetch(`${config.apiUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
  
      let data;
      try {
        data = await response.json();
        console.log('Login response:', data);
      } catch (jsonError) {
        console.error('Error parsing login response:', jsonError);
        throw new Error('Invalid response from server');
      }
  
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (!data.token) {
        throw new Error('No authentication token received');
      }

      console.log('Login successful, storing token...');
      // Store token using the auth utility
      setToken(data.token, remember);
      
      // Verify token was stored correctly
      const storedToken = getToken();
      console.log('Token stored successfully:', !!storedToken);
      console.log('Token storage location:', remember ? 'localStorage' : 'sessionStorage');

      if (!storedToken) {
        throw new Error('Failed to store authentication token');
      }

      if (data.needsVerification) {
        console.log('Email needs verification...');
        // Store email for verification
        if (remember) {
          localStorage.setItem('pendingVerificationEmail', email);
        } else {
          sessionStorage.setItem('pendingVerificationEmail', email);
        }
        navigate('/verify-email', { state: { email } });
      } else {
        console.log('Navigating to home...');
        navigate('/home2');
      }
    } catch (error) {
      console.error('Error during login:', error);
      const errorMessage = error.message === 'Invalid response from server' 
        ? 'Server error. Please try again later.'
        : error.message || 'An error occurred during login';
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="basic-page">
      <div className="image-gradient">
        <img src={Left} alt="left" className="left-image"/>
      </div>
      <div className="login-form">
        <p className="login-form-title">Log in</p>
        <input 
          type="email" 
          placeholder="Email" 
          className="form-input" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
        />
        <input 
          type="password" 
          placeholder="Password" 
          className="form-input" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="alshimer">
          <div>
            <input 
              type="checkbox" 
              className="checkbox" 
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <label>Remember me</label>
          </div>
          <span className="forgot-pswd">Forgot password?</span>
        </div>
        <hr className="line3"></hr>
        <div className="have-account1">
          <p style={{color: "black", fontSize: "1.3vw"}}>Don't have an account?</p>
          <p 
            style={{color: "white", fontWeight: "bold", fontSize:"1.4vw", cursor: "pointer"}} 
            onClick={() => navigate('/signin')}
          >
            Sign in
          </p>
        </div>
        <button 
          className="login" 
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'LogIn'}
        </button>
      </div>
      <Header />
    </div>
  )
}

export default login