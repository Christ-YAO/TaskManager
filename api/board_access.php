<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE');
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
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// GET - Lister les collaborateurs d'un tableau
if ($method === 'GET') {
    $boardId = $_GET['board_id'] ?? null;
    
    if (!$boardId) {
        sendResponse(false, 'board_id requis.');
    }
    
    try {
        $stmt = $pdo->prepare("
            SELECT ba.*, u.id as user_id
            FROM board_access ba
            LEFT JOIN users u ON ba.user_email = u.email
            WHERE ba.board_id = :board_id
            ORDER BY ba.created_at ASC
        ");
        $stmt->execute([':board_id' => $boardId]);
        $members = $stmt->fetchAll();
        
        sendResponse(true, 'Collaborateurs récupérés.', $members);
        
    } catch (PDOException $e) {
        error_log("Erreur: " . $e->getMessage());
        sendResponse(false, 'Erreur lors de la récupération.');
    }
}

// POST - Ajouter un collaborateur
if ($method === 'POST') {
    $boardId = $data['board_id'] ?? null;
    $userEmail = trim($data['user_email'] ?? '');
    $userName = trim($data['user_name'] ?? '');
    $addedBy = $data['added_by'] ?? null;
    
    if (!$boardId || empty($userEmail) || empty($userName) || !$addedBy) {
        sendResponse(false, 'board_id, user_email, user_name et added_by requis.');
    }
    
    if (!filter_var($userEmail, FILTER_VALIDATE_EMAIL)) {
        sendResponse(false, 'Email invalide.');
    }
    
    try {
        // Vérifier que le tableau existe
        $stmt = $pdo->prepare("SELECT user_id FROM boards WHERE id = :id");
        $stmt->execute([':id' => $boardId]);
        $board = $stmt->fetch();
        
        if (!$board) {
            sendResponse(false, 'Tableau introuvable.');
        }
        
        // Vérifier les permissions (propriétaire ou admin)
        $canAdd = false;
        if ($board['user_id'] == $addedBy) {
            $canAdd = true;
        } else {
            $stmt = $pdo->prepare("SELECT role FROM users WHERE id = :id");
            $stmt->execute([':id' => $addedBy]);
            $user = $stmt->fetch();
            if ($user && $user['role'] === 'admin') {
                $canAdd = true;
            }
        }
        
        if (!$canAdd) {
            sendResponse(false, 'Vous n\'êtes pas autorisé à ajouter des collaborateurs à ce tableau.');
        }
        
        // Vérifier si l'email n'est pas déjà ajouté
        $stmt = $pdo->prepare("SELECT id FROM board_access WHERE board_id = :board_id AND user_email = :user_email");
        $stmt->execute([':board_id' => $boardId, ':user_email' => $userEmail]);
        if ($stmt->fetch()) {
            sendResponse(false, 'Cet utilisateur est déjà collaborateur de ce tableau.');
        }
        
        // Vérifier que l'email n'est pas celui du propriétaire
        $stmt = $pdo->prepare("SELECT email FROM users WHERE id = :id");
        $stmt->execute([':id' => $board['user_id']]);
        $owner = $stmt->fetch();
        if ($owner && strtolower($owner['email']) === strtolower($userEmail)) {
            sendResponse(false, 'Le propriétaire du tableau est automatiquement membre.');
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO board_access (board_id, user_email, user_name, added_by, created_at) 
            VALUES (:board_id, :user_email, :user_name, :added_by, NOW())
        ");
        
        $stmt->execute([
            ':board_id' => $boardId,
            ':user_email' => strtolower($userEmail),
            ':user_name' => $userName,
            ':added_by' => $addedBy
        ]);
        
        $accessId = $pdo->lastInsertId();
        
        $stmt = $pdo->prepare("SELECT * FROM board_access WHERE id = :id");
        $stmt->execute([':id' => $accessId]);
        $access = $stmt->fetch();
        
        sendResponse(true, 'Collaborateur ajouté avec succès.', $access);
        
    } catch (PDOException $e) {
        error_log("Erreur: " . $e->getMessage());
        if (strpos($e->getMessage(), 'unique_board_user') !== false) {
            sendResponse(false, 'Cet utilisateur est déjà collaborateur de ce tableau.');
        }
        sendResponse(false, 'Erreur lors de l\'ajout.');
    }
}

// DELETE - Supprimer un collaborateur
if ($method === 'DELETE') {
    $boardId = $data['board_id'] ?? $_GET['board_id'] ?? null;
    $userEmail = $data['user_email'] ?? $_GET['user_email'] ?? null;
    
    if (!$boardId || !$userEmail) {
        sendResponse(false, 'board_id et user_email requis.');
    }
    
    try {
        $stmt = $pdo->prepare("DELETE FROM board_access WHERE board_id = :board_id AND user_email = :user_email");
        $stmt->execute([
            ':board_id' => $boardId,
            ':user_email' => $userEmail
        ]);
        
        sendResponse(true, 'Collaborateur supprimé avec succès.');
        
    } catch (PDOException $e) {
        error_log("Erreur: " . $e->getMessage());
        sendResponse(false, 'Erreur lors de la suppression.');
    }
}

sendResponse(false, 'Méthode non supportée.');

