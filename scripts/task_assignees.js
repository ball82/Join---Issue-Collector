
const contacts = [
  { id: "sm", name: "Sofia Müller", avatarClass: "avatar-sm", initials: "SM" },
  { id: "am", name: "Anton Mayer", avatarClass: "avatar-am", initials: "AM" },
  { id: "as", name: "Anja Schulz", avatarClass: "avatar-as", initials: "AS" },
  { id: "bz", name: "Benedikt Ziegler", avatarClass: "avatar-bz", initials: "BZ" },
  { id: "de", name: "David Eisenberg", avatarClass: "avatar-de", initials: "DE" },
];

let selectedAssignees = [];

/** Initialises the global assignee dropdown on the add-task page. */
function initAssignedTo() {
  const input = document.getElementById("assignedToInput");
  const dropdown = document.getElementById("assignedToDropdown");
  const list = document.getElementById("assignedToList");
  const selectedContainer = document.getElementById("assignedToSelected");
  if (!input || !dropdown || !list || !selectedContainer) return;
  renderContactOptions();
  attachAssignedToHandlers(input, dropdown, list, selectedContainer);
}

/**
 * Attaches focus, click, input, and outside-click handlers to the global dropdown elements.
 * @param {HTMLElement} input
 * @param {HTMLElement} dropdown
 * @param {HTMLElement} list
 * @param {HTMLElement} selectedContainer
 */
function attachAssignedToHandlers(input, dropdown, list, selectedContainer) {
  input.addEventListener("focus", showDropdown);
  input.addEventListener("click", () => handleInputClick(input, dropdown));
  attachToggleHandler(input, dropdown);
  input.addEventListener("input", filterContacts);
  document.addEventListener("click", (e) => { if (!input.contains(e.target) && !dropdown.contains(e.target)) hideDropdown(); });
  dropdown.addEventListener("click", (e) => e.stopPropagation());
}

/**
 * Toggles the global dropdown open/closed when the input is clicked.
 * @param {HTMLElement} input
 * @param {HTMLElement} dropdown
 */
function handleInputClick(input, dropdown) {
  const wrapper = input.closest(".assigned-to-wrapper");
  if (dropdown.style.display === "block") { hideDropdown(); if (wrapper) wrapper.classList.remove("is-open"); }
  else { showDropdown(); if (wrapper) wrapper.classList.add("is-open"); }
}

/**
 * Attaches a toggle handler to the chevron icon next to the assignee input.
 * @param {HTMLElement} input
 * @param {HTMLElement} dropdown
 */
function attachToggleHandler(input, dropdown) {
  const wrapper = input.closest(".assigned-to-wrapper");
  if (!wrapper) return;
  const toggleEl = wrapper.querySelector(".assigned-to-toggle");
  if (!toggleEl) return;
  toggleEl.addEventListener("click", (ev) => {
    ev.stopPropagation();
    if (dropdown.style.display === "block") { hideDropdown(); wrapper.classList.remove("is-open"); }
    else { showDropdown(); wrapper.classList.add("is-open"); }
  });
}

let scopedElements = {};

/**
 * Initialises a scoped assignee dropdown within a specific container (e.g. the edit overlay).
 * @param {HTMLElement} root - Container element that holds the dropdown markup.
 */
function initAssignedToScoped(root) {
  if (!root || !(root instanceof HTMLElement)) return;
  const input = root.querySelector('.assigned-to-input') || root.querySelector('#assignedToInput');
  const dropdown = root.querySelector('.assigned-to-dropdown') || root.querySelector('#assignedToDropdown');
  const list = root.querySelector('#assignedToList') || root.querySelector('.assigned-to-dropdown ul');
  const selectedContainer = root.querySelector('.assigned-to-selected') || root.querySelector('#assignedToSelected');
  if (!input || !dropdown || !list || !selectedContainer) return;
  scopedElements = { input, dropdown, list, selectedContainer };
  attachScopedListeners();
  renderContactOptionsScoped();
  renderSelectedBadgesScoped();
}

/** Attaches click, input, and outside-click listeners to the scoped dropdown elements. */
function attachScopedListeners() {
  const { input, dropdown, selectedContainer } = scopedElements;
  input.addEventListener("click", (e) => { e.stopPropagation(); toggleScopedDropdown(); });
  attachScopedToggle();
  input.addEventListener("input", filterContactsScoped);
  document.addEventListener("click", (e) => { if (!input.contains(e.target) && !dropdown.contains(e.target)) closeScopedDropdown(); });
  dropdown.addEventListener("click", (e) => e.stopPropagation());
}

/** Attaches a toggle handler to the chevron icon in the scoped dropdown wrapper. */
function attachScopedToggle() {
  const { input, dropdown } = scopedElements;
  const wrapper = input.closest('.assigned-to-wrapper');
  if (!wrapper) return;
  const toggleEl = wrapper.querySelector('.assigned-to-toggle');
  if (toggleEl) toggleEl.addEventListener('click', (ev) => { ev.stopPropagation(); toggleScopedDropdown(); });
}

/** Opens the scoped dropdown and hides the selected-badges container. */
function openScopedDropdown() {
  const { input, dropdown, selectedContainer } = scopedElements;
  dropdown.style.display = "block";
  selectedContainer.style.display = "none";
  const wrapper = input.closest('.assigned-to-wrapper');
  if (wrapper) wrapper.classList.add('is-open');
  filterContactsScoped();
}

/** Closes the scoped dropdown and restores the selected-badges container. */
function closeScopedDropdown() {
  const { input, dropdown, selectedContainer } = scopedElements;
  dropdown.style.display = "none";
  selectedContainer.style.display = "flex";
  const wrapper = input.closest('.assigned-to-wrapper');
  if (wrapper) wrapper.classList.remove('is-open');
}

/** Toggles the scoped dropdown between open and closed. */
function toggleScopedDropdown() {
  const { dropdown } = scopedElements;
  if (dropdown.style.display === 'block') closeScopedDropdown();
  else openScopedDropdown();
}

/**
 * Re-renders the scoped dropdown list with the given contact subset.
 * @param {object[]} [filteredContacts=contacts]
 */
function renderContactOptionsScoped(filteredContacts = contacts) {
  const { list } = scopedElements;
  list.innerHTML = "";
  filteredContacts.forEach((contact) => {
    const li = createContactLiScoped(contact);
    list.appendChild(li);
  });
}

/**
 * Creates a scoped dropdown list item for a contact.
 * @param {{ id: string, name: string, avatarClass: string, initials: string }} contact
 * @returns {HTMLElement}
 */
function createContactLiScoped(contact) {
  const isSelected = selectedAssignees.includes(contact.id);
  const li = document.createElement("li");
  li.classList.toggle("selected", isSelected);
  li.innerHTML = `<div class="contact-info"><div class="avatar ${contact.avatarClass}">${contact.initials}</div><span class="contact-name">${escapeHtml(contact.name)}</span></div><div class="checkmark-box ${isSelected ? "checked" : ""}"></div>`;
  li.addEventListener("click", (e) => { e.preventDefault(); toggleAssigneeScoped(contact.id, li); });
  return li;
}

/** Filters the scoped contact list by the current input value. */
function filterContactsScoped() {
  const { input } = scopedElements;
  const query = input.value.trim().toLowerCase();
  const filtered = contacts.filter((c) => c.name.toLowerCase().includes(query));
  renderContactOptionsScoped(filtered);
}

/**
 * Toggles a contact's selection in the scoped dropdown and updates the badge list.
 * @param {string} id - Contact id.
 * @param {HTMLElement|null} [listItemElement=null]
 */
function toggleAssigneeScoped(id, listItemElement = null) {
  const wasSelected = selectedAssignees.includes(id);
  if (wasSelected) selectedAssignees = selectedAssignees.filter((x) => x !== id);
  else selectedAssignees.push(id);
  if (listItemElement) updateListItemScoped(listItemElement, !wasSelected);
  filterContactsScoped();
  renderSelectedBadgesScoped();
}

/**
 * Updates the visual selected/checked state of a scoped list item.
 * @param {HTMLElement} li
 * @param {boolean} isNowSelected
 */
function updateListItemScoped(li, isNowSelected) {
  li.classList.toggle("selected", isNowSelected);
  const box = li.querySelector(".checkmark-box");
  if (box) box.classList.toggle("checked", isNowSelected);
}

/** Re-renders the scoped selected-assignee badge row. */
function renderSelectedBadgesScoped() {
  const { selectedContainer } = scopedElements;
  selectedContainer.innerHTML = "";
  selectedAssignees.forEach((id) => {
    const contact = contacts.find((c) => c.id === id);
    if (!contact) return;
    const badge = document.createElement("div");
    badge.className = "assigned-to-badge avatar-only";
    badge.innerHTML = `<div class="avatar ${contact.avatarClass}">${contact.initials}</div>`;
    selectedContainer.appendChild(badge);
  });
}

/** Opens the global dropdown and shows the filtered contact list. */
function showDropdown() {
  const dropdown = document.getElementById("assignedToDropdown");
  const selectedContainer = document.getElementById("assignedToSelected");
  if (!dropdown) return;
  dropdown.style.display = "block";
  if (selectedContainer) selectedContainer.style.display = "none";
  setWrapperOpen(true);
  filterContacts();
}

