import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuration Vite — build rapide et HMR pour le développement React
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // "host: true" rend le serveur accessible depuis les autres appareils
    // du même réseau Wi-Fi (indispensable pour tester le scan d'un QR Code
    // depuis un vrai téléphone) et pas seulement depuis ce PC.
    host: true,
  },
});
