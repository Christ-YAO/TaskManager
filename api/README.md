# API de Contact - TaskManager

## Installation

### 1. Créer la base de données

1. Ouvrez **phpMyAdmin** dans XAMPP (http://localhost/phpmyadmin)
2. Importez le fichier `create_contacts_table.sql` ou exécutez les commandes SQL suivantes :

```sql
CREATE DATABASE IF NOT EXISTS taskmanager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE taskmanager;

CREATE TABLE IF NOT EXISTS contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME NOT NULL,
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. Configuration

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

### Endpoint
- **URL**: `api/contact.php`
- **Méthode**: POST
- **Content-Type**: application/json

### Requête
```json
{
    "name": "Nom complet",
    "email": "email@example.com",
    "subject": "Sujet du message",
    "message": "Contenu du message"
}
```

### Réponse (succès)
```json
{
    "success": true,
    "message": "Message envoyé avec succès !",
    "data": {
        "id": 1
    }
}
```

### Réponse (erreur)
```json
{
    "success": false,
    "message": "Message d'erreur"
}
```

## Fichiers

- `db.php` - Connexion à la base de données
- `contact.php` - API REST pour gérer les messages de contact
- `create_contacts_table.sql` - Script SQL pour créer la table