/** Closes the global dropdown and restores the selected-badges container. */
function hideDropdown() {
  const dropdown = document.getElementById("assignedToDropdown");
  const selectedContainer = document.getElementById("assignedToSelected");
  if (!dropdown) return;
  dropdown.style.display = "none";
  if (selectedContainer) selectedContainer.style.display = selectedAssignees.length > 0 ? "flex" : "none";
  setWrapperOpen(false);
}

/**
 * Adds or removes the `is-open` class on the global assignee wrapper element.
 * @param {boolean} open
 */
function setWrapperOpen(open) {
  const input = document.getElementById('assignedToInput');
  if (!input) return;
  const wrapper = input.closest('.assigned-to-wrapper');
  if (wrapper) wrapper.classList.toggle('is-open', open);
}

/**
 * Re-renders the global dropdown list with the given contact subset.
 * @param {object[]} [filteredContacts=contacts]
 */
function renderContactOptions(filteredContacts = contacts) {
  const list = document.getElementById("assignedToList");
  list.innerHTML = "";
  filteredContacts.forEach((contact) => list.appendChild(createContactLi(contact)));
}

/**
 * Creates a global dropdown list item for a contact.
 * @param {{ id: string, name: string, avatarClass: string, initials: string }} contact
 * @returns {HTMLElement}
 */
function createContactLi(contact) {
  const isSelected = selectedAssignees.includes(contact.id);
  const li = document.createElement("li");
  li.classList.toggle("selected", isSelected);
  li.innerHTML = `<div class="contact-info"><div class="avatar ${contact.avatarClass}">${contact.initials}</div><span class="contact-name">${escapeHtml(contact.name)}</span></div><div class="checkmark-box ${isSelected ? "checked" : ""}"></div>`;
  li.addEventListener("click", (e) => { e.preventDefault(); toggleAssignee(contact.id, li); });
  return li;
}

/** Filters the global contact dropdown by the current input value. */
function filterContacts() {
  const input = document.getElementById("assignedToInput");
  const query = input.value.trim().toLowerCase();
  const filtered = contacts.filter((c) => c.name.toLowerCase().includes(query));
  renderContactOptions(filtered);
}

/**
 * Toggles a contact's selection in the global dropdown and updates badges.
 * @param {string} id
 * @param {HTMLElement|null} [listItemElement=null]
 */
function toggleAssignee(id, listItemElement = null) {
  const wasSelected = selectedAssignees.includes(id);
  if (wasSelected) selectedAssignees = selectedAssignees.filter((x) => x !== id);
  else selectedAssignees.push(id);
  if (listItemElement) updateListItem(listItemElement, !wasSelected);
  filterContacts();
  renderSelectedBadges();
}

/**
 * Updates the visual selected/checked state of a global list item.
 * @param {HTMLElement} li
 * @param {boolean} isNowSelected
 */
function updateListItem(li, isNowSelected) {
  li.classList.toggle("selected", isNowSelected);
  const box = li.querySelector(".checkmark-box");
  if (box) box.classList.toggle("checked", isNowSelected);
}

/** Re-renders the global selected-assignee badge row below the input. */
function renderSelectedBadges() {
  const selectedContainer = document.getElementById("assignedToSelected");
  const dropdown = document.getElementById("assignedToDropdown");
  selectedContainer.innerHTML = "";
  if (selectedAssignees.length === 0) { selectedContainer.style.display = "none"; return; }
  const isDropdownOpen = dropdown && dropdown.style.display === "block";
  selectedContainer.style.display = isDropdownOpen ? "none" : "flex";
  selectedAssignees.forEach((id) => appendBadge(selectedContainer, id));
}

/**
 * Appends a single avatar badge to a container for the given contact id.
 * @param {HTMLElement} container
 * @param {string} id
 */
function appendBadge(container, id) {
  const contact = contacts.find((c) => c.id === id);
  if (!contact) return;
  const badge = document.createElement("div");
  badge.className = "assigned-to-badge avatar-only";
  badge.innerHTML = `<div class="avatar ${contact.avatarClass}">${contact.initials}</div>`;
  container.appendChild(badge);
}

/**
 * Returns the full contact objects for all currently selected assignees.
 * @returns {Array<{ name: string, id: string, avatarClass: string, initials: string }>}
 */
function getAssignedTo() {
  return selectedAssignees.map((id) => {
    const contact = contacts.find((c) => c.id === id);
    return contact ? { name: contact.name, id: contact.id, avatarClass: contact.avatarClass, initials: contact.initials } : null;
  }).filter(Boolean);
}

/** Clears the selection and re-renders the empty badge row. */
function resetAssignedTo() {
  selectedAssignees = [];
  renderSelectedBadges();
}
