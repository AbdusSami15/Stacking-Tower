// js/ui.js
export default class HtmlUI {
  constructor() {
    this.txtScore = document.getElementById("txt-score");
    this.txtBest = document.getElementById("txt-best");

    this.txtBest2 = document.getElementById("txt-best2");
    this.txtLast = document.getElementById("txt-last");

    this.over = document.getElementById("ui-gameover");
    this.menu = document.getElementById("ui-menu");
    this.settings = document.getElementById("ui-settings");

    this.txtOverScore = document.getElementById("txt-overScore");
    this.txtOverBest = document.getElementById("txt-overBest");

    this.btnPlay = document.getElementById("btn-play");
    this.btnRestart = document.getElementById("btn-restart");
    this.btnBackMenu = document.getElementById("btn-backMenu");

    this.btnSound = document.getElementById("btn-sound");
    this.btnSettings = document.getElementById("btn-settings");
    this.icoSound = document.getElementById("ico-sound");

    this.btnCloseSettings = document.getElementById("btn-closeSettings");
    this.btnCloseSettings2 = document.getElementById("btn-closeSettings2");
    this.btnSound2 = document.getElementById("btn-sound2");
    this.btnRestart2 = document.getElementById("btn-restart2");

    this.onPlay = null;
    this.onRestart = null;
    this.onToggleSound = null;
    this.onSettingsOpen = null;
    this.onSettingsClose = null;
    this.onBackMenu = null;

    this.btnPlay.addEventListener("click", () => this.onPlay && this.onPlay());
    this.btnRestart.addEventListener("click", () => this.onRestart && this.onRestart());
    this.btnBackMenu.addEventListener("click", () => this.onBackMenu && this.onBackMenu());

    this.btnSound.addEventListener("click", () => this.onToggleSound && this.onToggleSound());
    this.btnSettings.addEventListener("click", () => this.onSettingsOpen && this.onSettingsOpen());

    this.btnCloseSettings.addEventListener("click", () => this.onSettingsClose && this.onSettingsClose());
    this.btnCloseSettings2.addEventListener("click", () => this.onSettingsClose && this.onSettingsClose());

    this.btnSound2.addEventListener("click", () => this.onToggleSound && this.onToggleSound());
    this.btnRestart2.addEventListener("click", () => this.onRestart && this.onRestart());
  }

  setScore(v) {
    const s = String(v | 0);
    this.txtScore.textContent = s;
  }

  setBest(v) {
    const b = v | 0;
    this.txtBest.textContent = `BEST ${b}`;
    if (this.txtBest2) this.txtBest2.textContent = String(b);
    if (this.txtOverBest) this.txtOverBest.textContent = String(b);
  }

  setLast(v) {
    if (this.txtLast) this.txtLast.textContent = String(v | 0);
  }

  setSoundMuted(isMuted) {
    if (!this.icoSound) return;
    this.icoSound.textContent = isMuted ? "🔇" : "🔊";
  }

  showMenu() {
    this.menu.classList.remove("ui-hidden");
    this.over.classList.add("ui-hidden");
  }

  showGameOver(score, best) {
    this.menu.classList.add("ui-hidden");
    this.over.classList.remove("ui-hidden");
    if (this.txtOverScore) this.txtOverScore.textContent = String(score | 0);
    if (this.txtOverBest) this.txtOverBest.textContent = String(best | 0);
  }

  hideAllOverlays() {
    this.menu.classList.add("ui-hidden");
    this.over.classList.add("ui-hidden");
  }

  openSettings() {
    this.settings.classList.remove("ui-hidden");
  }

  closeSettings() {
    this.settings.classList.add("ui-hidden");
  }
}

export const UI = new HtmlUI();
