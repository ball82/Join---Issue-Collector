
/**
 * Delegated click handler for the tasks column: routes to move-button or card-open logic.
 * @param {MouseEvent} event
 */
function onTaskCardClick(event) {
  if (handleMoveButtonClick(event)) return;
  handleTaskCardOpen(event);
}

/**
 * Handles a click on a card's move button; returns false when the click target
 * is not a move button so the caller can fall through.
 * @param {MouseEvent} event
 * @returns {boolean}
 */
function handleMoveButtonClick(event) {
  const moveBtn = event.target.closest(".card-move-btn");
  if (!moveBtn) return false;

  event.stopPropagation();
  event.preventDefault();

  const card = moveBtn.closest(".card-task");
  if (!card) return false;

  const taskId = card.dataset.taskId;
  if (!taskId) return false;

  openMoveMenu(taskId, moveBtn);
  return true;
}

/**
 * Opens the task detail overlay when the user clicks anywhere on a card.
 * @param {MouseEvent} event
 */
function handleTaskCardOpen(event) {
  const card = event.target.closest(".card-task");
  if (!card) return;

  const taskId = card.dataset.taskId;
  if (!taskId) return;

  openTaskCard(taskId);
}

/**
 * @returns {{ overlay: HTMLElement|null, content: HTMLElement|null }}
 */
function getOverlayElements() {
  const overlay = document.querySelector(".overlay-task-card");
  const content = document.getElementById("taskCardContent");
  return { overlay, content };
}

/**
 * Creates the backdrop element for a confirmation dialog.
 * @returns {HTMLElement}
 */
function createConfirmOverlay() {
  const overlay = document.createElement("div");
  overlay.className = "confirm-overlay confirm-overlay--open";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  return overlay;
}

/**
 * Creates the inner dialog element with Cancel and Delete buttons.
 * @param {string} message
 * @returns {HTMLElement}
 */
function createConfirmDialog(message) {
  const dialog = document.createElement("div");
  dialog.className = "confirm-dialog";
  dialog.innerHTML = `
    <h3 class="confirm-dialog__title">Confirm</h3>
    <p class="confirm-dialog__message">
      ${message || "Are you sure?"}
    </p>
    <div class="confirm-dialog__actions">
      <button type="button" class="confirm-dialog__button confirm-dialog__button--cancel">
        Cancel
      </button>
      <button type="button" class="confirm-dialog__button confirm-dialog__button--confirm">
        Delete
      </button>
    </div>
  `;
  return dialog;
}

/**
 * Moves focus to the Cancel button for accessible keyboard navigation.
 * @param {HTMLElement} dialog
 */
function focusCancelButton(dialog) {
  const cancelBtn = dialog.querySelector(".confirm-dialog__button--cancel");
  if (cancelBtn) cancelBtn.focus();
}

/**
 * Attaches an Escape key listener that calls cleanup(false).
 * @param {Function} cleanup - Called with the boolean result.
 */
function attachConfirmKeydown(cleanup) {
  const handler = (event) => {
    if (event.key === "Escape") {
      document.removeEventListener("keydown", handler);
      cleanup(false);
    }
  };
  document.addEventListener("keydown", handler);
}

/**
 * Wires up Cancel, Confirm, backdrop-click, and Escape key events.
 * @param {HTMLElement} overlay
 * @param {HTMLElement} dialog
 * @param {Function} resolve - Promise resolve callback.
 */
function setupConfirmEvents(overlay, dialog, resolve) {
  const cancelBtn = dialog.querySelector(".confirm-dialog__button--cancel");
  const confirmBtn = dialog.querySelector(".confirm-dialog__button--confirm");

  const cleanup = (result) => {
    overlay.remove();
    resolve(result);
  };

  cancelBtn.addEventListener("click", () => cleanup(false));
  confirmBtn.addEventListener("click", () => cleanup(true));

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) cleanup(false);
  });

  attachConfirmKeydown(cleanup);
}

/**
 * Shows a modal confirmation dialog and resolves to true (confirmed) or false (cancelled).
 * @param {string} message
 * @returns {Promise<boolean>}
 */
function showConfirmPopup(message) {
  return new Promise((resolve) => {
    const overlay = createConfirmOverlay();
    const dialog = createConfirmDialog(message);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    focusCancelButton(dialog);
    setupConfirmEvents(overlay, dialog, resolve);
  });
}

/**
 * Renders and displays the read-only task detail overlay.
 * @param {string} taskId
 */
