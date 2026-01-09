(function () {
  class StartScene extends Phaser.Scene {
    constructor() {
      super("StartScene");
      this.startUI = null;
      this.tutorial = null;
    }

    create() {
      this.cameras.main.setBackgroundColor(0x0b0f14);

      // Unlock audio on first user gesture (mobile)
      this.input.once("pointerdown", () => window.AudioUtil.unlock());

      const hs = window.StorageUtil.loadHighScore();

      this.startUI = window.UIFactory.createStartScreen(
        this,
        hs,
        () => this.scene.start("GameScene"),
        () => this.showTutorial()
      );

      this.tutorial = window.UIFactory.createTutorialOverlay(this, () => {
        window.StorageUtil.setTutorialSeen();
        this.tutorial.hide();
      });

      // If first time, show tutorial once
      if (!window.StorageUtil.isTutorialSeen()) {
        this.showTutorial();
      }
    }

    showTutorial() {
      if (!this.tutorial) return;
      this.tutorial.show();
    }
  }

  window.StartScene = StartScene;
})();
