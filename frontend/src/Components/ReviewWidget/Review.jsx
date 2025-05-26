import React, {useRef,useState, useEffect} from 'react'
import Draggable from 'react-draggable';
import { X } from 'lucide-react';
import { useAuth } from '../../utils/auth';
import { useNavigate } from 'react-router-dom';
import config from '../../config';

const Review = ({songs, currentSongIndex, setReview}) => {
    const navigate = useNavigate();
    const { isAuthenticated, getToken } = useAuth();
    const reviewRef = useRef(null);
    const [rating, setRating] = useState(0);
    const [impression, setImpression] = useState("");
    const [userEmail, setUserEmail] = useState(null);
    const currentSong = songs[currentSongIndex];    
   
    // Get user email on component mount
    useEffect(() => {
        const fetchUserEmail = async () => {
            // First try to get from storage
            let email = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');
            
            if (!email) {
                // If not in storage, try to get from server
                try {
                    const token = getToken();
                    if (token) {
                        const response = await fetch(`${config.apiUrl}/profile`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        if (response.ok) {
                            const data = await response.json();
                            email = data.email; // Access email directly from response data
                            if (email) {
                                // Store for future use
                                localStorage.setItem('userEmail', email);
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error fetching user profile:', error);
                }
            }
            
            setUserEmail(email);
        };

        fetchUserEmail();
    }, []);

    // Updated handleSubmit function
    const handleSubmit = async () => {
        if (!isAuthenticated()) {
            navigate('/login');
            return;
        }
        
        if (rating === 0) {
            alert('Please select a rating before submitting your review');
            return;
        }

        if (!userEmail) {
            console.error('No user email available');
            alert('Please log in again to submit your review');
            navigate('/login');
            return false;
        }
        
        try {
            const token = getToken();
            if (!token) {
                console.error("No authentication token available");
                alert('Please log in again to submit your review');
                navigate('/login');
                return false;
            }
            
            console.log("Submitting review for song:", currentSong.track_id);
            
            const response = await fetch(`${config.apiUrl}/songs/review`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    trackId: currentSong.track_id, // Changed from songId to trackId
                    userId: userEmail,
                    comment: impression,
                    rating: rating
                }),
            });
            
            // Check if response was successful first
            if (!response.ok) {
                // For error responses, try to get error details
                let errorMessage = `Server error: ${response.status}`;
                try {
                    const errorData = await response.json();
                    if (errorData.error) {
                        errorMessage = errorData.error;
                        if (errorData.details) {
                            errorMessage += `: ${errorData.details}`;
                        }
                    } else if (errorData.message) {
                        errorMessage = errorData.message;
                    }
                    console.error('Review submission failed with status:', response.status, errorData);
                } catch (e) {
                    console.error('Review submission failed with status:', response.status, 'No valid JSON in error response');
                }
                throw new Error(errorMessage);
            }
            
            // If we get here, the response was successful, so now try to parse the JSON
            let data;
            try {
                data = await response.json();
                console.log('Review submission succeeded with status:', response.status);
            } catch (jsonError) {
                console.error('Failed to parse successful response as JSON:', jsonError);
                data = { message: "Review submitted successfully" }; 
            }
            
            console.log("Review submitted successfully:", data);
            alert('Review submitted successfully!');
            return true; // Indicate success
        } catch (error) {
            console.error('Error submitting review:', error);
            alert(`Failed to submit review: ${error.message}`);
            return false; // Indicate failure
        }
    };
    return (
        <Draggable nodeRef={reviewRef}>
            <div ref={reviewRef} className="review-widget" style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                background: "linear-gradient(135deg,rgb(99, 5, 5),rgb(10, 7, 7))",
                padding: "20px",
                borderRadius: "10px",
                zIndex: 1000,
                color: "white",
                width: "37%"
            }}>
                <div className="review-header" style={{
                    display: "flex",
                    marginTop: "-50px",
                    justifyContent: "space-between",
                    alignItems: "center"                }}>
                    <p style={{ fontWeight: "bold", fontFamily: "Economica", fontSize:"42px" }}>Share Your Thoughts</p>
                    <button onClick={() => setReview(false)} style={{
                        background: "transparent",
                        border: "none",
                        color: "white",
                        cursor: "pointer"
                    }}>
                        <X size={20} />
                    </button>
                </div>

                <div style = {{display: "flex", marginTop: "-20px", marginBottom: "50px" }}>
                    <div style={{ textAlign: "start"}}>
                        <img src={currentSong.album_image} alt="Album Cover" style={{ width: "150px", height: "150px", borderRadius: "10px"}} />
                    </div>

                    <div style={{display: "flex", flexDirection: "column", justifyContent: "space-between", marginLeft: "30px"}}>   
                        <div style={{ display: "flex", justifyContent: "start", gap: "5px", marginBottom: "10px" }}>
                        {Array.from({ length: 5 }).map((_, index) => (
                            <span 
                            key={index} 
                            onClick={() => setRating(index + 1)}
                            onChange={(e) => setRating(e.target.value)}
                            style={{ cursor: "pointer", fontSize: "20px", color: index < rating ? "#FFD700" : "gray" }}
                            >
                            ★
                            </span>
                        ))}
                        </div>

                        <textarea 
                        placeholder="Write a review..." 
                        value={impression} 
                        onChange={(e) => setImpression(e.target.value)}
                        style={{
                            width: "200%",
                            height: "80px",
                            background: "transparent",
                            color: "white",
                            border: "none",
                            padding: "10px",
                            borderRadius: "5px",
                            marginBottom: "10px"
                        }}
                        />
                    </div>
                </div>                <div style={{ display: "flex", justifyContent: "end", gap: "20px" }}>
                    <button 
                        onClick={() => 
                            setReview(false)} 
                        style={{ width: "30%", background: "white", padding: "8px", borderRadius: "40px", color: "black" }}
                    >
                        Cancel
                    </button>                    <button 
                        onClick={async () => { 
                            const success = await handleSubmit();
                            // Only close the dialog if submission was successful
                            if (success) {
                                setReview(false);
                            }
                        }} 
                        style={{ width: "30%", background: "white", padding: "8px", borderRadius: "40px", color: "black"}}
                    >
                        Add
                    </button>
                </div>
            </div>
        </Draggable>
    )
}

export default Review