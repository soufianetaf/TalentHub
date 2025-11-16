# TalentHub : Plateforme de Recrutement Cross-Platform

## 🎯 Vue d'ensemble du Projet

**TalentHub** est une plateforme modulaire de pointe conçue pour centraliser, unifier et exploiter les profils de talents provenant de sources hétérogènes telles que **GitHub**, **LinkedIn** et **Twitter**. 

L'objectif principal est de regrouper les fragments d'identité numérique d'un candidat en un seul **profil enrichi (Cluster)**, en utilisant des techniques avancées de **Machine Learning** basées sur les embeddings sémantiques et la similarité textuelle.

Cette approche innovante permet aux recruteurs d'obtenir une vue complète et consolidée des compétences, de l'activité et du potentiel d'un talent pour une évaluation rapide, précise et efficace.

---

## 🛠️ Stack Technique

### 1. Système de Matching (Backend Python)

#### Technologies et Outils

- **Langage** : Python 3.x  
  Scripts de collecte, prétraitement et matching des profils.

- **Collecte des Données** :  
  - **GitHub API** : Récupération des profils et activités des développeurs
  - **Apify** : Scraping LinkedIn et Twitter
  - **Google API** : Sources complémentaires

- **Traitement NLP / Machine Learning** :  
  - **`sentence-transformers`** : Génération d'embeddings sémantiques
  - **`scikit-learn`** : Calculs de similarité et clustering
  - Modèle utilisé : **`all-MiniLM-L6-v2`** (embeddings de texte légers et performants)

- **Logique de Matching** :  
  - **Distance de Levenshtein** : Comparaison déterministe des chaînes de caractères
  - **Similarité Cosinus** : Approche probabiliste pour le clustering sémantique
  - Approche hybride combinant les deux méthodes pour une précision optimale

#### Dépendances Python

Créez un fichier `requirements_matching.txt` avec le contenu suivant :

```text
requests>=2.31.0
sentence-transformers>=2.2.0
numpy>=1.24.0
scikit-learn>=1.3.0
python-Levenshtein>=0.21.0
pandas>=2.0.0
tqdm>=4.65.0
```

**Installation** :
```bash
pip install -r requirements_matching.txt
```

---

### 2. Application Web (Frontend React)

#### Technologies et Outils

- **Framework** : React 18  
  Développement d'une interface utilisateur moderne et réactive

- **Bundler** : Vite  
  Environnement de développement ultra-rapide avec Hot Module Replacement (HMR)

- **Styling** :  
  - **Tailwind CSS** : Framework CSS utility-first
  - **PostCSS** : Transformation CSS avancée
  - Support natif du **Dark Mode**

#### Dépendances Node.js

**Installation complète** :
```bash
# Dépendances principales
npm install react react-dom

# Outils de développement
npm install -D @vitejs/plugin-react autoprefixer postcss tailwindcss vite

# Dépendances additionnelles (si nécessaire)
npm install lucide-react  # Icônes (optionnel)
```

---

## ⚙️ Guide de Démarrage

### Partie A : Génération des Données (Backend)

#### 1. Préparation de l'environnement

```bash
# Créer un environnement virtuel Python (recommandé)
python -m venv venv

# Activer l'environnement virtuel
# Sur Windows
venv\Scripts\activate
# Sur macOS/Linux
source venv/bin/activate

# Installer les dépendances
pip install -r requirements_matching.txt
```

#### 2. Configuration des données sources

Assurez-vous que les fichiers de données brutes collectées sont présents dans le dossier `matching_profiles/Collect_profiles/` :
- `github_profiles_morocco.json`
- `linkedin_profiles_apify.json`
- `twitter_profiles_apify.json`

#### 3. Exécution du Pipeline de Matching

Lancez le script orchestrateur pour générer le fichier de clusters final :

```bash
python matching_profiles/matching/preprocessing.py
python matching_profiles/matching/embedding_creator.py
python matching_profiles/matching/matching_logic.py
```

**Étapes exécutées ** :
1. ✅ Prétraitement et nettoyage des données
2. ✅ Création des embeddings sémantiques
3. ✅ Clustering et matching des profils


#### 4. Vérification

Le fichier `public/clusters_3_plateformes.json` doit être créé avec succès. Ce fichier sera lu par le frontend.

---

### Partie B : Démarrage de l'Application Web (Frontend)

#### 1. Installation des dépendances

```bash
# Depuis la racine du projet TalentHub/
npm install
```

#### 2. Lancement en mode développement

```bash
npm run start
# ou
npm run dev
```

L'application sera accessible à l'adresse : **http://localhost:5173**

#### 3. Build pour la production

```bash
npm run build
```

Les fichiers optimisés seront générés dans le dossier `dist/`.

---

## ✨ Fonctionnalités Clés

### 🔍 Recherche Avancée
- Filtrage multi-critères : compétences, nom, localisation
- Recherche en temps réel avec suggestions

### ⭐ Système de Notation
- Tri des profils selon le nombre de plateformes matchées
- Indicateur visuel de qualité : "3 plateformes ⭐"

