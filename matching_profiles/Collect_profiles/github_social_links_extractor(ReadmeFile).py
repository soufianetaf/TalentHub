# ═══════════════════════════════════════════════════════════
# GitHub Social Links Extractor - Phase 1 
# ═══════════════════════════════════════════════════════════
# Extrait LinkedIn & Twitter depuis un fichier JSON de profils GitHub.
# 
# ═══════════════════════════════════════════════════════════



#  IMPORTS STANDARDS
import json
import re
import requests
import os
import time
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed


from tqdm import tqdm 

# ═══════════════════════════════════════════════════════════
#  CONFIGURATION ET CHARGEMENT
# ═══════════════════════════════════════════════════════════

INPUT_FILENAME = 'github_profiles_morocco.json'

# --- 1. TOKEN GITHUB (PAS DE getpass DE COLAB) ---
# Si vous avez un token GitHub, remplacez 'VOTRE_TOKEN_ICI' par votre clé.
# Sinon, laissez None. Le traitement sera plus lent.
GITHUB_TOKEN = None # Remplacez par votre token si vous en avez un.

if not GITHUB_TOKEN:
    print("--- ATTENTION: PAS DE TOKEN GITHUB ---")
    print("Le traitement sera limité à 60 requêtes par heure pour les READMEs.")
else:
    print("--- TOKEN GITHUB CONFIGURÉ ---")

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}
if GITHUB_TOKEN:
    HEADERS['Authorization'] = f'token {GITHUB_TOKEN}'

# Workers optimisés
MAX_WORKERS = 50 if GITHUB_TOKEN else 10
print(f"Utilisation de {MAX_WORKERS} workers parallèles.")

# --- 2. CHARGER LES DONNÉES LOCALEMENT ---
if not os.path.exists(INPUT_FILENAME):
    print(f"\nERREUR: Fichier introuvable! Placez '{INPUT_FILENAME}' dans le même dossier que ce script.")
    exit(1)

with open(INPUT_FILENAME, 'r', encoding='utf-8') as f:
    profiles = json.load(f)

print(f"\n{len(profiles):,} profils chargés depuis {INPUT_FILENAME}")

# ═══════════════════════════════════════════════════════════
#  FONCTIONS D'EXTRACTION (INCHANGÉES)
# ═══════════════════════════════════════════════════════════

def extract_social_links(text):
    """Extrait LinkedIn et Twitter depuis un texte"""
    links = {'linkedin': None, 'twitter': None}

    if not text:
        return links

    # LinkedIn patterns
    linkedin_patterns = [
        r'linkedin\.com/in/([a-zA-Z0-9-]+)',
        r'linkedin\.com/company/([a-zA-Z0-9-]+)',
        r'linkedin://in/([a-zA-Z0-9-]+)',
        r'www\.linkedin\.com/in/([a-zA-Z0-9-]+)'
    ]

    for pattern in linkedin_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            username = match.group(1)
            if username.lower() not in ['linkedin', 'in', 'company']:
                links['linkedin'] = f"https://linkedin.com/in/{username}"
                break

    # Twitter patterns
    twitter_patterns = [
        r'twitter\.com/([a-zA-Z0-9_]+)',
        r'x\.com/([a-zA-Z0-9_]+)',
        r'@([a-zA-Z0-9_]{1,15})(?:\s|$|[^\w])'
    ]

    for pattern in twitter_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            username = match.group(1)
            # Filtrer les mots communs
            if username.lower() not in ['twitter', 'x', 'follow', 'share', 'tweet', 'via']:
                links['twitter'] = f"https://twitter.com/{username}"
                break

    return links

def fetch_github_readme(username):
    """Récupère le README du profil GitHub"""
    try:
        url = f"https://api.github.com/repos/{username}/{username}/readme"
        response = requests.get(url, headers=HEADERS, timeout=10)

        if response.status_code == 200:
            import base64
            content = base64.b64decode(response.json()['content']).decode('utf-8')
            return content
        elif response.status_code == 404:
            return None
        else:
            # Rate limit check
            if 'X-RateLimit-Remaining' in response.headers:
                remaining = int(response.headers['X-RateLimit-Remaining'])
                if remaining < 10:
                    print(f"\nRate limit proche: {remaining} requêtes restantes")
    except Exception as e:
        pass
    return None

