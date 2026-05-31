(async function loadCounter() {
  const FIREBASE_URL =
    "https://join-60a91-default-rtdb.europe-west1.firebasedatabase.app";
  const LIMIT = 10;
  try {
    const res = await fetch(`${FIREBASE_URL}/dailyCounter.json`);
    if (!res.ok) return;
    const data = await res.json();
    if (!data) return;

    const today = new Date().toISOString().slice(0, 10);
    const used = data.date === today ? (data.used || 0) : 0;

    const usedEl = document.getElementById("requests-used");
    const limitEl = document.getElementById("requests-limit");
    if (usedEl) usedEl.textContent = used;
    if (limitEl) limitEl.textContent = LIMIT;
  } catch (_err) {
    /* Silently fail – static fallback 0/10 stays visible */
  }
})();
