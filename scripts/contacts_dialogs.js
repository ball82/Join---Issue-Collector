function openAddContactDialog() {
  const dialog = document.getElementById("addContactDialog");
  if (dialog) {
    dialog.classList.add("active");
    document.body.style.overflow = "hidden";
  }
}

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

function getContactInitials(name) {
  return (name || "")
    .split(" ")
    .map((s) => s.charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function fillEditContactDialog(contact) {
  document.getElementById("editContactName").value = contact.name || "";
  document.getElementById("editContactEmail").value = contact.email || "";
  document.getElementById("editContactPhone").value = contact.phone || "";
  const avatar = document.getElementById("editContactAvatar");
  if (avatar) avatar.textContent = getContactInitials(contact.name);
}

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

function restoreMobileContactView() {
  const isMobile = window.innerWidth <= 1023;
  if (isMobile) {
    const contact = window.getCurrentContact();
    if (contact) window.showMobileContactDetail(contact);
  }
}

function closeEditContactDialog() {
  const dialog = document.getElementById("editContactDialog");
  if (dialog) {
    dialog.classList.remove("active");
    document.body.style.overflow = "";
    clearValidationErrors("edit");
  }
  restoreMobileContactView();
}

function deleteContactFromDialog() {
  deleteCurrentContact();
  closeEditContactDialog();
}

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

async function deleteCurrentContact() {
  const contact = window.getCurrentContact();
  if (!contact || !contact.id) {
    alert("No contact selected!");
    return;
  }
  if (!confirm(`Do you really want to delete ${contact.name}?`)) return;
  await removeContactFromFirebase(contact);
}

function findContactItemByName(name) {
  const items = document.querySelectorAll(".contact-item");
  for (const item of items) {
    const nameEl = item.querySelector(".user-name");
    if (nameEl && nameEl.textContent === name) return item;
  }
  return null;
}

function selectNewlyAddedContact(id, name, email, phone) {
  const contact = { id, name, email, phone };
  if (window.innerWidth <= 1023) {
    window.showMobileContactDetail(contact);
    return;
  }
  const item = findContactItemByName(name);
  if (item) item.click();
}

function buildSuccessMessageHTML(message) {
  return `<div class="success-message-wrapper"><div class="contact-success-message">${message}</div></div>`;
}

function showSuccessMessage(message) {
  const infoArea = document.querySelector(".info-contact-area");
  if (!infoArea) return;
  const originalContent = infoArea.innerHTML;
  infoArea.innerHTML = buildSuccessMessageHTML(message);
  setTimeout(() => { infoArea.innerHTML = originalContent; }, 2000);
}

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

function validatePhone(value, inputId, errorId) {
  if (!value) {
    showValidationError(inputId, errorId, "Please enter a phone number");
    return false;
  }
  return validatePhoneFormat(value, inputId, errorId);
}

function validateAddForm(name, email, phone) {
  const nameOk = validateName(name, "newContactName", "errorContactName");
  const emailOk = validateEmail(email, "newContactEmail", "errorContactEmail");
  const phoneOk = validatePhone(phone, "newContactPhone", "errorContactPhone");
  return nameOk && emailOk && phoneOk;
}

function validateEditForm(name, email, phone) {
  const nameOk = validateName(name, "editContactName", "errorEditName");
  const emailOk = validateEmail(email, "editContactEmail", "errorEditEmail");
  const phoneOk = validatePhone(phone, "editContactPhone", "errorEditPhone");
  return nameOk && emailOk && phoneOk;
}

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