### ❤️ Gestion des Favoris
- Ajout/suppression de profils favoris
- Panneau dédié (`FavoritesPanel`) pour un accès rapide

### 🎨 Expérience Utilisateur Premium
- **Dark Mode** : Design moderne et ergonomique
- **Notifications Toast** : Feedback instantané des actions
- **Interface Responsive** : Compatible mobile, tablette et desktop

### 📊 Statistiques en Temps Réel
- Affichage du nombre total de profils unifiés
- Métriques de matching par plateforme

---

## 📂 Structure du Projet

```
TalentHub/
│
├── index.html                          # Point d'entrée HTML
├── package.json                        # Configuration npm
├── vite.config.js                      # Configuration Vite
├── tailwind.config.js                  # Configuration Tailwind CSS
├── postcss.config.js                   # Configuration PostCSS
├── README.md                           # Documentation (ce fichier)
│
├── public/
│   └── clusters_3_plateformes.json     # ⚡ Données générées par le backend
│
├── src/
│   ├── App.jsx                         # Composant racine
│   ├── main.jsx                        # Point d'entrée React
│   ├── index.css                       # Styles globaux
│   │
│   ├── components/                     # Composants React
│   │   ├── ProfileCard.jsx             # Carte de profil individuel
│   │   ├── ProfileModal.jsx            # Modal de détails
│   │   ├── FavoritesPanel.jsx          # Panneau des favoris
│   │   ├── SearchBar.jsx               # Barre de recherche
│   │   └── StatsBar.jsx                # Barre de statistiques
│   │
│   └── hooks/                          # Hooks personnalisés
│       ├── useTalentData.js            # Gestion des données
│       ├── useFavorites.js             # Logique des favoris
│       └── useToast.js                 # Système de notifications
│
└── matching_profiles/
    │
    ├── Collect_profiles/               # Scripts de collecte
    │   ├── scraping_github.py          # Collecte GitHub
    │   ├── scraping_linkedin.py        # Collecte LinkedIn (via Apify)
    │   ├── scraping_twitter.py         # Collecte Twitter (via Apify)
    │   └── data/                       # Données brutes collectées
    │
    └── matching/                       # Pipeline de matching
        ├── preprocessing.py            # Nettoyage des données
        ├── embedding_creator.py        # Génération des embeddings
        ├── matching_logic.py           # Algorithme de clustering
        └── output/                     # Fichiers intermédiaires
```

---

## 🚀 Workflows et Processus

### Pipeline de Matching (Backend)

```
1. Collecte → 2. Prétraitement → 3. Embeddings → 4. Clustering → 5. Export JSON
```

**Détails** :
1. **Collecte** : Récupération des profils via APIs
2. **Prétraitement** : Normalisation des noms, emails, compétences
3. **Embeddings** : Conversion du texte en vecteurs sémantiques
4. **Clustering** : Regroupement des profils similaires
5. **Export** : Génération du fichier `clusters_3_plateformes.json`

### Interface Utilisateur (Frontend)

```
Chargement → Recherche/Filtrage → Consultation → Favoris → Export
```

---

## 🧪 Tests et Validation

### Tests Backend
```bash
# Tester le preprocessing
python -m matching_profiles.matching.preprocessing

# Tester l'embedding
python -m matching_profiles.matching.embedding_creator

# Pipeline complet
python matching_profiles/matching/pipeline_orchestrator.py
```

### Tests Frontend
```bash
# Lancer l'application en mode dev
npm run dev

# Build de production
npm run build
npm run preview
```

---

## 📋 Contribution

Nous accueillons les contributions avec enthousiasme ! Voici comment participer :

1. **Forkez** le dépôt
2. **Clonez** votre fork :
   ```bash
   git clone https://github.com/votre-username/TalentHub.git
   ```
3. **Créez une branche** pour votre fonctionnalité :
   ```bash
   git checkout -b feature/nom-fonctionnalite
   ```
4. **Commitez** vos modifications :
   ```bash
   git commit -m "Add: Description de la fonctionnalité"
   ```
5. **Pushez** vers votre fork :
   ```bash
   git push origin feature/nom-fonctionnalite
   ```
6. **Ouvrez une Pull Request** avec une description détaillée

### Bonnes Pratiques
- ✅ Testez vos modifications localement
- ✅ Suivez les conventions de code existantes
- ✅ Documentez les nouvelles fonctionnalités
- ✅ Ajoutez des tests si nécessaire

---

## 🐛 Résolution des Problèmes

### Erreur : Module non trouvé (Backend)
```bash
pip install --upgrade -r requirements_matching.txt
```

### Erreur : Port 5173 déjà utilisé (Frontend)
```bash
# Modifier le port dans vite.config.js
export default {
  server: { port: 3000 }
}
```

### Fichier clusters_3_plateformes.json manquant
```bash
# Relancer le pipeline backend
```

---

## 📝 Licence

Ce projet est distribué sous la **licence MIT**.  

```
MIT License

Copyright (c) 2025 TalentHub

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

Pour plus d'informations, consultez le fichier [LICENSE](./LICENSE).

---




---

**⭐ Si ce projet vous est utile, n'hésitez pas à lui donner une étoile sur GitHub !**
