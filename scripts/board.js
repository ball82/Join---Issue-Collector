
const BOARD_STATUS_ORDER = [
  "triage",
  "todo",
  "inprogress",
  "await_feedback",
  "done",
];

const STATUS_LABELS = {
  triage: "Triage",
  todo: "To do",
  inprogress: "In progress",
  await_feedback: "Review",
  done: "Done",
};

const BOARD_STATUS_LABELS = STATUS_LABELS;

let currentMoveTaskId = null;

let moveMenuElement = null;

/** Bootstraps the board: injects layout, fetches tasks, and wires up all interactions. */
async function loadScripts() {
  initLayout();
  await initBoard();
  initTaskCardEvents();
  initBoardSearch();
  initDragAndDrop();
}

/** Injects the shared header and sidebar and initialises the add-task form. */
function initLayout() {
  includeHeaderHTML();
  includeSidebarHTML();
  initPriorityButtons();
  initAddTaskForm();
}

/** Seeds tasks if the database is empty, then fetches and renders the board. */
async function initBoard() {
  await seedTasksIfEmpty();
  await fetchTasks();
  renderBoard();
}

/** Wires up the board search input with a 150 ms debounce. */
function initBoardSearch() {
  const input = document.getElementById("boardSearch");
  if (!input) return;

  let timeoutId;
  input.addEventListener("input", function () {
    clearTimeout(timeoutId);
    const query = this.value.trim().toLowerCase();
    timeoutId = setTimeout(() => {
      renderBoardFiltered(query);
    }, 150);
  });
}

/** Renders all five board columns with their current tasks. */
function renderBoard() {
  renderColumn("triage", "triage-tasks");
  renderColumn("todo", "to-do-tasks");
  renderColumn("inprogress", "in-progress-tasks");
  renderColumn("await_feedback", "await-feedback-tasks");
  renderColumn("done", "done-tasks");
  renderNoTasksIfEmpty();
}

/**
 * @param {object} task
 * @param {string} query - Lowercased search term.
 * @returns {boolean} True when the task title or description contains the query.
 */
function matchesQuery(task, query) {
  const title = String(task.title || "").toLowerCase();
  const description = String(task.description || "").toLowerCase();
  return title.includes(query) || description.includes(query);
}

/**
 * Filters tasks for a given status by search query.
 * @param {string} status
 * @param {string} query
 * @returns {object[]}
 */
function filterTasksByStatusAndQuery(status, query) {
  const list = getTasksByStatus(status);
  return list.filter((task) => matchesQuery(task, query));
}

/**
 * Renders a single column with only tasks matching the search query.
 * @param {string} status
 * @param {string} containerId
 * @param {string} query
 */
function renderFilteredStatusColumn(status, containerId, query) {
  const tasksForStatus = filterTasksByStatusAndQuery(status, query);
  renderColumnWithTasks(tasksForStatus, containerId, true);
}

/**
 * Re-renders all board columns filtered by the given query. Falls back to
 * a full render when the query is empty.
 * @param {string} query
 */
function renderBoardFiltered(query) {
  if (!query) {
    renderBoard();
    return;
  }

  renderFilteredStatusColumn("triage", "triage-tasks", query);
  renderFilteredStatusColumn("todo", "to-do-tasks", query);
  renderFilteredStatusColumn("inprogress", "in-progress-tasks", query);
  renderFilteredStatusColumn("await_feedback", "await-feedback-tasks", query);
  renderFilteredStatusColumn("done", "done-tasks", query);
  renderNoTasksIfEmpty();
}

/**
 * Returns all tasks with the given normalised status.
 * @param {string} status
 * @returns {object[]}
 */
function getTasksByStatus(status) {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return [];
  }
  return tasks.filter(
    (task) => normalizeTaskStatus(task.status) === status
  );
}

/**
 * Appends task card HTML to a container element.
 * @param {HTMLElement} container
 * @param {object[]} tasksForStatus
 */
function fillColumn(container, tasksForStatus) {
  if (!tasksForStatus.length) return;
  tasksForStatus.forEach((task) => {
    container.innerHTML += taskTemplate(task);
  });
}

/**
 * Clears a column container and fills it with the tasks for the given status.
 * @param {string} status
 * @param {string} containerId
 */
function renderColumn(status, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";
  const tasksForStatus = getTasksByStatus(status);
  fillColumn(container, tasksForStatus);
}

/**
 * Renders an arbitrary task list into a container, showing a placeholder when empty.
 * @param {object[]} tasksForStatus
 * @param {string} containerId
 * @param {boolean} isSearch - When true, uses the "no results" placeholder.
 */
function renderColumnWithTasks(tasksForStatus, containerId, isSearch) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";
  if (!tasksForStatus || !tasksForStatus.length) {
    container.innerHTML = isSearch ? noResultsTemplate() : noTaskTemplate();
    return;
  }
  fillColumn(container, tasksForStatus);
}

