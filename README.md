# TaskManager - Application Kanban Moderne

Une application de gestion de tâches moderne et personnalisée construite avec HTML, CSS, JavaScript et TailwindCSS, inspirée du design shadcn/ui.

## 🚀 Fonctionnalités

- **Page d'accueil** : Design moderne avec présentation des fonctionnalités
- **Authentification** : Système de connexion et inscription avec stockage local
- **Dashboard** : Vue d'ensemble de tous vos tableaux avec création rapide
- **Tableau Kanban** : Gestion complète de projets avec drag & drop
  - Colonnes personnalisables
  - Cartes avec titre et description
  - Déplacement de cartes entre colonnes
  - Suppression de cartes
  - Compteur de cartes par colonne

## 🎨 Design

- Interface moderne avec gradients et animations fluides
- Design responsive pour mobile, tablette et desktop
- Thème personnalisé avec TailwindCSS
- Animations et transitions soignées

## 📁 Structure du projet

```
TaskManager/
├── index.html          # Page d'accueil
├── login.html          # Page de connexion/inscription
├── dashboard.html      # Tableau de bord
├── kanban.html         # Vue Kanban
├── auth.js             # Logique d'authentification
├── dashboard.js         # Logique du dashboard
├── kanban.js           # Logique du Kanban (drag & drop)
├── styles.css          # Styles personnalisés
└── README.md           # Documentation
```

## 🛠️ Technologies utilisées

- **HTML5** : Structure sémantique
- **CSS3** : Styles personnalisés et animations
- **JavaScript (ES6+)** : Logique applicative
- **TailwindCSS** : Framework CSS via CDN
- **LocalStorage** : Stockage des données côté client

## 🚦 Utilisation

1. Ouvrez `index.html` dans votre navigateur
2. Cliquez sur "S'inscrire" pour créer un compte
3. Connectez-vous avec vos identifiants
4. Créez votre premier tableau depuis le dashboard
5. Ajoutez des colonnes et des cartes dans votre tableau Kanban
6. Déplacez les cartes entre les colonnes par drag & drop

## 💾 Stockage des données

Toutes les données sont stockées localement dans le navigateur via `localStorage` :
- Utilisateurs
- Tableaux
- Colonnes
- Cartes

## 🎯 Fonctionnalités à venir

- Équipes et collaboration
- Invitations par email
- Labels et étiquettes
- Dates d'échéance
- Pièces jointes
- Recherche et filtres

## 📝 Notes

Ce projet est une démonstration front-end uniquement. Pour une utilisation en production, il faudrait :
- Un backend avec base de données
- Authentification sécurisée
- API REST
- Gestion des permissions
- Synchronisation en temps réel

## 📄 Licence

Projet éducatif - Libre d'utilisation

