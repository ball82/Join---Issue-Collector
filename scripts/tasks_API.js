/**
 * @fileoverview Tasks API module for Firebase task management
 * @module tasks_API
 */

/** @type {Array<Object>} */
let tasks = [];

/** @constant {string} */
const FIREBASE_BASE_URL =
  "https://join-60a91-default-rtdb.europe-west1.firebasedatabase.app";

/** @constant {string} */
const TASKS_BASE_URL = `${FIREBASE_BASE_URL}/tasks`;

/**
 * Checks if the given value represents an in-progress status
 * @param {string} value - The status value to check
 * @returns {boolean} True if the value is an in-progress status
 */
function isInProgressStatus(value) {
  return (
    value === "inprogress" || value === "in-progress" || value === "in_progress"
  );
}

/**
 * Checks if the given value represents an await-feedback status
 * @param {string} value - The status value to check
 * @returns {boolean} True if the value is an await-feedback status
 */
function isAwaitFeedbackStatus(value) {
  return (
    value === "awaitfeedback" ||
    value === "await-feedback" ||
    value === "await_feedback"
  );
}

/**
 * Normalizes a task status string to a consistent format
 * @param {string} [status=""] - The status to normalize
 * @returns {string} The normalized status
 */
function normalizeTaskStatus(status = "") {
  const value = String(status).trim().toLowerCase();
  if (!value) return "triage";
  if (value === "triage") return "triage";
  if (isInProgressStatus(value)) return "inprogress";
  if (isAwaitFeedbackStatus(value)) return "await_feedback";
  if (value === "done") return "done";
  if (value === "todo") return "todo";
  return value;
}

/**
 * Fetches all tasks from Firebase
 * @async
 * @returns {Promise<Array<Object>>} Array of task objects
 */
async function fetchTasks() {
  try {
    const response = await fetch(`${TASKS_BASE_URL}.json`, {
      cache: "no-store",
    });

    if (!response.ok) {
      tasks = [];
      return tasks;
    }

    const data = await response.json();
    tasks = normalizeTasks(data);
    return tasks;
  } catch (_error) {
    tasks = [];
    return tasks;
  }
}

/**
 * Normalizes raw task data from Firebase into a consistent format
 * @param {Object|Array|null} raw - Raw task data from Firebase
 * @returns {Array<Object>} Array of normalized task objects
 */
function normalizeTasks(raw) {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw.filter(Boolean).map((value) => enrichTask(value));
  }

  return Object.entries(raw).map(([firebaseId, value]) =>
    enrichTask({ ...value, firebaseId })
  );
}

/**
 * Enriches a task object with default values and normalized fields
 * @param {Object} task - The task object to enrich
 * @returns {Object} The enriched task object
 */
function enrichTask(task) {
  const idFromTask = task.id || task.firebaseId;
  const id = idFromTask || generateId();

  const assigned = Array.isArray(task.assignedTo)
    ? task.assignedTo
    : task.assignedTo
    ? [task.assignedTo]
    : [];

  const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
  const status = normalizeTaskStatus(task.status || "triage");

  return {
    id,
    firebaseId: task.firebaseId || id,
    title: task.title || "",
    description: task.description || "",
    dueDate: task.dueDate || "",
    priority: task.priority || "Medium",
    category: task.category || "User Story",
    assignedTo: assigned,
    subtasks,
    status,
    creator: normalizeCreator(task.creator),
  };
}

/**
 * Normalizes a creator object, ensuring name, email and type are present.
 * The `type` field distinguishes internally created tickets ("internal")
 * from externally submitted ones via the e-mail issue collector ("external").
 * @param {Object} [creator] - Raw creator data (may be undefined)
 * @returns {{name: string, email: string, type: string}} Normalized creator
 */
function normalizeCreator(creator) {
  const raw = creator && typeof creator === "object" ? creator : {};
  const type = raw.type === "external" ? "external" : "internal";
  return {
    name: raw.name || "",
    email: raw.email || "",
    type,
  };
}

/**
 * Adds a new task to Firebase
 * @async
 * @param {Object} taskData - The task data to add
 * @returns {Promise<Object>} The newly created task object
 * @throws {Error} If the request fails
 */
