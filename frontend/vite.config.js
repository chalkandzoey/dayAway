import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // ---> ADD THIS SERVER CONFIGURATION <---
  server: {
    port: 3000, // Keep frontend on port 3000
    proxy: {
      // Requests starting with /api will be proxied
      '/api': {
        target: 'http://dayaway_backend:3001', // Your backend server address
        changeOrigin: true, // Recommended for virtual hosted sites
        secure: false,      // Set to true if backend uses HTTPS (not needed for localhost)
        // rewrite: (path) => path.replace(/^\/api/, '') // Only uncomment if your backend API paths DON'T start with /api
      }
    }
  }
  // ---> END OF SERVER CONFIGURATION <---
})