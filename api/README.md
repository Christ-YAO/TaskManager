# API TaskManager

API REST pour l'application TaskManager (Authentification et Contact)

## Installation

### 1. Créer la base de données

1. Ouvrez **phpMyAdmin** dans XAMPP (http://localhost/phpmyadmin)
2. Importez le fichier `init_database.sql` qui crée toutes les tables nécessaires
   - OU exécutez individuellement `create_users_table.sql` et `create_contacts_table.sql`

### 2. Créer le compte admin

Le compte admin est créé automatiquement lors de l'import de `init_database.sql`.
Sinon, vous pouvez :

- Exécuter `api/init_admin.php` dans votre navigateur : http://localhost/TaskManager/api/init_admin.php
- Ou utiliser phpMyAdmin pour insérer manuellement l'admin

**Identifiants admin par défaut :**

- Email: `admin@taskmanager.com`
- Mot de passe: `admin123`

### 3. Configuration

Si vos identifiants MySQL sont différents de ceux par défaut (root, pas de mot de passe), modifiez le fichier `api/db.php` :

```php
define('DB_HOST', 'localhost');  // Hôte de la base de données
define('DB_NAME', 'taskmanager'); // Nom de la base de données
define('DB_USER', 'root');        // Utilisateur MySQL
define('DB_PASS', '');            // Mot de passe MySQL
```

### 3. Vérification

1. Démarrez Apache et MySQL dans XAMPP
2. Accédez à http://localhost/TaskManager/contact.html
3. Remplissez le formulaire de contact
4. Les messages seront enregistrés dans la table `contacts`

## Structure de l'API

### 1. Authentification

#### Inscription (`api/register.php`)

- **Méthode**: POST
- **Content-Type**: application/json

**Requête:**

```json
{
  "name": "Nom complet",
  "email": "email@example.com",
  "password": "motdepasse"
}
```

**Réponse (succès):**

```json
{
  "success": true,
  "message": "Inscription réussie !",
  "data": {
    "id": 1,
    "name": "Nom complet",
    "email": "email@example.com",
    "role": "user",
    "created_at": "2024-01-01 12:00:00"
  }
}
```

#### Connexion (`api/login.php`)

- **Méthode**: POST
- **Content-Type**: application/json

**Requête:**

```json
{
  "email": "email@example.com",
  "password": "motdepasse"
}
```

**Réponse (succès):**

```json
{
  "success": true,
  "message": "Connexion réussie !",
  "data": {
    "id": 1,
    "name": "Nom complet",
    "email": "email@example.com",
    "role": "user"
  }
}
```

**Réponse (erreur):**

```json
{
  "success": false,
  "message": "Email ou mot de passe incorrect."
}
```

### 2. Contact

#### Formulaire de contact (`api/contact.php`)

- **Méthode**: POST
- **Content-Type**: application/json

**Requête:**

```json
{
  "name": "Nom complet",
  "email": "email@example.com",
  "subject": "Sujet du message",
  "message": "Contenu du message"
}
```

**Réponse (succès):**

```json
{
  "success": true,
  "message": "Message envoyé avec succès !",
  "data": {
    "id": 1
  }
}
```

## Fichiers

### Configuration

- `db.php` - Connexion à la base de données

### API

- `register.php` - API pour l'inscription
- `login.php` - API pour la connexion
- `contact.php` - API pour le formulaire de contact
- `init_admin.php` - Script pour créer le compte admin

### Base de données

- `init_database.sql` - Script complet pour initialiser toute la base de données
- `create_users_table.sql` - Script pour créer la table users
- `create_contacts_table.sql` - Script pour créer la table contacts

## Structure de la base de données

### Table `users`

- `id` - INT (auto-increment, clé primaire)
- `name` - VARCHAR(255) - Nom complet
- `email` - VARCHAR(255) - Email (unique)
- `password` - VARCHAR(255) - Mot de passe hashé
- `role` - VARCHAR(50) - Rôle (user/admin)
- `created_at` - DATETIME - Date de création
- `updated_at` - DATETIME - Date de mise à jour

### Table `contacts`

- `id` - INT (auto-increment, clé primaire)
- `name` - VARCHAR(255) - Nom complet
- `email` - VARCHAR(255) - Email
- `subject` - VARCHAR(255) - Sujet
- `message` - TEXT - Message
- `created_at` - DATETIME - Date de création

## Sécurité

- Les mots de passe sont hashés avec `password_hash()` (bcrypt)
- Utilisation de requêtes préparées (PDO) pour éviter les injections SQL
- Validation des données côté serveur
- Messages d'erreur génériques pour éviter la divulgation d'informations
