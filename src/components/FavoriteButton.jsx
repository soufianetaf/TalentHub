// src/components/FavoriteButton.jsx

import React from 'react';


import { Heart } from './Icons'; 

export const FavoriteButton = ({ profile, isFavorite, onToggle, size = "md" }) => {
  const [isAnimating, setIsAnimating] = React.useState(false);

  const handleClick = (e) => {
    e.stopPropagation(); // Empêcher l'ouverture du modal
    setIsAnimating(true);
    onToggle(profile);
    // Déclencher l'animation et la réinitialiser
    setTimeout(() => setIsAnimating(false), 300);
  };

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12"
  };
  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  };

  return (
    <button
      onClick={handleClick}
      className={`
        ${sizeClasses[size]}
        rounded-full 
        flex items-center justify-center
        transition-all duration-300
        ${isFavorite 
          ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg' 
          : 'bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-400 hover:text-red-500 border-2 border-gray-200 dark:border-gray-600'
        }
        ${isAnimating ? 'scale-125' : 'scale-100'}
        hover:scale-110
        focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
      `}
      title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      <Heart 
        className={`${iconSizes[size]} transition-transform ${isAnimating ? 'scale-125' : ''}`}
        filled={isFavorite}
      />
    </button>
  );
};
export default FavoriteButton;