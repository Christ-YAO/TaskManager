// Kanban board logic
let currentBoardId = null;
let currentBoard = null;
let draggedCard = null;
let draggedFromColumn = null;

document.addEventListener("DOMContentLoaded", function () {
  // Check authentication
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  // Get board ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  currentBoardId = urlParams.get("id");

  if (!currentBoardId) {
    window.location.href = "dashboard.html";
    return;
  }

  // Load board
  loadBoard();

  // Setup modals
  setupModals();
});

async function loadBoard() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  if (!currentBoardId) {
    window.location.href = "dashboard.html";
    return;
  }

  try {
    // Récupérer le tableau via l'API (l'API vérifie déjà les permissions)
    console.log("Loading board with ID:", currentBoardId, "for user:", currentUser.id);
    currentBoard = await BoardsAPI.getOne(currentBoardId, currentUser.id);
    console.log("Board loaded successfully:", currentBoard);

    if (!currentBoard) {
      console.error("Board is null or undefined");
      alert("Tableau introuvable");
      window.location.href = "dashboard.html";
      return;
    }

    // Update UI immediately
    const boardTitleEl = document.getElementById("boardTitle");
    if (boardTitleEl) {
      boardTitleEl.textContent = currentBoard.name;
      console.log("Board title updated to:", currentBoard.name);
    } else {
      console.error("boardTitle element not found, retrying...");
      setTimeout(() => {
        const retryEl = document.getElementById("boardTitle");
        if (retryEl) {
          retryEl.textContent = currentBoard.name;
          console.log("Board title updated on retry");
        }
      }, 200);
    }

    // Update user info
    if (currentUser && currentUser.name) {
      const userNameEl = document.getElementById("userName");
      const userInitialEl = document.getElementById("userInitial");
      const userInitialHeaderEl = document.getElementById("userInitialHeader");
      if (userNameEl) userNameEl.textContent = currentUser.name;
      if (userInitialEl)
        userInitialEl.textContent = currentUser.name.charAt(0).toUpperCase();
      if (userInitialHeaderEl)
        userInitialHeaderEl.textContent = currentUser.name
          .charAt(0)
          .toUpperCase();
      
      // Show add collaborator button for admin or board owner
    }

    // Load columns - ensure DOM is ready
    setTimeout(() => {
      console.log("Loading columns for board:", currentBoardId);
      loadColumns();
    }, 150);
  } catch (error) {
    console.error("Erreur lors du chargement du tableau:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    // Ne pas rediriger automatiquement, laisser l'utilisateur voir l'erreur dans la console
    // Si c'est une erreur d'accès, l'API devrait retourner un message clair
    if (error.message && error.message.includes("Accès non autorisé")) {
      alert("Vous n'avez pas accès à ce tableau");
    } else if (error.message && error.message.includes("introuvable")) {
      alert("Tableau introuvable");
    } else {
      alert("Erreur lors du chargement du tableau: " + error.message);
    }
    window.location.href = "dashboard.html";
  }
}

async function loadColumns() {
  if (!currentBoardId) {
    console.error("No board ID available");
    return;
  }

  const container = document.getElementById("kanbanContainer");
  if (!container) {
    console.error("Kanban container not found");
    // Retry after a short delay if container not found
    setTimeout(() => {
      loadColumns();
    }, 100);
    return;
  }

  try {
    // Récupérer les colonnes et les cartes via l'API
    const [columns, cards] = await Promise.all([
      ColumnsAPI.getAll(currentBoardId),
      CardsAPI.getByBoard(currentBoardId)
    ]);
    
    container.innerHTML = "";

    if (!columns || columns.length === 0) {
      // Les colonnes par défaut sont normalement créées lors de la création du tableau
      // Mais si elles n'existent pas, on affiche un message
      container.innerHTML = '<div class="text-center p-8 text-muted-foreground">Aucune colonne trouvée</div>';
      console.log("No columns found for board:", currentBoardId);
      return;
    }

    console.log(`Found ${columns.length} columns and ${cards.length} cards for board ${currentBoardId}`);

    columns.forEach((column, index) => {
      console.log(`Creating column ${index + 1}:`, column.name);
      const columnElement = createColumnElement(column, cards || []);
      if (columnElement) {
        container.appendChild(columnElement);
        console.log(`Column "${column.name}" added successfully`);
      } else {
        console.error(`Failed to create column element for:`, column);
      }
    });

    console.log(`Total columns displayed: ${container.children.length}`);
  } catch (error) {
    console.error("Erreur lors du chargement des colonnes:", error);
    container.innerHTML = '<div class="text-center p-8 text-red-500">Erreur lors du chargement des colonnes</div>';
  }
}

