// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  
  // Supprimer root: './src' - Vite attend que l'index.html soit à la racine
  // Vite recherche automatiquement index.html à la racine du projet
  
  // Le publicDir doit pointer vers le dossier contenant les fichiers statiques
  publicDir: 'public',
  
  // Configuration esbuild pour gérer JSX dans les fichiers .js
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  
  // Configuration optionnelle pour optimiser les builds
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  
  // Configuration du serveur de développement
  server: {
    port: 3000,
    open: true,
  },
});