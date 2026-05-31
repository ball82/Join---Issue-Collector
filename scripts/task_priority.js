
let selectedPriority = "Medium";

/** Initialises the priority button group and sets the default active button. */
function initPriorityButtons() {
  const buttons = document.querySelectorAll(".priority-buttons__button");
  if (!buttons.length) return;

  setupPriorityButtonInteractions(buttons);
  setInitialPriority(buttons);
}

/**
 * Marks one button as active and updates the `selectedPriority` variable.
 * @param {NodeList} buttons - All priority buttons.
 * @param {HTMLElement} activeButton - The button to activate.
 */
function setPriorityActive(buttons, activeButton) {
  buttons.forEach((button) => {
    button.classList.remove("is-active");
    button.setAttribute("aria-pressed", "false");
  });

  activeButton.classList.add("is-active");
  activeButton.setAttribute("aria-pressed", "true");
  selectedPriority = activeButton.dataset.priority || "Medium";
}

/**
 * Attaches click and keyboard handlers to every priority button.
 * @param {NodeList} buttons
 */
function setupPriorityButtonInteractions(buttons) {
  buttons.forEach((btn) => {
    btn.setAttribute("role", "button");
    btn.setAttribute("tabindex", "0");

    const activate = () => setPriorityActive(buttons, btn);

    btn.addEventListener("click", activate);
    btn.addEventListener("keydown", (event) => {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        activate();
      }
    });
  });
}

/**
 * Activates the default priority button (Medium or the first in the list).
 * @param {NodeList} buttons
 */
function setInitialPriority(buttons) {
  let defaultButton = document.querySelector(
    ".priority-buttons__button.priority-buttons__button--active"
  );

  if (!defaultButton) {
    defaultButton =
      document.querySelector(
        ".priority-buttons__button.priority-buttons__button--medium"
      ) || buttons[0];
  }

  if (defaultButton) {
    setPriorityActive(buttons, defaultButton);
  }
}

/** Resets the priority selection back to "Medium". */
function resetPriorityButtons() {
  const buttons = document.querySelectorAll(".priority-buttons__button");
  if (!buttons.length) return;

  selectedPriority = "Medium";
  setInitialPriority(buttons);
}

/** @returns {string} The currently selected priority label. */
function getSelectedPriority() {
  return selectedPriority || "Medium";
}
