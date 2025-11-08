import requests
import time
import json
import csv
from datetime import datetime
from typing import List, Dict
import re

class GitHubScraper:
    def __init__(self, token: str):
        self.token = token
        self.headers = {
            'Authorization': f'token {token}',
            'Accept': 'application/vnd.github.v3+json'
        }
        self.base_url = 'https://api.github.com'
        self.profiles = []
        
    def check_rate_limit(self):
        """Vérifier les limites de l'API"""
        response = requests.get(f'{self.base_url}/rate_limit', headers=self.headers)
        data = response.json()
        remaining = data['resources']['core']['remaining']
        reset_time = data['resources']['core']['reset']
        print(f"Requêtes restantes: {remaining}")
        return remaining, reset_time
    
    def search_users(self, query: str, max_results: int = 1000) -> List[str]:
        """Rechercher des utilisateurs selon une requête"""
        usernames = []
        page = 1
        per_page = 100
        
        while len(usernames) < max_results:
            try:
                url = f'{self.base_url}/search/users'
                params = {
                    'q': query,
                    'per_page': per_page,
                    'page': page
                }
                
                response = requests.get(url, headers=self.headers, params=params)
                
                if response.status_code == 403:
                    print("Limite API atteinte, attente...")
                    time.sleep(60)
                    continue
                    
                if response.status_code != 200:
                    print(f"Erreur: {response.status_code}")
                    break
                
                data = response.json()
                
                if not data.get('items'):
                    break
                
                for user in data['items']:
                    usernames.append(user['login'])
                    
                print(f"Trouvé {len(usernames)} utilisateurs...")
                
                if len(data['items']) < per_page:
                    break
                    
                page += 1
                time.sleep(2)  # Respect de l'API
                
            except Exception as e:
                print(f"Erreur lors de la recherche: {e}")
                break
                
        return usernames[:max_results]
    
    def get_user_details(self, username: str) -> Dict:
        """Récupérer les détails d'un utilisateur"""
        try:
            # Profil de base
            user_url = f'{self.base_url}/users/{username}'
            response = requests.get(user_url, headers=self.headers)
            
            if response.status_code != 200:
                return None
                
            user_data = response.json()
            
            # Repos de l'utilisateur
            repos_url = f'{self.base_url}/users/{username}/repos'
            repos_response = requests.get(
                repos_url, 
                headers=self.headers,
                params={'per_page': 100, 'sort': 'updated'}
            )
            
            repos = repos_response.json() if repos_response.status_code == 200 else []
            
            # Activité récente
            events_url = f'{self.base_url}/users/{username}/events/public'
            events_response = requests.get(events_url, headers=self.headers)
            events = events_response.json() if events_response.status_code == 200 else []
            
            # Calcul du score d'activité
            activity_score = self.calculate_activity_score(user_data, repos, events)
            
            # Extraction des emails depuis les commits
            emails = self.extract_emails_from_events(events)
            
            # Analyse des technologies
            languages = self.get_user_languages(repos)
            
            profile = {
                'username': username,
                'name': user_data.get('name', ''),
                'email': user_data.get('email', '') or (emails[0] if emails else ''),
                'additional_emails': emails,
                'bio': user_data.get('bio', ''),
                'location': user_data.get('location', ''),
                'company': user_data.get('company', ''),
                'blog': user_data.get('blog', ''),
                'twitter': user_data.get('twitter_username', ''),
                'linkedin': self.extract_linkedin(user_data.get('bio', '')),
                'public_repos': user_data.get('public_repos', 0),
                'followers': user_data.get('followers', 0),
                'following': user_data.get('following', 0),
                'created_at': user_data.get('created_at', ''),
                'updated_at': user_data.get('updated_at', ''),
                'activity_score': activity_score,
                'languages': languages,
                'recent_commits': len([e for e in events if e.get('type') == 'PushEvent']),
                'profile_url': user_data.get('html_url', ''),
                'avatar_url': user_data.get('avatar_url', ''),
                'hireable': user_data.get('hireable', False)
            }
            
            time.sleep(1)  # Respect de l'API
            return profile
            
        except Exception as e:
            print(f"Erreur pour {username}: {e}")
            return None
    
    def calculate_activity_score(self, user_data: Dict, repos: List, events: List) -> float:
        """Calculer un score d'activité"""
        score = 0
        
        # Repos publics (max 30 points)
        score += min(user_data.get('public_repos', 0) * 2, 30)
        
        # Followers (max 20 points)
        score += min(user_data.get('followers', 0), 20)
        
        # Activité récente (max 30 points)
        recent_events = len([e for e in events if e.get('type') in ['PushEvent', 'CreateEvent', 'PullRequestEvent']])
        score += min(recent_events * 3, 30)
        
        # Repos avec stars (max 20 points)
        total_stars = sum(repo.get('stargazers_count', 0) for repo in repos)
        score += min(total_stars, 20)
        
        return round(score, 2)
    
    def extract_emails_from_events(self, events: List) -> List[str]:
        """Extraire les emails des commits"""
        emails = set()
        for event in events:
            if event.get('type') == 'PushEvent':
                commits = event.get('payload', {}).get('commits', [])
                for commit in commits:
                    author = commit.get('author', {})
                    email = author.get('email', '')
                    if email and '@' in email and not email.endswith('users.noreply.github.com'):
                        emails.add(email)
        return list(emails)
    
    def extract_linkedin(self, bio: str) -> str:
        """Extraire le profil LinkedIn de la bio"""
        if not bio:
            return ''
        linkedin_pattern = r'linkedin\.com/in/([a-zA-Z0-9-]+)'
        match = re.search(linkedin_pattern, bio)
        return match.group(0) if match else ''
    
    def get_user_languages(self, repos: List) -> Dict:
        """Obtenir les langages utilisés"""
        languages = {}
        for repo in repos:
            lang = repo.get('language')
            if lang:
                languages[lang] = languages.get(lang, 0) + 1
        return languages
    
    def scrape_moroccan_it_profiles(self, max_profiles: int = 5000):
        """Scraper les profils IT marocains"""
        print(" Début du scraping...")
        
        # Différentes requêtes de recherche
        queries = [
            'location:Morocco',
            'location:Maroc',
            'location:Casablanca',
            'location:Rabat',
            'location:Marrakech',
            'location:Tangier',
            'location:Fes',
            'location:Agadir',
        ]
        
        # Ajouter des langages
        languages = ['JavaScript', 'Python', 'Java', 'PHP', 'TypeScript', 'Go', 'Ruby']
        
        all_usernames = set()
        
        # Recherche par location
        for query in queries:
            print(f"\n🔍 Recherche: {query}")
            usernames = self.search_users(query, max_results=500)
            all_usernames.update(usernames)
            
            remaining, _ = self.check_rate_limit()
            if remaining < 10:
                print("  Pause pour respecter les limites API...")
                time.sleep(60)
        
        # Recherche par langage + location
        for lang in languages:
            query = f'location:Morocco language:{lang}'
            print(f"\n Recherche: {query}")
            usernames = self.search_users(query, max_results=300)
            all_usernames.update(usernames)
            
            remaining, _ = self.check_rate_limit()
            if remaining < 10:
                time.sleep(60)
        
        print(f"\n✅ Total d'utilisateurs uniques trouvés: {len(all_usernames)}")
        
        # Récupérer les détails
        print("\n📊 Récupération des détails des profils...")
        
        for i, username in enumerate(list(all_usernames)[:max_profiles], 1):
            print(f"[{i}/{min(len(all_usernames), max_profiles)}] {username}")
            
            profile = self.get_user_details(username)
            if profile:
                self.profiles.append(profile)
            
            if i % 50 == 0:
                remaining, _ = self.check_rate_limit()
                if remaining < 10:
                    print("⏸️  Pause API...")
                    time.sleep(60)
        
        # Trier par score d'activité
        self.profiles.sort(key=lambda x: x['activity_score'], reverse=True)
        
        print(f"\n✅ Scraping terminé! {len(self.profiles)} profils collectés")
        
    def save_to_json(self, filename: str = 'github_profiles_morocco.json'):
        """Sauvegarder en JSON"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.profiles, f, ensure_ascii=False, indent=2)
        print(f" Sauvegardé dans {filename}")
    
    def save_to_csv(self, filename: str = 'github_profiles_morocco.csv'):
        """Sauvegarder en CSV"""
        if not self.profiles:
            return
        
        with open(filename, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=[
                'username', 'name', 'email', 'bio', 'location', 'company',
                'blog', 'twitter', 'linkedin', 'public_repos', 'followers',
                'following', 'activity_score', 'recent_commits', 'profile_url',
                'hireable'
            ])
            writer.writeheader()
            
            for profile in self.profiles:
                row = {k: v for k, v in profile.items() if k in writer.fieldnames}
                row['languages'] = ', '.join(profile.get('languages', {}).keys())
                writer.writerow(row)
        
        print(f" Sauvegardé dans {filename}")
    
    def generate_report(self):
        """Générer un rapport statistique"""
        if not self.profiles:
            return
        
        total = len(self.profiles)
        with_email = len([p for p in self.profiles if p['email']])
        with_twitter = len([p for p in self.profiles if p['twitter']])
        with_linkedin = len([p for p in self.profiles if p['linkedin']])
        hireable = len([p for p in self.profiles if p['hireable']])
        
        avg_repos = sum(p['public_repos'] for p in self.profiles) / total
        avg_followers = sum(p['followers'] for p in self.profiles) / total
        avg_score = sum(p['activity_score'] for p in self.profiles) / total
        
        # Top langages
        all_langs = {}
        for profile in self.profiles:
            for lang in profile.get('languages', {}):
                all_langs[lang] = all_langs.get(lang, 0) + 1
        
        top_langs = sorted(all_langs.items(), key=lambda x: x[1], reverse=True)[:10]
        
        report = f"""
