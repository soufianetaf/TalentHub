# =============================================================
# PARTIE 1 : PRÉTRAITEMENT ET DÉDOUBLONNAGE
# Objectif : Charger les données brutes, les nettoyer, les normaliser
#            et effectuer le dédoublonnage initial par source.
# =============================================================
import json
import re
import warnings
from collections import defaultdict
from pathlib import Path
from tqdm import tqdm

warnings.filterwarnings('ignore')

# ==================== CONFIGURATION ====================
# Fichiers sources
FICHIER_GITHUB = 'data/Github.json'
FICHIER_LINKEDIN = ['data/Linkedin_1.json', 'data/Linkedin_2.json', 
                    'data/Linkedin_3.json', 'data/Linkedin_4.json']
FICHIER_TWITTER = ['data/Twitter_1.json', 'data/Twitter_2.json', 'data/Twitter_3.json']

# Seuils pour le dédoublonnage local (seuils basiques ici, les seuils avancés sont dans matching.py)
SEUIL_EMAIL = 0.80 

# ==================== UTILITAIRES DE NETTOYAGE ====================

def nettoyer_texte(texte):
    """Nettoie et normalise un texte (minuscule, supprime URLs, ponctuation)"""
    if not texte or texte is None:
        return ""
    texte = str(texte).lower()
    # Supprimer URLs
    texte = re.sub(r'http\S+|www\S+|https\S+', '', texte, flags=re.MULTILINE)
    # Supprimer la ponctuation, conserver les espaces
    texte = re.sub(r'[^\w\s]', ' ', texte)
    # Remplacer plusieurs espaces par un seul
    texte = re.sub(r'\s+', ' ', texte).strip()
    return texte

def extraire_nom_utilisateur(url, plateforme):
    """Extrait le nom d'utilisateur d'une URL pour uniformisation"""
    if not url: return None
    
    url = str(url).lower()
    
    if plateforme == 'github':
        match = re.search(r'github\.com/([a-zA-Z0-9_-]+)', url)
        return match.group(1) if match else None
    
    elif plateforme == 'linkedin':
        # Capture l'identifiant après /in/ et avant le prochain / ou ?
        match = re.search(r'linkedin\.com/in/([a-zA-Z0-9_-]+)', url)
        return match.group(1) if match else None
        
    elif plateforme == 'twitter':
        match = re.search(r'(?:twitter|x)\.com/([a-zA-Z0-9_]+)', url)
        return match.group(1) if match else None
        
    return None

def normaliser_profil(profil, source):
    """Ajoute les champs normalisés nécessaires au matching"""
    # Identifiant unique de la source
    profil['id'] = profil.get('username') or profil.get('url') or profil.get('linkedin_id')
    
    # Normalisation du nom
    profil['nom_normalise'] = nettoyer_texte(profil.get('name') or profil.get('nom'))

    # Normalisation de l'email (partie locale)
    email = profil.get('email') or ''
    email_local = email.split('@')[0]
    profil['email_normalise'] = nettoyer_texte(email_local)

    # Normalisation de l'username
    if source == 'github':
        profil['username_normalise'] = nettoyer_texte(profil['username'])
    elif source == 'twitter':
        profil['username_normalise'] = nettoyer_texte(profil['username'])
    elif source == 'linkedin':
        # Utiliser l'identifiant de l'URL pour uniformiser
        profil['username_normalise'] = nettoyer_texte(extraire_nom_utilisateur(profil.get('url'), 'linkedin'))
    
    # Assurez-vous que l'email, si présent, est propre
    if 'email' in profil:
        profil['email'] = str(profil['email']).lower()
        
    return profil

# ==================== DEDOUBLONNAGE INTRA-SOURCE ====================

def charger_et_dedoublonner():
    """Charge les données de tous les fichiers et supprime les doublons internes."""
    toutes_donnees = {}
    
    # 1. Traitement GitHub
    print("Chargement et dédoublonnage GitHub...")
    github_profils = {}
    try:
        with open(FICHIER_GITHUB, 'r', encoding='utf-8') as f:
            data = json.load(f)
            for p in tqdm(data, desc="Traitement GitHub"):
                p['source'] = 'github'
                p = normaliser_profil(p, 'github')
                # Clé de dédoublonnage: username
                key = p['id']
                if key and key not in github_profils:
                    github_profils[key] = p
    except Exception as e:
        print(f"Erreur lors du chargement de GitHub: {e}")
    
    toutes_donnees['github'] = list(github_profils.values())
    print(f"-> GitHub: {len(toutes_donnees['github'])} profils uniques.")

    # 2. Traitement LinkedIn
    print("Chargement et dédoublonnage LinkedIn...")
    linkedin_profils = {}
    for fichier in FICHIER_LINKEDIN:
        try:
            with open(fichier, 'r', encoding='utf-8') as f:
                data = json.load(f)
                for p in tqdm(data, desc=f"Traitement {Path(fichier).name}"):
                    p['source'] = 'linkedin'
                    p = normaliser_profil(p, 'linkedin')
                    # Clé de dédoublonnage: username normalisé ou url
                    key = p['username_normalise'] or p['id']
                    if key and key not in linkedin_profils:
                         linkedin_profils[key] = p
        except Exception as e:
            print(f"Erreur lors du chargement de {fichier}: {e}")
            
    toutes_donnees['linkedin'] = list(linkedin_profils.values())
    print(f"-> LinkedIn: {len(toutes_donnees['linkedin'])} profils uniques.")

    # 3. Traitement Twitter
    print("Chargement et dédoublonnage Twitter...")
    twitter_profils = {}
    for fichier in FICHIER_TWITTER:
        try:
            with open(fichier, 'r', encoding='utf-8') as f:
                data = json.load(f)
                for p in tqdm(data, desc=f"Traitement {Path(fichier).name}"):
                    p['source'] = 'twitter'
                    p = normaliser_profil(p, 'twitter')
                    # Clé de dédoublonnage: username normalisé
                    key = p['username_normalise']
                    if key and key not in twitter_profils:
                        twitter_profils[key] = p
        except Exception as e:
            print(f"Erreur lors du chargement de {fichier}: {e}")
            
    toutes_donnees['twitter'] = list(twitter_profils.values())
    print(f"-> Twitter: {len(toutes_donnees['twitter'])} profils uniques.")
    
    return toutes_donnees

if __name__ == '__main__':
    profils_prepares = charger_et_dedoublonner()
    total_profiles = sum(len(p) for p in profils_prepares.values())
    print(f"\nTOTAL de profils uniques prêts pour le matching: {total_profiles}")
    
    # sauvegarderiez les données préparées pour la Partie 2
    with open('prepared_data.json', 'w', encoding='utf-8') as f:
    json.dump(profils_prepares, f, indent=2, ensure_ascii=False)