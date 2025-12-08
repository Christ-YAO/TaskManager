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

function loadBoard() {
  const boards = JSON.parse(localStorage.getItem("boards") || "[]");
  currentBoard = boards.find((b) => b.id === currentBoardId);

  if (!currentBoard) {
    window.location.href = "dashboard.html";
    return;
  }

  // Check if user has access to this board
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  // User always has access to their own boards
  if (currentBoard.userId === currentUser.id) {
    // User owns this board, allow access
  } else {
    // Check if user is authorized to access this board
    const authorizedEmails = JSON.parse(
      localStorage.getItem("authorizedEmails") || "{}"
    );
    const authorizedList = authorizedEmails[currentBoard.userId] || [];

    // Handle both old format (array of strings) and new format (array of objects)
    const hasAccess = authorizedList.some((member) => {
      const memberEmail = typeof member === "string" ? member : member.email;
      return memberEmail.toLowerCase() === currentUser.email.toLowerCase();
    });

    if (!hasAccess) {
      // User not authorized, redirect to own dashboard
      alert("Vous n'avez pas accès à ce tableau");
      window.location.href = "dashboard.html";
      return;
    }
  }

  // Initialize createdBy for cards without it (legacy cards)
  const cards = JSON.parse(localStorage.getItem("cards") || "[]");
  let cardsUpdated = false;
  const updatedCards = cards.map(card => {
    if (!card.createdBy && card.boardId === currentBoardId) {
      cardsUpdated = true;
      return { ...card, createdBy: currentBoard.userId };
    }
    return card;
  });
  if (cardsUpdated) {
    localStorage.setItem("cards", JSON.stringify(updatedCards));
    console.log("Initialized createdBy for legacy cards");
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
  }

  // Load columns - ensure DOM is ready
  setTimeout(() => {
    console.log("Loading columns for board:", currentBoardId);
    loadColumns();
  }, 150);
}

