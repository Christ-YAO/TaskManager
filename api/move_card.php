<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
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

if ($method !== 'POST') {
    sendResponse(false, 'Méthode non autorisée. Utilisez POST.');
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

$cardId = $data['card_id'] ?? null;
$columnId = $data['column_id'] ?? null;
$order = $data['order'] ?? null;

if (!$cardId || !$columnId) {
    sendResponse(false, 'card_id et column_id requis.');
}

try {
    // Vérifier que la carte existe
    $stmt = $pdo->prepare("SELECT * FROM cards WHERE id = :id");
    $stmt->execute([':id' => $cardId]);
    $card = $stmt->fetch();
    
    if (!$card) {
        sendResponse(false, 'Carte introuvable.');
    }
    
    // Vérifier que la colonne existe et appartient au même tableau
    $stmt = $pdo->prepare("SELECT board_id FROM columns WHERE id = :id");
    $stmt->execute([':id' => $columnId]);
    $column = $stmt->fetch();
    
    if (!$column) {
        sendResponse(false, 'Colonne introuvable.');
    }
    
    if ($column['board_id'] != $card['board_id']) {
        sendResponse(false, 'La colonne doit appartenir au même tableau.');
    }
    
    // Si order n'est pas fourni, mettre à la fin de la colonne
    if ($order === null) {
        $stmt = $pdo->prepare("SELECT MAX(`order`) as max_order FROM cards WHERE column_id = :column_id");
        $stmt->execute([':column_id' => $columnId]);
        $result = $stmt->fetch();
        $order = ($result['max_order'] ?? -1) + 1;
    }
    
    // Mettre à jour la carte
    $stmt = $pdo->prepare("
        UPDATE cards 
        SET column_id = :column_id, `order` = :order, updated_at = NOW()
        WHERE id = :id
    ");
    
    $stmt->execute([
        ':column_id' => $columnId,
        ':order' => $order,
        ':id' => $cardId
    ]);
    
    // Récupérer la carte mise à jour
    $stmt = $pdo->prepare("
        SELECT c.*, u.name as assignee_name
        FROM cards c
        LEFT JOIN users u ON c.assignee_email = u.email
        WHERE c.id = :id
    ");
    $stmt->execute([':id' => $cardId]);
    $updatedCard = $stmt->fetch();
    
    $updatedCard['assignees'] = $updatedCard['assignee_name'] ? [$updatedCard['assignee_name']] : [];
    
    sendResponse(true, 'Carte déplacée avec succès.', $updatedCard);
    
} catch (PDOException $e) {
    error_log("Erreur: " . $e->getMessage());
    sendResponse(false, 'Erreur lors du déplacement.');
}

