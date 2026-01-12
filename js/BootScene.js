// js/BootScene.js
export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload() {
    // Preload your audio files
    this.load.audio("tap", "assets/audio/tap.mp3");
    this.load.audio("cut", "assets/audio/cut.mp3");
    this.load.audio("perfect", "assets/audio/perfect.mp3");
    this.load.audio("combo", "assets/audio/combo.mp3");
    this.load.audio("lose", "assets/audio/lose.mp3");
    this.load.audio("ui", "assets/audio/ui.mp3");
  }

  create() {
    // Start game scene (UI menu is HTML overlay from ui.js)
    this.scene.start("GameScene");
  }
}
