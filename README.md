 TalentHub : Plateforme de Recrutement Cross-Platform

## 🎯 Vue d'ensemble du Projet

**TalentHub** est une plateforme modulaire conçue pour centraliser, unifier et exploiter les profils de talents provenant de sources hétérogènes comme **GitHub**, **LinkedIn**, et **Twitter**. L'objectif est de regrouper les fragments d'identité d'un candidat en un seul **profil enrichi (Cluster)**, en utilisant des techniques avancées de **Machine Learning (Embeddings sémantiques)** et de similarité textuelle.

Cette approche permet aux recruteurs d'obtenir une vue complète et consolidée des compétences et de l'activité du talent pour une évaluation rapide et efficace.

---

## 🛠️ Stack Technique

### 1. Système de Matching (Backend Python)

#### Technologies et Outils :

- **Langage** : Python 3.x  
  Pour les scripts de collecte, de prétraitement et de matching.

- **Collecte des Données** :  
  - **GitHub API**, **Apify**, **Google API** : Récupération des données brutes provenant de GitHub, LinkedIn et Twitter.
  
- **Traitement NLP / Machine Learning** :  
  - **`sentence-transformers`**, **`scikit-learn`** : Création des vecteurs d'embeddings sémantiques pour une analyse approfondie des profils.  
  - Modèle utilisé : **`all-MiniLM-L6-v2`** pour les embeddings de texte.

- **Logique de Matching** :  
  - **Levenshtein** (distance d'édition)  
  - **Similarité Cosinus** : Logique hybride pour le clustering des profils (à la fois déterministe et probabiliste).

#### Dépendances Python (`requirements_matching.txt`)

```text
requests
sentence-transformers
numpy
scikit-learn
python-Levenshtein
pandas
tqdm

## 2. Application Web (Frontend React)
Technologies et Outils :

Framework : React 18 pour le développement de l'interface utilisateur.

Bundler : Vite pour un environnement de développement rapide et un bundling optimisé.

Styling :

Tailwind CSS, PostCSS pour un design moderne et responsive (avec prise en charge du Dark Mode).

Dépendances Node.js (via package.json)
# Dépendances principales
npm install react react-dom

# Dépendances de développement (pour Vite/Tailwind)
npm install -D @vitejs/plugin-react autoprefixer postcss tailwindcss vite

⚙️ Guide de Démarrage
Partie A : Génération des Données (Backend)
Préparation :

Installez les dépendances Python listées ci-dessus via pip :

pip install -r requirements_matching.txt


Assurez-vous d'avoir les fichiers de données brutes collectées (ex : github_profiles_morocco.json, linkedin_profiles_apify.json, twitter_profiles_apify.json) dans le dossier matching_profiles/Collect_profiles/.

Exécution du Pipeline :

Lancez le script orchestrateur pour générer le fichier de clusters final :

python matching_profiles/matching/pipeline_orchestrator.py


Ce script exécutera les étapes suivantes :

Prétraitement des données

Création des embeddings

Clustering des profils

Copie du fichier final vers public/clusters_3_plateformes.json

Partie B : Démarrage de l'Application Web (Frontend)
Installation :

Naviguez vers le dossier racine du projet (TalentHub/) et installez les dépendances Node.js :

npm install

Démarrage :

Lancez l'application en mode développement avec Vite :

npm run start


L'application sera accessible dans votre navigateur à l'adresse : http://localhost:5173

✨ Fonctionnalités Clés de l'Application

Recherche Avancée : Permet de filtrer les clusters par compétences (terme de recherche), nom, et localisation.

Filtre de Qualité : Trie les profils selon le nombre de plateformes matchées (ex : "3 plateformes ⭐").

Système de Favoris : Ajoutez ou supprimez des profils de votre liste de favoris via le FavoritesPanel.

Expérience Utilisateur :

Intégration du Dark Mode pour un design moderne et ergonomique.

Système de notifications Toast pour améliorer l'interaction utilisateur.

Statistiques : Affichage des totaux de profils unifiés pour une vue d'ensemble rapide.

📂 Structure du Projet
TalentHub/
├── index.html                   # Point d'entrée de l'application frontend
├── package.json                 # Dépendances et scripts Node.js pour le frontend
├── vite.config.js               # Configuration Vite pour le bundling et le développement
│
├── public/
│   └── clusters_3_plateformes.json  # <-- Fichier d'entrée du Frontend
│
├── src/
│   ├── components/              # Composants React : ProfileCard, ProfileModal, FavoritesPanel, etc.
│   ├── hooks/                   # Logique métier : useTalentData, useFavorites, useToast
│   └── App.jsx                  # Composant principal avec toute la logique de l'interface
│
└── matching_profiles/
    ├── Collect_profiles/        # Scripts de collecte des données depuis GitHub, LinkedIn, Twitter
    │   ├── scraping_github.py  # Script de collecte des profils GitHub
    │   └── ... (Autres scripts et données brutes)
    │
    └── matching/                # Scripts de traitement des données pour la création des clusters
        ├── preprocessing.py     # Nettoyage et normalisation des données
        ├── embedding_creator.py # Création des vecteurs d'embeddings
        ├── matching_logic.py    # Logique du clustering des profils
        └── pipeline_orchestrator.py # Exécution du pipeline complet

📋 Contribution

Forkez ce dépôt et clonez-le sur votre machine locale.

Créez une branche pour votre fonctionnalité (git checkout -b feature/nom-fonctionnalité).

Faites vos modifications et testez-les localement.

Faites une pull request vers la branche principale avec une description détaillée des modifications.

📝 Licences

Ce projet est sous la licence MIT. Pour plus d'informations, consultez le fichier LICENSE.