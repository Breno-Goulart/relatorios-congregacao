import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: { globPatterns: ['**/*.{js,css,html,ico,png,svg}'] }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/react/') || id.includes('/node_modules/react-dom/') || id.includes('/node_modules/react-router-dom/')) {
            return 'vendor-react';
          }
          if (id.includes('/node_modules/firebase/')) {
            return 'vendor-firebase';
          }
          if (id.includes('/node_modules/lucide-react/')) {
            return 'vendor-icons';
          }
        }
      }
    }
  }
});