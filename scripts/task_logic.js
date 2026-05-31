
const AVATAR_COLORS = [
  "rgb(110, 82, 255)",
  "rgb(253, 112, 255)",
  "rgb(70, 47, 138)",
  "rgb(255, 188, 43)",
  "rgb(30, 214, 193)",
  "rgb(255, 123, 0)",
];

/**
 * Returns all uppercase initials from each word in a name.
 * @param {string} [name=""]
 * @returns {string}
 */
function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => (part[0] || "").toUpperCase())
    .join("");
}

/**
 * Picks a colour from AVATAR_COLORS based on a hash of the name and the index offset.
 * @param {string} [name=""]
 * @param {number} [index=0]
 * @returns {string} CSS colour string.
 */
function getAvatarColor(name = "", index = 0) {
  if (!AVATAR_COLORS.length) {
    return "#ff7a00";
  }

  const nameStr = String(name || "");
  const hash = nameStr
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const colorIndex = (hash + index) % AVATAR_COLORS.length;
  return AVATAR_COLORS[colorIndex];
}

/**
 * Returns the first letter of the first word and the first letter of the last word.
 * @param {string} name
 * @returns {string}
 */
function getInitialsFromName(name) {
  var parts = String(name).trim().split(" ");
  if (!parts.length) return "";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (
    parts[0].charAt(0).toUpperCase() +
    parts[parts.length - 1].charAt(0).toUpperCase()
  );
}

/**
 * Converts a YYYY-MM-DD date string to DD/MM/YY format.
 * @param {string} dateStr
 * @returns {string}
 */
function formatDateToDDMMYY(dateStr) {
  if (!dateStr) return "-";
  const parts = String(dateStr).split("-");
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  const yy = y.slice(2);
  return `${d}/${m}/${yy}`;
}

/**
 * Capitalises the first character of a string.
 * @param {string} str
 * @returns {string}
 */
function capitalize(str) {
  if (!str) return "";
  str = String(str);
  return str.charAt(0).toUpperCase() + str.slice(1);
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

/**
 * Normalises a priority value to "Urgent", "Medium", or "Low".
 * @param {string} p
 * @returns {"Urgent"|"Medium"|"Low"}
 */
function normalizePriority(p) {
  const v = String(p || "Medium").toLowerCase();
  if (v.startsWith("u")) return "Urgent";
  if (v.startsWith("l")) return "Low";
  return "Medium";
}

/**
 * Returns the HEX colour associated with a given priority level.
 * @param {string} priority
 * @returns {string}
 */
function priorityColor(priority) {
  const p = normalizePriority(priority);
  if (p === "Urgent") return "#ff3d00";
  if (p === "Low") return "#5be84a";
  return "#ffab2b";
}
