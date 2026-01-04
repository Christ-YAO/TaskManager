<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Inclure le fichier de connexion à la base de données
require_once 'db.php';

// Fonction pour envoyer une réponse JSON
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

// Vérifier que la requête est en POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, 'Méthode non autorisée. Utilisez POST.');
}

// Récupérer les données JSON
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Vérifier si les données sont valides
if (!$data) {
    sendResponse(false, 'Données invalides.');
}

// Récupérer et valider les champs
$name = isset($data['name']) ? trim($data['name']) : '';
$email = isset($data['email']) ? trim($data['email']) : '';
$subject = isset($data['subject']) ? trim($data['subject']) : '';
$message = isset($data['message']) ? trim($data['message']) : '';

// Validation des champs
$errors = [];

if (empty($name)) {
    $errors[] = 'Le nom est requis.';
}

if (empty($email)) {
    $errors[] = 'L\'email est requis.';
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'L\'email n\'est pas valide.';
}

if (empty($subject)) {
    $errors[] = 'Le sujet est requis.';
}

if (empty($message)) {
    $errors[] = 'Le message est requis.';
}

// Si des erreurs existent, les retourner
if (!empty($errors)) {
    sendResponse(false, implode(' ', $errors));
}

// Connexion à la base de données
$pdo = getDBConnection();

if (!$pdo) {
    sendResponse(false, 'Erreur de connexion à la base de données.');
}

try {
    // Préparer la requête d'insertion
    $stmt = $pdo->prepare("
        INSERT INTO contacts (name, email, subject, message, created_at) 
        VALUES (:name, :email, :subject, :message, NOW())
    ");
    
    // Exécuter la requête avec les paramètres
    $stmt->execute([
        ':name' => $name,
        ':email' => $email,
        ':subject' => $subject,
        ':message' => $message
    ]);
    
    // Récupérer l'ID du message inséré
    $contactId = $pdo->lastInsertId();
    
    sendResponse(true, 'Message envoyé avec succès !', ['id' => $contactId]);
    
} catch (PDOException $e) {
    error_log("Erreur lors de l'insertion: " . $e->getMessage());
    sendResponse(false, 'Erreur lors de l\'enregistrement du message.');
}

