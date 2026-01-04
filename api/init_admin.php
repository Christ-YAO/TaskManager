<?php
/**
 * Script d'initialisation pour créer le compte admin
 * Exécutez ce script une fois via navigateur: http://localhost/TaskManager/api/init_admin.php
 */

require_once 'db.php';

$pdo = getDBConnection();

if (!$pdo) {
    die("Erreur de connexion à la base de données.");
}

try {
    // Vérifier si l'admin existe déjà
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = 'admin@taskmanager.com'");
    $stmt->execute();
    $adminExists = $stmt->fetch();
    
    if ($adminExists) {
        echo "Le compte admin existe déjà.";
        exit;
    }
    
    // Créer le compte admin
    $adminPassword = 'admin123';
    $hashedPassword = password_hash($adminPassword, PASSWORD_DEFAULT);
    
    $stmt = $pdo->prepare("
        INSERT INTO users (name, email, password, role, created_at) 
        VALUES ('Administrateur', 'admin@taskmanager.com', :password, 'admin', NOW())
    ");
    
    $stmt->execute([':password' => $hashedPassword]);
    
    echo "Compte admin créé avec succès !<br>";
    echo "Email: admin@taskmanager.com<br>";
    echo "Mot de passe: admin123<br>";
    echo "<br>⚠️ Veuillez changer le mot de passe après la première connexion.";
    
} catch (PDOException $e) {
    echo "Erreur: " . $e->getMessage();
}