/** Inserts a "no tasks" placeholder into any column that has no task cards. */
function renderNoTasksIfEmpty() {
  const taskBoards = document.querySelectorAll(".task-cards");

  taskBoards.forEach((board) => {
    const hasTask = board.querySelector(".card-task");
    const placeholder = board.querySelector(".card-no-task");

    if (hasTask && placeholder) {
      placeholder.remove();
    }

    if (!hasTask && !placeholder) {
      board.innerHTML = noTaskTemplate();
    }
  });
}

/** Attaches delegated click and dragstart handlers to the tasks column wrapper. */
function initTaskCardEvents() {
  const columnsWrapper = document.querySelector(".tasks-columns");
  if (!columnsWrapper) return;

  columnsWrapper.addEventListener("click", onTaskCardClick);
  columnsWrapper.addEventListener("dragstart", (event) => {
    dragstartHandler(event);
  });
}

/** Attaches dragover, dragleave, and drop handlers to every board column. */
function initDragAndDrop() {
  const columns = document.querySelectorAll(".task-column");

  columns.forEach((column) => {
    column.addEventListener("dragover", (event) => {
      dragoverHandler(event);
    });
    column.addEventListener("dragleave", (event) => {
      dragleaveHandler(event);
    });
    column.addEventListener("drop", (event) => {
      dropHandler(event);
    });
  });
}

/**
 * Stores the dragged task id in the dataTransfer object.
 * @param {DragEvent} event
 */
function dragstartHandler(event) {
  const taskElement = event.target.closest(".card-task");
  if (!taskElement || !event.dataTransfer) return;

  const taskId = taskElement.dataset.taskId;
  if (!taskId) return;

  event.dataTransfer.setData("text/plain", taskId);
}

/**
 * Adds the drag-over highlight class to the column.
 * @param {DragEvent} event
 */
function dragoverHandler(event) {
  event.preventDefault();
  const column = event.currentTarget;
  if (column && column.classList) column.classList.add("drag-over");
}

/**
 * Removes the drag-over highlight class from the column.
 * @param {DragEvent} event
 */
function dragleaveHandler(event) {
  const column = event.currentTarget;
  if (column && column.classList) column.classList.remove("drag-over");
}

/**
 * Handles a drop event by updating the task status and re-rendering the board.
 * @param {DragEvent} event
 */
async function dropHandler(event) {
  event.preventDefault();
  const column = event.currentTarget;
  if (column && column.classList) column.classList.remove("drag-over");

  if (!event.dataTransfer) return;
  const taskId = event.dataTransfer.getData("text/plain");
  const rawStatus = column && column.dataset ? column.dataset.status : "";
  const newStatus = normalizeTaskStatus(rawStatus);
  if (!taskId || !newStatus) return;

  await updateTaskStatus(taskId, newStatus);
  renderBoard();
}

/**
 * Returns the singleton move-menu element, creating it on first call.
 * @returns {HTMLElement}
 */
function ensureMoveMenuElement() {
  if (moveMenuElement) return moveMenuElement;

  const el = document.createElement("div");
  el.className = "card-move-menu";
  el.innerHTML = `
    <div class="card-move-menu__inner">
      <p class="card-move-menu__title">Move task:</p>
      <div class="card-move-menu__options"></div>
    </div>
  `;
  document.body.appendChild(el);
  moveMenuElement = el;

  return moveMenuElement;
}

/**
 * Appends a labelled move button to a container.
 * @param {HTMLElement} container
 * @param {string} arrow - Arrow character shown on the button.
 * @param {string} label
 * @param {boolean} disabled
 * @param {Function} onClick
 */
function createMoveMenuOption(container, arrow, label, disabled, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "card-move-menu__option";
  button.disabled = disabled;
  button.innerHTML =
    '<span class="card-move-menu__arrow">' +
    arrow +
    "</span>" +
    "<span>" +
    label +
    "</span>";
  if (!disabled) {
    button.addEventListener("click", onClick);
  }
  container.appendChild(button);
}

/**
 * @param {string} taskId
 * @param {HTMLElement} menu
 * @returns {boolean} True when the same task's menu is already visible.
 */
function isSameMoveMenuOpen(taskId, menu) {
  const visible = menu.style.display === "block";
  const sameTask = String(currentMoveTaskId) === String(taskId);
  return visible && sameTask;
}

/**
 * Calculates the previous and next column for a task in the board order.
 * @param {string} taskId
 * @returns {{ previousStatus: string|null, nextStatus: string|null, labels: object }|null}
 */
function getMoveMenuState(taskId) {
  currentMoveTaskId = taskId;

  const index = tasks.findIndex((t) => String(t.id) === String(taskId));
  if (index === -1) return null;

  const task = tasks[index];
  const status = normalizeTaskStatus(task.status);
  const order = Array.isArray(BOARD_STATUS_ORDER) ? BOARD_STATUS_ORDER : [];
  const statusIndex = order.indexOf(status);
  if (statusIndex === -1) return null;

  const previousStatus = statusIndex > 0 ? order[statusIndex - 1] : null;
  const nextStatus =
    statusIndex < order.length - 1 ? order[statusIndex + 1] : null;

  const labels =
    typeof BOARD_STATUS_LABELS === "object" ? BOARD_STATUS_LABELS : {};

  return { previousStatus, nextStatus, labels };
}

