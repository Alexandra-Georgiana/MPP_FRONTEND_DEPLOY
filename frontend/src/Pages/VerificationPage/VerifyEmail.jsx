import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { setToken } from '../../utils/auth';
import './VerifyEmail.css';
import config from '../../config';

const VerifyEmail = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Get email and username from location state or storage
        const emailFromState = location.state?.email;
        const usernameFromState = location.state?.username;
        const emailFromStorage = localStorage.getItem('pendingVerificationEmail') || sessionStorage.getItem('pendingVerificationEmail');
        const usernameFromStorage = localStorage.getItem('pendingUsername') || sessionStorage.getItem('pendingUsername');
        
        if (emailFromState) {
            setEmail(emailFromState);
            setUsername(usernameFromState);
        } else if (emailFromStorage) {
            setEmail(emailFromStorage);
            setUsername(usernameFromStorage);
        } else {
            navigate('/login');
        }
    }, [location, navigate]);

    const handleInputChange = (index, value) => {
        if (value.length > 1) value = value[0]; // Only take the first character if multiple are pasted
        if (!/^[0-9]*$/.test(value)) return; // Only allow numbers

        const newCode = [...verificationCode];
        newCode[index] = value;
        setVerificationCode(newCode);

        // Auto-focus next input
        if (value && index < 5) {
            const nextInput = document.getElementById(`code-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
            // Focus previous input on backspace if current input is empty
            const prevInput = document.getElementById(`code-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').trim();
        if (!/^\d{6}$/.test(pastedData)) return; // Only allow 6 digits

        const newCode = pastedData.split('');
        setVerificationCode(newCode);
    };

    const handleSubmit = async () => {
        if (isLoading) return;
        setIsLoading(true);
        setError('');

        const code = verificationCode.join('');
        if (code.length !== 6) {
            setError('Please enter a valid verification code');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(`${config.apiUrl}/verify-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    code
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                // Use auth utility to store token
                const rememberMe = localStorage.getItem('pendingVerificationEmail') !== null;
                setToken(data.token, rememberMe);
                
                // Clean up verification data
                localStorage.removeItem('pendingVerificationEmail');
                localStorage.removeItem('pendingUsername');
                sessionStorage.removeItem('pendingVerificationEmail');
                sessionStorage.removeItem('pendingUsername');

                alert('Email verified successfully!');
                navigate('/home2');
            } else {
                setError(data.error || 'Verification failed');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${config.apiUrl}/resend-verification`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();
            if (response.ok) {
                alert('New verification code sent to your email!');
            } else {
                setError(data.error || 'Failed to resend code');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="verify-email-container">
            <div className="verify-email-card">
                <h2>Email Verification</h2>
                <p className="instruction">Please enter the 6-digit code sent to</p>
                <p className="email">{email}</p>
                
                <div className="verification-code-inputs">
                    {verificationCode.map((digit, index) => (
                        <input
                            key={index}
                            id={`code-${index}`}
                            type="text"
                            maxLength="1"
                            value={digit}
                            onChange={(e) => handleInputChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            onPaste={handlePaste}
                            className="code-input"
                            autoFocus={index === 0}
                        />
                    ))}
                </div>

                {error && <p className="error-message">{error}</p>}

                <button 
                    className="verify-button" 
                    onClick={handleSubmit}
                    disabled={isLoading}
                >
                    {isLoading ? 'Verifying...' : 'Verify Email'}
                </button>

                <div className="resend-code">
                    <p>Didn't receive the code?</p>
                    <button 
                        className="resend-button" 
                        onClick={handleResendCode}
                        disabled={isLoading}
                    >
                        Resend Code
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail; 