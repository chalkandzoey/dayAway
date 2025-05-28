// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx';
import './index.css'

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';

// ---> ADD MUI X Date Picker Imports <---
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'; // Using v3 adapter
// If using date-fns v2, you might need AdapterDateFns from '@mui/x-date-pickers/AdapterDateFns'
// Make sure your date-fns version matches the adapter.
// If you installed date-fns recently, it's likely v2 or v3. For v3, use AdapterDateFnsV3.
// For date-fns v2: import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* Wrap AuthProvider (and thus App) with LocalizationProvider */}
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  </React.StrictMode>,
)