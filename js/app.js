// js/app.js
import { UI } from "./ui.js";
import GameScene from "./GameScene.js";

const BEST_KEY = "stacking_tower_best";
const LAST_KEY = "stacking_tower_last";
const MUTE_KEY = "stacking_tower_mute";

let game = null;

function getInt(key) {
  return parseInt(localStorage.getItem(key) || "0", 10) | 0;
}
function setInt(key, v) {
  localStorage.setItem(key, String(v | 0));
}

function getMute() {
  return localStorage.getItem(MUTE_KEY) === "1";
}
function setMute(v) {
  localStorage.setItem(MUTE_KEY, v ? "1" : "0");
}

function createGame() {
  if (game) return game;

  const config = {
    type: Phaser.AUTO,
    parent: "game",
    backgroundColor: "#0b0f14",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 720,
      height: 1280,
    },
    render: { pixelArt: false, antialias: true, roundPixels: false },
    physics: {
      default: "arcade",
      arcade: { gravity: { y: 900 }, debug: false },
    },
    scene: [GameScene],
  };

  game = new Phaser.Game(config);
  game.sound.mute = getMute();
  UI.setSoundMuted(game.sound.mute);

  return game;
}

function startRun() {
  const g = createGame();
  UI.hideAllOverlays();
  UI.setScore(0);

  g.scene.stop("GameScene");
  g.scene.start("GameScene");
}

function backToMenu() {
  createGame();
  UI.showMenu();
}

function toggleSound() {
  const g = createGame();
  g.sound.mute = !g.sound.mute;
  setMute(g.sound.mute);
  UI.setSoundMuted(g.sound.mute);
}

function openSettings() {
  createGame();
  UI.openSettings();
  if (game) game.scene.pause("GameScene");
}

function closeSettings() {
  UI.closeSettings();
  if (game) game.scene.resume("GameScene");
}

// init UI
UI.setScore(0);
UI.setBest(getInt(BEST_KEY));
UI.setLast(getInt(LAST_KEY));
UI.setSoundMuted(getMute());
UI.showMenu();

// wire
UI.onPlay = startRun;
UI.onRestart = startRun;
UI.onBackMenu = backToMenu;
UI.onToggleSound = toggleSound;
UI.onSettingsOpen = openSettings;
UI.onSettingsClose = closeSettings;

// expose helpers for GameScene to call (optional)
window.__STACKING_APP__ = {
  setBest: (v) => { setInt(BEST_KEY, v); UI.setBest(v); },
  setLast: (v) => { setInt(LAST_KEY, v); UI.setLast(v); },
  getBest: () => getInt(BEST_KEY),
};
