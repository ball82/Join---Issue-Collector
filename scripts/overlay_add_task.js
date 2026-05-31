
/** Wires up trigger buttons and overlay close events for the add-task overlay. */
function initAddTaskOverlay() {
  const overlay = document.querySelector("overlay-modal");
  const form = document.getElementById("taskForm");

  if (!overlay || !form) return;

  const triggers = document.querySelectorAll(".js-add-task-trigger");
  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const status = trigger.dataset.status || "triage";
      openAddTaskOverlay(status);
    });
  });

  const closeBtn = overlay.querySelector("[data-overlay-close]");
  if (closeBtn) {
    closeBtn.addEventListener("click", closeAddTaskOverlay);
  }

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closeAddTaskOverlay();
    }
  });
}

/**
 * Opens the add-task overlay and pre-sets the status hidden field.
 * @param {string} status - Initial status value for the new task.
 */
function openAddTaskOverlay(status) {
  const overlay = document.querySelector("overlay-modal");
  const form = document.getElementById("taskForm");
  if (!overlay || !form) return;

  if (typeof resetTaskForm === "function") {
    resetTaskForm();
  } else {
    form.reset();
  }

  const statusInput = form.querySelector('input[name="status"]');
  if (statusInput) {
    statusInput.value = status;
  }

  overlay.style.display = "flex";
  document.body.style.overflow = "hidden";
}

/** Closes the add-task overlay and restores body scroll. */
function closeAddTaskOverlay() {
  const overlay = document.querySelector("overlay-modal");
  if (!overlay) return;

  overlay.style.display = "none";
  document.body.style.overflow = "";
}

/**
 * Opens the add-task overlay with the given status; used from inline HTML handlers.
 * @param {string} [status="triage"]
 */
function addTaskBtn(status) {
  openAddTaskOverlay(status || "triage");
}

/** Closes the add-task overlay; used from inline HTML handlers. */
function closeAddTaskBtn() {
  closeAddTaskOverlay();
}

document.addEventListener("DOMContentLoaded", initAddTaskOverlay);
