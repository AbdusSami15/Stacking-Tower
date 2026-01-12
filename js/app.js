// js/app.js
import { HtmlUI } from "./ui.js";
import GameScene from "./GameScene.js";

export const UI = new HtmlUI();
UI.show();
UI.setState("menu");

let game = null;

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
  return game;
}

UI.onPlay = () => {
  const g = createGame();
  g.scene.start("GameScene");
  UI.setState("playing");
};

UI.onRestart = () => {
  if (!game) return;
  game.scene.stop("GameScene");
  game.scene.start("GameScene");
  UI.setState("playing");
};

UI.onToggleSound = () => {
  if (!game) return;
  game.sound.mute = !game.sound.mute;
};

UI.onSettings = () => {};
