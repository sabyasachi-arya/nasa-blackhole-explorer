import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5180 },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        // Keep the data payload and vendor code in separate chunks so the
        // shell can paint before the (larger) dataset is parsed.
        manualChunks: {
          vendor: ['react', 'react-dom'],
          icons: ['lucide-react'],
        },
      },
    },
  },
});
