import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: false },
  build: {
    target: 'es2022',
    cssMinify: true,
    sourcemap: false,
    chunkSizeWarningLimit: 400,
    rollupOptions: {
      output: {
        // Split vendor code so repeat visits and the mobile shell cache it separately.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          forms: ['zod'],
        },
      },
    },
  },
});
