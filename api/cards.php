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

// GET - Lister les cartes
if ($method === 'GET') {
    $columnId = $_GET['column_id'] ?? null;
    $boardId = $_GET['board_id'] ?? null;
    
    try {
        if ($columnId) {
            $stmt = $pdo->prepare("
                SELECT c.*, u.name as assignee_name
                FROM cards c
                LEFT JOIN users u ON c.assignee_email = u.email
                WHERE c.column_id = :column_id
                ORDER BY c.`order` ASC
            ");
            $stmt->execute([':column_id' => $columnId]);
        } elseif ($boardId) {
            $stmt = $pdo->prepare("
                SELECT c.*, u.name as assignee_name
                FROM cards c
                LEFT JOIN users u ON c.assignee_email = u.email
                WHERE c.board_id = :board_id
                ORDER BY c.column_id, c.`order` ASC
            ");
            $stmt->execute([':board_id' => $boardId]);
        } else {
            sendResponse(false, 'column_id ou board_id requis.');
        }
        
        $cards = $stmt->fetchAll();
        
        // Formater les assignees comme array
        foreach ($cards as &$card) {
            $card['assignees'] = $card['assignee_name'] ? [$card['assignee_name']] : [];
        }
        
        sendResponse(true, 'Cartes récupérées.', $cards);
        
    } catch (PDOException $e) {
        error_log("Erreur: " . $e->getMessage());
        sendResponse(false, 'Erreur lors de la récupération.');
    }
}

// POST - Créer une carte
if ($method === 'POST') {
    $boardId = $data['board_id'] ?? null;
    $columnId = $data['column_id'] ?? null;
    $title = trim($data['title'] ?? '');
    $description = trim($data['description'] ?? '');
    $priority = $data['priority'] ?? 'low';
    $dueDate = $data['due_date'] ?? null;
    $assigneeEmail = $data['assignee_email'] ?? null;
    $createdBy = $data['created_by'] ?? null;
    
    if (!$boardId || !$columnId || empty($title) || !$createdBy) {
        sendResponse(false, 'board_id, column_id, title et created_by requis.');
    }
    
    $allowedPriorities = ['high', 'medium', 'low'];
    if (!in_array($priority, $allowedPriorities)) {
        $priority = 'low';
    }
    
    try {
        // Vérifier que la colonne existe et appartient au tableau
        $stmt = $pdo->prepare("SELECT id FROM columns WHERE id = :column_id AND board_id = :board_id");
        $stmt->execute([':column_id' => $columnId, ':board_id' => $boardId]);
        $column = $stmt->fetch();
        if (!$column) {
            sendResponse(false, 'La colonne spécifiée n\'existe pas ou n\'appartient pas à ce tableau.');
        }
        
        // Vérifier que created_by existe
        $stmt = $pdo->prepare("SELECT id FROM users WHERE id = :id");
        $stmt->execute([':id' => $createdBy]);
        $user = $stmt->fetch();
        if (!$user) {
            sendResponse(false, 'L\'utilisateur créateur n\'existe pas.');
        }
        
        // Convertir la date au format DATETIME si nécessaire
        $dueDateFormatted = null;
        if ($dueDate) {
            // Si c'est juste une date (YYYY-MM-DD), ajouter l'heure
            if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $dueDate)) {
                $dueDateFormatted = $dueDate . ' 23:59:59';
            } else {
                $dueDateFormatted = $dueDate;
            }
        }
        
        // Trouver le max order dans la colonne
        $stmt = $pdo->prepare("SELECT MAX(`order`) as max_order FROM cards WHERE column_id = :column_id");
        $stmt->execute([':column_id' => $columnId]);
        $result = $stmt->fetch();
        $maxOrder = $result['max_order'] ?? -1;
        $newOrder = $maxOrder + 1;
        
        $stmt = $pdo->prepare("
            INSERT INTO cards (board_id, column_id, title, description, priority, due_date, assignee_email, created_by, `order`, created_at) 
            VALUES (:board_id, :column_id, :title, :description, :priority, :due_date, :assignee_email, :created_by, :order, NOW())
        ");
        
        $stmt->execute([
            ':board_id' => (int)$boardId,
            ':column_id' => (int)$columnId,
            ':title' => $title,
            ':description' => $description ?: null,
            ':priority' => $priority,
            ':due_date' => $dueDateFormatted,
            ':assignee_email' => $assigneeEmail ?: null,
            ':created_by' => (int)$createdBy,
            ':order' => $newOrder
        ]);
        
        $cardId = $pdo->lastInsertId();
        
        // Récupérer la carte créée
        $stmt = $pdo->prepare("
            SELECT c.*, u.name as assignee_name
            FROM cards c
            LEFT JOIN users u ON c.assignee_email = u.email
            WHERE c.id = :id
        ");
        $stmt->execute([':id' => $cardId]);
        $card = $stmt->fetch();
        
        $card['assignees'] = $card['assignee_name'] ? [$card['assignee_name']] : [];
        
        sendResponse(true, 'Carte créée avec succès.', $card);
        
    } catch (PDOException $e) {
        error_log("Erreur: " . $e->getMessage());
        error_log("Board ID: " . $boardId . ", Column ID: " . $columnId . ", Created By: " . $createdBy);
        
        // Vérifier si c'est une erreur de clé étrangère
        if (strpos($e->getMessage(), 'foreign key') !== false || strpos($e->getMessage(), '1452') !== false) {
            sendResponse(false, 'Erreur: Le tableau, la colonne ou l\'utilisateur spécifié n\'existe pas.');
        } else {
            sendResponse(false, 'Erreur lors de la création: ' . $e->getMessage());
        }
    }
}

// PUT - Modifier une carte
if ($method === 'PUT') {
    $cardId = $data['id'] ?? null;
    $title = trim($data['title'] ?? '');
    $description = trim($data['description'] ?? '');
    $priority = $data['priority'] ?? null;
    $dueDate = $data['due_date'] ?? null;
    $assigneeEmail = $data['assignee_email'] ?? null;
    $columnId = $data['column_id'] ?? null;
    $order = $data['order'] ?? null;
    
    if (!$cardId) {
        sendResponse(false, 'id requis.');
    }
    
    try {
        // Construire la requête dynamiquement
        $updates = [];
        $params = [':id' => $cardId];
        
        if ($title !== '') {
            $updates[] = "title = :title";
            $params[':title'] = $title;
        }
        if ($description !== null) {
            $updates[] = "description = :description";
            $params[':description'] = $description ?: null;
        }
        if ($priority !== null) {
            $allowedPriorities = ['high', 'medium', 'low'];
            if (in_array($priority, $allowedPriorities)) {
                $updates[] = "priority = :priority";
                $params[':priority'] = $priority;
            }
        }
        if ($dueDate !== null) {
            $updates[] = "due_date = :due_date";
            $params[':due_date'] = $dueDate ?: null;
        }
        if ($assigneeEmail !== null) {
            $updates[] = "assignee_email = :assignee_email";
            $params[':assignee_email'] = $assigneeEmail ?: null;
        }
        if ($columnId !== null) {
            $updates[] = "column_id = :column_id";
            $params[':column_id'] = $columnId;
        }
        if ($order !== null) {
            $updates[] = "`order` = :order";
            $params[':order'] = $order;
        }
        
        if (empty($updates)) {
            sendResponse(false, 'Aucune donnée à mettre à jour.');
        }
        
        $updates[] = "updated_at = NOW()";
        $sql = "UPDATE cards SET " . implode(', ', $updates) . " WHERE id = :id";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        // Récupérer la carte modifiée
        $stmt = $pdo->prepare("
            SELECT c.*, u.name as assignee_name
            FROM cards c
            LEFT JOIN users u ON c.assignee_email = u.email
            WHERE c.id = :id
        ");
        $stmt->execute([':id' => $cardId]);
        $card = $stmt->fetch();
        
        $card['assignees'] = $card['assignee_name'] ? [$card['assignee_name']] : [];
        
        sendResponse(true, 'Carte modifiée avec succès.', $card);
        
    } catch (PDOException $e) {
        error_log("Erreur: " . $e->getMessage());
        sendResponse(false, 'Erreur lors de la modification.');
    }
}

// DELETE - Supprimer une carte
if ($method === 'DELETE') {
    $cardId = $data['id'] ?? $_GET['id'] ?? null;
    
    if (!$cardId) {
        sendResponse(false, 'id requis.');
    }
    
    try {
        $stmt = $pdo->prepare("DELETE FROM cards WHERE id = :id");
        $stmt->execute([':id' => $cardId]);
        
        sendResponse(true, 'Carte supprimée avec succès.');
        
    } catch (PDOException $e) {
        error_log("Erreur: " . $e->getMessage());
        sendResponse(false, 'Erreur lors de la suppression.');
    }
}

sendResponse(false, 'Méthode non supportée.');

