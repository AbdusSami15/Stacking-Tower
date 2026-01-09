(function () {
  const C = window.GameConstants;

  const config = {
    type: Phaser.AUTO,
    parent: "game",
    backgroundColor: "#0b0f14",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: C.DESIGN_W,
      height: C.DESIGN_H
    },
    scene: [window.BootScene, window.GameScene],
    fps: {
      target: 60,
      forceSetTimeOut: true
    },
    input: {
      activePointers: 1
    }
  };

  new Phaser.Game(config);
})();
