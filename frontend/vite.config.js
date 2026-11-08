import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true, // the backend only allows CORS from this exact origin
    proxy: {
      // In development the browser talks to :5173 and Vite forwards /api to Spring Boot.
      '/api': 'http://localhost:8080',
    },
  },
  test: { environment: 'node' },
});
