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

function getCurrentUser() {
    // Dans une vraie app, on utiliserait des sessions/tokens JWT
    // Pour l'instant, on récupère depuis les headers ou le body
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    return $data['user_id'] ?? null;
}

$pdo = getDBConnection();
if (!$pdo) {
    sendResponse(false, 'Erreur de connexion à la base de données.');
}

$method = $_SERVER['REQUEST_METHOD'];
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// GET - Lister les tableaux
if ($method === 'GET') {
    $userId = $_GET['user_id'] ?? null;
    $boardId = $_GET['id'] ?? null;
    
    if (!$userId) {
        sendResponse(false, 'user_id requis.');
    }
    
    try {
        // Si ID spécifié, récupérer un tableau
        if ($boardId) {
            $stmt = $pdo->prepare("
                SELECT b.*, 
                       (SELECT COUNT(*) FROM cards WHERE board_id = b.id) as card_count
                FROM boards b 
                WHERE b.id = :id
            ");
            $stmt->execute([':id' => $boardId]);
            $board = $stmt->fetch();
            
            if (!$board) {
                sendResponse(false, 'Tableau introuvable.');
            }
            
            // Vérifier l'accès (propriétaire, admin, ou collaborateur)
            $hasAccess = false;
            if ($board['user_id'] == $userId) {
                $hasAccess = true;
            } else {
                // Vérifier si admin
                $stmt = $pdo->prepare("SELECT role FROM users WHERE id = :id");
                $stmt->execute([':id' => $userId]);
                $user = $stmt->fetch();
                if ($user && $user['role'] === 'admin') {
                    $hasAccess = true;
                } else {
                    // Vérifier si collaborateur
                    $stmt = $pdo->prepare("SELECT user_email FROM board_access WHERE board_id = :board_id AND user_email = (SELECT email FROM users WHERE id = :user_id)");
                    $stmt->execute([':board_id' => $boardId, ':user_id' => $userId]);
                    if ($stmt->fetch()) {
                        $hasAccess = true;
                    }
                }
            }
            
            if (!$hasAccess) {
                sendResponse(false, 'Accès non autorisé.');
            }
            
            sendResponse(true, 'Tableau récupéré.', $board);
        } else {
            // Récupérer le rôle de l'utilisateur
            $stmt = $pdo->prepare("SELECT role, email FROM users WHERE id = :id");
            $stmt->execute([':id' => $userId]);
            $user = $stmt->fetch();
            
            if (!$user) {
                sendResponse(false, 'Utilisateur introuvable.');
            }
            
            $isAdmin = $user['role'] === 'admin';
            $userEmail = $user['email'];
            
            if ($isAdmin) {
                // Admin voit tous les tableaux
                $stmt = $pdo->prepare("
                    SELECT b.*, 
                           (SELECT COUNT(*) FROM cards WHERE board_id = b.id) as card_count
                    FROM boards b
                    ORDER BY b.created_at DESC
                ");
                $stmt->execute();
            } else {
                // Utilisateur voit ses tableaux + ceux où il est collaborateur
                $stmt = $pdo->prepare("
                    SELECT DISTINCT b.*, 
                           (SELECT COUNT(*) FROM cards WHERE board_id = b.id) as card_count
                    FROM boards b
                    LEFT JOIN board_access ba ON b.id = ba.board_id
                    WHERE b.user_id = :user_id OR ba.user_email = :user_email
                    ORDER BY b.created_at DESC
                ");
                $stmt->execute([':user_id' => $userId, ':user_email' => $userEmail]);
            }
            
            $boards = $stmt->fetchAll();
            sendResponse(true, 'Tableaux récupérés.', $boards);
        }
    } catch (PDOException $e) {
        error_log("Erreur: " . $e->getMessage());
        sendResponse(false, 'Erreur lors de la récupération.');
    }
}

// POST - Créer un tableau
if ($method === 'POST') {
    // Vérifier que les données sont bien reçues
    if (!$data || !is_array($data)) {
        sendResponse(false, 'Données invalides. Format JSON requis. Données reçues: ' . json_encode($input));
    }
    
    $userId = $data['user_id'] ?? null;
    $name = trim($data['name'] ?? '');
    $color = $data['color'] ?? 'blue';
    
    if (!$userId) {
        sendResponse(false, 'user_id requis. Données reçues: ' . json_encode($data));
    }
    
    if (empty($name)) {
        sendResponse(false, 'Le nom du tableau est requis.');
    }
    
    $allowedColors = ['blue', 'purple', 'green', 'yellow', 'red', 'pink'];
    if (!in_array($color, $allowedColors)) {
        $color = 'blue';
    }
    
    try {
        // Vérifier que l'utilisateur existe
        $stmt = $pdo->prepare("SELECT id FROM users WHERE id = :user_id");
        $stmt->execute([':user_id' => $userId]);
        $user = $stmt->fetch();
        if (!$user) {
            sendResponse(false, 'Utilisateur introuvable (ID: ' . $userId . ').');
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO boards (name, color, user_id, created_at) 
            VALUES (:name, :color, :user_id, NOW())
        ");
        
        $result = $stmt->execute([
            ':name' => $name,
            ':color' => $color,
            ':user_id' => $userId
        ]);
        
        if (!$result) {
            sendResponse(false, 'Erreur lors de l\'insertion du tableau.');
        }
        
        $boardId = $pdo->lastInsertId();
        
        if (!$boardId) {
            sendResponse(false, 'Erreur: Aucun ID retourné après insertion.');
        }
        
        // Créer les colonnes par défaut
        $defaultColumns = [
            ['name' => 'Backlog', 'order' => 0],
            ['name' => 'To Do', 'order' => 1],
            ['name' => 'In Progress', 'order' => 2],
            ['name' => 'Done', 'order' => 3]
        ];
        
        $stmt = $pdo->prepare("INSERT INTO columns (board_id, name, `order`, created_at) VALUES (:board_id, :name, :order, NOW())");
        foreach ($defaultColumns as $col) {
            $stmt->execute([
                ':board_id' => $boardId,
                ':name' => $col['name'],
                ':order' => $col['order']
            ]);
        }
        
        // Récupérer le tableau créé
        $stmt = $pdo->prepare("
            SELECT b.*, 
                   (SELECT COUNT(*) FROM cards WHERE board_id = b.id) as card_count
            FROM boards b
            WHERE b.id = :id
        ");
        $stmt->execute([':id' => $boardId]);
        $board = $stmt->fetch();
        
        if (!$board) {
            sendResponse(false, 'Erreur: Tableau créé mais impossible à récupérer (ID: ' . $boardId . ').');
        }
        
        sendResponse(true, 'Tableau créé avec succès.', $board);
        
    } catch (PDOException $e) {
        error_log("Erreur lors de la création du tableau: " . $e->getMessage());
        sendResponse(false, 'Erreur lors de la création: ' . $e->getMessage());
    }
}

// PUT - Modifier un tableau
if ($method === 'PUT') {
    $userId = $data['user_id'] ?? null;
    $boardId = $data['id'] ?? null;
    $name = trim($data['name'] ?? '');
    $color = $data['color'] ?? 'blue';
    
    if (!$userId || !$boardId) {
        sendResponse(false, 'user_id et id requis.');
    }
    
    if (empty($name)) {
        sendResponse(false, 'Le nom du tableau est requis.');
    }
    
    try {
        // Vérifier que l'utilisateur est propriétaire
        $stmt = $pdo->prepare("SELECT user_id FROM boards WHERE id = :id");
        $stmt->execute([':id' => $boardId]);
        $board = $stmt->fetch();
        
        if (!$board) {
            sendResponse(false, 'Tableau introuvable.');
        }
        
        if ($board['user_id'] != $userId) {
            // Vérifier si admin
            $stmt = $pdo->prepare("SELECT role FROM users WHERE id = :id");
            $stmt->execute([':id' => $userId]);
            $user = $stmt->fetch();
            if (!$user || $user['role'] !== 'admin') {
                sendResponse(false, 'Vous n\'êtes pas autorisé à modifier ce tableau.');
            }
        }
        
        $allowedColors = ['blue', 'purple', 'green', 'yellow', 'red', 'pink'];
        if (!in_array($color, $allowedColors)) {
            $color = 'blue';
        }
        
        $stmt = $pdo->prepare("
            UPDATE boards 
            SET name = :name, color = :color, updated_at = NOW()
            WHERE id = :id
        ");
        
        $stmt->execute([
            ':name' => $name,
            ':color' => $color,
            ':id' => $boardId
        ]);
        
        // Récupérer le tableau modifié
        $stmt = $pdo->prepare("
            SELECT b.*, 
                   (SELECT COUNT(*) FROM cards WHERE board_id = b.id) as card_count
            FROM boards b
            WHERE b.id = :id
        ");
        $stmt->execute([':id' => $boardId]);
        $board = $stmt->fetch();
        
        sendResponse(true, 'Tableau modifié avec succès.', $board);
        
    } catch (PDOException $e) {
        error_log("Erreur: " . $e->getMessage());
        sendResponse(false, 'Erreur lors de la modification.');
    }
}

// DELETE - Supprimer un tableau
if ($method === 'DELETE') {
    $userId = $data['user_id'] ?? $input['user_id'] ?? null;
    $boardId = $data['id'] ?? $_GET['id'] ?? null;
    
    if (!$userId || !$boardId) {
        sendResponse(false, 'user_id et id requis.');
    }
    
    try {
        // Vérifier que l'utilisateur est propriétaire
        $stmt = $pdo->prepare("SELECT user_id FROM boards WHERE id = :id");
        $stmt->execute([':id' => $boardId]);
        $board = $stmt->fetch();
        
        if (!$board) {
            sendResponse(false, 'Tableau introuvable.');
        }
        
        if ($board['user_id'] != $userId) {
            // Vérifier si admin
            $stmt = $pdo->prepare("SELECT role FROM users WHERE id = :id");
            $stmt->execute([':id' => $userId]);
            $user = $stmt->fetch();
            if (!$user || $user['role'] !== 'admin') {
                sendResponse(false, 'Vous n\'êtes pas autorisé à supprimer ce tableau.');
            }
        }
        
        // Suppression en cascade (columns, cards, board_access)
        $stmt = $pdo->prepare("DELETE FROM boards WHERE id = :id");
        $stmt->execute([':id' => $boardId]);
        
        sendResponse(true, 'Tableau supprimé avec succès.');
        
    } catch (PDOException $e) {
        error_log("Erreur: " . $e->getMessage());
        sendResponse(false, 'Erreur lors de la suppression.');
    }
}

sendResponse(false, 'Méthode non supportée.');

