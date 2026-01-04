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

$email = isset($data['email']) ? trim($data['email']) : '';
$password = isset($data['password']) ? trim($data['password']) : '';

// Validation
$errors = [];

if (empty($email)) {
    $errors[] = 'L\'email est requis.';
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'L\'email n\'est pas valide.';
}

if (empty($password)) {
    $errors[] = 'Le mot de passe est requis.';
}

if (!empty($errors)) {
    sendResponse(false, implode(' ', $errors));
}

$pdo = getDBConnection();

if (!$pdo) {
    sendResponse(false, 'Erreur de connexion à la base de données.');
}

try {
    // Récupérer l'utilisateur par email
    $stmt = $pdo->prepare("SELECT id, name, email, password, role FROM users WHERE email = :email");
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch();
    
    if (!$user) {
        sendResponse(false, 'Email ou mot de passe incorrect.');
    }
    
    // Vérifier le mot de passe
    if (!password_verify($password, $user['password'])) {
        sendResponse(false, 'Email ou mot de passe incorrect.');
    }
    
    // Retourner l'utilisateur (sans le mot de passe)
    unset($user['password']);
    
    sendResponse(true, 'Connexion réussie !', $user);
    
} catch (PDOException $e) {
    error_log("Erreur lors de la connexion: " . $e->getMessage());
    sendResponse(false, 'Erreur lors de la connexion.');
}