function openTaskCard(taskId) {
  const { overlay, content } = getOverlayElements();
  if (!overlay || !content) return;

  const task = tasks.find((t) => String(t.id) === String(taskId));
  if (!task) return;

  content.innerHTML = taskCardContentTemplate(task);
  overlay.style.display = "flex";
  overlay.classList.add("overlay-task-card--open");
  document.body.style.overflow = "hidden";
  closeMoveMenu();
}

/** Hides the task detail overlay and clears its content. */
function closeTaskCard() {
  const { overlay, content } = getOverlayElements();
  if (!overlay) return;

  overlay.style.display = "none";
  overlay.classList.remove("overlay-task-card--open");
  document.body.style.overflow = "";

  if (content) {
    content.innerHTML = "";
  }

  closeMoveMenu();
}

document.addEventListener("click", (event) => {
  const { overlay } = getOverlayElements();
  if (!overlay) return;
  if (event.target === overlay) closeTaskCard();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeTaskCard();
    closeMoveMenu();
  }
});

/**
 * Switches the overlay content to the task edit form.
 * @param {string} taskId
 */
function onTaskEditClick(taskId) {
  const { overlay, content } = getOverlayElements();
  if (!overlay || !content) return;

  const task = tasks.find((t) => String(t.id) === String(taskId));
  if (!task) return;

  content.innerHTML = taskCardEditTemplate(task);
  removeMinDate();
  initEditAssignedSection(task, content);
}

/**
 * Initialises the assignee dropdown inside the edit overlay after a short tick.
 * @param {object} task
 * @param {HTMLElement} content
 */
function initEditAssignedSection(task, content) {
  setTimeout(() => {
    try {
      updateSelectedAssignees(task);
      initAssignedToInEdit(content);
      hideAssignedDropdown(content);
    } catch (error) {
      console.error("onTaskEditClick: initAssignedTo failed", error);
    }
  }, 0);
}

/**
 * Syncs the `selectedAssignees` array with the task's current assignees.
 * @param {object} task
 */
function updateSelectedAssignees(task) {
  if (!Array.isArray(task.assignedTo)) return;
  if (typeof selectedAssignees === "undefined") return;

  const ids = task.assignedTo
    .map((entry) => normalizeAssigneeId(entry))
    .filter(Boolean);

  selectedAssignees = ids;
}

/**
 * Resolves an assignee entry (string name, id string, or object) to a contact id.
 * @param {string|object|null} entry
 * @returns {string|null}
 */
function normalizeAssigneeId(entry) {
  if (!entry) return null;

  if (typeof entry === "string") {
    const contact = contacts.find((c) => c.name === entry || c.id === entry);
    return contact ? contact.id : null;
  }

  if (typeof entry === "object") {
    if (entry.id) return entry.id;
    const contact = contacts.find((c) => c.name === entry.name);
    return contact ? contact.id : null;
  }

  return null;
}

/**
 * Calls the scoped or global assignedTo initialiser depending on what is available.
 * @param {HTMLElement} content
 */
function initAssignedToInEdit(content) {
  if (typeof initAssignedToScoped === "function") {
    initAssignedToScoped(content);
    return;
  }
  if (typeof initAssignedTo === "function") {
    initAssignedTo();
  }
}

/**
 * Hides the assignee dropdown inside the edit overlay.
 * @param {HTMLElement} content
 */
function hideAssignedDropdown(content) {
  const dropdown = content.querySelector(".assigned-to-dropdown");
  if (dropdown) dropdown.style.display = "none";
}

/**
 * Discards edits and reverts the overlay to the read-only detail view.
 * @param {string} taskId
 */
function onTaskEditCancel(taskId) {
  openTaskCard(taskId);
}

/**
 * Extracts and trims the editable fields from the edit form's FormData.
 * @param {FormData} formData
 * @returns {{ title: string, description: string, dueDate: string, priorityRaw: string }}
 */
function buildTaskUpdatePayload(formData) {
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const dueDate = String(formData.get("dueDate") || "").trim();
  const priorityRaw = String(formData.get("priority") || "Medium").trim();
  return { title, description, dueDate, priorityRaw };
}

/**
 * @param {{ title: string }} payload
 * @returns {boolean} False and shows an alert when the title is empty.
 */
function isEditPayloadValid(payload) {
  if (!payload.title) {
    alert("Title is required.");
    return false;
  }
  return true;
}

/**
 * @param {string} taskId
 * @returns {number} Index of the task in the module-level `tasks` array, or -1.
 */
function findTaskIndexById(taskId) {
  return tasks.findIndex((task) => String(task.id) === String(taskId));
}

/**
 * Merges the edit payload into the existing task object.
 * @param {object} oldTask
 * @param {{ title: string, description: string, dueDate: string, priorityRaw: string }} payload
 * @returns {object} Updated task object.
 */
