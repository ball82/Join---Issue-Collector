/** Opens the add-contact dialog and locks body scroll. */
function openAddContactDialog() {
  const dialog = document.getElementById("addContactDialog");
  if (dialog) {
    dialog.classList.add("active");
    document.body.style.overflow = "hidden";
  }
}

/** Closes the add-contact dialog, resets the form, and clears validation errors. */
function closeAddContactDialog() {
  const dialog = document.getElementById("addContactDialog");
  if (dialog) {
    dialog.classList.remove("active");
    document.body.style.overflow = "";
    const form = document.getElementById("addContactForm");
    if (form) form.reset();
    clearValidationErrors("add");
  }
}

/**
 * Returns up to two uppercase initials from a contact name.
 * @param {string} name
 * @returns {string}
 */
function getContactInitials(name) {
  return (name || "")
    .split(" ")
    .map((s) => s.charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Populates the edit-contact dialog fields with the given contact's data.
 * @param {{ name?: string, email?: string, phone?: string }} contact
 */
function fillEditContactDialog(contact) {
  document.getElementById("editContactName").value = contact.name || "";
  document.getElementById("editContactEmail").value = contact.email || "";
  document.getElementById("editContactPhone").value = contact.phone || "";
  const avatar = document.getElementById("editContactAvatar");
  if (avatar) avatar.textContent = getContactInitials(contact.name);
}

/** Opens the edit-contact dialog for the currently selected contact. */
function openEditContactDialog() {
  const contact = window.getCurrentContact();
  if (!contact) {
    alert("Please select a contact first!");
    return;
  }
  const dialog = document.getElementById("editContactDialog");
  if (!dialog) return;
  fillEditContactDialog(contact);
  dialog.classList.add("active");
  document.body.style.overflow = "hidden";
}

/** Re-opens the mobile contact detail view after an edit dialog was closed. */
function restoreMobileContactView() {
  const isMobile = window.innerWidth <= 1023;
  if (isMobile) {
    const contact = window.getCurrentContact();
    if (contact) window.showMobileContactDetail(contact);
  }
}

/** Closes the edit-contact dialog and restores the mobile contact view if applicable. */
function closeEditContactDialog() {
  const dialog = document.getElementById("editContactDialog");
  if (dialog) {
    dialog.classList.remove("active");
    document.body.style.overflow = "";
    clearValidationErrors("edit");
  }
  restoreMobileContactView();
}

/** Deletes the current contact and closes the edit dialog. */
function deleteContactFromDialog() {
  deleteCurrentContact();
  closeEditContactDialog();
}

/**
 * Removes a contact document from Firebase.
 * @param {{ id: string }} contact
 */
async function removeContactFromFirebase(contact) {
  if (!window.remove || !window.ref || !window.firebaseDb) {
    alert("Firebase is not ready yet. Please try again.");
    return;
  }
  try {
    const contactRef = window.ref(window.firebaseDb, `contacts/${contact.id}`);
    await window.remove(contactRef);
  } catch (error) {
    console.error("Error deleting contact:", error);
    alert("Error deleting contact: " + (error.message || "Unknown error"));
  }
}

/** Shows a native confirm dialog and deletes the currently selected contact from Firebase. */
async function deleteCurrentContact() {
  const contact = window.getCurrentContact();
  if (!contact || !contact.id) {
    alert("No contact selected!");
    return;
  }
  if (!confirm(`Do you really want to delete ${contact.name}?`)) return;
  await removeContactFromFirebase(contact);
}

/**
 * Finds the first contact-item element whose name label matches the given name.
 * @param {string} name
 * @returns {HTMLElement|null}
 */
function findContactItemByName(name) {
  const items = document.querySelectorAll(".contact-item");
  for (const item of items) {
    const nameEl = item.querySelector(".user-name");
    if (nameEl && nameEl.textContent === name) return item;
  }
  return null;
}

/**
 * Selects the newly created contact in the list (or opens the mobile detail view).
 * @param {string} id
 * @param {string} name
 * @param {string} email
 * @param {string} phone
 */
function selectNewlyAddedContact(id, name, email, phone) {
  const contact = { id, name, email, phone };
  if (window.innerWidth <= 1023) {
    window.showMobileContactDetail(contact);
    return;
  }
  const item = findContactItemByName(name);
  if (item) item.click();
}

/**
 * Wraps a message string in a success-message HTML structure.
 * @param {string} message
 * @returns {string}
 */
function buildSuccessMessageHTML(message) {
  return `<div class="success-message-wrapper"><div class="contact-success-message">${message}</div></div>`;
}

/**
 * Temporarily replaces the contact info area with a success message.
 * @param {string} message
 */
function showSuccessMessage(message) {
  const infoArea = document.querySelector(".info-contact-area");
  if (!infoArea) return;
  const originalContent = infoArea.innerHTML;
  infoArea.innerHTML = buildSuccessMessageHTML(message);
  setTimeout(() => { infoArea.innerHTML = originalContent; }, 2000);
}

/**
 * Marks an input as invalid and displays a validation error message.
 * @param {string} inputId
 * @param {string} errorId
 * @param {string} message
 */
function showValidationError(inputId, errorId, message) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  if (input) {
    input.classList.add("input-error");
    input.classList.remove("input-success");
  }
  if (error) {
    error.textContent = message;
    error.style.display = "block";
  }
}

/**
 * Clears all validation error states for either the "add" or "edit" form.
 * @param {"add"|"edit"} formType
 */
function clearValidationErrors(formType) {
  if (formType === "add") {
    clearFieldError("newContactName", "errorContactName");
    clearFieldError("newContactEmail", "errorContactEmail");
    clearFieldError("newContactPhone", "errorContactPhone");
  } else if (formType === "edit") {
    clearFieldError("editContactName", "errorEditName");
    clearFieldError("editContactEmail", "errorEditEmail");
    clearFieldError("editContactPhone", "errorEditPhone");
  }
}

/**
 * Removes the error class and clears the error text for a single field.
 * @param {string} inputId
 * @param {string} errorId
 */
function clearFieldError(inputId, errorId) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  if (input) {
    input.classList.remove("input-error");
    input.classList.remove("input-success");
  }
  if (error) {
    error.textContent = "";
    error.style.display = "none";
  }
}

