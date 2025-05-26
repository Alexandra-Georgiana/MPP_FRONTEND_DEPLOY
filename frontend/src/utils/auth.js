import { useState, useEffect, useCallback } from 'react';

// Check if user is authenticated
export const isAuthenticated = async () => {
  const token = getToken();
  console.log('Checking authentication, token exists:', !!token);
  if (!token) return false;

  // If there's a token, consider the user authenticated
  // This prevents unnecessary API calls that might fail due to network issues
  return true;
};

// Get token
export const getToken = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  console.log('Getting token from storage:', !!token);
  return token;
};

// Set token (use localStorage if rememberMe is true, otherwise sessionStorage)
export const setToken = (token, rememberMe = false) => {
  console.log('Setting token, rememberMe:', rememberMe);
  // First clear any existing tokens
  clearAuthData();
  
  if (rememberMe) {
    localStorage.setItem('token', token);
  } else {
    sessionStorage.setItem('token', token);
  }
};

// Clear auth data
export const clearAuthData = () => {
  console.log('Clearing auth data');
  // Clear all auth-related data
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
  localStorage.removeItem('pendingVerificationEmail');
  sessionStorage.removeItem('pendingVerificationEmail');
  localStorage.removeItem('pendingUsername');
  sessionStorage.removeItem('pendingUsername');
  localStorage.removeItem('userEmail');
  sessionStorage.removeItem('userEmail');
  localStorage.removeItem('username');
  sessionStorage.removeItem('username');
};

// Check if token exists and is valid
export const checkAuthToken = async () => {
  const token = getToken();
  console.log('Checking token validity, token exists:', !!token);
  if (!token) return false;

  try {
    console.log('Making verify-token request');
    const response = await fetch(`${config.apiUrl}/verify-token`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      const data = await response.json();
      console.log('Token verification failed:', data);
      if (response.status === 403 && data.needsVerification) {
        return { needsVerification: true, email: data.email };
      }
      clearAuthData();
      return false;
    }
    
    const data = await response.json();
    console.log('Token verification response:', data);
    if (!data.valid) {
      clearAuthData();
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error verifying token:', error);
    // Don't clear auth data on network errors
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      console.log('Network error - keeping token');
      return true; // Assume token is valid if server is unreachable
    }
    clearAuthData();
    return false;
  }
};

// Custom hook for authentication
export const useAuth = () => {
  const [isAuthenticatedState, setIsAuthenticatedState] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAuthentication = useCallback(async () => {
    const result = await isAuthenticated();
    setIsAuthenticatedState(result === true);
    setLoading(false);
  }, []);

  useEffect(() => {
    checkAuthentication();
  }, [checkAuthentication]);

  return {
    isAuthenticated: () => isAuthenticatedState,
    getToken,
    setToken,
    clearAuthData,
    loading,
    checkAuthentication
  };
}; 