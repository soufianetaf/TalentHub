# =============================================================
# PARTIE 2 : CRÉATION DES EMBEDDINGS SÉMANTIQUES
# Objectif : Transformer les descriptions textuelles des profils
#            en vecteurs numériques (embeddings) et sauvegarder.
# Dépendance : sentence-transformers, preprocessing.py (Partie 1)
# =============================================================
import json
import numpy as np
from sentence_transformers import SentenceTransformer
from tqdm import tqdm
import warnings
import os

# Fichier créé par la Partie 1
INPUT_PREPARED_FILE = 'prepared_data.json'
# Fichier créé par la Partie 2 pour la Partie 3
OUTPUT_EMBEDDINGS_FILE = 'prepared_data_with_embeddings.json'

# Import des fonctions de nettoyage et de chargement de la Partie 1
try:
    from preprocessing import charger_et_dedoublonner, nettoyer_texte
except ImportError:
    print("ATTENTION: Impossible d'importer 'preprocessing.py'. Assurez-vous que le fichier est présent.")
    # On définit des fonctions mock si l'import échoue pour permettre le test de cette partie
    def charger_et_dedoublonner(): return {'linkedin': [], 'github': [], 'twitter': []}
    def nettoyer_texte(texte): return ""

warnings.filterwarnings('ignore')

# Configuration du modèle (Choisir un modèle optimisé pour la vitesse et la sémantique)
MODEL_NAME = 'all-MiniLM-L6-v2' 

# ==================== FONCTIONS D'AGRÉGATION ET D'EMBEDDING ====================

def creer_texte_a_matcher(profil, source):
    """Agrège les champs textuels les plus importants pour l'embedding."""
    
    texte_parties = []
    
    # Noms et titres (communs à LinkedIn/GitHub)
    nom = profil.get('name') or profil.get('nom')
    if nom:
        texte_parties.append(nom)
    
    # Champs spécifiques LinkedIn
    if source == 'linkedin':
        if profil.get('headline'):
            texte_parties.append(profil['headline'])
        if profil.get('skills') and isinstance(profil['skills'], list):
             # Agréger les compétences
            skills_text = ' '.join(s.get('name', '') for s in profil['skills'])
            if skills_text:
                texte_parties.append(skills_text)
        if profil.get('experience') and isinstance(profil['experience'], list):
            # Agréger les titres d'expérience
            exp_text = ' '.join(e.get('title', '') for e in profil['experience'])
            if exp_text:
                texte_parties.append(exp_text)
    
    # Champs spécifiques GitHub (Bio et description)
    elif source == 'github':
        if profil.get('bio'):
            texte_parties.append(profil['bio'])
        if profil.get('company'):
            texte_parties.append(profil['company'])
    
    return " ".join(texte_parties).strip()

def creer_embeddings(profils_dict):
    """Crée les embeddings pour tous les profils dans le dictionnaire."""
    
    # 1. Initialisation du modèle
    try:
        model = SentenceTransformer(MODEL_NAME)
        print(f"Modèle SentenceTransformer chargé: {MODEL_NAME}")
    except Exception as e:
        print(f"Erreur de chargement du modèle {MODEL_NAME}: {e}. Veuillez installer: pip install sentence-transformers")
        return profils_dict

    # 2. Collecte des textes et des références
    textes_a_encoder = []
    references = [] # (source, index_dans_liste)
    
    for source, profils_list in profils_dict.items():
        for i, profil in enumerate(profils_list):
            texte = creer_texte_a_matcher(profil, source)
            # Ne pas encoder si le texte est vide (profil incomplet)
            if texte:
                textes_a_encoder.append(texte)
                references.append((source, i))

    print(f"Total de {len(textes_a_encoder)} textes à encoder...")

    # 3. Encodage par lots (batch encoding)
    if not textes_a_encoder:
        print("Aucun texte valide trouvé pour l'encodage. Fin de la Partie 2.")
        return profils_dict

    embeddings_np = model.encode(textes_a_encoder, show_progress_bar=True, convert_to_numpy=True)
    
    # 4. Insertion des embeddings dans la structure de données
    for (source, i), embedding in zip(references, embeddings_np):
        # Stocker l'embedding directement sous forme numpy pour l'instant
        profils_dict[source][i]['embedding'] = embedding

    print("Embeddings créés et attachés aux profils.")
    return profils_dict

def sauvegarder_embeddings(profils_enrichis, filename=OUTPUT_EMBEDDINGS_FILE):
    """Convertit les embeddings Numpy en listes et sauvegarde en JSON."""
    
    # Créer une structure de données sérialisable
    profils_serialisables = {}
    for source, profils_list in profils_enrichis.items():
        profils_serialisables[source] = []
        for profil in profils_list:
            # Créer une copie pour ne pas modifier l'objet original si besoin
            profil_copie = profil.copy() 
            if 'embedding' in profil_copie:
                # Convertir l'array numpy en liste pour la sérialisation JSON
                profil_copie['embedding'] = profil_copie['embedding'].tolist()
            profils_serialisables[source].append(profil_copie)
            
    # Sauvegarde
    print(f"\nSauvegarde des données enrichies vers {filename}...")
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(profils_serialisables, f, indent=2, ensure_ascii=False)
        
    print(f"✅ Données de la Partie 2 sauvegardées avec succès.")


# ==================== EXÉCUTION DU PIPELINE ====================

def charger_donnees_partie1():
    """Charge les données préparées par la Partie 1."""
    if os.path.exists(INPUT_PREPARED_FILE):
        print(f"Chargement des données préparées depuis {INPUT_PREPARED_FILE}...")
        try:
            with open(INPUT_PREPARED_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Erreur de lecture du JSON: {e}. Exécution du prétraitement complet...")
            return charger_et_dedoublonner()
    else:
        print(f"Fichier {INPUT_PREPARED_FILE} non trouvé. Exécution du prétraitement complet...")
        return charger_et_dedoublonner()


if __name__ == '__main__':
    
    print("--- Démarrage de la Partie 2 : Création des Embeddings ---")
    profils_prepares = charger_donnees_partie1() 
    
    # 2. Créer les embeddings (Partie coûteuse en temps/ressources)
    profils_enrichis = creer_embeddings(profils_prepares)

    # 3. Sauvegarder les résultats pour la Partie 3
    sauvegarder_embeddings(profils_enrichis)