function createDefaultColumns() {
  if (!currentBoardId) {
    console.error("No board ID available for creating default columns");
    return;
  }

  const defaultColumns = [
    { name: "Backlog", order: 0 },
    { name: "To Do", order: 1 },
    { name: "In Progress", order: 2 },
    { name: "Done", order: 3 },
  ];

  const columns = JSON.parse(localStorage.getItem("columns") || "[]");
  const baseTime = Date.now();

  defaultColumns.forEach((col, index) => {
    const newColumn = {
      id: (baseTime + index).toString(),
      boardId: currentBoardId,
      name: col.name,
      order: col.order,
    };
    columns.push(newColumn);
  });

  localStorage.setItem("columns", JSON.stringify(columns));

  // Reload columns to display them immediately
  setTimeout(() => {
    loadColumns();
  }, 50);
}

function createColumnElement(column, allCards = []) {
  if (!column || !column.id) {
    console.error("Invalid column data:", column);
    return null;
  }

  const columnDiv = document.createElement("div");
  columnDiv.className =
    "kanban-column bg-muted/30 border border-border rounded-lg p-4 min-w-[320px] max-w-[320px] flex flex-col h-full";
  columnDiv.dataset.columnId = column.id;

  // Filtrer les cartes pour cette colonne
  const cards = allCards
    .filter((c) => c.columnId == column.id)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  columnDiv.innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <div class="flex items-center space-x-2">
                <h3 class="font-semibold text-foreground">${column.name}</h3>
                <span class="text-sm text-muted-foreground bg-background px-2 py-0.5 rounded-md border border-border">${
                  cards.length
                }</span>
            </div>
            <div class="flex items-center space-x-1">
                <button class="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
                    </svg>
                </button>
                <button onclick="showAddCardModal('${
                  column.id
                }')" class="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                </button>
            </div>
        </div>
        <div class="cards-container space-y-3 flex-1 overflow-y-auto pb-2" data-column-id="${
          column.id
        }">
            ${cards.map((card) => createCardHTML(card, column.name)).join("")}
        </div>
        <button onclick="showAddCardModal('${
          column.id
        }')" class="mt-4 w-full text-muted-foreground hover:text-foreground font-medium text-sm flex items-center space-x-1 py-2.5 hover:bg-accent rounded-md transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            <span>New</span>
        </button>
    `;

  // Setup drag and drop
  const cardsContainer = columnDiv.querySelector(".cards-container");
  if (cardsContainer) {
    setupDragAndDrop(cardsContainer, columnDiv);
  } else {
    console.error("Cards container not found in column element");
  }

  return columnDiv;
}

// Helper function to get initials from first two names
function getInitials(fullName) {
  if (!fullName) return "";
  const names = fullName.trim().split(/\s+/);
  if (names.length === 0) return "";
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  // Get first letter of first name and first letter of second name
  return (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
}

function createCardHTML(card, columnName = "") {
  const priorityColors = {
    high: "bg-red-500",
    medium: "bg-yellow-500",
    low: "bg-green-500",
  };

  const priorityLabels = {
    high: "High",
    medium: "Medium",
    low: "Low",
  };

  const priority = card.priority || "low";
  const dueDate = card.dueDate ? formatDueDate(card.dueDate) : null;
  const attachments = card.attachments || 0;
  const comments = card.comments || 0;
  const assignees = card.assignees || [];

  // Check if card is in "Done" column
  const isDone = columnName && columnName.toLowerCase() === "done";
  const strikeThroughClass = isDone ? "line-through opacity-75" : "";

  return `
        <div class="kanban-card bg-background border border-border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all relative ${
          isDone ? "opacity-75" : ""
        }" 
             draggable="true" 
             data-card-id="${card.id}"
             onclick="showCardDetail('${card.id}')">
            <div class="mb-3 flex items-center justify-between">
                <span class="inline-block px-2.5 py-1 rounded text-xs font-medium text-white ${
                  priorityColors[priority]
                }">${priorityLabels[priority]}</span>
                <div class="card-menu relative">
                    <button onclick="event.stopPropagation(); showCardMenu('${card.id}', event)" class="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
                        </svg>
                    </button>
                </div>
            </div>
            <h4 class="font-semibold text-foreground mb-2 text-sm ${strikeThroughClass}">${
    card.title
  }</h4>
            ${
              card.description
                ? `<p class="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed ${strikeThroughClass}">${card.description}</p>`
                : ""
            }
            <div class="flex items-center justify-between mb-3">
                ${
                  dueDate
                    ? `<div class="flex items-center space-x-1 text-xs text-muted-foreground">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>${dueDate}</span>
                    </div>`
                    : "<div></div>"
                }
                <div class="flex items-center space-x-3">
                    ${
                      attachments > 0
                        ? `
                    <div class="flex items-center space-x-1 text-xs text-muted-foreground">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                        </svg>
                        <span>${attachments}</span>
                    </div>
                    `
                        : ""
                    }
                    ${
                      comments > 0
                        ? `
                    <div class="flex items-center space-x-1 text-xs text-muted-foreground">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                        </svg>
                        <span>${comments}</span>
                    </div>
                    `
                        : ""
                    }
                </div>
            </div>
            <div class="flex items-center justify-end">
                <div class="flex items-center space-x-1">
                    ${
                      assignees.length > 0
                        ? assignees
                            .slice(0, 3)
                            .map(
                              (assignee, idx) => `
                            <div class="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold border-2 border-background ${
                              idx > 0 ? "-ml-2" : ""
                            }" title="${assignee}">
                                ${getInitials(assignee)}
                            </div>
                        `
                            )
                            .join("")
                        : ""
                    }
                    ${
                      assignees.length > 3
                        ? `<div class="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-semibold border-2 border-background -ml-2">+${
                            assignees.length - 3
                          }</div>`
                        : ""
                    }
                </div>
            </div>
        </div>
    `;
}

function formatDueDate(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = date - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `${Math.abs(diffDays)} days overdue`;
  } else if (diffDays === 0) {
    return "Today";
  } else {
    return `${diffDays} days`;
  }
}

// Cette fonction n'est plus utilisée - les cartes sont chargées dans loadColumns()
// Conservée pour référence/compatibilité si nécessaire ailleurs
async function getCardsForColumn(columnId) {
  try {
    const cards = await CardsAPI.getByColumn(columnId);
    return cards || [];
  } catch (error) {
    console.error("Erreur lors de la récupération des cartes:", error);
    return [];
  }
}

function setupDragAndDrop(cardsContainer, columnElement) {
  // Allow drop
  columnElement.addEventListener("dragover", function (e) {
    e.preventDefault();
    this.classList.add("drag-over");
  });

  columnElement.addEventListener("dragleave", function (e) {
    this.classList.remove("drag-over");
  });

  columnElement.addEventListener("drop", function (e) {
    e.preventDefault();
    this.classList.remove("drag-over");

    if (draggedCard && draggedFromColumn) {
      moveCard(draggedCard, draggedFromColumn, this.dataset.columnId);
    }
  });

  // Card drag events
  cardsContainer.addEventListener("dragstart", function (e) {
    if (e.target.classList.contains("kanban-card")) {
      draggedCard = e.target.dataset.cardId;
      draggedFromColumn = e.target.closest(".kanban-column").dataset.columnId;
      e.target.classList.add("dragging");
    }
  });

  cardsContainer.addEventListener("dragend", function (e) {
    if (e.target.classList.contains("kanban-card")) {
      e.target.classList.remove("dragging");
      draggedCard = null;
      draggedFromColumn = null;
    }
  });
}

async function moveCard(cardId, fromColumnId, toColumnId) {
  try {
    // Si la carte est déplacée dans la même colonne, ne rien faire
    if (fromColumnId === toColumnId) {
      return;
    }

    // Calculer le nouvel ordre (mettre à la fin de la colonne pour l'instant)
    // L'API calculera automatiquement l'ordre si order n'est pas fourni
    await CardsAPI.move({
      cardId: cardId,
      columnId: toColumnId,
      order: null // L'API calculera l'ordre automatiquement (à la fin)
    });

    // Recharger les colonnes pour afficher la nouvelle position
    await loadColumns();
  } catch (error) {
    console.error("Erreur lors du déplacement de la carte:", error);
    alert("Erreur lors du déplacement de la carte: " + error.message);
    // Recharger les colonnes pour réinitialiser l'affichage en cas d'erreur
    await loadColumns();
  }
}

function setupModals() {
  // Add column modal
  const addColumnForm = document.getElementById("addColumnForm");
  if (addColumnForm) {
    addColumnForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const columnName = document.getElementById("columnName").value;
      createColumn(columnName);
    });
  }

  // Add card modal
  const addCardForm = document.getElementById("addCardForm");
  if (addCardForm) {
    addCardForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const cardTitle = document.getElementById("cardTitle").value;
      const cardDescription = document.getElementById("cardDescription").value;
      const cardPriority = document.getElementById("cardPriority").value;
      const cardDueDate = document.getElementById("cardDueDate").value;
      const cardAssignee = document.getElementById("cardAssignee").value;
      const columnId = addCardForm.dataset.columnId;
      createCard(
        cardTitle,
        cardDescription,
        columnId,
        cardPriority,
        cardDueDate,
        cardAssignee
      );
    });
  }

  // Edit card modal
  const editCardForm = document.getElementById("editCardForm");
  if (editCardForm) {
    editCardForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const cardId = editCardForm.dataset.cardId;
      const cardTitle = document.getElementById("editCardTitle").value;
      const cardDescription = document.getElementById(
        "editCardDescription"
      ).value;
      const cardPriority = document.getElementById("editCardPriority").value;
      const cardDueDate = document.getElementById("editCardDueDate").value;
      const cardAssignee = document.getElementById("editCardAssignee").value;
      updateCard(cardId, cardTitle, cardDescription, cardPriority, cardDueDate, cardAssignee);
    });
  }
}

function createColumn(name) {
  const columns = JSON.parse(localStorage.getItem("columns") || "[]");
  const boardColumns = columns.filter((c) => c.boardId === currentBoardId);
  const maxOrder =
    boardColumns.length > 0
      ? Math.max(...boardColumns.map((c) => c.order))
      : -1;

  const newColumn = {
    id: Date.now().toString(),
    boardId: currentBoardId,
    name: name,
    order: maxOrder + 1,
  };

  columns.push(newColumn);
  localStorage.setItem("columns", JSON.stringify(columns));

  hideAddColumnModal();
  loadColumns();
}

let currentColumnIdForCard = null;
let currentCardMenu = null;

function showAddCardModal(columnId) {
  currentColumnIdForCard = columnId;
  document.getElementById("addCardForm").dataset.columnId = columnId;
  document.getElementById("addCardModal").classList.remove("hidden");
  document.getElementById("addCardModal").classList.add("flex");
  document.getElementById("cardTitle").value = "";
  document.getElementById("cardDescription").value = "";
  document.getElementById("cardPriority").value = "low";
  document.getElementById("cardDueDate").value = "";
  
  // Load assignees
  loadAssignees();
}

function hideAddCardModal() {
  document.getElementById("addCardModal").classList.add("hidden");
  document.getElementById("addCardModal").classList.remove("flex");
  const assigneeSelect = document.getElementById("cardAssignee");
  if (assigneeSelect) {
    assigneeSelect.value = "";
  }
}

async function loadAssignees() {
  const assigneeSelect = document.getElementById("cardAssignee");
  if (!assigneeSelect) {
    console.error("cardAssignee select not found");
    return;
  }
  
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser) {
    console.error("No current user found");
    return;
  }
  
  if (!currentBoard) {
    console.error("Board not loaded");
    return;
  }
  
  try {
    // Récupérer le propriétaire du tableau
    const boardOwner = await UsersAPI.getOne(currentBoard.userId);
    
    // Récupérer les collaborateurs du tableau
    const collaborators = await BoardAccessAPI.getAll(currentBoardId);
    
    // Clear existing options except the first one
    assigneeSelect.innerHTML = '<option value="">Sélectionner un membre</option>';
    
    // Add board owner (créateur)
    if (boardOwner) {
      const option = document.createElement("option");
      option.value = boardOwner.email;
      const ownerLabel = boardOwner.id == currentUser.id 
        ? `${boardOwner.name} (Moi - Propriétaire)` 
        : `${boardOwner.name} (Propriétaire)`;
      option.textContent = ownerLabel;
      if (boardOwner.id == currentUser.id) {
        option.selected = true;
      }
      assigneeSelect.appendChild(option);
    }
    
    // Add collaborators
    if (collaborators && Array.isArray(collaborators)) {
      collaborators.forEach((collaborator) => {
        const option = document.createElement("option");
        option.value = collaborator.userEmail;
        const collaboratorLabel = collaborator.userEmail.toLowerCase() === currentUser.email.toLowerCase()
          ? `${collaborator.userName} (Moi)`
          : collaborator.userName;
        option.textContent = collaboratorLabel;
        assigneeSelect.appendChild(option);
      });
    }
    
    // Si l'utilisateur actuel n'est pas dans la liste (ni propriétaire ni collaborateur), l'ajouter quand même
    const currentUserInList = Array.from(assigneeSelect.options).some(
      (opt) => opt.value === currentUser.email
    );
    if (!currentUserInList) {
      const option = document.createElement("option");
      option.value = currentUser.email;
      option.textContent = `${currentUser.name} (Moi)`;
      option.selected = true;
      assigneeSelect.appendChild(option);
    }
    
    console.log(`Loaded ${assigneeSelect.options.length - 1} members for assignment`);
  } catch (error) {
    console.error("Erreur lors du chargement des assignés:", error);
    // En cas d'erreur, au moins ajouter l'utilisateur actuel
    assigneeSelect.innerHTML = '<option value="">Sélectionner un membre</option>';
    const option = document.createElement("option");
    option.value = currentUser.email;
    option.textContent = `${currentUser.name} (Moi)`;
    option.selected = true;
    assigneeSelect.appendChild(option);
  }
}

async function createCard(
  title,
  description,
  columnId,
  priority = "low",
  dueDate = null,
  assigneeEmail = null
) {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  if (!currentBoardId || !columnId || !title) {
    alert("Informations manquantes pour créer la carte");
    return;
  }

  try {
    // Créer la carte via l'API
    await CardsAPI.create({
      boardId: currentBoardId,
      columnId: columnId,
      title: title.trim(),
      description: description ? description.trim() : null,
      priority: priority,
      dueDate: dueDate || null,
      assigneeEmail: assigneeEmail || null,
      createdBy: currentUser.id,
    });

    hideAddCardModal();
    loadColumns();
  } catch (error) {
    console.error("Erreur lors de la création de la carte:", error);
    alert("Erreur lors de la création de la carte: " + error.message);
  }
}

function updateBoardCardCount() {
  const cards = JSON.parse(localStorage.getItem("cards") || "[]");
  const boardCards = cards.filter((c) => c.boardId === currentBoardId);

  const boards = JSON.parse(localStorage.getItem("boards") || "[]");
  const board = boards.find((b) => b.id === currentBoardId);
  if (board) {
    board.cardCount = boardCards.length;
    localStorage.setItem("boards", JSON.stringify(boards));
  }
}

function showAddColumnModal() {
  document.getElementById("addColumnModal").classList.remove("hidden");
  document.getElementById("addColumnModal").classList.add("flex");
  document.getElementById("columnName").value = "";
}

function hideAddColumnModal() {
  document.getElementById("addColumnModal").classList.add("hidden");
  document.getElementById("addColumnModal").classList.remove("flex");
}

function showCardDetail(cardId) {
  const cards = JSON.parse(localStorage.getItem("cards") || "[]");
  const card = cards.find((c) => c.id === cardId);

  if (!card) return;

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const isCreator = card.createdBy === currentUser.id;
  const isAdmin = currentUser.role === "admin";

  const priorityColors = {
    high: "bg-red-500",
    medium: "bg-yellow-500",
    low: "bg-green-500",
  };

  const priorityLabels = {
    high: "High",
    medium: "Medium",
    low: "Low",
  };

  document.getElementById("cardDetailTitle").textContent = card.title;

  const content = document.getElementById("cardDetailContent");
  content.innerHTML = `
        <div class="space-y-4">
            <div>
                <span class="inline-block px-3 py-1 rounded text-sm font-medium text-white ${
                  priorityColors[card.priority || "low"]
                }">${priorityLabels[card.priority || "low"]}</span>
            </div>
            <div>
                <h3 class="font-semibold text-foreground mb-2">Description</h3>
                <p class="text-muted-foreground whitespace-pre-wrap">${
                  card.description || "Aucune description"
                }</p>
            </div>
            ${
              card.dueDate
                ? `
            <div>
                <h3 class="font-semibold text-foreground mb-2">Date d'échéance</h3>
                <p class="text-muted-foreground">${formatDueDate(
                  card.dueDate
                )}</p>
            </div>
            `
                : ""
            }
            <div>
                <h3 class="font-semibold text-foreground mb-2">Assignés</h3>
                <div class="flex items-center space-x-2">
                    ${(card.assignees || [])
                      .map(
                        (assignee) => `
                        <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium" title="${assignee}">
                            ${getInitials(assignee)}
                        </div>
                    `
                      )
                      .join("")}
                </div>
            </div>
            <div class="flex items-center space-x-4 text-sm text-muted-foreground">
                <div class="flex items-center space-x-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                    </svg>
                    <span>${card.attachments || 0} pièce(s) jointe(s)</span>
                </div>
                <div class="flex items-center space-x-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                    </svg>
                    <span>${card.comments || 0} commentaire(s)</span>
                </div>
            </div>
        </div>
        <div class="flex space-x-4 pt-4 border-t border-border">
            ${
              isCreator || isAdmin
                ? `
            <button onclick="showEditCardModal('${
              card.id
            }')" class="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground h-10 px-4 py-2 font-medium hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transition-colors">
                Modifier
            </button>
            <button onclick="deleteCard('${
              card.id
            }')" class="inline-flex items-center justify-center rounded-md bg-red-600 text-white h-10 px-4 py-2 font-medium hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transition-colors">
                Supprimer
            </button>
            `
                : ""
            }
            <button onclick="hideCardDetailModal()" class="inline-flex items-center justify-center rounded-md border border-input bg-background h-10 px-4 py-2 font-medium hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transition-colors">
                Fermer
            </button>
        </div>
    `;

  document.getElementById("cardDetailModal").classList.remove("hidden");
  document.getElementById("cardDetailModal").classList.add("flex");
}

function hideCardDetailModal() {
  document.getElementById("cardDetailModal").classList.add("hidden");
  document.getElementById("cardDetailModal").classList.remove("flex");
}

async function showCardMenu(cardId, event) {
  // Close previous menu if open
  if (currentCardMenu) {
    currentCardMenu.remove();
    currentCardMenu = null;
  }

  event.stopPropagation();

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  try {
    // Récupérer toutes les cartes du board pour trouver celle-ci
    const cards = await CardsAPI.getByBoard(currentBoardId);
    const card = cards.find((c) => c.id == cardId);

    if (!card) {
      console.error("Card not found:", cardId);
      return;
    }

    // Vérifier si l'utilisateur est le créateur ou admin
    const isCreator = card.createdBy == currentUser.id;
    const isAdmin = currentUser.role === "admin";

    const menu = document.createElement("div");
    menu.className =
      "absolute right-0 top-full mt-2 w-48 bg-background border border-border rounded-lg shadow-lg z-50 py-1";
    menu.onclick = (e) => e.stopPropagation();
    menu.innerHTML = `
            ${
              isCreator || isAdmin
                ? `
            <button onclick="event.stopPropagation(); showEditCardModal('${cardId}'); return false;" class="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors flex items-center space-x-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
                <span>Modifier</span>
            </button>
            <button onclick="event.stopPropagation(); deleteCard('${cardId}'); return false;" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
                <span>Supprimer</span>
            </button>
            `
                : ""
            }
        `;

    const button = event.target.closest("button");
    const menuContainer = button.parentElement; // Le div avec class="card-menu relative"
    if (menuContainer) {
      menuContainer.appendChild(menu);
      currentCardMenu = menu;
    }

    // Close menu when clicking outside
    setTimeout(() => {
      document.addEventListener("click", function closeMenu(e) {
        if (!menu.contains(e.target) && !button.contains(e.target)) {
          menu.remove();
          currentCardMenu = null;
          document.removeEventListener("click", closeMenu);
        }
      });
    }, 0);
  } catch (error) {
    console.error("Erreur lors de la récupération de la carte:", error);
  }
}

async function deleteCard(cardId) {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  if (!confirm("Êtes-vous sûr de vouloir supprimer cette carte ?")) return;

  try {
    // Fermer le menu si ouvert
    if (currentCardMenu) {
      currentCardMenu.remove();
      currentCardMenu = null;
    }

    await CardsAPI.delete({ id: cardId });
    
    hideCardDetailModal();
    loadColumns();
  } catch (error) {
    console.error("Erreur lors de la suppression de la carte:", error);
    alert("Erreur lors de la suppression: " + error.message);
  }
}

async function showEditCardModal(cardId) {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  try {
    // Fermer le menu si ouvert
    if (currentCardMenu) {
      currentCardMenu.remove();
      currentCardMenu = null;
    }

    // Récupérer la carte depuis l'API
    const cards = await CardsAPI.getByBoard(currentBoardId);
    const card = cards.find((c) => c.id == cardId);

    if (!card) {
      alert("Carte introuvable");
      return;
    }

    // Check if current user is the creator or admin
    if (card.createdBy != currentUser.id && currentUser.role !== "admin") {
      alert("Vous n'êtes pas autorisé à modifier cette carte. Seul le créateur ou l'admin peut la modifier.");
      return;
    }

    // Store current card ID for editing
    document.getElementById("editCardForm").dataset.cardId = cardId;

    // Fill form with card data
    document.getElementById("editCardTitle").value = card.title;
    document.getElementById("editCardDescription").value = card.description || "";
    document.getElementById("editCardPriority").value = card.priority || "low";
    
    // Formater la date pour l'input date (YYYY-MM-DD)
    if (card.dueDate) {
      const date = new Date(card.dueDate);
      const formattedDate = date.toISOString().split('T')[0];
      document.getElementById("editCardDueDate").value = formattedDate;
    } else {
      document.getElementById("editCardDueDate").value = "";
    }

    // Load assignees and set current assignee
    await loadAssigneesForEdit(card.assigneeEmail || null);

    // Show edit modal
    hideCardDetailModal();
    document.getElementById("editCardModal").classList.remove("hidden");
    document.getElementById("editCardModal").classList.add("flex");
  } catch (error) {
    console.error("Erreur lors du chargement de la carte:", error);
    alert("Erreur lors du chargement de la carte: " + error.message);
  }
}

function hideEditCardModal() {
  document.getElementById("editCardModal").classList.add("hidden");
  document.getElementById("editCardModal").classList.remove("flex");
}

async function updateCard(cardId, title, description, priority, dueDate, assigneeEmail = null) {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  try {
    await CardsAPI.update({
      id: cardId,
      title: title.trim(),
      description: description ? description.trim() : null,
      priority: priority,
      dueDate: dueDate || null,
      assigneeEmail: assigneeEmail || null,
    });

    hideEditCardModal();
    loadColumns();
  } catch (error) {
    console.error("Erreur lors de la modification de la carte:", error);
    alert("Erreur lors de la modification: " + error.message);
  }
}

async function loadAssigneesForEdit(currentAssigneeEmail = null) {
  const assigneeSelect = document.getElementById("editCardAssignee");
  if (!assigneeSelect) {
    console.error("editCardAssignee select not found");
    return;
  }
  
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser) {
    console.error("No current user found");
    return;
  }
  
  if (!currentBoard) {
    console.error("Board not loaded");
    return;
  }
  
  try {
    // Récupérer le propriétaire du tableau
    const boardOwner = await UsersAPI.getOne(currentBoard.userId);
    
    // Récupérer les membres autorisés
    const boardAccess = await BoardAccessAPI.getAll(currentBoardId);
    
    // Clear existing options except the first one
    assigneeSelect.innerHTML = '<option value="">Sélectionner un membre</option>';
    
    // Add board owner
    if (boardOwner) {
      const option = document.createElement("option");
      option.value = boardOwner.email;
      const ownerLabel = boardOwner.id == currentUser.id ? `${boardOwner.name} (Moi - Propriétaire)` : `${boardOwner.name} (Propriétaire)`;
      option.textContent = ownerLabel;
      if (currentAssigneeEmail && boardOwner.email.toLowerCase() === currentAssigneeEmail.toLowerCase()) {
        option.selected = true;
      }
      assigneeSelect.appendChild(option);
    }
    
    // Add authorized members
    for (const member of boardAccess) {
      if (member.userEmail.toLowerCase() !== boardOwner.email.toLowerCase()) {
        const option = document.createElement("option");
        option.value = member.userEmail;
        const memberLabel = member.userEmail.toLowerCase() === currentUser.email.toLowerCase() ? `${member.userName} (Moi)` : member.userName;
        option.textContent = memberLabel;
        if (currentAssigneeEmail && member.userEmail.toLowerCase() === currentAssigneeEmail.toLowerCase()) {
          option.selected = true;
        }
        assigneeSelect.appendChild(option);
      }
    }
    
    // Si l'utilisateur actuel n'est pas dans la liste (ni propriétaire ni collaborateur), l'ajouter quand même
    const currentUserInList = Array.from(assigneeSelect.options).some(
      (opt) => opt.value === currentUser.email
    );
    if (!currentUserInList) {
      const option = document.createElement("option");
      option.value = currentUser.email;
      option.textContent = `${currentUser.name} (Moi)`;
      if (currentAssigneeEmail && currentUser.email.toLowerCase() === currentAssigneeEmail.toLowerCase()) {
        option.selected = true;
      }
      assigneeSelect.appendChild(option);
    }
    
    console.log(`Loaded ${assigneeSelect.options.length - 1} members for edit, current assignee: ${currentAssigneeEmail || 'none'}`);
  } catch (error) {
    console.error("Erreur lors du chargement des assignés:", error);
    // En cas d'erreur, au moins ajouter l'utilisateur actuel
    assigneeSelect.innerHTML = '<option value="">Sélectionner un membre</option>';
    const option = document.createElement("option");
    option.value = currentUser.email;
    option.textContent = `${currentUser.name} (Moi)`;
    if (currentAssigneeEmail && currentUser.email.toLowerCase() === currentAssigneeEmail.toLowerCase()) {
      option.selected = true;
    }
    assigneeSelect.appendChild(option);
  }
}

function showInviteModal() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const boards = JSON.parse(localStorage.getItem("boards") || "[]");
  const board = boards.find((b) => b.id === currentBoardId);
  
  if (!board) {
    alert("Tableau introuvable");
    return;
  }
  
  // Check if user is admin or board owner
  const isAdmin = currentUser && currentUser.role === "admin";
  const isOwner = board.userId === currentUser.id;
  
  if (!isAdmin && !isOwner) {
    alert("Vous n'êtes pas autorisé à ajouter des collaborateurs à ce tableau");
    return;
  }
  
  // Prompt for collaborator details
  const name = prompt("Nom du collaborateur :");
  if (!name || name.trim() === "") {
    return;
  }
  
  const email = prompt("Email du collaborateur :");
  if (!email || email.trim() === "") {
    return;
  }
  
  // Use the addAuthorizedEmail function from dashboard.js (need to make it global or duplicate logic)
  // For now, we'll duplicate the logic here
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert("Veuillez entrer une adresse email valide");
    return;
  }
  
  if (email.toLowerCase() === currentUser.email.toLowerCase()) {
    alert("Vous ne pouvez pas vous ajouter vous-même");
    return;
  }
  
  // Use new boardAccess structure
  let boardAccess = JSON.parse(localStorage.getItem("boardAccess") || "{}");
  
  if (!boardAccess[currentBoardId]) {
    boardAccess[currentBoardId] = [];
  }
  
  const existingMember = boardAccess[currentBoardId].find((m) => {
    const memberEmail = typeof m === "string" ? m : m.email;
    return memberEmail.toLowerCase() === email.toLowerCase();
  });
  
  if (existingMember) {
    alert("Cet email est déjà autorisé pour ce tableau");
    return;
  }
  
  boardAccess[currentBoardId].push({
    name: name.trim(),
    email: email.toLowerCase(),
    addedBy: currentUser.id,
  });
  
  localStorage.setItem("boardAccess", JSON.stringify(boardAccess));
  
  alert(`Collaborateur ${name} ajouté avec succès au tableau "${board.name}"`);
}

function showMenuModal() {
  alert("Menu à venir !");
}

function showCreateBoardModal() {
  window.location.href = "dashboard.html";
}

function logout() {
  if (confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
    localStorage.removeItem("currentUser");
    window.location.href = "login.html";
  }
}
