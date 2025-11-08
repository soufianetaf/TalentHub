import React from 'react';
// Imports des icônes existantes
import { Linkedin, Github, Twitter, MapPin, Building2, Users, Briefcase, Code } from './Icons';
// NOUVEAUX IMPORTS
import { FavoriteButton } from './FavoriteButton'; 
import { Heart } from './Icons'; // S'assurer que Heart est importé si FavoriteButton n'inclut pas sa définition

const ProfileCard = ({ 
    cluster, 
    getLinkedInData, 
    getGitHubData, 
    getTwitterData, 
    calculateProfileScore, 
    setSelectedProfile,
    // NOUVELLES PROPS POUR LES FAVORIS
    onToggleFavorite,
    isFavorite 
}) => {
    const linkedin = getLinkedInData(cluster);
    const github = getGitHubData(cluster);
    const twitter = getTwitterData(cluster);
    const original = linkedin.profil_original || {};
    const profileScore = calculateProfileScore(cluster);

    const fullName = original.firstName && original.lastName 
      ? `${original.firstName} ${original.lastName}`
      : linkedin.nom || 'Nom non disponible';

    const photo = original.photo || original.profilePicture?.url || 
      `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=4F46E5&color=fff&size=128`;

    return (
        <div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer border-2 border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-600 group transform hover:-translate-y-1"
            onClick={() => setSelectedProfile(cluster)}
        >
            <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 h-48 overflow-visible">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -mr-20 -mt-20"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full -ml-16 -mb-16"></div>
                </div>
                
                {/* BOUTON FAVORIS - AJOUTÉ ICI */}
                <div className="absolute top-4 right-4 z-20">
                    <FavoriteButton
                        profile={cluster}
                        isFavorite={isFavorite(cluster)}
                        onToggle={onToggleFavorite}
                        size="md" // Taille "md" pour un bon affichage sur la bannière
                    />
                </div>
                
                <div className="absolute bottom-4 left-6">
                    <div className="relative">
                        <img 
                            src={photo}
                            alt={fullName}
                            className="w-28 h-28 rounded-full border-4 border-white dark:border-gray-700 object-cover shadow-xl group-hover:scale-105 transition-transform bg-gray-100"
                            onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=4F46E5&color=fff&size=128`}
                        />
                        {/* Indicateur de statut (online/disponible) */}
                        <div className="absolute -bottom-1 -right-1 bg-green-500 w-6 h-6 rounded-full border-2 border-white dark:border-gray-700 animate-pulse"></div>
                    </div>
                </div>
                
                {/* Score de Profil */}
                <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 bg-opacity-90 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg">
                    <div className="flex items-center gap-1">
                        <span className="text-yellow-500 text-xs">⭐</span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{profileScore}%</span>
                    </div>
                </div>
                
                {/* Anciens Badges de Plateformes - SUPPRIMÉS DE L'EN-TÊTE POUR ÉVITER LE CONFLIT */}
                
            </div>

            <div className="pt-6 px-6 pb-6">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white capitalize group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{fullName}</h3>
                        <p className="text-indigo-600 dark:text-indigo-400 font-medium mt-1 line-clamp-1">{original.headline || linkedin.bio?.slice(0, 60)}</p>
                    </div>
                </div>
                
                {/* NOUVEAU : Réintégration des badges de plateformes ici si souhaité */}
                <div className="flex gap-2 mb-4">
                    {linkedin && (
                        <a 
                            href={linkedin.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 rounded-full text-white bg-blue-500 hover:bg-blue-600 shadow-md transition-colors"
                            title="Voir profil LinkedIn"
                        >
                            <Linkedin className="w-4 h-4" />
                        </a>
                    )}
                    {github && (
                        <a 
                            href={github.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 rounded-full text-white bg-gray-800 hover:bg-gray-900 shadow-md transition-colors"
                            title="Voir profil GitHub"
                        >
                            <Github className="w-4 h-4" />
                        </a>
                    )}
                    {twitter && (
                        <a 
                            href={twitter.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 rounded-full text-white bg-sky-500 hover:bg-sky-600 shadow-md transition-colors"
                            title="Voir profil Twitter"
                        >
                            <Twitter className="w-4 h-4" />
                        </a>
                    )}
                </div>

                <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <MapPin className="w-4 h-4 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
                        <span className="text-sm capitalize truncate">{linkedin.localisation || 'Non spécifié'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Building2 className="w-4 h-4 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
                        <span className="text-sm capitalize truncate">{linkedin.organisation || 'Non spécifié'}</span>
                    </div>
                </div>

                <p className="text-gray-600 dark:text-gray-400 text-sm mt-4 leading-relaxed" style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}>
                    {linkedin.bio || original.about || 'Aucune description disponible'}
                </p>

                <div className="grid grid-cols-3 gap-3 mt-6">
                    {original.connectionsCount ? (
                        <div className="text-center bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 rounded-xl p-3 border border-indigo-200 dark:border-indigo-700">
                            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mx-auto mb-1" />
                            <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{original.connectionsCount > 500 ? '500+' : original.connectionsCount}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Connexions</p>
                        </div>
                    ) : null}
                    {github?.profil_original?.public_repos ? (
                        <div className="text-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/30 dark:to-gray-700/30 rounded-xl p-3 border border-gray-200 dark:border-gray-600">
                            <Github className="w-5 h-5 text-gray-800 dark:text-gray-300 mx-auto mb-1" />
                            <p className="text-xl font-bold text-gray-800 dark:text-gray-300">{github.profil_original.public_repos}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Repos</p>
                        </div>
                    ) : null}
                    {original.experience?.length ? (
                        <div className="text-center bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 rounded-xl p-3 border border-emerald-200 dark:border-emerald-700">
                            <Briefcase className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
                            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{original.experience.length}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Expériences</p>
                        </div>
                    ) : null}
                </div>

                {original.skills?.slice(0, 5).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-3">
                            <Code className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Compétences clés</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {original.skills.slice(0, 5).map((skill, idx) => (
                                <span key={idx} className="px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-semibold border border-indigo-100 dark:border-indigo-700">
                                    {skill.name}
                                </span>
                            ))}
                            {original.skills.length > 5 && (
                                <span className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs font-semibold">
                                    +{original.skills.length - 5}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Profil complet disponible</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform inline-block">
                            Voir plus →
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileCard;