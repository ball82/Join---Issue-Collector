
/** Fetches and injects the sidebar HTML for all [sidebar-html] placeholder elements. */
function includeSidebarHTML() {
  let includeElements = document.querySelectorAll("[sidebar-html]");
  includeElements.forEach((el) => {
    let file = el.getAttribute("sidebar-html");
    fetch(file)
      .then((resp) => resp.text())
      .then((html) => handleSidebarLoaded(el, html));
  });
}

/**
 * Injects the fetched sidebar HTML and highlights the active nav link.
 * @param {HTMLElement} el - Placeholder element to replace.
 * @param {string} html - Fetched sidebar markup.
 */
function handleSidebarLoaded(el, html) {
  el.innerHTML = html;
  updateSidebarForLoginState();
  if (typeof highlightActiveSidebarLink === "function") highlightActiveSidebarLink();
}

/** Fetches and injects the header HTML for the [header-html] placeholder element. */
function includeHeaderHTML() {
  const placeholder = document.querySelector("[header-html]");
  if (!placeholder) return;

  const src = placeholder.getAttribute("header-html");

  fetch(src)
    .then((r) => r.text())
    .then((html) => {
      placeholder.outerHTML = html;

      initHeaderUserMenu();
    })
    .catch(() => {});
}

/** Attaches open/close/keyboard handlers to the header user menu. */
function setupHeaderMenu() {
  const btn = document.getElementById("headerUserBtn");
  const menu = document.getElementById("userMenu");
  if (!btn || !menu) return;
  btn.addEventListener("click", (e) => { e.stopPropagation(); toggleMenu(menu, btn, !menu.classList.contains("open")); });
  document.addEventListener("click", (e) => handleOutsideClick(e, menu, btn));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") toggleMenu(menu, btn, false); });
}

/**
 * Closes the menu when a click occurs outside both the menu and its toggle button.
 * @param {MouseEvent} e
 * @param {HTMLElement} menu
 * @param {HTMLElement} btn
 */
function handleOutsideClick(e, menu, btn) {
  if (menu.classList.contains("open") && !menu.contains(e.target) && e.target !== btn) toggleMenu(menu, btn, false);
}

/**
 * Opens or closes a menu element and updates ARIA attributes.
 * @param {HTMLElement} menu
 * @param {HTMLElement} btn
 * @param {boolean} open
 */
function toggleMenu(menu, btn, open) {
  menu.classList.toggle("open", open);
  menu.setAttribute("aria-hidden", open ? "false" : "true");
  btn.setAttribute("aria-expanded", open ? "true" : "false");
}

/** Adds the "active" class to the sidebar nav item matching the current page. */
function highlightActiveSidebarLink() {
  const current = window.location.pathname.split("/").pop();
  const items = document.querySelectorAll(".nav-item");

  items.forEach((item) => {
    const link = item.getAttribute("href");
    if (link === current) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });
}

/** Shows or hides the auth/guest nav sections based on localStorage login state. */
function updateSidebarForLoginState() {
  const navAuth = document.querySelector(".nav-auth");
  const navGuest = document.querySelector(".nav-guest");
  if (!navAuth || !navGuest) return;
  const loggedIn = !!localStorage.getItem("loggedInUser");
  navAuth.style.display = loggedIn ? "flex" : "none";
  navGuest.style.display = loggedIn ? "none" : "flex";
}

/** Calls Firebase signOut if the Firebase auth instance is available. */
function signOutFirebase() {
  if (window.firebaseAuth && window.firebaseAuth.signOut) {
    firebaseAuth.signOut().catch((err) => {
      console.error("Firebase Logout Error:", err);
    });
  }
}

/** Clears the local session, signs out of Firebase, and redirects to the login page. */
function logout() {
  localStorage.removeItem("loggedInUser");
  signOutFirebase();
  window.location.href = "index.html";
}

/** Wires up the header user-menu toggle and outside-click close after the header is injected. */
function initHeaderUserMenu() {
  const loggedIn = !!localStorage.getItem("loggedInUser");
  if (!loggedIn) {
    const headerUser = document.getElementById("headerUser");
    if (headerUser) headerUser.style.display = "none";
    return;
  }

  const btn = document.getElementById("headerUserBtn");
  const menu = document.getElementById("userMenu");
  if (!btn || !menu) return;
  btn.addEventListener("click", (event) => { event.stopPropagation(); toggleUserMenu(menu, btn); });
  document.addEventListener("click", (event) => { if (!menu.contains(event.target) && !btn.contains(event.target)) closeUserMenu(menu, btn); });
}

/**
 * Toggles the user menu open/closed and syncs ARIA attributes.
 * @param {HTMLElement} menu
 * @param {HTMLElement} btn
 */
function toggleUserMenu(menu, btn) {
  const isOpen = menu.classList.toggle("open");
  menu.setAttribute("aria-hidden", isOpen ? "false" : "true");
  btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
}

/**
 * Closes the user menu if it is currently open.
 * @param {HTMLElement} menu
 * @param {HTMLElement} btn
 */
function closeUserMenu(menu, btn) {
  if (!menu.classList.contains("open")) return;
  menu.classList.remove("open");
  menu.setAttribute("aria-hidden", "true");
  btn.setAttribute("aria-expanded", "false");
}
