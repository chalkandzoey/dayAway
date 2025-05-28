// src/App.jsx
import React from 'react';
// Import Link for navigation
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage'; // <<<--- IMPORT AdminPage
import './App.css';

function App() {
  // Get user, loading status, and logout function from context
  const { user, loading, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      console.log('Logout initiated from header.');
      // No need to navigate here, routing logic below handles it
    } catch (error) {
      console.error('Header logout failed:', error);
    }
  };


  // Show loading indicator while checking session on initial load
  if (loading) {
    return <div>Loading Application...</div>;
  }

  return (
    <BrowserRouter>
      <div className="App">
        {/* --- Header --- */}
        <header className="App-header">
          <h1>Leave Management System</h1>
          <nav>
            {/* Show links based on login status */}
            {user && (
              <>
                <Link to="/" style={navLinkStyle}>Dashboard</Link>
                {/* Conditionally show Admin link */}
                {user.isAdmin && (
                   <Link to="/admin" style={navLinkStyle}>Admin</Link>
                )}
                <button onClick={handleLogout} style={logoutButtonStyle}>Logout ({user.name})</button>
              </>
            )}
            {/* Show Login link if not logged in? Optional */}
            {/* {!user && <Link to="/login" style={navLinkStyle}>Login</Link>} */}
          </nav>
        </header>
        <main>
          <Routes>
            {/* Login Route */}
            <Route
              path="/login"
              element={!user ? <LoginPage /> : <Navigate to="/" replace />}
            />

            {/* Dashboard Route (Protected - requires login) */}
            <Route
              path="/"
              element={user ? <DashboardPage /> : <Navigate to="/login" replace />}
            />

            {/* --- Admin Route (Protected - requires login AND isAdmin) --- */}
            <Route
              path="/admin"
              element={user && user.isAdmin ? <AdminPage /> : <Navigate to="/" replace />}
              // If user is logged in AND admin, show Admin page.
              // Otherwise, redirect to Dashboard (logged-in non-admin) or Login (not logged in, handled by '/' route redirect).
            />
            {/* --- End of Admin Route --- */}


            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />

          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

// Basic inline styles for navigation (can be moved to CSS)
const navLinkStyle = {
    margin: '0 10px',
    color: 'white',
    textDecoration: 'none'
};

const logoutButtonStyle = {
    marginLeft: '15px',
    background: 'none',
    border: 'none',
    color: '#aaa', // Lighter color for name/logout
    cursor: 'pointer',
    fontSize: '0.9em'
};


export default App;