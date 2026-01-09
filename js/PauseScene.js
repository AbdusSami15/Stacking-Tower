(function () {
  class PauseScene extends Phaser.Scene {
    constructor() {
      super("PauseScene");
      this.fromKey = "GameScene";
    }

    init(data) {
      this.fromKey = (data && data.from) ? data.from : "GameScene";
    }

    create() {
      const w = this.scale.width;
      const h = this.scale.height;

      this.cameras.main.setBackgroundColor("rgba(0,0,0,0)");

      // Ensure audio unlocked on mobile
      this.input.once("pointerdown", () => window.AudioUtil.unlock());
      window.AudioUtil.setScene(this);

      const dim = this.add.rectangle(w * 0.5, h * 0.5, w, h, 0x000000, 0.72).setScrollFactor(0);

      const title = this.add.text(w * 0.5, h * 0.32, "PAUSED", {
        fontFamily: "Arial",
        fontSize: "34px",
        color: "#ffffff"
      }).setOrigin(0.5).setScrollFactor(0);

      const resumeBtn = this.makeBtn(w * 0.5, h * 0.50, "RESUME");
      const menuBtn = this.makeBtn(w * 0.5, h * 0.60, "BACK TO MENU");

      resumeBtn.on("pointerdown", () => {
        window.AudioUtil.ui();
        this.scene.stop("PauseScene");
        this.scene.resume(this.fromKey);
      });

      menuBtn.on("pointerdown", () => {
        window.AudioUtil.ui();
        this.scene.stop(this.fromKey);
        this.scene.stop("PauseScene");
        this.scene.start("StartScene");
      });

      dim.setInteractive();
      dim.on("pointerdown", () => {
        window.AudioUtil.ui();
        this.scene.stop("PauseScene");
        this.scene.resume(this.fromKey);
      });
    }

    makeBtn(x, y, label) {
      const r = this.add.rectangle(x, y, 240, 56, 0x22c55e, 1).setOrigin(0.5).setScrollFactor(0);
      r.setInteractive({ useHandCursor: true });

      this.add.text(x, y, label, {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#0b0f14"
      }).setOrigin(0.5).setScrollFactor(0);

      return r;
    }
  }

  window.PauseScene = PauseScene;
})();