╔════════════════════════════════════════════════════════╗
║      RAPPORT SCRAPING GITHUB - PROFILS IT MAROC        ║
╚════════════════════════════════════════════════════════╝

 STATISTIQUES GÉNÉRALES
  • Total profils: {total}
  • Avec email: {with_email} ({with_email/total*100:.1f}%)
  • Avec Twitter: {with_twitter} ({with_twitter/total*100:.1f}%)
  • Avec LinkedIn: {with_linkedin} ({with_linkedin/total*100:.1f}%)
  • Disponibles (Hireable): {hireable} ({hireable/total*100:.1f}%)

 MOYENNES
  • Repos publics: {avg_repos:.1f}
  • Followers: {avg_followers:.1f}
  • Score d'activité: {avg_score:.1f}/100

 TOP 10 LANGAGES
"""
        for i, (lang, count) in enumerate(top_langs, 1):
            report += f"  {i}. {lang}: {count} développeurs\n"
        
        report += f"""
 TOP 10 PROFILS PAR ACTIVITÉ
"""
        for i, profile in enumerate(self.profiles[:10], 1):
            report += f"  {i}. {profile['username']} - Score: {profile['activity_score']}\n"
            report += f"     📧 {profile['email'] or 'N/A'} | 📁 {profile['public_repos']} repos | 👥 {profile['followers']} followers\n"
        
        print(report)
        
        with open('rapport_scraping.txt', 'w', encoding='utf-8') as f:
            f.write(report)
        print("💾 Rapport sauvegardé dans rapport_scraping.txt")


def main():
    print("""
╔════════════════════════════════════════════════════════╗
║   GITHUB SCRAPER - PROFILS IT MAROCAINS               ║
╚════════════════════════════════════════════════════════╝
    """)
    
    token = input("🔑 Entrez votre token GitHub: ").strip()
    
    if not token:
        print("❌ Token requis!")
        return
    
    max_profiles = input("📊 Nombre de profils à scraper (max 5000, défaut=1000): ").strip()
    max_profiles = int(max_profiles) if max_profiles.isdigit() else 1000
    
    scraper = GitHubScraper(token)
    
    # Vérifier le token
    remaining, _ = scraper.check_rate_limit()
    if remaining == 0:
        print("❌ Token invalide ou limite atteinte!")
        return
    
    # Scraping
    scraper.scrape_moroccan_it_profiles(max_profiles=max_profiles)
    
    # Sauvegarder
    scraper.save_to_json()
    scraper.save_to_csv()
    scraper.generate_report()
    
    print("\n✅ Scraping terminé avec succès!")


if __name__ == "__main__":
    main()