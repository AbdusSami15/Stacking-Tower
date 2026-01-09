(function () {
  function makeText(scene, x, y, text, size, color) {
    return scene.add.text(x, y, text, {
      fontFamily: "Arial",
      fontSize: size + "px",
      color: color
    }).setDepth(200);
  }

  window.UIFactory = {
    createHUD: function (scene) {
      const c = window.GameConstants.UI;

      const scoreText = makeText(scene, c.scoreX, c.scoreY, "Score: 0", 20, "#ffffff");
      const highText = makeText(scene, c.scoreX, c.highY, "High: 0", 16, "#cbd5e1");

      const hintText = makeText(scene, scene.scale.width * 0.5, 80, "Tap to drop", 16, "#94a3b8")
        .setOrigin(0.5);

      return { scoreText, highText, hintText };
    },

    createToast: function (scene) {
      const t = makeText(scene, scene.scale.width * 0.5, 120, "", 18, "#ffffff")
        .setOrigin(0.5)
        .setAlpha(0)
        .setDepth(250);

      return {
        show: function (msg) {
          t.setText(msg);
          scene.tweens.killTweensOf(t);
          t.setAlpha(0);
          scene.tweens.add({
            targets: t,
            alpha: 1,
            duration: 120,
            ease: "Quad.out",
            yoyo: true,
            hold: 420,
            onComplete: () => t.setAlpha(0)
          });
        }
      };
    },

    createGameOverOverlay: function (scene, onRestart) {
      const w = scene.scale.width;
      const h = scene.scale.height;

      const root = scene.add.container(0, 0).setDepth(500).setVisible(false);

      const dim = scene.add.rectangle(w * 0.5, h * 0.5, w, h, 0x000000, 0.65);

      const title = scene.add.text(w * 0.5, h * 0.34, "GAME OVER", {
        fontFamily: "Arial",
        fontSize: "34px",
        color: "#ffffff"
      }).setOrigin(0.5);

      const info = scene.add.text(w * 0.5, h * 0.44, "", {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#e2e8f0",
        align: "center"
      }).setOrigin(0.5);

      const btn = scene.add.rectangle(w * 0.5, h * 0.58, 200, 54, 0x22c55e, 1);
      btn.setInteractive({ useHandCursor: true });

      const btnText = scene.add.text(w * 0.5, h * 0.58, "RESTART", {
        fontFamily: "Arial",
        fontSize: "20px",
        color: "#0b0f14"
      }).setOrigin(0.5);

      const sub = scene.add.text(w * 0.5, h * 0.66, "Tap anywhere to restart", {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#94a3b8"
      }).setOrigin(0.5);

      btn.on("pointerdown", function () {
        if (typeof onRestart === "function") onRestart();
      });

      root.add([dim, title, info, btn, btnText, sub]);

      return {
        root,
        setVisible: function (v) { root.setVisible(v); },
        setInfo: function (score, high) { info.setText("Score: " + score + "\nHigh: " + high); }
      };
    }
  };
})();