function loadColumns() {
  if (!currentBoardId) {
    console.error("No board ID available");
    return;
  }

  const columns = JSON.parse(localStorage.getItem("columns") || "[]");
  const boardColumns = columns
    .filter((c) => c.boardId === currentBoardId)
    .sort((a, b) => a.order - b.order);

  const container = document.getElementById("kanbanContainer");
  if (!container) {
    console.error("Kanban container not found");
    // Retry after a short delay if container not found
    setTimeout(() => {
      loadColumns();
    }, 100);
    return;
  }

  container.innerHTML = "";

  if (boardColumns.length === 0) {
    // Create default columns
    createDefaultColumns();
    return;
  }

  console.log(
    `Found ${boardColumns.length} columns for board ${currentBoardId}`
  );

  boardColumns.forEach((column, index) => {
    console.log(`Creating column ${index + 1}:`, column.name);
    const columnElement = createColumnElement(column);
    if (columnElement) {
      container.appendChild(columnElement);
      console.log(`Column "${column.name}" added successfully`);
    } else {
      console.error(`Failed to create column element for:`, column);
    }
  });

  console.log(`Total columns displayed: ${container.children.length}`);
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

function createColumnElement(column) {
  if (!column || !column.id) {
    console.error("Invalid column data:", column);
    return null;
  }

  const columnDiv = document.createElement("div");
  columnDiv.className =
    "kanban-column bg-muted/30 border border-border rounded-lg p-4 min-w-[320px] max-w-[320px] flex flex-col h-full";
  columnDiv.dataset.columnId = column.id;

  const cards = getCardsForColumn(column.id);

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
            ${cards.map((card) => createCardHTML(card)).join("")}
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

function createCardHTML(card) {
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
  const columns = JSON.parse(localStorage.getItem("columns") || "[]");
  const cardColumn = columns.find((c) => c.id === card.columnId);
  const isDone = cardColumn && cardColumn.name.toLowerCase() === "done";
  const strikeThroughClass = isDone ? "line-through opacity-75" : "";

  return `
        <div class="kanban-card bg-background border border-border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all ${
          isDone ? "opacity-75" : ""
        }" 
             draggable="true" 
             data-card-id="${card.id}"
             onclick="showCardDetail('${card.id}')">
            <div class="mb-3">
                <span class="inline-block px-2.5 py-1 rounded text-xs font-medium text-white ${
                  priorityColors[priority]
                }">${priorityLabels[priority]}</span>
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
                    <button onclick="event.stopPropagation();" class="w-6 h-6 rounded-full bg-muted hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground text-xs font-semibold border-2 border-background -ml-2 transition-colors">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                        </svg>
                    </button>
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

function getCardsForColumn(columnId) {
  const cards = JSON.parse(localStorage.getItem("cards") || "[]");
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const boards = JSON.parse(localStorage.getItem("boards") || "[]");
  const board = boards.find((b) => b.id === currentBoardId);
  
  if (!board || !currentUser) {
    return cards
      .filter((c) => c.columnId === columnId)
      .sort((a, b) => a.order - b.order);
  }
  
  // If user is the board owner, show all cards
  if (board.userId === currentUser.id) {
    return cards
      .filter((c) => c.columnId === columnId)
      .sort((a, b) => a.order - b.order);
  }
  
  // If user is an authorized member, filter cards by who added them
  const authorizedEmails = JSON.parse(localStorage.getItem("authorizedEmails") || "{}");
  
  // Check if user is authorized to access this board
  const authorizedMembers = authorizedEmails[board.userId] || [];
  const isAuthorized = authorizedMembers.some(member => {
    const memberEmail = typeof member === "string" ? member : member.email;
    return memberEmail.toLowerCase() === currentUser.email.toLowerCase();
  });
  
  if (!isAuthorized) {
    // User is not authorized, return empty array
    return [];
  }
  
  // Find who added the current user
  let addedByUserId = null;
  for (const member of authorizedMembers) {
    const memberEmail = typeof member === "string" ? member : member.email;
    if (memberEmail.toLowerCase() === currentUser.email.toLowerCase()) {
      addedByUserId = typeof member === "object" ? member.addedBy : null;
      break;
    }
  }
  
  // If addedBy is not set (legacy member or added by owner), show cards created by board owner
  // If addedBy is set, show cards created by that person OR by the current member
  const targetCreatorId = addedByUserId || board.userId;
  
  // Filter cards created by the target creator OR by the current member
  return cards
    .filter((c) => {
      if (c.columnId !== columnId) return false;
      // If card doesn't have createdBy (legacy), assume it was created by board owner
      const cardCreator = c.createdBy || board.userId;
      // Show cards created by the target creator (person who added member or board owner)
      // OR cards created by the current member themselves
      return cardCreator === targetCreatorId || c.createdBy === currentUser.id;
    })
    .sort((a, b) => a.order - b.order);
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

function moveCard(cardId, fromColumnId, toColumnId) {
  const cards = JSON.parse(localStorage.getItem("cards") || "[]");
  const card = cards.find((c) => c.id === cardId);

  if (card) {
    card.columnId = toColumnId;
    card.order = Date.now(); // Simple ordering
    localStorage.setItem("cards", JSON.stringify(cards));
    loadColumns();
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

function loadAssignees() {
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
  
  const boards = JSON.parse(localStorage.getItem("boards") || "[]");
  const board = boards.find((b) => b.id === currentBoardId);
  
  if (!board) {
    console.error("Board not found");
    return;
  }
  
  // Get board owner
  const users = JSON.parse(localStorage.getItem("users") || "[]");
  const boardOwner = users.find((u) => u.id === board.userId);
  
  // Get authorized members
  const authorizedEmails = JSON.parse(localStorage.getItem("authorizedEmails") || "{}");
  const authorizedMembers = authorizedEmails[board.userId] || [];
  
  // Clear existing options except the first one
  assigneeSelect.innerHTML = '<option value="">Sélectionner un membre</option>';
  
  // Add board owner
  if (boardOwner) {
    const option = document.createElement("option");
    option.value = boardOwner.email;
    const ownerLabel = boardOwner.id === currentUser.id ? `${boardOwner.name} (Moi - Propriétaire)` : `${boardOwner.name} (Propriétaire)`;
    option.textContent = ownerLabel;
    if (boardOwner.id === currentUser.id) {
      option.selected = true;
    }
    assigneeSelect.appendChild(option);
  }
  
  // Add authorized members
  authorizedMembers.forEach((member) => {
    const memberEmail = typeof member === "string" ? member : member.email;
    const memberName = typeof member === "string" ? member.split("@")[0] : member.name;
    const memberUser = users.find((u) => u.email.toLowerCase() === memberEmail.toLowerCase());
    
    if (memberUser && memberUser.id !== board.userId) {
      // Don't add owner again if already added
      const option = document.createElement("option");
      option.value = memberUser.email;
      const memberLabel = memberUser.id === currentUser.id ? `${memberName} (Moi)` : memberName;
      option.textContent = memberLabel;
      if (memberUser.id === currentUser.id && !boardOwner) {
        option.selected = true;
      }
      assigneeSelect.appendChild(option);
    }
  });
  
  // If current user is not in the list, add them
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
}

function createCard(
  title,
  description,
  columnId,
  priority = "low",
  dueDate = null,
  assigneeEmail = null
) {
  const cards = JSON.parse(localStorage.getItem("cards") || "[]");
  const columnCards = cards.filter((c) => c.columnId === columnId);
  const maxOrder =
    columnCards.length > 0 ? Math.max(...columnCards.map((c) => c.order)) : -1;

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const users = JSON.parse(localStorage.getItem("users") || "[]");
  
  // Get assignee name
  let assigneeName = currentUser ? currentUser.name : "";
  if (assigneeEmail) {
    const assigneeUser = users.find((u) => u.email.toLowerCase() === assigneeEmail.toLowerCase());
    if (assigneeUser) {
      assigneeName = assigneeUser.name;
    }
  }

  const newCard = {
    id: Date.now().toString(),
    boardId: currentBoardId,
    columnId: columnId,
    title: title,
    description: description,
    priority: priority,
    dueDate: dueDate || null,
    attachments: 0,
    comments: 0,
    assignees: assigneeName ? [assigneeName] : [],
    assigneeEmail: assigneeEmail || null,
    createdBy: currentUser.id, // Track who created the card
    order: maxOrder + 1,
    createdAt: new Date().toISOString(),
  };

  cards.push(newCard);
  localStorage.setItem("cards", JSON.stringify(cards));

  // Update board card count
  updateBoardCardCount();

  hideAddCardModal();
  loadColumns();
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

function deleteCard(cardId) {
  if (!confirm("Êtes-vous sûr de vouloir supprimer cette carte ?")) return;

  const cards = JSON.parse(localStorage.getItem("cards") || "[]");
  const filteredCards = cards.filter((c) => c.id !== cardId);
  localStorage.setItem("cards", JSON.stringify(filteredCards));

  updateBoardCardCount();
  hideCardDetailModal();
  loadColumns();
}

function showEditCardModal(cardId) {
  const cards = JSON.parse(localStorage.getItem("cards") || "[]");
  const card = cards.find((c) => c.id === cardId);

  if (!card) return;

  // Store current card ID for editing
  document.getElementById("editCardForm").dataset.cardId = cardId;

  // Fill form with card data
  document.getElementById("editCardTitle").value = card.title;
  document.getElementById("editCardDescription").value = card.description || "";
  document.getElementById("editCardPriority").value = card.priority || "low";
  document.getElementById("editCardDueDate").value = card.dueDate || "";

  // Load assignees and set current assignee
  loadAssigneesForEdit(card.assigneeEmail || null);

  // Show edit modal
  hideCardDetailModal();
  document.getElementById("editCardModal").classList.remove("hidden");
  document.getElementById("editCardModal").classList.add("flex");
}

function hideEditCardModal() {
  document.getElementById("editCardModal").classList.add("hidden");
  document.getElementById("editCardModal").classList.remove("flex");
}

function updateCard(cardId, title, description, priority, dueDate, assigneeEmail = null) {
  const cards = JSON.parse(localStorage.getItem("cards") || "[]");
  const card = cards.find((c) => c.id === cardId);

  if (!card) return;

  const users = JSON.parse(localStorage.getItem("users") || "[]");
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  
  // Get assignee name
  let assigneeName = "";
  if (assigneeEmail) {
    const assigneeUser = users.find((u) => u.email.toLowerCase() === assigneeEmail.toLowerCase());
    if (assigneeUser) {
      assigneeName = assigneeUser.name;
    }
  }

  // Update card properties
  card.title = title;
  card.description = description;
  card.priority = priority;
  card.dueDate = dueDate || null;
  card.assignees = assigneeName ? [assigneeName] : [];
  card.assigneeEmail = assigneeEmail || null;
  
  // Preserve createdBy if it exists, otherwise set it to current user
  if (!card.createdBy && currentUser) {
    card.createdBy = currentUser.id;
  }

  localStorage.setItem("cards", JSON.stringify(cards));
  hideEditCardModal();
  loadColumns();
}

function loadAssigneesForEdit(currentAssigneeEmail = null) {
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
  
  const boards = JSON.parse(localStorage.getItem("boards") || "[]");
  const board = boards.find((b) => b.id === currentBoardId);
  
  if (!board) {
    console.error("Board not found");
    return;
  }
  
  // Get board owner
  const users = JSON.parse(localStorage.getItem("users") || "[]");
  const boardOwner = users.find((u) => u.id === board.userId);
  
  // Get authorized members
  const authorizedEmails = JSON.parse(localStorage.getItem("authorizedEmails") || "{}");
  const authorizedMembers = authorizedEmails[board.userId] || [];
  
  // Clear existing options except the first one
  assigneeSelect.innerHTML = '<option value="">Sélectionner un membre</option>';
  
  // Add board owner
  if (boardOwner) {
    const option = document.createElement("option");
    option.value = boardOwner.email;
    const ownerLabel = boardOwner.id === currentUser.id ? `${boardOwner.name} (Moi - Propriétaire)` : `${boardOwner.name} (Propriétaire)`;
    option.textContent = ownerLabel;
    if (currentAssigneeEmail && boardOwner.email.toLowerCase() === currentAssigneeEmail.toLowerCase()) {
      option.selected = true;
    }
    assigneeSelect.appendChild(option);
  }
  
  // Add authorized members
  authorizedMembers.forEach((member) => {
    const memberEmail = typeof member === "string" ? member : member.email;
    const memberName = typeof member === "string" ? member.split("@")[0] : member.name;
    const memberUser = users.find((u) => u.email.toLowerCase() === memberEmail.toLowerCase());
    
    if (memberUser && memberUser.id !== board.userId) {
      // Don't add owner again if already added
      const option = document.createElement("option");
      option.value = memberUser.email;
      const memberLabel = memberUser.id === currentUser.id ? `${memberName} (Moi)` : memberName;
      option.textContent = memberLabel;
      if (currentAssigneeEmail && memberUser.email.toLowerCase() === currentAssigneeEmail.toLowerCase()) {
        option.selected = true;
      }
      assigneeSelect.appendChild(option);
    }
  });
  
  // If current user is not in the list, add them
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
  
  // If no assignee selected and no currentAssigneeEmail, select current user
  if (!currentAssigneeEmail && assigneeSelect.selectedIndex === 0) {
    const currentUserOption = Array.from(assigneeSelect.options).find(
      (opt) => opt.value === currentUser.email
    );
    if (currentUserOption) {
      currentUserOption.selected = true;
    }
  }
  
  console.log(`Loaded ${assigneeSelect.options.length - 1} members for edit, current assignee: ${currentAssigneeEmail || 'none'}`);
}

function showInviteModal() {
  alert("Fonctionnalité d'invitation à venir !");
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
