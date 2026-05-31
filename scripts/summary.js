
/** @returns {object|null} The current user object from localStorage, or null. */
function getCurrentUser() {
  if (typeof window.getCurrentUser === "function") {
    try { return window.getCurrentUser(); } catch (e) {}
  }
  try {
    const raw = localStorage.getItem("loggedInUser");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) { return null; }
}

/**
 * @param {object|null} u - User object from localStorage.
 * @returns {boolean} True when the user has a real, non-guest display name.
 */
function shouldShowName(u) {
  if (!u || typeof u.name === "undefined" || u.name === null) return false;
  const nm = String(u.name).trim();
  return nm && nm.toLowerCase() !== "guest";
}

/**
 * Updates greeting text and name visibility for one greeting element pair.
 * @param {HTMLElement|null} nameEl - Element that shows the user's name.
 * @param {HTMLElement|null} textEl - Element that shows the greeting text.
 * @param {object|null} user
 * @param {string} displayStyle - CSS display value to use when showing the name.
 */
function updateGreetingElement(nameEl, textEl, user, displayStyle) {
  if (!nameEl || !textEl) return;
  if (shouldShowName(user)) {
    nameEl.textContent = user.name;
    nameEl.style.display = displayStyle;
    textEl.textContent = "Good morning,";
  } else {
    nameEl.style.display = "none";
    textEl.textContent = "Good morning!";
  }
}

/**
 * Hides the splash screen element and removes the splash-active class from body.
 * @param {HTMLElement} body
 * @param {HTMLElement|null} splashScreen
 */
function hideSplashScreen(body, splashScreen) {
  body.classList.remove("splash-active");
  if (splashScreen) splashScreen.style.display = "none";
}

/** Renders the personalised greeting and auto-dismisses the splash on mobile. */
function showGreeting() {
  const body = document.body;
  const splashScreen = document.getElementById("greeting-splash");
  body.classList.add("splash-active");
  const user = getCurrentUser();
  updateGreetingElement(document.getElementById("greet-name-splash"), document.querySelector(".greeting-splash .greet-text"), user, "block");
  updateGreetingElement(document.getElementById("greet-name"), document.querySelector(".kpi-right .greet-text"), user, "inline");
  if (window.innerWidth <= 640) setTimeout(() => hideSplashScreen(body, splashScreen), 4500);
  else hideSplashScreen(body, splashScreen);
}
