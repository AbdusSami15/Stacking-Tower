// js/ui.js
export const UI = (() => {
  const $ = (id) => document.getElementById(id);

  const el = {
    // Buttons
    btnPlay: $("btn-play"),
    btnRestart: $("btn-restart"),
    btnBackMenu: $("btn-backMenu"),
    btnSound: $("btn-sound"),
    btnSettings: $("btn-settings"),

    // Labels
    txtScore: $("txt-score"),
    txtBestTop: $("txt-best"),
    txtBestMenu: $("txt-best2"),
    txtLast: $("txt-last"),

    // Gameover labels
    txtOverScore: $("txt-overScore"),
    txtOverBest: $("txt-overBest"),

    // Panels
    menu: $("ui-menu"),
    gameover: $("ui-gameover"),

    // Sound icon
    icoSound: $("ico-sound"),
  };

  const api = {
    onPlay: null,
    onRestart: null,
    onBackMenu: null,
    onToggleSound: null,

    // Kept for compatibility (no settings panel now)
    onSettingsOpen: null,
    onSettingsClose: null,

    setScore(v) {
      const val = (v | 0).toString();
      if (el.txtScore) el.txtScore.textContent = val;
    },

    setBest(v) {
      const val = (v | 0);
      if (el.txtBestTop) el.txtBestTop.textContent = `BEST ${val}`;
      if (el.txtBestMenu) el.txtBestMenu.textContent = `${val}`;
      if (el.txtOverBest) el.txtOverBest.textContent = `${val}`;
    },

    setLast(v) {
      const val = (v | 0);
      if (el.txtLast) el.txtLast.textContent = `${val}`;
    },

    setSoundMuted(isMuted) {
      // If you are using an icon font/svg later, update here only.
      if (!el.icoSound) return;
      el.icoSound.textContent = isMuted ? "🔇" : "🔊";
    },

    showMenu() {
      if (el.menu) el.menu.classList.remove("ui-hidden");
      if (el.gameover) el.gameover.classList.add("ui-hidden");
    },

    showGameOver(score, best) {
      if (el.menu) el.menu.classList.add("ui-hidden");
      if (el.gameover) el.gameover.classList.remove("ui-hidden");

      if (el.txtOverScore) el.txtOverScore.textContent = `${score | 0}`;
      if (el.txtOverBest) el.txtOverBest.textContent = `${best | 0}`;
    },

    hideAllOverlays() {
      if (el.menu) el.menu.classList.add("ui-hidden");
      if (el.gameover) el.gameover.classList.add("ui-hidden");
    },

    // Settings removed
    openSettings() {},
    closeSettings() {},
  };

  function safeCall(fn) {
    try { fn && fn(); } catch (_) {}
  }

  function bindOnce() {
    // Settings panel removed: hide settings button
    if (el.btnSettings) el.btnSettings.style.display = "none";

    if (el.btnPlay) {
      el.btnPlay.addEventListener("click", () => safeCall(api.onPlay));
    }

    if (el.btnRestart) {
      el.btnRestart.addEventListener("click", () => safeCall(api.onRestart));
    }

    if (el.btnBackMenu) {
      el.btnBackMenu.addEventListener("click", () => safeCall(api.onBackMenu));
    }

    if (el.btnSound) {
      el.btnSound.addEventListener("click", () => safeCall(api.onToggleSound));
    }
  }

  bindOnce();
  return api;
})();
