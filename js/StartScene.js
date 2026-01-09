(function () {
  class StartScene extends Phaser.Scene {
    constructor() {
      super("StartScene");
      this.startUI = null;
      this.tutorial = null;
    }

    create() {
      this.cameras.main.setBackgroundColor(0x0b0f14);

      window.AudioUtil.setScene(this);

      this.input.once("pointerdown", () => window.AudioUtil.unlock());

      const hs = window.StorageUtil.loadHighScore();

      this.startUI = window.UIFactory.createStartScreen(
        this,
        hs,
        () => { window.AudioUtil.ui(); this.scene.start("GameScene"); },
        () => { window.AudioUtil.ui(); this.showTutorial(); }
      );

      this.tutorial = window.UIFactory.createTutorialOverlay(this, () => {
        window.StorageUtil.setTutorialSeen();
        this.tutorial.hide();
      });

      if (!window.StorageUtil.isTutorialSeen()) this.showTutorial();
    }

    showTutorial() {
      if (this.tutorial) this.tutorial.show();
    }
  }

  window.StartScene = StartScene;
})();
