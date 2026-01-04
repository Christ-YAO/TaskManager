<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'db.php';

function sendResponse($success, $message, $data = null) {
    $response = ['success' => $success, 'message' => $message];
    if ($data !== null) $response['data'] = $data;
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit;
}

$pdo = getDBConnection();
if (!$pdo) {
    sendResponse(false, 'Erreur de connexion à la base de données.');
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $userId = $_GET['id'] ?? null;
    
    try {
        if ($userId) {
            // Récupérer un utilisateur spécifique
            $stmt = $pdo->prepare("SELECT id, name, email, role, created_at FROM users WHERE id = :id");
            $stmt->execute([':id' => $userId]);
            $user = $stmt->fetch();
            
            if (!$user) {
                sendResponse(false, 'Utilisateur introuvable.');
            }
            
            sendResponse(true, 'Utilisateur récupéré.', $user);
        } else {
            // Récupérer tous les utilisateurs (sans mots de passe)
            $stmt = $pdo->prepare("SELECT id, name, email, role, created_at FROM users ORDER BY name ASC");
            $stmt->execute();
            $users = $stmt->fetchAll();
            
            sendResponse(true, 'Utilisateurs récupérés.', $users);
        }
    } catch (PDOException $e) {
        error_log("Erreur: " . $e->getMessage());
        sendResponse(false, 'Erreur lors de la récupération.');
    }
}

sendResponse(false, 'Méthode non supportée.');

