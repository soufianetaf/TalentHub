# =============================================================
# PARTIE 3 : LOGIQUE DE MATCHING ET CLUSTERING
# Objectif : Utiliser les critères (déterministes, Levenshtein,
#            Cosimus) pour grouper les profils de différentes
#            sources en clusters uniques.
# =============================================================
import json
import numpy as np
import pandas as pd
import os
from sklearn.metrics.pairwise import cosine_similarity
from Levenshtein import distance as levenshtein_distance
from collections import defaultdict
from tqdm import tqdm

# Fichier créé par la Partie 2
INPUT_EMBEDDINGS_FILE = 'prepared_data_with_embeddings.json'
OUTPUT_CLUSTERS_FILE = 'clusters_final_report.json'

# ==================== SEUILS DE MATCHING (OPTIMISÉS) ====================
SEUIL_NOM = 0.75         # Similarité de Levenshtein (Nom complet)
SEUIL_USERNAME = 0.60    # Similarité de Levenshtein (Username)
SEUIL_EMBEDDING = 0.60   # Similarité Cosinus (Description/Compétences)
SEUIL_GLOBAL = 0.65      # Seuil minimum requis pour le matching hybride
SEUIL_EMAIL = 0.80       # Seuil pour la partie locale de l'email

# ==================== FONCTIONS D'UTILITAIRES ====================

def charger_embeddings_partie2(filename=INPUT_EMBEDDINGS_FILE):
    """
    Charge les données enrichies (Partie 2) et convertit les listes d'embeddings
    en tableaux NumPy (ndarray) pour le calcul de similarité.
    """
    if not os.path.exists(filename):
        print(f"ERREUR: Fichier d'embeddings introuvable : {filename}")
        print("Veuillez d'abord exécuter 'embedding_creator.py' (Partie 2).")
        return None

    print(f"Chargement des embeddings depuis {filename}...")
    with open(filename, 'r', encoding='utf-8') as f:
        profils_dict = json.load(f)

    # Conversion des listes d'embeddings en np.ndarray
    for source in profils_dict:
        for profil in profils_dict[source]:
            if 'embedding' in profil and isinstance(profil['embedding'], list):
                profil['embedding'] = np.array(profil['embedding'])
            else:
                # S'il manque l'embedding (profil trop court), le mettre à None
                profil['embedding'] = None
                
    print("✅ Embeddings chargés et convertis en NumPy.")
    return profils_dict

def calculer_similarite_cosinus(emb1, emb2):
    """Calcule la similarité cosinus entre deux vecteurs d'embedding."""
    if emb1 is None or emb2 is None:
        return 0.0
    # Le vecteur numpy doit être remodelé pour sklearn.metrics.pairwise
    emb1 = emb1.reshape(1, -1)
    emb2 = emb2.reshape(1, -1)
    return cosine_similarity(emb1, emb2)[0][0]

def calculer_similarite_levenshtein(s1, s2):
    """Calcule la similarité basée sur la distance de Levenshtein (0 à 1)."""
    if not s1 or not s2: return 0.0
    s1, s2 = str(s1), str(s2)
    # Longueur maximale
    max_len = max(len(s1), len(s2))
    # Distance normalisée par la longueur maximale
    dist = levenshtein_distance(s1, s2)
    return 1.0 - (dist / max_len)

# ==================== LOGIQUE DE MATCHING ====================

