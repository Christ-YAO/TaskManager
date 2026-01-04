<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
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

// GET - Lister les colonnes d'un tableau
if ($method === 'GET') {
    $boardId = $_GET['board_id'] ?? null;
    
    if (!$boardId) {
        sendResponse(false, 'board_id requis.');
    }
    
    try {
        $stmt = $pdo->prepare("
            SELECT * FROM columns 
            WHERE board_id = :board_id 
            ORDER BY `order` ASC
        ");
        $stmt->execute([':board_id' => $boardId]);
        $columns = $stmt->fetchAll();
        
        sendResponse(true, 'Colonnes récupérées.', $columns);
        
    } catch (PDOException $e) {
        error_log("Erreur: " . $e->getMessage());
        sendResponse(false, 'Erreur lors de la récupération.');
    }
}

// POST - Créer une colonne
if ($method === 'POST') {
    $boardId = $data['board_id'] ?? null;
    $name = trim($data['name'] ?? '');
    
    if (!$boardId || empty($name)) {
        sendResponse(false, 'board_id et name requis.');
    }
    
    try {
        // Trouver le max order
        $stmt = $pdo->prepare("SELECT MAX(`order`) as max_order FROM columns WHERE board_id = :board_id");
        $stmt->execute([':board_id' => $boardId]);
        $result = $stmt->fetch();
        $maxOrder = $result['max_order'] ?? -1;
        $newOrder = $maxOrder + 1;
        
        $stmt = $pdo->prepare("
            INSERT INTO columns (board_id, name, `order`, created_at) 
            VALUES (:board_id, :name, :order, NOW())
        ");
        
        $stmt->execute([
            ':board_id' => $boardId,
            ':name' => $name,
            ':order' => $newOrder
        ]);
        
        $columnId = $pdo->lastInsertId();
        
        $stmt = $pdo->prepare("SELECT * FROM columns WHERE id = :id");
        $stmt->execute([':id' => $columnId]);
        $column = $stmt->fetch();
        
        sendResponse(true, 'Colonne créée avec succès.', $column);
        
    } catch (PDOException $e) {
        error_log("Erreur: " . $e->getMessage());
        sendResponse(false, 'Erreur lors de la création.');
    }
}

// PUT - Modifier une colonne
if ($method === 'PUT') {
    $columnId = $data['id'] ?? null;
    $name = trim($data['name'] ?? '');
    
    if (!$columnId || empty($name)) {
        sendResponse(false, 'id et name requis.');
    }
    
    try {
        $stmt = $pdo->prepare("UPDATE columns SET name = :name WHERE id = :id");
        $stmt->execute([':name' => $name, ':id' => $columnId]);
        
        $stmt = $pdo->prepare("SELECT * FROM columns WHERE id = :id");
        $stmt->execute([':id' => $columnId]);
        $column = $stmt->fetch();
        
        sendResponse(true, 'Colonne modifiée avec succès.', $column);
        
    } catch (PDOException $e) {
        error_log("Erreur: " . $e->getMessage());
        sendResponse(false, 'Erreur lors de la modification.');
    }
}

// DELETE - Supprimer une colonne
if ($method === 'DELETE') {
    $columnId = $data['id'] ?? $_GET['id'] ?? null;
    
    if (!$columnId) {
        sendResponse(false, 'id requis.');
    }
    
    try {
        $stmt = $pdo->prepare("DELETE FROM columns WHERE id = :id");
        $stmt->execute([':id' => $columnId]);
        
        sendResponse(true, 'Colonne supprimée avec succès.');
        
    } catch (PDOException $e) {
        error_log("Erreur: " . $e->getMessage());
        sendResponse(false, 'Erreur lors de la suppression.');
    }
}

sendResponse(false, 'Méthode non supportée.');

