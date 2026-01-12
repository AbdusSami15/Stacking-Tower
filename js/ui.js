// js/ui.js
export class HtmlUI {
  constructor() {
    this.root = document.getElementById("ui-root");

    this.txtScore = document.getElementById("txt-score");
    this.centerPrompt = document.getElementById("ui-centerPrompt");
    this.txtPrompt = document.getElementById("txt-prompt");

    this.btnPlay = document.getElementById("btn-play");
    this.btnRestart = document.getElementById("btn-restart");
    this.btnSound = document.getElementById("btn-sound");
    this.btnSettings = document.getElementById("btn-settings");

    this.onPlay = null;
    this.onRestart = null;
    this.onToggleSound = null;
    this.onSettings = null;

    this.btnPlay.addEventListener("click", () => this.onPlay && this.onPlay());
    this.btnRestart.addEventListener("click", () => this.onRestart && this.onRestart());
    this.btnSound.addEventListener("click", () => this.onToggleSound && this.onToggleSound());
    this.btnSettings.addEventListener("click", () => this.onSettings && this.onSettings());
  }

  show() { this.root.classList.remove("ui-hidden"); }
  hide() { this.root.classList.add("ui-hidden"); }

  setScore(v) { this.txtScore.textContent = String(v | 0); }

  showPrompt(text) {
    if (text) this.txtPrompt.textContent = text;
    this.centerPrompt.classList.remove("ui-hidden");
  }

  hidePrompt() { this.centerPrompt.classList.add("ui-hidden"); }

  setState(state) {
    this.show();

    if (state === "menu") {
      this.btnPlay.classList.remove("ui-hidden");
      this.btnRestart.classList.add("ui-hidden");
      this.showPrompt("TAP TO START");
    } else if (state === "playing") {
      this.btnPlay.classList.add("ui-hidden");
      this.btnRestart.classList.add("ui-hidden");
      this.hidePrompt();
    } else if (state === "gameover") {
      this.btnPlay.classList.add("ui-hidden");
      this.btnRestart.classList.remove("ui-hidden");
      this.showPrompt("GAME OVER");
    }
  }
}
