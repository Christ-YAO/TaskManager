# API Boards - Documentation

## Créer un tableau (POST)

### Endpoint
`POST /api/boards.php`

### Description
Crée un nouveau tableau pour un utilisateur. Crée automatiquement 4 colonnes par défaut :
- Backlog (ordre: 0)
- To Do (ordre: 1)
- In Progress (ordre: 2)
- Done (ordre: 3)

### Paramètres requis

**Body (JSON):**
```json
{
    "user_id": 1,
    "name": "Nom du tableau",
    "color": "blue"
}
```

- `user_id` (integer, requis) : ID de l'utilisateur propriétaire
- `name` (string, requis) : Nom du tableau
- `color` (string, optionnel) : Couleur du tableau. Valeurs acceptées : `blue`, `purple`, `green`, `yellow`, `red`, `pink`. Par défaut : `blue`

### Exemple de requête

```javascript
const response = await fetch('api/boards.php', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        user_id: 1,
        name: 'Mon nouveau tableau',
        color: 'blue'
    })
});

const result = await response.json();
console.log(result);
```

### Réponse (succès)

**Code HTTP:** 200

```json
{
    "success": true,
    "message": "Tableau créé avec succès.",
    "data": {
        "id": 5,
        "name": "Mon nouveau tableau",
        "color": "blue",
        "user_id": 1,
        "created_at": "2024-01-15 10:30:00",
        "updated_at": null,
        "card_count": 0
    }
}
```

### Réponse (erreur)

**Code HTTP:** 200 (avec success: false)

```json
{
    "success": false,
    "message": "user_id requis."
}
```

Ou:

```json
{
    "success": false,
    "message": "Le nom du tableau est requis."
}
```

### Erreurs possibles

- `user_id requis.` - Le paramètre user_id est manquant
- `Le nom du tableau est requis.` - Le nom est vide ou manquant
- `Erreur lors de la création.` - Erreur de base de données

### Notes

- Le tableau est automatiquement associé à l'utilisateur spécifié par `user_id`
- Les colonnes par défaut sont créées automatiquement lors de la création du tableau
- L'ID du tableau est généré automatiquement par la base de données
- Le `card_count` est initialisé à 0

