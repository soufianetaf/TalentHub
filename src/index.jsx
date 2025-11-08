// src/index.jsx
import React from 'react';
import { createRoot } from 'react-dom/client'; // CORRECTION: React 18+
import RecruitmentPlatform from './App.jsx';
import './index.css'; // Ajout du CSS Tailwind

// Méthode React 18+
const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <RecruitmentPlatform />
  </React.StrictMode>
);