def process_profile(profile):
    """Traite un profil complet"""
    result = {
        'username': profile.get('username'),
        'name': profile.get('name'),
        'github_url': f"https://github.com/{profile.get('username')}",
        'linkedin': None,
        'twitter': None,
        'source': []
    }

    # 1. Twitter direct depuis le JSON
    if profile.get('twitter'):
        tw = profile['twitter'].strip()
        if tw and not tw.startswith('http'):
            result['twitter'] = f"https://twitter.com/{tw}"
        elif tw.startswith('http'):
            result['twitter'] = tw
        if result['twitter']:
            result['source'].append('json_twitter')

    # 2. LinkedIn direct depuis le JSON
    if profile.get('linkedin'):
        li = profile['linkedin'].strip()
        if li:
            if not li.startswith('http'):
                result['linkedin'] = f"https://linkedin.com/in/{li}"
            else:
                result['linkedin'] = li
            result['source'].append('json_linkedin')

    # 3. Extraire depuis bio
    if profile.get('bio'):
        links = extract_social_links(profile['bio'])
        if not result['linkedin'] and links['linkedin']:
            result['linkedin'] = links['linkedin']
            result['source'].append('bio')
        if not result['twitter'] and links['twitter']:
            result['twitter'] = links['twitter']
            result['source'].append('bio')

    # 4. Extraire depuis blog/website
    if profile.get('blog'):
        blog_text = profile['blog']
        # Si c'est juste un domaine, chercher des liens sociaux
        if 'linkedin.com' in blog_text.lower() or 'twitter.com' in blog_text.lower():
            links = extract_social_links(blog_text)
            if not result['linkedin'] and links['linkedin']:
                result['linkedin'] = links['linkedin']
                result['source'].append('blog')
            if not result['twitter'] and links['twitter']:
                result['twitter'] = links['twitter']
                result['source'].append('blog')

    # 5. Extraire depuis company
    if profile.get('company'):
        links = extract_social_links(profile['company'])
        if not result['linkedin'] and links['linkedin']:
            result['linkedin'] = links['linkedin']
            result['source'].append('company')
        if not result['twitter'] and links['twitter']:
            result['twitter'] = links['twitter']
            result['source'].append('company')

    # 6. Récupérer README (si nécessaire et si token disponible)
    if GITHUB_TOKEN and (not result['linkedin'] or not result['twitter']):
        readme = fetch_github_readme(profile['username'])
        if readme:
            links = extract_social_links(readme)
            if not result['linkedin'] and links['linkedin']:
                result['linkedin'] = links['linkedin']
                result['source'].append('readme')
            if not result['twitter'] and links['twitter']:
                result['twitter'] = links['twitter']
                result['source'].append('readme')

    return result

# ═══════════════════════════════════════════════════════════
#  TRAITEMENT PARALLÈLE
# ═══════════════════════════════════════════════════════════

print(f"\nTraitement de {len(profiles):,} profils en cours...")

start_time = time.time()
results = []
errors = []

# Traitement en parallèle
with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
    futures = {executor.submit(process_profile, profile): profile for profile in profiles}

    # Utilisation de tqdm (barre de progression console)
    for future in tqdm(as_completed(futures), total=len(profiles), desc="Extraction"):
        try:
            result = future.result()
            results.append(result)
        except Exception as e:
            profile = futures[future]
            errors.append({'username': profile.get('username'), 'error': str(e)})

elapsed_time = time.time() - start_time

# ═══════════════════════════════════════════════════════════
#  STATISTIQUES DÉTAILLÉES
# ═══════════════════════════════════════════════════════════

linkedin_found = sum(1 for r in results if r['linkedin'])
twitter_found = sum(1 for r in results if r['twitter'])
both_found = sum(1 for r in results if r['linkedin'] and r['twitter'])
one_found = sum(1 for r in results if (r['linkedin'] or r['twitter']) and not (r['linkedin'] and r['twitter']))
none_found = sum(1 for r in results if not r['linkedin'] and not r['twitter'])

print("\n" + "="*70)
print("RESULTATS FINAUX - PHASE 1")
print("="*70)
print(f"Temps de traitement : {elapsed_time/60:.1f} minutes ({elapsed_time:.0f}s)")
print(f"Vitesse moyenne    : {len(results)/elapsed_time:.1f} profils/seconde")
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

# Calcul du taux de succès total
total_links = linkedin_found + twitter_found
max_possible = len(results) * 2
success_rate = (total_links / max_possible) * 100

print(f"\nTAUX DE SUCCES GLOBAL: {success_rate:.1f}%")
print(f" ({total_links:,} liens trouvés sur {max_possible:,} possibles)")

# Sources des liens
all_sources = []
for r in results:
    all_sources.extend(r['source'])

if all_sources:
    print("\nSources des liens trouvés:")
    for source, count in Counter(all_sources).most_common():
        print(f" {source:15} : {count:,} liens")

# ═══════════════════════════════════════════════════════════
#  SAUVEGARDE DES RÉSULTATS
# ═══════════════════════════════════════════════════════════

print("\nSauvegarde des résultats...")

