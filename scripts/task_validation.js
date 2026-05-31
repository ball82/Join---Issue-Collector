
/**
 * Validates the required task form fields and shows inline errors.
 * @param {string} title
 * @param {string} dueDate
 * @param {string} category
 * @returns {boolean} True when all required fields are filled.
 */
function validateTaskForm(title, dueDate, category) {
  let valid = true;

  if (!title) {
    showError("titleError", "Title is required");
    valid = false;
  }

  if (!dueDate) {
    showError("dueDateError", "Due date is required");
    valid = false;
  }

  if (!category) {
    showError("categoryError", "Category is required");
    valid = false;
  }

  return valid;
}

/**
 * Writes an error message into the element with the given id.
 * @param {string} id - Element id of the error container.
 * @param {string} message
 */
function showError(id, message) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = message;
  }
}

/** Clears all inline validation error messages for the task form. */
function clearFormErrors() {
  const errorIds = ["titleError", "dueDateError", "categoryError"];

  errorIds.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = "";
    }
  });
}

/**
 * Returns the trimmed value of an input element by id.
 * @param {string} id
 * @returns {string}
 */
function getInputValue(id) {
  const element = document.getElementById(id);
  return element ? String(element.value || "").trim() : "";
}

/**
 * Escapes HTML special characters to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
