# Guide de Migration - localStorage vers API

Ce document explique la migration de localStorage vers les APIs pour TaskManager.

## Fonctions à modifier dans dashboard.js

1. **loadStats()** - Utiliser BoardsAPI.getAll() et CardsAPI.getByBoard()
2. **loadBoards()** - Utiliser BoardsAPI.getAll()
3. **createBoard()** - Utiliser BoardsAPI.create()
4. **updateBoard()** - Utiliser BoardsAPI.update()
5. **deleteBoard()** - Utiliser BoardsAPI.delete()
6. **loadAuthorizedEmails()** - Utiliser BoardAccessAPI.getAll() pour chaque board
7. **addAuthorizedEmail()** - Utiliser BoardAccessAPI.add()
8. **removeAuthorizedEmail()** - Utiliser BoardAccessAPI.delete()
9. **loadBoardsForSelect()** - Utiliser BoardsAPI.getAll()
10. **displayStats()** - Modifier pour utiliser les colonnes de l'API
11. **createBoardCard()** - Utiliser cardCount de l'API

## Fonctions à modifier dans kanban.js

1. **loadBoard()** - Utiliser BoardsAPI.getOne()
2. **loadColumns()** - Utiliser ColumnsAPI.getAll()
3. **createColumn()** - Utiliser ColumnsAPI.create()
4. **getCardsForColumn()** - Utiliser CardsAPI.getByColumn()
5. **createCard()** - Utiliser CardsAPI.create()
6. **updateCard()** - Utiliser CardsAPI.update()
7. **deleteCard()** - Utiliser CardsAPI.delete()
8. **moveCard()** - Utiliser CardsAPI.move()

## Notes importantes

- L'API retourne les données en snake_case (user_id, board_id, etc.)
- Le code JS utilise camelCase (userId, boardId)
- La fonction toCamelCase() dans api-config.js convertit automatiquement
- Seul `currentUser` reste dans localStorage
- Toutes les autres données viennent de l'API

