import { useState, useEffect } from 'react';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('talenthub_favorites');
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {
        console.error('Erreur de chargement des favoris:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('talenthub_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (profile) => {
    setFavorites(prev => {
      // Ajouter un ID unique si n'existe pas
      const profileWithId = { 
        ...profile, 
        id: profile.id || `profile_${Date.now()}_${Math.random()}`,
        addedAt: new Date().toISOString() 
      };
      
      const isFavorite = prev.some(fav => 
        JSON.stringify(fav.profils) === JSON.stringify(profile.profils)
      );
      
      if (isFavorite) {
        return prev.filter(fav => 
          JSON.stringify(fav.profils) !== JSON.stringify(profile.profils)
        );
      } else {
        return [...prev, profileWithId];
      }
    });
  };

  const isFavorite = (profile) => {
    return favorites.some(fav => 
      JSON.stringify(fav.profils) === JSON.stringify(profile.profils)
    );
  };

  const clearFavorites = () => {
    if (window.confirm('Supprimer tous les favoris ?')) {
      setFavorites([]);
    }
  };

  return {
    favorites,
    toggleFavorite,
    isFavorite,
    clearFavorites,
    favoritesCount: favorites.length
  };
};