

/**
 * @returns {boolean} True if a valid user session exists in localStorage.
 */
function isUserLoggedIn() {
  try {
    const raw = localStorage.getItem("loggedInUser");
    if (!raw) return false;
    const user = JSON.parse(raw);
    return Boolean(user && (user.uid || user.email || user.isGuest));
  } catch (_error) {
    return false;
  }
}

/** Hides the welcome overlay by setting the `hidden` attribute. */
function closeWelcomeOverlay() {
  const overlay = document.getElementById("welcome-overlay");
  if (overlay) overlay.setAttribute("hidden", "");
}

/** Shows the welcome overlay by removing the `hidden` attribute. */
function openWelcomeOverlay() {
  const overlay = document.getElementById("welcome-overlay");
  if (overlay) overlay.removeAttribute("hidden");
}

/**
 * Entry point for the welcome overlay on the login page.
 * Redirects already-logged-in users to summary.html; otherwise shows the
 * overlay and wires up the member-login button and Escape key.
 */
function initWelcomeOverlay() {
  if (isUserLoggedIn()) {
    window.location.replace("summary.html");
    return;
  }

  const memberBtn = document.getElementById("welcome-member-login");
  if (memberBtn) {
    memberBtn.addEventListener("click", closeWelcomeOverlay);
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeWelcomeOverlay();
  });

  if (document.readyState === "complete") {
    openWelcomeOverlay();
  } else {
    window.addEventListener("load", openWelcomeOverlay);
  }
}

document.addEventListener("DOMContentLoaded", initWelcomeOverlay);