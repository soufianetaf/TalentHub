import React, { useEffect } from 'react';

// NOTE: Ce composant doit recevoir darkMode et setDarkMode via props
const DarkModeToggle = ({ darkMode, setDarkMode }) => {

  // Synchronise l'état darkMode de React avec la classe 'dark' sur la balise <html>
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);
  
  // Initialise l'état lors du premier chargement, en utilisant les valeurs par défaut
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode') === 'true';
    // AJOUT DE LA VÉRIFICATION DE SÉCURITÉ ICI :
    if (typeof setDarkMode === 'function') {
      setDarkMode(savedMode);
    }
  }, [setDarkMode]);
  

  const toggleDarkMode = () => {
    // AJOUT DE LA VÉRIFICATION DE SÉCURITÉ LORS DU CLIC :
    if (typeof setDarkMode === 'function') {
        setDarkMode(!darkMode);
    } else {
        console.error("Erreur: setDarkMode n'est pas une fonction. Vérifiez si App.jsx lui passe la prop.");
    }
  };

  return (
    <button
      onClick={toggleDarkMode} // Utilise la fonction de bascule synchronisée
      className="relative w-16 h-8 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      style={{
        // Les styles internes continuent d'utiliser l'état 'darkMode' reçu en props
        backgroundColor: darkMode ? '#4F46E5' : '#E5E7EB'
      }}
      aria-label="Toggle dark mode"
    >
      <span
        className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center text-xs"
        style={{
          transform: darkMode ? 'translateX(32px)' : 'translateX(0)'
        }}
      >
        {darkMode ? '🌙' : '☀️'}
      </span>
    </button>
  );
};

export default DarkModeToggle;