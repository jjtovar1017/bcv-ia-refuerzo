import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
    'process.env': {}
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      external: ['ioredis'],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom']
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['ioredis']
  },
  server: {
    port: 3000,
    open: true
  },
  preview: {
    port: 4173
  }
});