# 1. Fichier complet avec métadonnées
output_complete = {
    'metadata': {
        'total_profiles': len(results),
        'processing_time_seconds': round(elapsed_time, 2),
        'processing_time_minutes': round(elapsed_time/60, 2),
        'linkedin_found': linkedin_found,
        'twitter_found': twitter_found,
        'both_found': both_found,
        'none_found': none_found,
        'coverage_linkedin': f"{linkedin_found/len(results)*100:.1f}%",
        'coverage_twitter': f"{twitter_found/len(results)*100:.1f}%",
        'success_rate': f"{success_rate:.1f}%",
        'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
    },
    'profiles': results
}

with open('github_social_links_complete.json', 'w', encoding='utf-8') as f:
    json.dump(output_complete, f, indent=2, ensure_ascii=False)

# 2. Fichier uniquement avec liens trouvés (optimisé)
profiles_with_links = [r for r in results if r['linkedin'] or r['twitter']]
with open('github_social_links_found.json', 'w', encoding='utf-8') as f:
    json.dump(profiles_with_links, f, indent=2, ensure_ascii=False)

# 3. CSV pour Excel/Google Sheets
import csv
with open('github_social_links.csv', 'w', newline='', encoding='utf-8-sig') as f:
    writer = csv.DictWriter(f, fieldnames=['username', 'name', 'github_url', 'linkedin', 'twitter', 'source'])
    writer.writeheader()
    for r in results:
        writer.writerow({
            'username': r['username'],
            'name': r['name'] or '',
            'github_url': r['github_url'],
            'linkedin': r['linkedin'] or '',
            'twitter': r['twitter'] or '',
            'source': ', '.join(r['source']) if r['source'] else ''
        })

# 4. Profils sans liens pour Phase 2
profiles_without_links = [r for r in results if not r['linkedin'] and not r['twitter']]
missing_data = {
    'count': len(profiles_without_links),
    'percentage': f"{len(profiles_without_links)/len(results)*100:.1f}%",
    'profiles': profiles_without_links
}

with open('github_profiles_missing_links.json', 'w', encoding='utf-8') as f:
    json.dump(missing_data, f, indent=2, ensure_ascii=False)

# 5. Fichier séparé LinkedIn uniquement
linkedin_only = [{'username': r['username'], 'name': r['name'], 'linkedin': r['linkedin']}
                 for r in results if r['linkedin']]
with open('linkedin_links.json', 'w', encoding='utf-8') as f:
    json.dump(linkedin_only, f, indent=2, ensure_ascii=False)

# 6. Fichier séparé Twitter uniquement
twitter_only = [{'username': r['username'], 'name': r['name'], 'twitter': r['twitter']}
                 for r in results if r['twitter']]
with open('twitter_links.json', 'w', encoding='utf-8') as f:
    json.dump(twitter_only, f, indent=2, ensure_ascii=False)

print("\nFichiers sauvegardés:")
print("   github_social_links_complete.json    (tous les profils + stats)")
print("   github_social_links_found.json       (seulement avec liens)")
print("   github_social_links.csv              (format Excel)")
print("   github_profiles_missing_links.json   (pour Phase 2)")
print("   linkedin_links.json                  (LinkedIn seulement)")
print("   twitter_links.json                   (Twitter seulement)")

# ═══════════════════════════════════════════════════════════
#  APERÇU DES RÉSULTATS
# ═══════════════════════════════════════════════════════════

print("\n" + "="*70)
print("APERÇU - 10 premiers profils avec liens:")
print("="*70)
profiles_with_links = [r for r in results if r['linkedin'] or r['twitter']]
for i, profile in enumerate(profiles_with_links[:10], 1):
    print(f"\n{i}. {profile['username']} ({profile['name'] or 'N/A'})")
    if profile['linkedin']:
        print(f"   LinkedIn: {profile['linkedin']}")
    if profile['twitter']:
        print(f"   Twitter:  {profile['twitter']}")
    print(f"   Source: {', '.join(profile['source'])}")

# ═══════════════════════════════════════════════════════════
#  PROCHAINES ÉTAPES
# ═══════════════════════════════════════════════════════════

print("\n" + "="*70)
print("PHASE 1 TERMINÉE !")
print("="*70)
print(f"\nVous avez trouvé {total_links:,} liens sur {len(results):,} profils")
print(f"Taux de réussite: {success_rate:.1f}%")
print(f"\nProchaine étape - PHASE 2:")
print(f"   Il reste {len(profiles_without_links):,} profils sans liens")
print(f"   Utilisez 'github_profiles_missing_links.json' pour la Phase 2")
print(f"   (Google Custom Search API )")
print("\n" + "="*70)