function createUpdatedTask(oldTask, payload) {
  const assignedTo =
    typeof getAssignedTo === "function"
      ? getAssignedTo()
      : oldTask.assignedTo;

  return {
    ...oldTask,
    title: payload.title,
    description: payload.description,
    dueDate: payload.dueDate,
    priority: normalizePriority(payload.priorityRaw),
    assignedTo,
  };
}

/**
 * Saves the updated task to Firebase, updates the local array, and re-opens the detail view.
 * @param {object} updatedTask
 * @param {number} index - Index in the tasks array.
 * @param {string} taskId
 */
async function persistEditedTask(updatedTask, index, taskId) {
  try {
    await saveTask(updatedTask);
    tasks[index] = updatedTask;
    renderBoard();
    openTaskCard(taskId);
  } catch (error) {
    console.error("onTaskEditSave: error saving task", error);
    alert("Error while saving the task.");
  }
}

/**
 * Form submit handler for the task edit overlay.
 * @param {SubmitEvent} event
 * @param {string} taskId
 */
async function onTaskEditSave(event, taskId) {
  event.preventDefault();

  const form = event.target;
  if (!form) return;

  const formData = new FormData(form);
  const payload = buildTaskUpdatePayload(formData);
  if (!isEditPayloadValid(payload)) return;

  const index = findTaskIndexById(taskId);
  if (index === -1) return;

  const updatedTask = createUpdatedTask(tasks[index], payload);
  await persistEditedTask(updatedTask, index, taskId);
}

/**
 * Toggles the active state of the clicked priority button inside the edit form.
 * @param {MouseEvent} event
 */
function onEditPriorityClick(event) {
  const button = event.currentTarget;
  const wrapper = button.closest(".priority-buttons");
  if (!wrapper) return;

  const buttons = wrapper.querySelectorAll(".priority-buttons__button");
  buttons.forEach((btn) => btn.classList.remove("is-active"));

  button.classList.add("is-active");

  const hidden = wrapper.querySelector('input[name="priority"]');
  if (hidden) hidden.value = button.dataset.priority || "Medium";
}

/**
 * Shows a confirmation dialog before deleting a task from the overlay.
 * @param {string} taskId
 */
async function onOverlayDeleteClick(taskId) {
  const confirmed = await showConfirmPopup(
    "Do you really want to delete this task?"
  );
  if (!confirmed) return;

  await deleteTask(taskId);
}

/**
 * Deletes a task from Firebase and the local array, then closes the overlay.
 * @param {string} taskId
 */
async function deleteTask(taskId) {
  try {
    await deleteTaskById(taskId);

    tasks = tasks.filter(
      (task) =>
        String(task.id) !== String(taskId) &&
        String(task.firebaseId) !== String(taskId)
    );

    closeTaskCard();
    renderBoard();
  } catch (error) {
    console.error("onOverlayDeleteClick: error deleting task", error);
    alert("Error while deleting the task.");
  }
}

/**
 * @param {object} task
 * @returns {object[]} A shallow copy of the task's subtasks array.
 */
function getClonedSubtasks(task) {
  return Array.isArray(task.subtasks) ? [...task.subtasks] : [];
}

/**
 * Returns a new subtask object with its done/checked state updated.
 * @param {object} subtask
 * @param {boolean} checked
 * @returns {object}
 */
function createUpdatedSubtask(subtask, checked) {
  const done = !!checked;
  return { ...subtask, done, checked: done };
}

/**
 * Saves the updated task to Firebase and refreshes the board.
 * @param {object} updatedTask
 * @param {number} index - Index in the tasks array.
 */
async function persistSubtaskUpdate(updatedTask, index) {
  try {
    await saveTask(updatedTask);
    tasks[index] = updatedTask;
    renderBoard();
  } catch (error) {
    console.error("onSubtaskToggle: error saving subtask state", error);
  }
}

/**
 * Toggles the done state of a subtask and persists the change.
 * @param {string} taskId
 * @param {number} index - Subtask index within the task.
 * @param {boolean} checked
 */
async function onSubtaskToggle(taskId, index, checked) {
  const taskIndex = findTaskIndexById(taskId);
  if (taskIndex === -1) return;

  const task = tasks[taskIndex];
  const subtasks = getClonedSubtasks(task);
  if (!subtasks[index]) return;

  subtasks[index] = createUpdatedSubtask(subtasks[index], checked);
  const updatedTask = { ...task, subtasks };

  await persistSubtaskUpdate(updatedTask, taskIndex);
}
