

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

function closeWelcomeOverlay() {
  const overlay = document.getElementById("welcome-overlay");
  if (overlay) overlay.setAttribute("hidden", "");
}

function openWelcomeOverlay() {
  const overlay = document.getElementById("welcome-overlay");
  if (overlay) overlay.removeAttribute("hidden");
}

function initWelcomeOverlay() {
  if (isUserLoggedIn()) {
    closeWelcomeOverlay();
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