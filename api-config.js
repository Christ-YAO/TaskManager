// Configuration de l'API - Fonctions utilitaires
const API_BASE = 'api';

// Conversion snake_case (API) ↔ camelCase (JS)
function toCamelCase(obj) {
    if (Array.isArray(obj)) {
        return obj.map(toCamelCase);
    }
    if (obj && typeof obj === 'object') {
        const camelObj = {};
        for (const [key, value] of Object.entries(obj)) {
            const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
            camelObj[camelKey] = toCamelCase(value);
        }
        return camelObj;
    }
    return obj;
}

function toSnakeCase(obj) {
    if (Array.isArray(obj)) {
        return obj.map(toSnakeCase);
    }
    if (obj && typeof obj === 'object') {
        const snakeObj = {};
        for (const [key, value] of Object.entries(obj)) {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            snakeObj[snakeKey] = toSnakeCase(value);
        }
        return snakeObj;
    }
    return obj;
}

// Fonction générique pour les appels API
async function apiCall(endpoint, method = 'GET', data = null) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        throw new Error('Utilisateur non connecté');
    }

    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    // Convertir les données en snake_case pour l'API
    if (data && method !== 'GET') {
        const snakeData = toSnakeCase(data);
        // Ajouter user_id si nécessaire
        if (!snakeData.user_id && currentUser.id) {
            snakeData.user_id = currentUser.id;
        }
        options.body = JSON.stringify(snakeData);
    } else if (method === 'GET' && data) {
        // Pour GET, ajouter user_id aux paramètres
        if (!data.user_id && currentUser.id) {
            data.user_id = currentUser.id;
        }
    }

    const url = method === 'GET' && data 
        ? `${API_BASE}/${endpoint}?${new URLSearchParams(data).toString()}`
        : `${API_BASE}/${endpoint}`;

    try {
        const response = await fetch(url, options);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || 'Erreur API');
        }

        // Convertir les données de l'API en camelCase
        return toCamelCase(result.data);
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Fonctions API pour les boards
const BoardsAPI = {
    getAll: async (userId) => apiCall('boards.php', 'GET', { user_id: userId }),
    getOne: async (boardId, userId) => apiCall('boards.php', 'GET', { user_id: userId, id: boardId }),
    create: async (data) => apiCall('boards.php', 'POST', data),
    update: async (data) => apiCall('boards.php', 'PUT', data),
    delete: async (data) => apiCall('boards.php', 'DELETE', data),
};

// Fonctions API pour les columns
const ColumnsAPI = {
    getAll: async (boardId) => apiCall('columns.php', 'GET', { board_id: boardId }),
    create: async (data) => apiCall('columns.php', 'POST', data),
    update: async (data) => apiCall('columns.php', 'PUT', data),
    delete: async (data) => apiCall('columns.php', 'DELETE', data),
};

// Fonctions API pour les cards
const CardsAPI = {
    getByColumn: async (columnId) => apiCall('cards.php', 'GET', { column_id: columnId }),
    getByBoard: async (boardId) => apiCall('cards.php', 'GET', { board_id: boardId }),
    create: async (data) => apiCall('cards.php', 'POST', data),
    update: async (data) => apiCall('cards.php', 'PUT', data),
    delete: async (data) => apiCall('cards.php', 'DELETE', data),
    move: async (data) => apiCall('move_card.php', 'POST', data),
};

// Fonctions API pour board_access
const BoardAccessAPI = {
    getAll: async (boardId) => apiCall('board_access.php', 'GET', { board_id: boardId }),
    add: async (data) => apiCall('board_access.php', 'POST', data),
    delete: async (data) => apiCall('board_access.php', 'DELETE', data),
};

