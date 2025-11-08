// src/hooks/useTalentData.js
import { useState, useEffect, useCallback } from 'react';

const getLinkedInData = (cluster) => cluster.profils?.find(p => p.source === 'linkedin') || {};

const calculateProfileScore = (cluster) => {
    let score = 0;
    const linkedin = getLinkedInData(cluster);
    const github = cluster.profils?.find(p => p.source === 'github');
    const twitter = cluster.profils?.find(p => p.source === 'twitter');
    const original = linkedin.profil_original || {};

    if (linkedin) score += 30;
    if (github) score += 30;
    if (twitter) score += 20;
    if (original.experience?.length > 0) score += 10;
    if (original.skills?.length > 5) score += 10;
    
    return Math.min(score, 100);
};

const filterClustersData = (all, term, name, location, platform) => {
    let filtered = all;

    if (term) {
      const searchLower = term.toLowerCase();
      filtered = filtered.filter(cluster => {
        const linkedinProfile = getLinkedInData(cluster);
        if (!linkedinProfile) return false;
        
        const original = linkedinProfile.profil_original || {};
        const bio = (linkedinProfile.bio || '').slice(0, 200);
        const headline = original.headline || '';
        const skills = original.skills?.slice(0, 10).map(s => s.name).join(' ') || '';
        
        const searchableText = `${bio} ${headline} ${skills}`.toLowerCase();
        return searchableText.includes(searchLower);
      });
    }

    if (name) {
      const nameLower = name.toLowerCase();
      filtered = filtered.filter(cluster => {
        const linkedinProfile = getLinkedInData(cluster);
        if (!linkedinProfile) return false;
        
        const original = linkedinProfile.profil_original || {};
        const fullName = original.firstName && original.lastName 
          ? `${original.firstName} ${original.lastName}`.toLowerCase()
          : linkedinProfile.nom?.toLowerCase() || '';
        
        return fullName.includes(nameLower);
      });
    }

    if (location) {
      const locationLower = location.toLowerCase();
      filtered = filtered.filter(cluster => {
        const linkedinProfile = getLinkedInData(cluster);
        if (!linkedinProfile) return false;
        
        const profileLocation = (linkedinProfile.localisation || '').toLowerCase();
        return profileLocation.includes(locationLower);
      });
    }

    if (platform !== 'all') {
      filtered = filtered.filter(cluster => 
        cluster.taille === parseInt(platform)
      );
    }
    return filtered;
};

const useTalentData = () => {
  const [allClusters, setAllClusters] = useState([]);
  const [filteredClusters, setFilteredClusters] = useState([]);
  const [displayedClusters, setDisplayedClusters] = useState([]);
  
  // États de recherche et de filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [filterPlatforms, setFilterPlatforms] = useState('all');
  
  // États d'interface
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState(null);
  
  // Pagination
  const itemsPerPage = 12;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const loadClustersChunked = useCallback(async () => {
    try {
      setLoading(true);
      setLoadingProgress(10);
      
      // CORRECTION: Chemin vers le fichier dans le dossier public
      const response = await fetch('/clusters_3_plateformes.json');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      setLoadingProgress(30);
      
      // Lecture en streaming pour les gros fichiers
      const reader = response.body.getReader();
      const contentLength = +response.headers.get('Content-Length');
      
      let receivedLength = 0;
      let chunks = [];
      
      while(true) {
        const {done, value} = await reader.read();
        
        if (done) break;
        
        chunks.push(value);
        receivedLength += value.length;
        
        const progress = Math.min(30 + (receivedLength / contentLength) * 40, 70);
        setLoadingProgress(Math.round(progress));
      }
      
      setLoadingProgress(80);
      
      const chunksAll = new Uint8Array(receivedLength);
      let position = 0;
      for(let chunk of chunks) {
        chunksAll.set(chunk, position);
        position += chunk.length;
      }
      
      const text = new TextDecoder("utf-8").decode(chunksAll);
      
      setLoadingProgress(90);
      
      const data = JSON.parse(text);
      
      if (!Array.isArray(data)) {
        throw new Error('Le fichier JSON doit contenir un tableau');
      }
      
      setLoadingProgress(95);
      
      setAllClusters(data);
      setFilteredClusters(data);
      updateDisplayedClusters(data, 1);
      setError(null);
      setLoadingProgress(100);
      
    } catch (err) {
      console.error('Erreur de chargement:', err);
      setError(`Impossible de charger les données: ${err.message}`);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  }, []);

  const updateDisplayedClusters = useCallback((clusters, page) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setDisplayedClusters(clusters.slice(startIndex, endIndex));
    setTotalPages(Math.ceil(clusters.length / itemsPerPage));
    setCurrentPage(page);
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      updateDisplayedClusters(filteredClusters, newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Chargement initial
  useEffect(() => {
    loadClustersChunked();
  }, [loadClustersChunked]);

  // Debouncing et application du filtre
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const filtered = filterClustersData(allClusters, searchTerm, searchName, searchLocation, filterPlatforms);
      setFilteredClusters(filtered);
      updateDisplayedClusters(filtered, 1);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchName, searchLocation, filterPlatforms, allClusters, updateDisplayedClusters]);

  return {
    // Données et Affichage
    allClusters, filteredClusters, displayedClusters,
    // Recherche et Filtres
    searchTerm, setSearchTerm, searchName, setSearchName, searchLocation, setSearchLocation, filterPlatforms, setFilterPlatforms,
    // Pagination
    currentPage, totalPages, handlePageChange,
    // État d'interface
    loading, loadingProgress, error, loadClustersChunked,
    // Fonctions utilitaires
    getLinkedInData, calculateProfileScore,
    getGitHubData: (cluster) => cluster.profils?.find(p => p.source === 'github') || null,
    getTwitterData: (cluster) => cluster.profils?.find(p => p.source === 'twitter') || null,
  };
};

export default useTalentData;