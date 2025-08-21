import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev proxy: calls to /api/* are forwarded to your Go API on :8080
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET || 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
    },
  },
})
