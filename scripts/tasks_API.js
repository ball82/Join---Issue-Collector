let tasks = [];

const FIREBASE_BASE_URL =
  "https://join-60a91-default-rtdb.europe-west1.firebasedatabase.app";

const TASKS_BASE_URL = `${FIREBASE_BASE_URL}/tasks`;

/**
 * @param {string} value
 * @returns {boolean} True for all recognised "in progress" status strings.
 */
function isInProgressStatus(value) {
  return (
    value === "inprogress" || value === "in-progress" || value === "in_progress"
  );
}

/**
 * @param {string} value
 * @returns {boolean} True for all recognised "await feedback" status strings.
 */
function isAwaitFeedbackStatus(value) {
  return (
    value === "awaitfeedback" ||
    value === "await-feedback" ||
    value === "await_feedback"
  );
}

/**
 * Converts any raw status string to the canonical internal value used by the board.
 * Defaults to "triage" when the input is empty.
 * @param {string} [status=""]
 * @returns {string}
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
 * Loads all tasks from Firebase and stores them in the module-level `tasks` array.
 * @returns {Promise<object[]>}
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
 * Converts the raw Firebase payload (object or array) into a normalised task array.
 * @param {object|Array|null} raw
 * @returns {object[]}
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
 * Normalises a single subtask entry to {title, done, checked}.
 * Handles both string items (from AI email processing) and plain objects.
 * @param {string|object} s
 * @returns {{title:string, done:boolean, checked:boolean}|null}
 */
function normalizeSubtask(s) {
  if (!s && s !== "") return null;
  if (typeof s === "string") {
    const title = s.trim();
    if (!title) return null;
    return { title, done: false, checked: false };
  }
  if (typeof s === "object") {
    const title = String(s.title || s.text || s.name || "").trim();
    if (!title) return null;
    const done = !!(s.done || s.checked || s.completed);
    return { title, done, checked: done };
  }
  return null;
}

/**
 * Fills in default values and normalises fields for a single task object.
 * @param {object} task
 * @returns {object} Fully enriched task object.
 */
function enrichTask(task) {
  const idFromTask = task.id || task.firebaseId;
  const id = idFromTask || generateId();

  const assigned = Array.isArray(task.assignedTo)
    ? task.assignedTo
    : task.assignedTo
    ? [task.assignedTo]
    : [];

  const subtasks = Array.isArray(task.subtasks)
    ? task.subtasks.map(normalizeSubtask).filter(Boolean)
    : [];
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
    isAiGenerated: !!task.isAiGenerated,
  };
}

/**
 * @param {*} creator - Raw creator value from Firebase.
 * @returns {{ name: string, email: string, type: 'internal'|'external' }}
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
 * Creates a new task in Firebase and appends it to the local tasks array.
 * @param {object} taskData
 * @returns {Promise<object>} The created task with its Firebase id.
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
 * PATCHes the task status in Firebase, updates the local array, and fires the status webhook.
 * @param {string} taskId
 * @param {string} newStatus
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

  notifyStatusChange(tasks[index], previousStatus, normalizedStatus);
}

const STATUS_WEBHOOK_URL = "https://bajo-dev.app.n8n.cloud/webhook/join-status-change";

/**
 * Fires a webhook to notify the task creator when its status changes.
 * Silently skips if the creator has no email or the status is unchanged.
 * @param {object} task - The updated task object.
 * @param {string} previousStatus - Status before the update.
 * @param {string} newStatus - Status after the update.
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
  }).catch(() => {});
}

/** @returns {string} A unique id based on the current timestamp and random noise. */
function generateId() {
  return String(Date.now() + Math.random());
}

/**
 * Replaces a task document in Firebase with a full PUT request.
 * @param {object} task - Task object with a valid firebaseId.
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
 * Deletes a task from Firebase by its local or Firebase id.
 * @param {string} taskId
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

/** No-op placeholder retained for API compatibility. */
async function seedTasksIfEmpty() {
  return;
}