async function addTask(taskData) {
  const cleanTask = enrichTask({
    ...taskData,
    id: undefined,
    firebaseId: undefined,
  });

  const { firebaseId: _ignore, ...payload } = cleanTask;

  const response = await fetch(`${TASKS_BASE_URL}.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("addTask: request failed");
  }

  const result = await response.json();
  const firebaseId = result && result.name ? result.name : cleanTask.id;

  const newTask = enrichTask({
    ...payload,
    firebaseId,
  });

  tasks.push(newTask);
  return newTask;
}

/**
 * Updates the status of a task in Firebase
 * @async
 * @param {string} taskId - The ID of the task to update
 * @param {string} newStatus - The new status to set
 * @throws {Error} If the request fails
 */
async function updateTaskStatus(taskId, newStatus) {
  const index = tasks.findIndex((t) => String(t.id) === String(taskId));
  if (index === -1) return;

  const task = tasks[index];
  const firebaseId = task.firebaseId || task.id;
  const normalizedStatus = normalizeTaskStatus(newStatus);

  if (!firebaseId) {
    tasks[index] = { ...task, status: normalizedStatus };
    return;
  }

  const previousStatus = task.status;

  const response = await fetch(`${TASKS_BASE_URL}/${firebaseId}.json`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: normalizedStatus }),
  });

  if (!response.ok) {
    throw new Error("updateTaskStatus: request failed");
  }

  tasks[index] = { ...task, status: normalizedStatus };

  // Notify the creator about the status change (fire-and-forget via n8n).
  notifyStatusChange(tasks[index], previousStatus, normalizedStatus);
}

/**
 * URL of the n8n webhook that sends the status-change notification email.
 * Replace with the production URL shown in your n8n Webhook node.
 * @constant {string}
 */
const STATUS_WEBHOOK_URL = "http://localhost:5678/webhook/join-status-change";

/**
 * Notifies the ticket creator about a column/status change by calling an n8n
 * webhook. Fire-and-forget: failures are swallowed so moving a card never
 * breaks if n8n is unreachable. Only fires when a creator email exists and the
 * status actually changed.
 * @param {Object} task - The updated task (must contain creator + title)
 * @param {string} previousStatus - The status before the change
 * @param {string} newStatus - The status after the change
 */
function notifyStatusChange(task, previousStatus, newStatus) {
  const creatorEmail = task.creator && task.creator.email;
  if (!creatorEmail) return;
  if (previousStatus === newStatus) return;
  if (!STATUS_WEBHOOK_URL || STATUS_WEBHOOK_URL.startsWith("REPLACE_")) return;

  const labels = typeof STATUS_LABELS === "object" ? STATUS_LABELS : {};
  const payload = {
    title: task.title || "",
    creatorEmail,
    creatorName: (task.creator && task.creator.name) || "",
    previousStatus,
    newStatus,
    statusLabel: labels[newStatus] || newStatus,
  };

  fetch(STATUS_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {
    /* Notification is best-effort; ignore network errors. */
  });
}

/**
 * Generates a unique ID based on timestamp and random number
 * @returns {string} A unique identifier
 */
function generateId() {
  return String(Date.now() + Math.random());
}

/**
 * Saves a task to Firebase
 * @async
 * @param {Object} task - The task object to save
 * @throws {Error} If the HTTP request fails
 */
async function saveTask(task) {
  let firebaseId = task.firebaseId;

  if (!firebaseId) {
    const existing = tasks.find((t) => String(t.id) === String(task.id));
    if (existing && existing.firebaseId) {
      firebaseId = existing.firebaseId;
    } else {
      firebaseId = task.id;
    }
  }

  const response = await fetch(`${TASKS_BASE_URL}/${firebaseId}.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(task),
  });

  if (!response.ok) {
    throw new Error("saveTask: HTTP " + response.status);
  }
}

/**
 * Deletes a task from Firebase by its ID
 * @async
 * @param {string} taskId - The ID of the task to delete
 * @throws {Error} If the request fails
 */
async function deleteTaskById(taskId) {
  const task = tasks.find(
    (t) =>
      String(t.id) === String(taskId) || String(t.firebaseId) === String(taskId)
  );

  const firebaseId = task && task.firebaseId ? task.firebaseId : taskId;

  const response = await fetch(`${TASKS_BASE_URL}/${firebaseId}.json`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("deleteTaskById: request failed");
  }
}


/**
 * Seeds the database with sample tasks if empty
 * @async
 */
async function seedTasksIfEmpty() {
  // No-op: sample task seeding has been removed.
  return;
}