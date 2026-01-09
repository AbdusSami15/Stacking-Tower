(() => {
  if (window.__GAME__) return;

  function viewport() {
    return {
      w: Math.max(1, window.innerWidth),
      h: Math.max(1, window.innerHeight)
    };
  }

  class BootScene extends Phaser.Scene {
    constructor() {
      super("BootScene");
    }

    create() {
      const { width, height } = this.scale;

      this.cameras.main.setBackgroundColor("#0b0f14");

      const text = this.add.text(
        width / 2,
        height / 2,
        "BOOT SCENE\nFullscreen OK",
        {
          fontFamily: "Arial",
          fontSize: "32px",
          color: "#ffffff",
          align: "center"
        }
      ).setOrigin(0.5);

      this.scale.on("resize", (size) => {
        this.cameras.main.setSize(size.width, size.height);
        text.setPosition(size.width / 2, size.height / 2);
      });

      // Later:
      // this.scene.start("MenuScene");
    }
  }

  const { w, h } = viewport();

  const config = {
    type: Phaser.AUTO,
    parent: "game",
    width: w,
    height: h,
    backgroundColor: "#000000",
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    render: {
      pixelArt: true,
      antialias: false
    },
    fps: {
      target: 60,
      forceSetTimeOut: true
    },
    scene: [BootScene]
  };

  window.__GAME__ = new Phaser.Game(config);

  const resize = () => {
    const { w, h } = viewport();
    window.__GAME__.scale.resize(w, h);
  };

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("orientationchange", resize, { passive: true });

  // Optional fullscreen on first tap (mobile)
  const fsOnce = () => {
    document.removeEventListener("pointerdown", fsOnce);
    const el = document.documentElement;
    if (el.requestFullscreen && !document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
    }
  };
  document.addEventListener("pointerdown", fsOnce, { passive: true });
})();
