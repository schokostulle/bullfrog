/**
 * Sichtbare Fehlerzeile am oberen Rand — Ersatz für die Entwicklerkonsole.
 * Fängt unbehandelte JS-Fehler automatisch ab. Zusätzlich kann jeder Teil
 * der App gezielt window.showDebugError("...") aufrufen, um einen Fehler
 * anzuzeigen, den er selbst per try/catch abgefangen hat.
 *
 * Diese Datei muss als ERSTES <script> geladen werden (vor allen anderen),
 * damit auch Fehler aus später geladenen Skripten erfasst werden.
 */
(function () {
  const queue = [];
  let barEl = null;

  function ensureBar() {
    if (barEl) return barEl;
    barEl = document.createElement("div");
    barEl.id = "debug-bar";
    barEl.className = "debug-bar";
    barEl.innerHTML =
      '<span class="debug-bar-count"></span>' +
      '<span class="debug-bar-text"></span>' +
      '<button type="button" class="debug-bar-close" aria-label="Fehlermeldung schließen">&times;</button>';
    document.body.prepend(barEl);
    barEl.querySelector(".debug-bar-close").addEventListener("click", () => {
      barEl.classList.remove("show");
    });
    return barEl;
  }

  function render() {
    if (!document.body) {
      document.addEventListener("DOMContentLoaded", render, { once: true });
      return;
    }
    const bar = ensureBar();
    bar.querySelector(".debug-bar-count").textContent = `Fehler ${queue.length}:`;
    bar.querySelector(".debug-bar-text").textContent = queue[queue.length - 1];
    bar.classList.add("show");
  }

  function showDebugError(message) {
    queue.push(String(message));
    render();
    // Bleibt zusätzlich in der Konsole sichtbar, falls doch mal verfügbar
    if (window.console && console.error) console.error(message);
  }

  window.addEventListener("error", (e) => {
    const loc = e.filename ? ` (${e.filename.split("/").pop()}:${e.lineno})` : "";
    showDebugError((e.message || "Unbekannter Fehler") + loc);
  });

  window.addEventListener("unhandledrejection", (e) => {
    const reason = e.reason && e.reason.message ? e.reason.message : String(e.reason);
    showDebugError(reason);
  });

  window.showDebugError = showDebugError;
})();
