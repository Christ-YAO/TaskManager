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

## 👑 Compte Administrateur

### Compte admin par défaut

Un compte administrateur est **créé automatiquement** lors du premier chargement de la page de connexion. Vous pouvez vous connecter directement avec :

- **Email** : `admin@taskmanager.com`
- **Mot de passe** : `admin123`

⚠️ **Important** : Changez le mot de passe après la première connexion pour des raisons de sécurité.

> Note : Le compte admin est créé automatiquement s'il n'existe pas déjà. Vous n'avez aucune action à effectuer.

### Fonctionnalités Admin

Le compte administrateur dispose des privilèges suivants :

- **Voir tous les tableaux** : L'admin peut voir tous les tableaux de tous les utilisateurs
- **Ajouter des collaborateurs** : L'admin peut ajouter des collaborateurs à n'importe quel tableau
  - Depuis le dashboard : Menu contextuel sur chaque tableau → "Ajouter collaborateur"
  - Depuis le kanban : Bouton "Ajouter collaborateur" dans le header

### Identifiants par défaut

- **Email** : `admin@taskmanager.com`
- **Mot de passe** : `admin123`

⚠️ **Important** : Changez le mot de passe après la première connexion pour des raisons de sécurité.

## 💾 Stockage des données

Toutes les données sont stockées localement dans le navigateur via `localStorage` :
- Utilisateurs
- Tableaux
- Colonnes
- Cartes

## 🎯 Fonctionnalités

- ✅ **Système de rôles** : Utilisateurs et administrateurs
- ✅ **Collaboration** : Partage de tableaux avec collaborateurs
- ✅ **Gestion admin** : Les admins peuvent voir tous les tableaux et ajouter des collaborateurs
- 🔄 **À venir** :
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

