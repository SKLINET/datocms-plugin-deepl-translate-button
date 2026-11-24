import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  publicDir: false,
  resolve: {
    // datocms-react-ui ships its own nested React 18; two copies break hooks.
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 5173,
  },
});
