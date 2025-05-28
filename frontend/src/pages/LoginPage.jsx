// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

// Import MUI components
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Alert from '@mui/material/Alert'; // For showing errors
import CircularProgress from '@mui/material/CircularProgress'; // Optional loading indicator

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(''); // Clear previous errors
    setLoading(true);

    console.log('Attempting login via context with:', { email, password });

    try {
      await login(email, password);
      // Login successful! State is updated in context.
      // Routing in App.jsx will handle redirect.
    } catch (err) {
      console.error('Login failed:', err);
      setError(err.message || 'Failed to login. Please check credentials.');
      setLoading(false); // Stop loading on error
    }
     // Loading state stops automatically on success due to redirect/unmount
     // No finally block needed to set loading false here if redirect happens
  };

  return (
    // Container centers content horizontally and adds padding
    <Container component="main" maxWidth="xs">
      {/* Box component used for layout and styling */}
      <Box
        sx={{
          marginTop: 8, // Add some margin top
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Typography for semantic headings */}
        <Typography component="h1" variant="h5">
          Login
        </Typography>

        {/* Form - using Box with component="form" */}
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          {/* Email Input */}
          <TextField
            margin="normal" // Adds margin top and bottom
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus // Focus this field when the page loads
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            error={!!error} // Show error styling if error exists
          />
          {/* Password Input */}
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            error={!!error} // Show error styling if error exists
          />

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              {error}
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            fullWidth
            variant="contained" // Gives it the solid background style
            sx={{ mt: 3, mb: 2 }} // Margin top and bottom
            disabled={loading} // Disable button when loading
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

export default LoginPage;