def tenter_match_deterministe(p1, p2):
    """Vérifie si les profils correspondent sur des critères forts (Email, ID social)."""
    
    # 1. Match d'URL social croisé
    # NOTE: Cette logique suppose que les champs URL ont été normalisés/créés
    # durant la Partie 1/2. 
    # Ex: si GitHub (p1) a un champ 'linkedin_url' qui correspond à l'URL de p2
    
    # Pour simuler, nous utilisons les identifiants normatifs s'ils existent
    if (p1.get('source') == 'github' and p2.get('source') == 'twitter' and 
        p1.get('twitter_username') == p2.get('username')):
        return 1.0, "deterministic_social_username"
    if (p1.get('source') == 'twitter' and p2.get('source') == 'github' and 
        p1.get('github_username') == p2.get('username')):
        return 1.0, "deterministic_social_username"


    # 2. Match E-mail (partie locale normalisée)
    e1 = p1.get('email_normalise')
    e2 = p2.get('email_normalise')
    if e1 and e2:
        sim_email = calculer_similarite_levenshtein(e1, e2)
        if sim_email >= SEUIL_EMAIL:
            # Match quasi parfait sur la partie locale de l'email
            return 0.95, f"deterministic_email_{sim_email:.2f}"
            
    return 0.0, None

def tenter_match_hybride(p1, p2):
    """Calcule un score global basé sur les critères probabilistes."""
    
    scores = {}
    
    # Similarité d'embeddings (le critère le plus pondérant)
    if 'embedding' in p1 and 'embedding' in p2 and p1['embedding'] is not None and p2['embedding'] is not None:
        scores['embedding'] = calculer_similarite_cosinus(p1['embedding'], p2['embedding'])
    else:
        scores['embedding'] = 0.0
        
    # Similarité de nom complet (Levenshtein)
    scores['nom'] = calculer_similarite_levenshtein(p1.get('nom_normalise'), p2.get('nom_normalise'))
    
    # Similarité d'username (Levenshtein)
    scores['username'] = calculer_similarite_levenshtein(p1.get('username_normalise'), p2.get('username_normalise'))
    
    # Logique de score combiné :
    if scores['embedding'] >= SEUIL_EMBEDDING:
        # L'embedding est fort: 60% embedding, 30% nom, 10% username
        score_global = (scores['embedding'] * 0.6) + (scores['nom'] * 0.3) + (scores['username'] * 0.1)
    else:
        # L'embedding est faible/manquant: 
        # On se base principalement sur le nom (50%) et un peu sur l'embedding (40%)
        if scores['nom'] < 0.9:
            return 0.0, None # Rejet si l'embedding est faible ET le nom n'est pas presque parfait
        score_global = (scores['embedding'] * 0.4) + (scores['nom'] * 0.5) + (scores['username'] * 0.1)
        
    if score_global >= SEUIL_GLOBAL:
        return score_global, f"hybrid_score_{score_global:.2f}"
    
    return 0.0, None

