<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'db.php';

function sendResponse($success, $message, $data = null) {
    $response = [
        'success' => $success,
        'message' => $message
    ];
    if ($data !== null) {
        $response['data'] = $data;
    }
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, 'Méthode non autorisée. Utilisez POST.');
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    sendResponse(false, 'Données invalides.');
}

$name = isset($data['name']) ? trim($data['name']) : '';
$email = isset($data['email']) ? trim($data['email']) : '';
$password = isset($data['password']) ? trim($data['password']) : '';

// Validation
$errors = [];

if (empty($name)) {
    $errors[] = 'Le nom est requis.';
} elseif (strlen($name) < 2) {
    $errors[] = 'Le nom doit contenir au moins 2 caractères.';
}

if (empty($email)) {
    $errors[] = 'L\'email est requis.';
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'L\'email n\'est pas valide.';
}

if (empty($password)) {
    $errors[] = 'Le mot de passe est requis.';
} elseif (strlen($password) < 6) {
    $errors[] = 'Le mot de passe doit contenir au moins 6 caractères.';
}

if (!empty($errors)) {
    sendResponse(false, implode(' ', $errors));
}

$pdo = getDBConnection();

if (!$pdo) {
    sendResponse(false, 'Erreur de connexion à la base de données.');
}

try {
    // Vérifier si l'email existe déjà
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = :email");
    $stmt->execute([':email' => $email]);
    $existingUser = $stmt->fetch();
    
    if ($existingUser) {
        sendResponse(false, 'Cet email est déjà utilisé.');
    }
    
    // Hasher le mot de passe
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    
    // Insérer le nouvel utilisateur
    $stmt = $pdo->prepare("
        INSERT INTO users (name, email, password, role, created_at) 
        VALUES (:name, :email, :password, 'user', NOW())
    ");
    
    $stmt->execute([
        ':name' => $name,
        ':email' => $email,
        ':password' => $hashedPassword
    ]);
    
    $userId = $pdo->lastInsertId();
    
    // Récupérer l'utilisateur créé (sans le mot de passe)
    $stmt = $pdo->prepare("SELECT id, name, email, role, created_at FROM users WHERE id = :id");
    $stmt->execute([':id' => $userId]);
    $user = $stmt->fetch();
    
    sendResponse(true, 'Inscription réussie !', $user);
    
} catch (PDOException $e) {
    error_log("Erreur lors de l'inscription: " . $e->getMessage());
    sendResponse(false, 'Erreur lors de l\'inscription.');
}

