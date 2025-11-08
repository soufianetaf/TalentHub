# ═══════════════════════════════════════════════════════════
#  PHASE 2 - Google Custom Search API (VERSION LOCALE)
# ═══════════════════════════════════════════════════════════
# Cherche LinkedIn & Twitter pour les profils manquants via Google Search API.
# Utilise un Rate Limiter intégré pour respecter le quota (100 requêtes/minute).
# ═══════════════════════════════════════════════════════════


# 📥 IMPORTS STANDARDS
import json
import re
import time
import os
import threading
from googleapiclient.discovery import build
from tqdm import tqdm # Utilisation de tqdm standard
from concurrent.futures import ThreadPoolExecutor, as_completed
from collections import Counter

# ═══════════════════════════════════════════════════════════
#  CONFIGURATION GOOGLE API
# ═══════════════════════════════════════════════════════════

INPUT_FILENAME = 'github_profiles_missing_links.json'

print("="*70)
print("CONFIGURATION GOOGLE CUSTOM SEARCH API")
print("="*70)
print("\nVotre quota : 10,000 requêtes/jour | Limite : 100 requêtes/minute\n")

# Utilisation de input() pour le terminal local
api_key = input("Entrez votre API Key Google: ")
search_engine_id = input("Entrez votre Search Engine ID (CX): ")

API_CONFIG = {
    'api_key': api_key,
    'cx': search_engine_id
}

print("\nConfiguration terminée.")

# ═══════════════════════════════════════════════════════════
#  RATE LIMITER (90 requêtes/minute max pour sécurité)
# ═══════════════════════════════════════════════════════════

class RateLimiter:
    """Limite à 90 requêtes/minute pour sécurité"""
    def __init__(self, max_calls=90, time_window=60):
        self.max_calls = max_calls
        self.time_window = time_window
        self.calls = []
        self.lock = threading.Lock()

    def wait_if_needed(self):
        with self.lock:
            now = time.time()
            # Supprimer les appels hors fenêtre
            self.calls = [t for t in self.calls if now - t < self.time_window]

            if len(self.calls) >= self.max_calls:
                # Attendre que le plus vieux appel sorte de la fenêtre
                sleep_time = self.time_window - (now - self.calls[0]) + 1
                print(f"\nRate limit : attente {sleep_time:.0f}s...")
                time.sleep(sleep_time)
                # Remise à zéro pour la nouvelle fenêtre
                self.calls = [t for t in self.calls if time.time() - t < self.time_window] 

            self.calls.append(time.time()) # Utiliser le temps actuel après l'attente

rate_limiter = RateLimiter(max_calls=90, time_window=60)

# ═══════════════════════════════════════════════════════════
#  CHARGEMENT DES DONNÉES LOCALES
# ═══════════════════════════════════════════════════════════

if not os.path.exists(INPUT_FILENAME):
    print(f"\nERREUR: Fichier introuvable! Placez '{INPUT_FILENAME}' dans le même dossier que ce script.")
    exit(1)