/**
 * Returns the human-readable label for a move button.
 * @param {object} labels
 * @param {string|null} status
 * @param {"prev"|"next"} kind
 * @returns {string}
 */
function getMoveLabel(labels, status, kind) {
  if (!status) {
    return kind === "prev" ? "No previous column" : "No next column";
  }
  const fallback = kind === "prev" ? "previous column" : "next column";
  return "Move to " + (labels[status] || fallback);
}

/**
 * Populates the move-menu options container with prev/next buttons.
 * @param {HTMLElement} container
 * @param {{ previousStatus: string|null, nextStatus: string|null, labels: object }} state
 */
function renderMoveOptions(container, state) {
  const prevLabel = getMoveLabel(state.labels, state.previousStatus, "prev");
  const nextLabel = getMoveLabel(state.labels, state.nextStatus, "next");

  container.innerHTML = "";

  createMoveMenuOption(
    container,
    "←",
    prevLabel,
    !state.previousStatus,
    () => moveTaskToAdjacentColumn(currentMoveTaskId, "prev")
  );

  createMoveMenuOption(
    container,
    "→",
    nextLabel,
    !state.nextStatus,
    () => moveTaskToAdjacentColumn(currentMoveTaskId, "next")
  );
}

/**
 * Positions the move menu below the anchor element.
 * @param {HTMLElement} menu
 * @param {HTMLElement} anchorEl
 */
function positionMoveMenu(menu, anchorEl) {
  const rect = anchorEl.getBoundingClientRect();
  const top = rect.bottom + window.scrollY + 6;
  const left = rect.left + window.scrollX;

  menu.style.top = top + "px";
  menu.style.left = left + "px";
  menu.style.display = "block";
}

/**
 * Opens the mobile move menu for a task card (no-op on desktop ≥ 1024 px).
 * @param {string} taskId
 * @param {HTMLElement} anchorEl - The move button that was tapped.
 */
function openMoveMenu(taskId, anchorEl) {
  if (window.innerWidth >= 1024) return;

  const menu = ensureMoveMenuElement();
  const optionsContainer = menu.querySelector(".card-move-menu__options");
  if (!optionsContainer) return;

  if (isSameMoveMenuOpen(taskId, menu)) {
    closeMoveMenu();
    return;
  }

  const state = getMoveMenuState(taskId);
  if (!state) return;

  renderMoveOptions(optionsContainer, state);
  positionMoveMenu(menu, anchorEl);
}

/** Hides the move menu. */
function closeMoveMenu() {
  if (!moveMenuElement) return;
  moveMenuElement.style.display = "none";
}

/**
 * Returns the status that is one step before or after the given status in the board order.
 * @param {string[]} order
 * @param {string} status
 * @param {"prev"|"next"} direction
 * @returns {string|null}
 */
function getAdjacentStatus(order, status, direction) {
  const index = order.indexOf(status);
  if (index === -1) return null;

  const offset = direction === "prev" ? -1 : 1;
  return order[index + offset] || null;
}

/**
 * Moves a task to a specific status, closes the menu, and re-renders the board.
 * @param {string} taskId
 * @param {string} targetStatus
 */
async function moveTaskToStatus(taskId, targetStatus) {
  try {
    await updateTaskStatus(taskId, targetStatus);
    closeMoveMenu();
    renderBoard();
  } catch (error) {
    console.error("moveTaskToAdjacentColumn: failed", error);
  }
}

/**
 * Moves a task one column to the left or right in the board order.
 * @param {string} taskId
 * @param {"prev"|"next"} direction
 */
async function moveTaskToAdjacentColumn(taskId, direction) {
  const index = tasks.findIndex((t) => String(t.id) === String(taskId));
  if (index === -1) return;

  const status = normalizeTaskStatus(tasks[index].status);
  const order = Array.isArray(BOARD_STATUS_ORDER) ? BOARD_STATUS_ORDER : [];
  const targetStatus = getAdjacentStatus(order, status, direction);
  if (!targetStatus) return;

  await moveTaskToStatus(taskId, targetStatus);
}

document.addEventListener("click", (event) => {
  if (!moveMenuElement || moveMenuElement.style.display !== "block") return;

  const clickInsideMenu = moveMenuElement.contains(event.target);
  const clickOnMoveBtn = event.target.closest(".card-move-btn");

  if (!clickInsideMenu && !clickOnMoveBtn) {
    closeMoveMenu();
  }
});

window.addEventListener("scroll", closeMoveMenu);
window.addEventListener("resize", closeMoveMenu);

document.addEventListener("DOMContentLoaded", loadScripts);
