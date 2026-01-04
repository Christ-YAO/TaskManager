# API TaskManager - Documentation Complète

API REST pour l'application TaskManager (Authentification, Tableaux, Colonnes, Cartes, Collaborateurs, Contact)

## Installation

### 1. Créer la base de données

1. Ouvrez **phpMyAdmin** dans XAMPP (http://localhost/phpmyadmin)
2. Importez le fichier `init_database.sql` qui crée toutes les tables nécessaires
   - OU exécutez individuellement les fichiers SQL dans cet ordre :
     1. `create_users_table.sql`
     2. `create_contacts_table.sql`
     3. `create_tables.sql` (boards, columns, cards, board_access)

### 2. Créer le compte admin

Le compte admin est créé via `api/init_admin.php` :
- Accédez à : http://localhost/TaskManager/api/init_admin.php
- Ou importez `init_database.sql` qui inclut les tables

**Identifiants admin par défaut :**
- Email: `admin@taskmanager.com`
- Mot de passe: `admin123`

### 3. Configuration

Si vos identifiants MySQL sont différents, modifiez `api/db.php` :
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'taskmanager');
define('DB_USER', 'root');
define('DB_PASS', '');
```

## Structure de l'API

### 1. Authentification

#### Inscription (`api/register.php`)
- **Méthode**: POST
- **Body**: `{ "name": "Nom", "email": "email@example.com", "password": "pass" }`

#### Connexion (`api/login.php`)
- **Méthode**: POST
- **Body**: `{ "email": "email@example.com", "password": "pass" }`
- **Retourne**: `{ "success": true, "data": { "id": 1, "name": "...", "email": "...", "role": "user" } }`

### 2. Tableaux (Boards)

#### Lister (`api/boards.php`)
- **Méthode**: GET
- **Paramètres**: `user_id` (requis), `id` (optionnel)
- **Exemple**: `api/boards.php?user_id=1`

#### Créer (`api/boards.php`)
- **Méthode**: POST
- **Body**: `{ "user_id": 1, "name": "Mon projet", "color": "blue" }`
- **Couleurs**: blue, purple, green, yellow, red, pink
- **Note**: Crée automatiquement 4 colonnes par défaut (Backlog, To Do, In Progress, Done)

#### Modifier (`api/boards.php`)
- **Méthode**: PUT
- **Body**: `{ "user_id": 1, "id": 1, "name": "Nouveau nom", "color": "green" }`

#### Supprimer (`api/boards.php`)
- **Méthode**: DELETE
- **Body**: `{ "user_id": 1, "id": 1 }`
- **Note**: Supprime en cascade (colonnes, cartes, collaborateurs)

### 3. Colonnes (Columns)

#### Lister (`api/columns.php`)
- **Méthode**: GET
- **Paramètres**: `board_id` (requis)
- **Exemple**: `api/columns.php?board_id=1`

#### Créer (`api/columns.php`)
- **Méthode**: POST
- **Body**: `{ "board_id": 1, "name": "Nouvelle colonne" }`
- **Note**: L'ordre est calculé automatiquement (max + 1)

#### Modifier (`api/columns.php`)
- **Méthode**: PUT
- **Body**: `{ "id": 1, "name": "Nom modifié" }`

#### Supprimer (`api/columns.php`)
- **Méthode**: DELETE
- **Body**: `{ "id": 1 }` ou paramètre GET `id=1`

### 4. Cartes (Cards)

#### Lister (`api/cards.php`)
- **Méthode**: GET
- **Paramètres**: `column_id` OU `board_id` (requis)
- **Exemple**: `api/cards.php?column_id=1` ou `api/cards.php?board_id=1`

#### Créer (`api/cards.php`)
- **Méthode**: POST
- **Body**: 
```json
{
    "board_id": 1,
    "column_id": 1,
    "title": "Nouvelle tâche",
    "description": "Description",
    "priority": "high",
    "due_date": "2024-12-31",
    "assignee_email": "user@example.com",
    "created_by": 1
}
```
- **Priorités**: high, medium, low

#### Modifier (`api/cards.php`)
- **Méthode**: PUT
- **Body**: Tous les champs sont optionnels sauf `id`
```json
{
    "id": 1,
    "title": "Titre modifié",
    "description": "Nouvelle description",
    "priority": "medium",
    "column_id": 2,
    "order": 0
}
```

#### Supprimer (`api/cards.php`)
- **Méthode**: DELETE
- **Body**: `{ "id": 1 }` ou paramètre GET `id=1`

### 5. Déplacer une carte (Drag & Drop)

#### Move Card (`api/move_card.php`)
- **Méthode**: POST
- **Body**: 
```json
{
    "card_id": 1,
    "column_id": 2,
    "order": 0
}
```
- **Note**: Si `order` n'est pas fourni, la carte est placée à la fin de la colonne

### 6. Collaborateurs (Board Access)

#### Lister (`api/board_access.php`)
- **Méthode**: GET
- **Paramètres**: `board_id` (requis)
- **Exemple**: `api/board_access.php?board_id=1`

#### Ajouter (`api/board_access.php`)
- **Méthode**: POST
- **Body**: 
```json
{
    "board_id": 1,
    "user_email": "collaborateur@example.com",
    "user_name": "Nom Collaborateur",
    "added_by": 1
}
```
- **Permissions**: Propriétaire du tableau ou admin

#### Supprimer (`api/board_access.php`)
- **Méthode**: DELETE
- **Body**: `{ "board_id": 1, "user_email": "collaborateur@example.com" }`

### 7. Contact

#### Formulaire de contact (`api/contact.php`)
- **Méthode**: POST
- **Body**: 
```json
{
    "name": "Nom complet",
    "email": "email@example.com",
    "subject": "Sujet",
    "message": "Message"
}
```

## Structure de la base de données

### Table `users`
- `id` - INT (PK)
- `name` - VARCHAR(255)
- `email` - VARCHAR(255) UNIQUE
- `password` - VARCHAR(255)
- `role` - VARCHAR(50) DEFAULT 'user'
- `created_at` - DATETIME
- `updated_at` - DATETIME

### Table `boards`
- `id` - INT (PK)
- `name` - VARCHAR(255)
- `color` - VARCHAR(50) DEFAULT 'blue'
- `user_id` - INT (FK → users.id)
- `created_at` - DATETIME
- `updated_at` - DATETIME

### Table `columns`
- `id` - INT (PK)
- `board_id` - INT (FK → boards.id)
- `name` - VARCHAR(255)
- `order` - INT
- `created_at` - DATETIME

### Table `cards`
- `id` - INT (PK)
- `board_id` - INT (FK → boards.id)
- `column_id` - INT (FK → columns.id)
- `title` - VARCHAR(255)
- `description` - TEXT
- `priority` - VARCHAR(50) DEFAULT 'low'
- `due_date` - DATETIME
- `attachments` - INT DEFAULT 0
- `comments` - INT DEFAULT 0
- `assignee_email` - VARCHAR(255)
- `created_by` - INT (FK → users.id)
- `order` - INT
- `created_at` - DATETIME
- `updated_at` - DATETIME

### Table `board_access`
- `id` - INT (PK)
- `board_id` - INT (FK → boards.id)
- `user_email` - VARCHAR(255)
- `user_name` - VARCHAR(255)
- `added_by` - INT (FK → users.id)
- `created_at` - DATETIME
- UNIQUE (board_id, user_email)

### Table `contacts`
- `id` - INT (PK)
- `name` - VARCHAR(255)
- `email` - VARCHAR(255)
- `subject` - VARCHAR(255)
- `message` - TEXT
- `created_at` - DATETIME

## Notes importantes

1. **user_id requis**: Toutes les APIs nécessitent un `user_id` pour identifier l'utilisateur actuel
2. **Permissions**: 
   - Les propriétaires peuvent modifier/supprimer leurs tableaux
   - Les admins ont accès à tout
   - Les collaborateurs peuvent voir et utiliser les tableaux partagés
3. **Suppression en cascade**: La suppression d'un tableau supprime automatiquement ses colonnes, cartes et collaborateurs
4. **Colonnes par défaut**: Chaque nouveau tableau crée automatiquement 4 colonnes (Backlog, To Do, In Progress, Done)

