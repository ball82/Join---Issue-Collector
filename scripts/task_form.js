
/** Opens the add-task overlay modal. */
function addTaskBtn() {
  const overlay = document.querySelector(".overlay-modal");
  if (!overlay) return;
  overlay.style.display = "flex";
}

/** Closes the add-task overlay modal. */
function closeAddTaskBtn() {
  const overlay = document.querySelector(".overlay-modal");
  if (!overlay) return;
  overlay.style.display = "none";
}

/** Wires up the task form submit/clear handlers and sub-module initialisers. */
function initAddTaskForm() {
  const form = document.getElementById("taskForm");
  if (!form) return;

  form.addEventListener("submit", handleCreateTask);

  const clearBtn = document.getElementById("clearBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", handleClearTaskForm);
  }

  initSubtaskControls();
  initAssignedTo();
  setMinDate();
}

/**
 * Submit handler for the task form; reads and submits the form data.
 * @param {SubmitEvent|null} [event]
 */
async function handleCreateTask(event) {
  if (event) event.preventDefault();
  const taskData = readTaskForm();
  if (!taskData) return;
  await submitTask(taskData);
}

/**
 * Calls addTask and handles post-save behaviour.
 * @param {object} data
 */
async function submitTask(data) {
  try {
    await addTask(data);
    afterTaskSaved();
  } catch (error) {
    handleCreateTaskError(error);
  }
}

/** @returns {boolean} True when the current URL is the standalone add_task.html page. */
function isOnAddTaskPage() {
  return window.location.pathname.includes("add_task.html");
}

/** Resets the form and redirects to board.html (or closes the overlay if on the board). */
function afterTaskSaved() {
  showSuccessMessage();
  resetTaskForm();
  if (isOnAddTaskPage()) {
    setTimeout(() => { window.location.href = "board.html"; }, 1500);
  } else {
    if (typeof renderBoard === "function") renderBoard();
    setTimeout(() => closeAddTaskBtn(), 1500);
  }
}

/**
 * Logs the error and shows a user-visible alert.
 * @param {Error} error
 */
function handleCreateTaskError(error) {
  console.error("handleCreateTask:", error);
  alert("Task could not be created (see console).");
}

/**
 * Reads and validates the task form; returns the task payload or null on validation failure.
 * @returns {object|null}
 */
function readTaskForm() {
  clearFormErrors();

  const title = getInputValue("title");
  const description = getInputValue("description");
  const dueDate = getInputValue("dueDate");
  const category = getInputValue("category");
  const assignedTo = getAssignedTo();

  if (!validateTaskForm(title, dueDate, category)) {
    return null;
  }

  return buildTaskData(title, description, dueDate, category, assignedTo);
}

/**
 * Assembles the full task payload from individual field values.
 * @param {string} title
 * @param {string} description
 * @param {string} dueDate
 * @param {string} category
 * @param {object[]} assignedTo
 * @returns {object}
 */
function buildTaskData(title, description, dueDate, category, assignedTo) {
  const subtasks = getSubtaskDrafts();

  return {
    title,
    description,
    dueDate,
    category,
    assignedTo,
    priority: getSelectedPriority(),
    subtasks,
    status: "triage",
    creator: getCurrentUserAsCreator(),
  };
}

/**
 * Reads the logged-in user from localStorage and returns a creator object.
 * Falls back to a Guest/internal creator if no user is found.
 * @returns {{ name: string, email: string, type: 'internal' }}
 */
function getCurrentUserAsCreator() {
  try {
    const raw = localStorage.getItem("loggedInUser");
    if (!raw) {
      return { name: "Guest", email: "", type: "internal" };
    }
    const user = JSON.parse(raw);
    return {
      name: user.name || "Guest",
      email: user.email || "",
      type: "internal",
    };
  } catch (_error) {
    return { name: "Guest", email: "", type: "internal" };
  }
}

/** Resets the task form, priority buttons, assignees, subtasks, and success message. */
function resetTaskForm() {
  const form = document.getElementById("taskForm");
  if (form) form.reset();

  resetPriorityButtons();
  clearFormErrors();
  resetAssignedTo();
  resetSubtasks();

  const messageElement = document.getElementById("successMessage");
  if (messageElement) {
    messageElement.style.display = "none";
  }
}

/**
 * Clear handler for the form's clear button.
 * @param {MouseEvent|null} [event]
 */
function handleClearTaskForm(event) {
  if (event) event.preventDefault();
  resetTaskForm();
}

/** Shows a success notification after a task is created. */
function showSuccessMessage() {
  const canNotify =
    typeof window.createNotification === "function";

  if (canNotify) {
    window.createNotification({
      type: "success",
      text: "Task created successfully!",
      duration: 1800,
    });
    return;
  }

  const messageElement = document.getElementById("successMessage");
  if (!messageElement) return;

  messageElement.style.display = "flex";

  setTimeout(() => {
    messageElement.style.display = "none";
  }, 2000);
}

/** Sets today as the minimum selectable date on the due-date input. */
function setMinDate() {
  const dueDate = document.getElementById("dueDate");
  if (!dueDate) return;

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  const minDate = `${year}-${month}-${day}`;
  dueDate.min = minDate;
}

/** Removes the min attribute from the due-date input (used in the edit overlay). */
function removeMinDate() {
  const dueDate = document.getElementById("dueDate");
  if (!dueDate) return;
  dueDate.removeAttribute("min");
}

/** @returns {HTMLElement|null} The notification container element. */
function getNotificationContainer() {
  return document.getElementById("notificationContainer");
}

/**
 * Returns the inner HTML for a toast notification.
 * @param {string} type
 * @param {string} text
 * @returns {string}
 */
function buildNotificationTemplate(type, text) {
  const safeText =
    typeof escapeHtml === "function"
      ? escapeHtml(text || "Task created successfully!")
      : String(text || "Task created successfully!");

  return `
    <span class="notif-icon" aria-hidden="true">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
           xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10"
                fill="currentColor" opacity="0.12"/>
        <path d="M7 12.5L10 15.5L17 8.5"
              stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </span>
    <div class="notif-message">${safeText}</div>
    <button class="notif-close" aria-label="Close notification">&times;</button>
  `;
}

/**
 * Fades out and removes a notification element after its transition completes.
 * @param {HTMLElement|null} element
 */
function removeNotification(element) {
  if (!element) return;

  element.classList.remove("show");
  element.addEventListener(
    "transitionend",
    () => {
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
    },
    { once: true }
  );
}

/**
 * Creates a styled notification element with a close button.
 * @param {string} type
 * @param {string} text
 * @returns {HTMLElement}
 */
function createNotificationElement(type, text) {
  const notif = document.createElement("div");
  notif.className = `notification notification--${type}`;
  notif.setAttribute("role", "status");
  notif.setAttribute("aria-live", "polite");
  notif.innerHTML = buildNotificationTemplate(type, text);

  const closeBtn = notif.querySelector(".notif-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => removeNotification(notif));
  }

  return notif;
}

/**
 * Appends an auto-dismissing toast notification to the notification container.
 * @param {{ type?: string, text?: string, duration?: number }} [options={}]
 */
function createNotification(options = {}) {
  const {
    type = "success",
    text = "Task created successfully!",
    duration = 1800,
  } = options;

  const container = getNotificationContainer();
  if (!container) return;

  const notif = createNotificationElement(type, text);
  container.appendChild(notif);

  requestAnimationFrame(() => {
    notif.classList.add("show");
  });

  setTimeout(() => {
    removeNotification(notif);
  }, duration);
}

if (typeof window !== "undefined") {
  window.createNotification = createNotification;
}
