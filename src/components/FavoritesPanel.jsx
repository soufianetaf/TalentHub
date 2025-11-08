import React from 'react';
// Import correct de l'icône de fermeture
import { XCircle, Trash2, Heart } from './Icons';

export const FavoritesPanel = ({ 
  favorites, 
  onClose, 
  onRemove, 
  onClear, 
  onSelectProfile,
  getLinkedInData 
}) => {
  // --- Affichage si AUCUN favori ---
  if (favorites.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-md w-full p-12 text-center shadow-2xl animate-slideUp">
          <div className="bg-red-100 dark:bg-red-900/30 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            {/* L'icône Heart ici est correcte */}
            <Heart className="w-12 h-12 text-red-500" filled={false} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Aucun favori</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Vous n'avez pas encore ajouté de profils à vos favoris.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  // --- Affichage si favoris EXISTENT (Modal complet) ---
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-slideUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-pink-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Heart className="w-8 h-8" filled={true} />
                Mes Favoris
              </h2>
              <p className="text-red-100">
                {favorites.length} profil{favorites.length > 1 ? 's' : ''} sauvegardé{favorites.length > 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {favorites.length > 0 && (
                <button
                  onClick={onClear}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  title="Tout supprimer"
                >
                  {/* L'icône Trash2 est correcte */}
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                {/* CORRECTION ICI : Remplacer X par XCircle */}
                <XCircle className="w-6 h-6" /> 
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {favorites.map((profile, idx) => {
              const linkedin = getLinkedInData(profile);
              const original = linkedin.profil_original || {};
              const fullName = original.firstName && original.lastName 
                ? `${original.firstName} ${original.lastName}`
                : linkedin.nom || 'Nom non disponible';
              const photo = original.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=4F46E5&color=fff&size=80`;

              return (
                <div
                  key={idx}
                  className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-indigo-300 dark:hover:border-indigo-600"
                  onClick={() => onSelectProfile(profile)}
                >
                  <div className="flex items-start gap-4">
                    <img 
                      src={photo}
                      alt={fullName}
                      className="w-16 h-16 rounded-full object-cover border-2 border-white dark:border-gray-600"
                      onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=4F46E5&color=fff&size=80`}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-white truncate">
                        {fullName}
                      </h3>
                      <p className="text-sm text-indigo-600 dark:text-indigo-400 truncate">
                        {original.headline || linkedin.bio?.slice(0, 40)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          📍 {linkedin.localisation || 'N/A'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        Ajouté le {new Date(profile.addedAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(profile);
                      }}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors text-red-500"
                      title="Retirer des favoris"
                    >
                      {/* CORRECTION ICI : Remplacer X par XCircle */}
                      <XCircle className="w-4 h-4" /> 
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-900 p-4 flex justify-between items-center border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            💡 <strong>Astuce:</strong> Cliquez sur un profil pour voir les détails
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default FavoritesPanel;