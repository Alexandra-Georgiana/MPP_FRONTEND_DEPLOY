import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import bcrypt from 'bcryptjs';
import config from '../../config';

const AdminLogin = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
  const handleSubmit = async () => {
    // Use state variables for dynamic input
    if (!email || !password) {
        alert('Email and password are required.');
        return;
    }

    try {
        console.log('Sending request to /api/admin/login with email:', email);
        // Make the API request to the Flask server
        const response = await fetch(`${config.flaskApiUrl}/api/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                password,
            }),
        });

        console.log('Response received:', response);        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to login');
        }
        
        const data = await response.json();
        console.log('Parsed response data:', data);

        if (data.token) {
            // Save token in localStorage
            localStorage.setItem('adminToken', data.token);
            
            // Store admin info
            localStorage.setItem('admin', JSON.stringify({
                id: data.admin.id,
                email: data.admin.email
            }));
            
            // Redirect to admin page using navigate
            navigate('/admin');        } else {
            throw new Error('No token received from server');
        }
    } catch (error) {
        console.error('Error during login:', error);
        alert('An error occurred during login. Please try again later.');
    }
};
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: "10px" }}>
            <p style={{ color: "white", fontSize: "40px", fontWeight: "bold" }}>Admin Login</p>
            <div style={{ width: "300px", display: "flex", flexDirection: "column", gap: "15px" }}>
                <input
                    type="email"
                    placeholder="Email"
                    style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "5px",
                        border: "1px solid #ccc"
                    }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "5px",
                        border: "1px solid #ccc"
                    }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button
                    style={{
                        marginTop: "20px",
                        width: "100%",
                        padding: "10px",
                        backgroundColor: "#531B21",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer"
                    }}
                    onClick={handleSubmit}
                >
                    Log In
                </button>
            </div>
        </div>
    );
};

export default AdminLogin;
