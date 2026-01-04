<?php
/**
 * Exemple de test pour créer un tableau
 * 
 * Pour tester cette API, vous pouvez utiliser curl ou Postman
 */

// Exemple avec curl (à exécuter dans un terminal):
/*
curl -X POST http://localhost/TaskManager/api/boards.php \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "name": "Mon nouveau tableau",
    "color": "blue"
  }'
*/

// Ou via JavaScript fetch:
/*
fetch('api/boards.php', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        user_id: 1,
        name: 'Mon nouveau tableau',
        color: 'blue'
    })
})
.then(response => response.json())
.then(data => {
    console.log('Tableau créé:', data);
})
.catch(error => {
    console.error('Erreur:', error);
});
*/

?>

