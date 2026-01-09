(function () {
  class BootScene extends Phaser.Scene {
    constructor() {
      super("BootScene");
    }

    create() {
      // No assets required (pure rectangles). Later you can load sprites here.
      this.scene.start("GameScene");
    }
  }

  window.BootScene = BootScene;
})();
