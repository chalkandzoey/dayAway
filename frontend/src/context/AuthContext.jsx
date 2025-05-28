// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { loginUser as apiLoginUser, logoutUser as apiLogoutUser } from '../services/apiService'; // Assuming logoutUser exists/will exist
import { getCurrentUser as apiGetCurrentUser } from '../services/apiService'; // Assuming getCurrentUser exists/will exist


// Create the context
const AuthContext = createContext(null);

// Create the provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // Store user data { id, name, email, isAdmin }
  const [loading, setLoading] = useState(true); // Loading state for initial check

  // Check for existing session on initial load
  useEffect(() => {
    const checkLoggedInStatus = async () => {
      setLoading(true);
      try {
        // We need an API call to check the session (GET /api/auth/me)
        const currentUser = await apiGetCurrentUser(); // We need to create this in apiService
        setUser(currentUser); // Set user if session is valid
      } catch (error) {
        // If /me fails (401), it means no active session
        setUser(null);
        console.log('No active session found or error checking status.');
      } finally {
        setLoading(false);
      }
    };
    checkLoggedInStatus();
  }, []); // Empty dependency array means run once on mount

  // Login function for components to call
  const login = async (email, password) => {
    try {
      const userData = await apiLoginUser(email, password);
      setUser(userData); // Update user state on successful login
      return userData; // Return user data for potential use in component
    } catch (error) {
      setUser(null); // Clear user on failed login
      throw error; // Re-throw error for component to handle
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await apiLogoutUser(); // Call backend logout - create this in apiService
      setUser(null); // Clear user state
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear user state even if backend call fails? Maybe.
      setUser(null);
      throw error; // Re-throw for component handling if needed
    }
  };

  // Value provided by the context
  const value = {
    user, // The current user object or null
    loading, // Whether the initial session check is loading
    login, // Function to log in
    logout, // Function to log out
  };

  // Render children wrapped in the provider
  // Only render children once the initial loading state is resolved
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Custom hook to easily use the Auth Context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}