# Charger les profils sans liens
with open(INPUT_FILENAME, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Extraire la liste des profils
if isinstance(data, dict) and 'profiles' in data:
    profiles = data['profiles']
else:
    profiles = data

print(f"\n{len(profiles):,} profils à traiter chargés depuis {INPUT_FILENAME}")

# ═══════════════════════════════════════════════════════════
#  FONCTIONS DE RECHERCHE
# ═══════════════════════════════════════════════════════════

def extract_linkedin_from_results(items):
    """Extrait LinkedIn depuis résultats Google"""
    if not items:
        return None

    patterns = [
        r'linkedin\.com/in/([a-zA-Z0-9-]+)',
        r'www\.linkedin\.com/in/([a-zA-Z0-9-]+)'
    ]

    for item in items:
        link = item.get('link', '')

        # Vérifier le lien direct
        for pattern in patterns:
            match = re.search(pattern, link, re.IGNORECASE)
            if match:
                username = match.group(1)
                # Filtrer les URLs génériques
                if username.lower() not in ['linkedin', 'in', 'company', 'pub', 'posts', 'jobs']:
                    return f"https://linkedin.com/in/{username}"

    # Si pas trouvé dans les liens, chercher dans les snippets
    for item in items:
        snippet = item.get('snippet', '')
        for pattern in patterns:
            match = re.search(pattern, snippet, re.IGNORECASE)
            if match:
                username = match.group(1)
                if username.lower() not in ['linkedin', 'in', 'company', 'pub', 'posts', 'jobs']:
                    return f"https://linkedin.com/in/{username}"

    return None

def extract_twitter_from_results(items):
    """Extrait Twitter depuis résultats Google"""
    if not items:
        return None

    patterns = [
        r'twitter\.com/([a-zA-Z0-9_]+)',
        r'x\.com/([a-zA-Z0-9_]+)'
    ]

    for item in items:
        link = item.get('link', '')

        # Vérifier le lien direct
        for pattern in patterns:
            match = re.search(pattern, link, re.IGNORECASE)
            if match:
                username = match.group(1)
                # Filtrer les URLs génériques
                if username.lower() not in ['twitter', 'x', 'intent', 'share', 'search', 'i', 'explore', 'home']:
                    return f"https://twitter.com/{username}"

    # Si pas trouvé dans les liens, chercher dans les snippets
    for item in items:
        snippet = item.get('snippet', '')
        for pattern in patterns:
            match = re.search(pattern, snippet, re.IGNORECASE)
            if match:
                username = match.group(1)
                if username.lower() not in ['twitter', 'x', 'intent', 'share', 'search', 'i', 'explore', 'home']:
                    return f"https://twitter.com/{username}"

    return None

def google_search(query, retries=3):
    """Effectue une recherche Google avec rate limiting"""
    for attempt in range(retries):
        try:
            # Attendre si nécessaire (rate limiting)
            rate_limiter.wait_if_needed()

            # La création du service peut rester à l'extérieur si la clé est statique, mais elle est ici pour la robustesse.
            service = build("customsearch", "v1", developerKey=API_CONFIG['api_key'])
            result = service.cse().list(
                q=query,
                cx=API_CONFIG['cx'],
                num=10
            ).execute()
            
            return result.get('items', [])

        except Exception as e:
            error_str = str(e).lower()

            # Quota journalier dépassé
            if 'quota' in error_str and 'day' in error_str:
                print(f"\nERREUR: QUOTA JOURNALIER DÉPASSÉ (10,000 requêtes)")
                print(f" Attendez demain ou utilisez une autre clé API.")
                return None

            # Rate limit par minute
            if 'quota' in error_str or 'rate' in error_str or '429' in error_str:
                wait_time = (attempt + 1) * 10
                print(f"\nRate limit détecté, attente {wait_time}s...")
                time.sleep(wait_time)
                continue

            # Autre erreur
            if attempt == retries - 1:
                print(f"\nErreur recherche: {str(e)[:100]}")
                return None

            time.sleep(2)

    return None

def search_profile_social_links(profile):
    """Cherche LinkedIn et Twitter pour un profil"""
    result = {
        'username': profile['username'],
        'name': profile.get('name'),
        'github_url': profile.get('github_url'),
        'linkedin': None,
        'twitter': None,
        'source': []
    }

    # Construire les requêtes
    name = profile.get('name') or profile['username']
    username = profile['username']

    # Recherche LinkedIn
    query_linkedin = f'"{name}" OR "{username}" site:linkedin.com/in Morocco developer'
    items_linkedin = google_search(query_linkedin)

    if items_linkedin:
        result['linkedin'] = extract_linkedin_from_results(items_linkedin)
        if result['linkedin']:
            result['source'].append('google_linkedin')

    # Recherche Twitter
    query_twitter = f'"{name}" OR "{username}" (site:twitter.com OR site:x.com) Morocco developer'
    items_twitter = google_search(query_twitter)

    if items_twitter:
        result['twitter'] = extract_twitter_from_results(items_twitter)
        if result['twitter']:
            result['source'].append('google_twitter')

    return result

# ═══════════════════════════════════════════════════════════
#  TRAITEMENT (MODE SÉQUENTIEL / RATE LIMIT GÉRÉ)
# ═══════════════════════════════════════════════════════════

print(f"\nTraitement de {len(profiles):,} profils...")
print(f"Mode : Séquentiel (limite de 90 req/min)")

start_time = time.time()
results = []
errors = []

# Compteurs
linkedin_found = 0
twitter_found = 0
both_found = 0
requests_made = 0

# Traitement séquentiel avec barre de progression
for i, profile in enumerate(tqdm(profiles, desc="Recherche Google")):
    try:
        result = search_profile_social_links(profile)
        results.append(result)

        # Mise à jour des compteurs
        requests_made += 2  # 2 requêtes par profil
        if result['linkedin']:
            linkedin_found += 1
        if result['twitter']:
            twitter_found += 1
        if result['linkedin'] and result['twitter']:
            both_found += 1

    except Exception as e:
        errors.append({'username': profile.get('username'), 'error': str(e)})

elapsed_time = time.time() - start_time

# ═══════════════════════════════════════════════════════════
#  STATISTIQUES
# ═══════════════════════════════════════════════════════════

one_found = sum(1 for r in results if (r['linkedin'] or r['twitter']) and not (r['linkedin'] and r['twitter']))
none_found = sum(1 for r in results if not r['linkedin'] and not r['twitter'])

print("\n" + "="*70)
print("RESULTATS PHASE 2 - GOOGLE SEARCH")
print("="*70)
print(f"Temps de traitement : {elapsed_time/60:.1f} minutes ({elapsed_time/3600:.1f}h)")
print(f"Requêtes effectuées : {requests_made:,}")
print(f"Vitesse moyenne     : {requests_made/(elapsed_time/60):.1f} req/min")
print()
print(f"Total traité      : {len(results):,} profils")
print(f"LinkedIn trouvé   : {linkedin_found:,} ({linkedin_found/len(results)*100:.1f}%)")
print(f"Twitter trouvé    : {twitter_found:,} ({twitter_found/len(results)*100:.1f}%)")
print(f"Les DEUX trouvés  : {both_found:,} ({both_found/len(results)*100:.1f}%)")
print(f"Un seul trouvé    : {one_found:,} ({one_found/len(results)*100:.1f}%)")
print(f"Rien trouvé       : {none_found:,} ({none_found/len(results)*100:.1f}%)")
if errors:
    print(f"Erreurs          : {len(errors)}")
print("="*70)

# ═══════════════════════════════════════════════════════════
#  SAUVEGARDE
# ═══════════════════════════════════════════════════════════

print("\nSauvegarde des résultats...")

# Résultats complets Phase 2
output = {
    'metadata': {
        'phase': 2,
        'method': 'Google Custom Search API',
        'total_profiles': len(results),
        'requests_made': requests_made,
        'linkedin_found': linkedin_found,
        'twitter_found': twitter_found,
        'both_found': both_found,
        'processing_time_minutes': round(elapsed_time/60, 2),
        'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
    },
    'profiles': results
}

with open('phase2_google_results.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, indent=2, ensure_ascii=False)

# Profils avec liens trouvés
found = [r for r in results if r['linkedin'] or r['twitter']]
with open('phase2_links_found.json', 'w', encoding='utf-8') as f:
    json.dump(found, f, indent=2, ensure_ascii=False)

# Profils encore sans liens
still_missing = [r for r in results if not r['linkedin'] and not r['twitter']]
missing_output = {
    'count': len(still_missing),
    'profiles': still_missing
}
with open('phase3_still_missing.json', 'w', encoding='utf-8') as f:
    json.dump(missing_output, f, indent=2, ensure_ascii=False)


import csv
with open('phase2_google_results.csv', 'w', newline='', encoding='utf-8-sig') as f:
    writer = csv.DictWriter(f, fieldnames=['username', 'name', 'github_url', 'linkedin', 'twitter', 'source'])
    writer.writeheader()
    for r in results:
        writer.writerow({
            'username': r['username'],
            'name': r['name'] or '',
            'github_url': r['github_url'],
            'linkedin': r['linkedin'] or '',
            'twitter': r['twitter'] or '',
            'source': ', '.join(r['source'])
        })

print("\nFichiers sauvegardés:")
print("   phase2_google_results.json")
print("   phase2_links_found.json")
print("   phase3_still_missing.json")
print("   phase2_google_results.csv")



print(f"\nTWITTER:")
print(f"   Phase 1 : {phase1_twitter:,}")
print(f"   Phase 2 : +{phase2_twitter:,}")
print(f"   TOTAL   : {total_twitter:,} ({total_twitter/total_profiles*100:.1f}%)")

print(f"\nCOUVERTURE GLOBALE:")
print(f"   Profils avec liens : {total_with_links:,} / {total_profiles:,}")
print(f"   Taux de couverture : {total_with_links/total_profiles*100:.1f}%")
print(f"   Profils restants   : {len(still_missing):,}")

total_links_all = total_linkedin + total_twitter
print(f"\nTOTAL DE LIENS TROUVÉS : {total_links_all:,}")
print(f"   Sur {total_profiles * 2:,} liens possibles")
print(f"   Taux de succès : {total_links_all/(total_profiles*2)*100:.1f}%")

print("\n" + "="*70)
print("PHASE 2 TERMINÉE !")
print("="*70)

# Rapport final
report = f"""
RAPPORT PHASE 2 - GOOGLE CUSTOM SEARCH API
==========================================
Date : {time.strftime('%Y-%m-%d %H:%M:%S')}
Durée : {elapsed_time/60:.1f} minutes ({elapsed_time/3600:.1f} heures)

TRAITEMENT:
- Profils traités : {len(results):,}
- Requêtes effectuées : {requests_made:,}
- Vitesse moyenne : {requests_made/(elapsed_time/60):.1f} requêtes/min

RÉSULTATS PHASE 2:
- LinkedIn trouvés : {linkedin_found:,} ({linkedin_found/len(results)*100:.1f}%)
- Twitter trouvés : {twitter_found:,} ({twitter_found/len(results)*100:.1f}%)
- Les deux trouvés : {both_found:,} ({both_found/len(results)*100:.1f}%)
- Rien trouvé : {none_found:,} ({none_found/len(results)*100:.1f}%)

RÉSULTATS GLOBAUX (Phase 1 + 2):
- LinkedIn total : {total_linkedin:,} / {total_profiles:,} ({total_linkedin/total_profiles*100:.1f}%)
- Twitter total : {total_twitter:,} / {total_profiles:,} ({total_twitter/total_profiles*100:.1f}%)
- Couverture : {total_with_links:,} / {total_profiles:,} ({total_with_links/total_profiles*100:.1f}%)
- Profils restants sans liens : {len(still_missing):,}

FICHIERS GÉNÉRÉS:
- phase2_google_results.json (tous les résultats)
- phase2_links_found.json (seulement avec liens)
- phase3_still_missing.json (pour phase 3)
- phase2_google_results.csv (format Excel)
"""

with open('phase2_report.txt', 'w', encoding='utf-8') as f:
    f.write(report)

print("\nRapport sauvegardé : phase2_report.txt")
print(f"\nFélicitations ! Vous avez maintenant ~{total_with_links/total_profiles*100:.0f}% de couverture !")