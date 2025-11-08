import React from 'react';
import useTalentData from './hooks/useTalentData'; 
import ProfileCard from './components/ProfileCard.jsx';
import ProfileModal from './components/ProfileModal.jsx';
import Pagination from './components/Pagination.jsx';
import DarkModeToggle from './components/DarkModeToggle.jsx';
import { Users, Loader, ExternalLink, Search, Code, MapPin, Filter, Linkedin, Github, Twitter, Heart } from './components/Icons.jsx'; 

// NOUVEAUX IMPORTS DES HOOKS ET COMPOSANTS
import { useFavorites } from './hooks/useFavorites';
import { useToast } from './hooks/useToast';
import ToastContainer from './components/ToastContainer';
import FavoritesPanel from './components/FavoritesPanel';

const RecruitmentPlatform = () => {
    
    // GESTION LOCALE DU DARK MODE POUR PLUS DE FIABILITÉ
    const [darkMode, setDarkMode] = React.useState(false);

    const {
        allClusters, filteredClusters, displayedClusters,
        searchTerm, setSearchTerm, searchName, setSearchName, searchLocation, setSearchLocation, filterPlatforms, setFilterPlatforms,
        currentPage, totalPages, handlePageChange,
        loading, loadingProgress, error, loadClustersChunked,
        getLinkedInData, calculateProfileScore, getGitHubData, getTwitterData
    } = useTalentData();

    const [selectedProfile, setSelectedProfile] = React.useState(null);

    // NOUVEAUX HOOKS POUR LES FAVORIS ET NOTIFICATIONS
    const { 
        favorites, 
        toggleFavorite, 
        isFavorite, 
        clearFavorites, 
        favoritesCount 
    } = useFavorites();
    const toast = useToast();
    
    const [showFavorites, setShowFavorites] = React.useState(false); 
    
    // NOUVELLE LOGIQUE : Fonction pour gérer les favoris avec notifications
    const handleToggleFavorite = (profile) => {
        const wasFavorite = isFavorite(profile);
        toggleFavorite(profile);
        
        if (wasFavorite) {
            toast.info(`❌ Retiré: ${profile.nom || 'Profil'}`);
        } else {
            toast.success(`❤️ Ajouté: ${profile.nom || 'Profil'}`);
        }
    };


    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 flex items-center justify-center">
                <div className="text-center bg-white dark:bg-gray-800 rounded-3xl p-12 shadow-2xl max-w-md w-full mx-4">
                    <Loader className="w-16 h-16 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto mb-6" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Chargement des profils...</p>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                        <div 
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 h-full rounded-full transition-all duration-300"
                            style={{ width: `${loadingProgress}%` }}
                        ></div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">{loadingProgress}%</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Chargement en streaming pour optimiser les performances...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center max-w-2xl">
                    <div className="bg-red-100 dark:bg-red-900/30 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ExternalLink className="w-12 h-12 text-red-600 dark:text-red-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Erreur de chargement</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">{error}</p>
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 text-left">
                        <p className="font-bold text-gray-900 dark:text-white mb-2">Instructions :</p>
                        <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                            <li>Placez le fichier <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">clusters_3_plateformes.json</code> dans le dossier <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">public/</code></li>
                            <li>Redémarrez le serveur de développement</li>
                            <li>Vérifiez que le fichier contient un tableau JSON valide</li>
                        </ol>
                    </div>
                    <button 
                        onClick={loadClustersChunked}
                        className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                    >
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }
    
    const resetFilters = () => {
        setSearchTerm('');
        setSearchName('');
        setSearchLocation('');
        setFilterPlatforms('all');
    }

    return (
        <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gradient-to-br from-gray-50 to-blue-50' } transition-colors duration-300`}>
            <header className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-40 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    {/* OPTIMISATION RESPONSIVE : Ajout de flex-wrap pour les petits écrans */}
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-3 rounded-xl shadow-lg">
                                <Users className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">TalentHub</h1>
                                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Plateforme de Recrutement Cross-Platform</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            
                            {/* NOUVEAU BLOC : BADGE FAVORIS */}
                            <button
                                onClick={() => setShowFavorites(true)}
                                className="relative p-3 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 rounded-xl hover:shadow-lg transition-all border border-red-100 dark:border-red-800"
                                title="Voir mes favoris"
                            >
                                <Heart className="w-6 h-6 text-red-500" filled={favoritesCount > 0} />
                                {favoritesCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
                                        {favoritesCount}
                                    </span>
                                )}
                            </button>
                            {/* FIN NOUVEAU BLOC */}

                            {/* AJOUT DU DARK MODE TOGGLE */}
                            <DarkModeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
                            
                            <div className="text-right bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 px-6 py-3 rounded-xl border border-indigo-100 dark:border-indigo-800">
                                <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{allClusters.length}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium whitespace-nowrap">Profils Talents</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Barre de recherche/Filtres */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8 border border-gray-100 dark:border-gray-700 transition-colors duration-300">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Recherche avancée de talents</h2>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Utilisez les filtres pour trouver le candidat idéal</p>
                    </div>
                    
                    {/* Grille des champs de filtre */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="relative">
                            <Code className="absolute left-4 top-1/2 transform -translate-y-1/2 text-indigo-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Compétences (React, Python...)"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm bg-white dark:bg-gray-700"
                            />
                        </div>

                        <div className="relative">
                            <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 text-indigo-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Nom complet (Soufiane...)"
                                value={searchName}
                                onChange={(e) => setSearchName(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm bg-white dark:bg-gray-700"
                            />
                        </div>

                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-indigo-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Localisation (Paris, Casablanca...)"
                                value={searchLocation}
                                onChange={(e) => setSearchLocation(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm bg-white dark:bg-gray-700"
                            />
                        </div>

                        <div className="relative">
                            <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-indigo-400 w-5 h-5 pointer-events-none" />
                            <select
                                value={filterPlatforms}
                                onChange={(e) => setFilterPlatforms(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white dark:bg-gray-700 cursor-pointer transition-all text-gray-900 dark:text-white text-sm"
                            >
                                <option value="all">Toutes plateformes</option>
                                <option value="3">3 plateformes ⭐</option>
                                <option value="2">2 plateformes</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">{filteredClusters.length}</span> profil(s) trouvé(s)
                                {filteredClusters.length > 0 && (
                                    <span className="ml-2 text-gray-400 dark:text-gray-500">
                                        • Page {currentPage} sur {totalPages}
                                    </span>
                                )}
                            </p>
                            {(searchTerm || searchName || searchLocation) && (
                                <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-semibold">
                                    Filtres actifs
                                </span>
                            )}
                        </div>
                        {(searchTerm || searchName || searchLocation || filterPlatforms !== 'all') && (
                            <button 
                                onClick={resetFilters}
                                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium hover:underline flex items-center gap-2"
                            >
                                <span className="text-lg">×</span> Réinitialiser tout
                            </button>
                        )}
                    </div>
                </div>

                {filteredClusters.length > 0 ? (
                    <div>
                        {/* Statistiques rapides */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                                <Linkedin className="w-8 h-8 mb-2 opacity-80" />
                                <p className="text-3xl font-bold">{allClusters.length}</p>
                                <p className="text-sm opacity-90">Profils LinkedIn</p>
                            </div>
                            <div className="bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl p-6 text-white shadow-lg">
                                <Github className="w-8 h-8 mb-2 opacity-80" />
                                <p className="text-3xl font-bold">{allClusters.filter(c => c.profils?.some(p => p.source === 'github')).length}</p>
                                <p className="text-sm opacity-90">Profils GitHub</p>
                            </div>
                            <div className="bg-gradient-to-br from-sky-400 to-sky-600 rounded-xl p-6 text-white shadow-lg">
                                <Twitter className="w-8 h-8 mb-2 opacity-80" />
                                <p className="text-3xl font-bold">{allClusters.filter(c => c.profils?.some(p => p.source === 'twitter')).length}</p>
                                <p className="text-sm opacity-90">Profils Twitter</p>
                            </div>
                            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                                <Users className="w-8 h-8 mb-2 opacity-80" />
                                <p className="text-3xl font-bold">{allClusters.filter(c => c.taille === 3).length}</p>
                                <p className="text-sm opacity-90">Profils 3 plateformes</p>
                            </div>
                        </div>

                        {/* Grille des profils */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {displayedClusters.map((cluster, idx) => (
                                <ProfileCard 
                                    key={idx} 
                                    cluster={cluster} 
                                    setSelectedProfile={setSelectedProfile}
                                    getLinkedInData={getLinkedInData} 
                                    getGitHubData={getGitHubData} 
                                    getTwitterData={getTwitterData}
                                    calculateProfileScore={calculateProfileScore}
                                    // PROPS POUR LES FAVORIS
                                    onToggleFavorite={handleToggleFavorite} 
                                    isFavorite={isFavorite}
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} handlePageChange={handlePageChange} />}
                    </div>
                ) : (
                    /* Aucun résultat */
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
                        <div className="bg-gray-100 dark:bg-gray-700 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Aucun résultat</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">Aucun profil ne correspond à votre recherche</p>
                        {(searchTerm || searchName || searchLocation) && (
                            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                <p className="text-sm text-gray-700 dark:text-gray-300 font-semibold mb-2">Filtres actifs :</p>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {searchTerm && (
                                        <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full text-xs">
                                            Compétences: {searchTerm}
                                        </span>
                                    )}
                                    {searchName && (
                                        <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs">
                                            Nom: {searchName}
                                        </span>
                                    )}
                                    {searchLocation && (
                                        <span className="px-3 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 rounded-full text-xs">
                                            Localisation: {searchLocation}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                        <button 
                            onClick={resetFilters}
                            className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                        >
                            Réinitialiser tous les filtres
                        </button>
                    </div>
                )}
            </div>

            {/* Modale de profil détaillée */}
            {selectedProfile && (
                <ProfileModal 
                    cluster={selectedProfile} 
                    onClose={() => setSelectedProfile(null)} 
                    getLinkedInData={getLinkedInData} 
                    getGitHubData={getGitHubData} 
                    getTwitterData={getTwitterData}
                    // Logique de favoris pour le Modal
                    isFavorite={isFavorite}
                    onToggleFavorite={handleToggleFavorite}
                />
            )}

            {/* NOUVEAU BLOC : TOAST CONTAINER */}
            <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />

            {/* NOUVEAU BLOC : FAVORITES PANEL (tiroir latéral) */}
            {showFavorites && (
                <FavoritesPanel
                    favorites={favorites}
                    onClose={() => setShowFavorites(false)}
                    onRemove={(profile) => {
                        toggleFavorite(profile);
                        toast.info(`❌ Retiré: ${profile.nom || 'Profil'}`);
                    }}
                    onClear={() => {
                        clearFavorites();
                        toast.success(' Tous les favoris ont été supprimés');
                    }}
                    onSelectProfile={(profile) => {
                        setSelectedProfile(profile);
                        setShowFavorites(false);
                    }}
                    getLinkedInData={getLinkedInData} 
                    getGitHubData={getGitHubData}
                    getTwitterData={getTwitterData}
                    calculateProfileScore={calculateProfileScore}
                    isFavorite={isFavorite} 
                    onToggleFavorite={handleToggleFavorite} 
                />
            )}
        </div>
    );
};

export default RecruitmentPlatform;