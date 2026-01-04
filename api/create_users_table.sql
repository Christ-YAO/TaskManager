-- Créer la table users pour l'authentification
USE taskmanager;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- L'utilisateur admin sera créé via api/init_admin.php
-- Ou exécutez cette commande après avoir hashé le mot de passe avec PHP:
-- INSERT INTO users (name, email, password, role) 
-- VALUES ('Administrateur', 'admin@taskmanager.com', '[HASH_GÉNÉRÉ]', 'admin')
-- ON DUPLICATE KEY UPDATE name=name;

