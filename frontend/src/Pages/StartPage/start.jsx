import React from 'react'
import Start from "../../assets/start.jpg"
import './index.css'
import { useNavigate } from 'react-router-dom';



const start = () => {
  const navigate = useNavigate();
  return (
    <div className = "first-page">
        <img src={Start} alt="start" className="fullscreen-image" />
        <div className = "name">
            <p className = "library"> Music Library</p>
        </div>
        <div className = "quote">
            <p className = "quote-text">"   I think music in itself is healing. It’s an explosive expression of humanity. It’s something we are all touched by. No matter what culture we’re from, everyone loves music."</p>
        </div>
        <div className = "author">
            <b className = "author-name">- Billy Joel</b>
        </div>
            <button className = "browse" onClick = {() => navigate('/home1')}>Browse</button>
    </div>
    
  )
}

export default start