def effectuer_clustering(profils_dict):
    """Algorithme de matching et de clustering."""
    
    clusters = []
    # Créer des copies des profils à matcher (pour les enlever une fois qu'ils sont matchés)
    profils_restants = {source: list(p) for source, p in profils_dict.items()}

    # 1. Utiliser LinkedIn comme source principale pour l'itération
    linkedin_list = profils_restants.pop('linkedin', [])
    
    profils_github = profils_restants.get('github', [])
    profils_twitter = profils_restants.get('twitter', [])

    # 2. Boucle de matching
    for p_li in tqdm(linkedin_list, desc="Clustering de profils"):
        # Initialiser le cluster avec le profil LinkedIn
        current_cluster = {
            'profils': [p_li],
            'sources': {p_li['source']},
            'taille': 1,
            'match_info': []
        }
        
        # 2a. Tenter de matcher avec GitHub
        match_github = None
        # Créer une liste temporaire d'indices à supprimer pour éviter la mutation lors de l'itération
        # (Bien que 'profils_github' soit une copie, l'approche 'remove' est moins performante)

        # Itérer sur GitHub
        for p_gh in profils_github:
            score, source_match = tenter_match_deterministe(p_li, p_gh)
            if score == 0.0:
                score, source_match = tenter_match_hybride(p_li, p_gh)
                
            if score >= SEUIL_GLOBAL:
                match_github = p_gh
                current_cluster['profils'].append(p_gh)
                current_cluster['sources'].add(p_gh['source'])
                current_cluster['match_info'].append({'target': 'github', 'score': score, 'method': source_match})
                break # On prend le premier match jugé suffisant

        # 2b. Tenter de matcher avec Twitter
        match_twitter = None
        # Itérer sur Twitter
        for p_tw in profils_twitter:
            score, source_match = tenter_match_deterministe(p_li, p_tw)
            if score == 0.0:
                score, source_match = tenter_match_hybride(p_li, p_tw)
                
            if score >= SEUIL_GLOBAL:
                match_twitter = p_tw
                current_cluster['profils'].append(p_tw)
                current_cluster['sources'].add(p_tw['source'])
                current_cluster['match_info'].append({'target': 'twitter', 'score': score, 'method': source_match})
                break # On prend le premier match jugé suffisant

        # Ajouter le cluster
        clusters.append({
            'cluster_id': f"C-{len(clusters):05d}",
            # Retirer les embeddings des profils avant la sauvegarde (ils sont trop lourds)
            'profils': [{k: v for k, v in p.items() if k != 'embedding'} for p in current_cluster['profils']], 
            'sources': list(current_cluster['sources']),
            'taille': len(current_cluster['profils'])
        })
        
        # 3. Mise à jour des profils restants (nettoyer la liste)
        # Supprimer les profils qui ont été matchés pour éviter les doublons dans d'autres clusters
        if match_github:
            profils_github.remove(match_github)
        if match_twitter:
            profils_twitter.remove(match_twitter)

    return clusters

# ==================== EXÉCUTION ET RAPPORT ====================

if __name__ == '__main__':
    # 1. Chargement des données enrichies de la Partie 2
    print("--- Démarrage de la Partie 3 : Matching et Clustering ---")
    profils_enrichis = charger_embeddings_partie2() 
    
    if profils_enrichis is None:
        exit(1) # Arrêter si le chargement a échoué

    # 2. Exécution de la Partie 3 (Clustering)
    clusters_finaux = effectuer_clustering(profils_enrichis)
    
    # 3. Rapport
    print("\n" + "="*70)
    print("RAPPORT DE CLUSTERING")
    print("="*70)
    print(f"Total de clusters créés (basés sur LinkedIn): {len(clusters_finaux)}")
    
    # Clusters valides: taille > 1 signifie qu'au moins deux sources ont été matchées
    clusters_valides = [c for c in clusters_finaux if c['taille'] > 1]
    print(f"Clusters avec matching inter-plateforme: {len(clusters_valides)}")
    
    # Analyse détaillée
    if clusters_valides:
        print("\nANALYSE SUPPLÉMENTAIRE\n")
        
        # Distribution des tailles
        print("Distribution des clusters par taille:")
        tailles = defaultdict(int)
        for c in clusters_valides:
            tailles[c['taille']] += 1
        for taille in sorted(tailles.keys()):
            # La taille maximale est 3 (LinkedIn, GitHub, Twitter)
            print(f"   • {taille} plateformes: {tailles[taille]} clusters")
        
        # Combinaisons de sources
        print("\nCombinaisons de sources:")
        combos = defaultdict(int)
        for c in clusters_valides:
            combo = '+'.join(sorted(c['sources']))
            combos[combo] += 1
        for combo in sorted(combos.keys()):
            print(f"   • {combo}: {combos[combo]} clusters")
        
        # Sauvegarde du résultat
        print(f"\nSauvegarde des clusters vers {OUTPUT_CLUSTERS_FILE}...")
        with open(OUTPUT_CLUSTERS_FILE, 'w', encoding='utf-8') as f:
            # Ne sauvegarder que les clusters qui ont au moins 2 sources matchées
            json.dump(clusters_valides, f, indent=2, ensure_ascii=False)
        print(f" Clusters sauvegardés dans {OUTPUT_CLUSTERS_FILE}")