/**
 * Validates a contact name: must be non-empty and contain only allowed characters.
 * @param {string} value
 * @param {string} inputId
 * @param {string} errorId
 * @returns {boolean}
 */
function validateName(value, inputId, errorId) {
  if (!value) {
    showValidationError(inputId, errorId, "Please enter a name");
    return false;
  }
  const pattern = /^[a-zA-ZÀ-ɏḀ-ỿ\s'\-\.]+$/;
  if (!pattern.test(value)) {
    showValidationError(inputId, errorId, "Name can only contain letters, spaces, hyphens, and apostrophes");
    return false;
  }
  return true;
}

/**
 * Validates an email address format.
 * @param {string} value
 * @param {string} inputId
 * @param {string} errorId
 * @returns {boolean}
 */
function validateEmail(value, inputId, errorId) {
  if (!value) {
    showValidationError(inputId, errorId, "Please enter an email address");
    return false;
  }
  const pattern = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  if (!pattern.test(value)) {
    showValidationError(inputId, errorId, "Please enter a valid email (e.g. name@domain.com)");
    return false;
  }
  return true;
}

/**
 * Validates the format and minimum digit count of a phone number.
 * @param {string} value
 * @param {string} inputId
 * @param {string} errorId
 * @returns {boolean}
 */
function validatePhoneFormat(value, inputId, errorId) {
  const pattern = /^[0-9+\-\(\)\s]+$/;
  if (!pattern.test(value)) {
    showValidationError(inputId, errorId, "Phone number can only contain digits and +, -, (, ), space");
    return false;
  }
  if (value.replace(/[^0-9]/g, "").length < 6) {
    showValidationError(inputId, errorId, "Phone number must have at least 6 digits");
    return false;
  }
  return true;
}

/**
 * Validates a phone field: must be non-empty and pass format validation.
 * @param {string} value
 * @param {string} inputId
 * @param {string} errorId
 * @returns {boolean}
 */
function validatePhone(value, inputId, errorId) {
  if (!value) {
    showValidationError(inputId, errorId, "Please enter a phone number");
    return false;
  }
  return validatePhoneFormat(value, inputId, errorId);
}

/**
 * Runs all three field validations for the add-contact form.
 * @param {string} name
 * @param {string} email
 * @param {string} phone
 * @returns {boolean} True only when all three fields are valid.
 */
function validateAddForm(name, email, phone) {
  const nameOk = validateName(name, "newContactName", "errorContactName");
  const emailOk = validateEmail(email, "newContactEmail", "errorContactEmail");
  const phoneOk = validatePhone(phone, "newContactPhone", "errorContactPhone");
  return nameOk && emailOk && phoneOk;
}

/**
 * Runs all three field validations for the edit-contact form.
 * @param {string} name
 * @param {string} email
 * @param {string} phone
 * @returns {boolean} True only when all three fields are valid.
 */
function validateEditForm(name, email, phone) {
  const nameOk = validateName(name, "editContactName", "errorEditName");
  const emailOk = validateEmail(email, "editContactEmail", "errorEditEmail");
  const phoneOk = validatePhone(phone, "editContactPhone", "errorEditPhone");
  return nameOk && emailOk && phoneOk;
}

/**
 * Pushes a new contact to Firebase and selects it in the list.
 * @param {string} name
 * @param {string} email
 * @param {string} phone
 */
async function saveNewContact(name, email, phone) {
  try {
    const newRef = await window.push(window.ref(window.firebaseDb, "contacts"), { name, email, phone });
    closeAddContactDialog();
    window.showToast("Contact successfully created");
    setTimeout(() => selectNewlyAddedContact(newRef.key, name, email, phone), 500);
  } catch (error) {
    console.error("Error adding contact:", error);
    alert("Error adding contact. Please try again.");
  }
}

/**
 * Submit handler for the add-contact form.
 * @param {SubmitEvent} e
 */
async function handleAddContactSubmit(e) {
  e.preventDefault();
  clearValidationErrors("add");
  const name = document.getElementById("newContactName").value.trim();
  const email = document.getElementById("newContactEmail").value.trim();
  const phone = document.getElementById("newContactPhone").value.trim();
  if (!validateAddForm(name, email, phone)) return;
  const emailExists = await window.checkEmailExists(email);
  if (emailExists) {
    showValidationError("newContactEmail", "errorContactEmail", "This email address is already registered");
    return;
  }
  await saveNewContact(name, email, phone);
}

/**
 * Updates an existing contact document in Firebase.
 * @param {string} id - Firebase contact id.
 * @param {string} name
 * @param {string} email
 * @param {string} phone
 */
async function saveEditedContact(id, name, email, phone) {
  try {
    if (!window.set || !window.ref || !window.firebaseDb) {
      alert("Firebase is not ready yet. Please try again.");
      return;
    }
    const contactRef = window.ref(window.firebaseDb, `contacts/${id}`);
    await window.set(contactRef, { name, email, phone });
    closeEditContactDialog();
  } catch (error) {
    console.error("Error updating contact:", error);
    alert("Error updating contact: " + (error.message || "Unknown error"));
  }
}

/**
 * Submit handler for the edit-contact form.
 * @param {SubmitEvent} e
 */
async function handleEditContactSubmit(e) {
  e.preventDefault();
  clearValidationErrors("edit");
  const contact = window.getCurrentContact();
  if (!contact || !contact.id) return;
  const name = document.getElementById("editContactName").value.trim();
  const email = document.getElementById("editContactEmail").value.trim();
  const phone = document.getElementById("editContactPhone").value.trim();
  if (!validateEditForm(name, email, phone)) return;
  await saveEditedContact(contact.id, name, email, phone);
}

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("addContactForm");
  if (form) form.addEventListener("submit", handleAddContactSubmit);
  const editForm = document.getElementById("editContactForm");
  if (editForm) editForm.addEventListener("submit", handleEditContactSubmit);
});
