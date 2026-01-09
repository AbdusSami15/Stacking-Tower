(function () {
  class GameScene extends Phaser.Scene {
    constructor() {
      super("GameScene");

      this.stack = [];
      this.current = null;
      this.moveTween = null;

      this.score = 0;
      this.highScore = 0;
      this.isGameOver = false;
      this.inputLocked = false;

      this.minX = 0;
      this.maxX = 0;
      this.baseY = 0;

      this.bgIndex = 0;
      this.blockColorIndex = 0;
    }

    create() {
      this.applyBg(0);

      this.highScore = window.StorageUtil.loadHighScore();

      this.hud = window.UIFactory.createHUD(this);
      this.toast = window.UIFactory.createToast(this);
      this.overlay = window.UIFactory.createGameOverOverlay(this, () => this.restartGame());

      this.updateHUD();

      this.input.on("pointerdown", () => {
        if (this.isGameOver) {
          this.restartGame();
          return;
        }
        if (this.inputLocked) return;
        this.dropBlock();
      });

      this.scale.on("resize", () => {
        this.recomputeBounds();
        // rebuild overlay/hud positioning if needed
        // (HUD uses fixed top-left, okay. Overlay needs rebuild)
        this.overlay.root.destroy();
        this.overlay = window.UIFactory.createGameOverOverlay(this, () => this.restartGame());
        if (this.isGameOver) {
          this.overlay.setInfo(this.score, this.highScore);
          this.overlay.setVisible(true);
        }
      });

      this.recomputeBounds();
      this.startGame();
    }

    recomputeBounds() {
      const pad = window.GameConstants.GAMEPLAY.edgePadding;

      this.baseY = Math.floor(this.scale.height * 0.86);
      this.minX = pad;
      this.maxX = this.scale.width - pad;
    }

    // ---------- Game lifecycle ----------
    startGame() {
      this.clearAll();

      this.isGameOver = false;
      this.inputLocked = false;
      this.score = 0;

      this.hud.hintText.setVisible(true);

      this.applyBg(0);
      this.updateHUD();

      // Base block
      const baseW = window.GameConstants.GAMEPLAY.baseWidth;
      const baseH = window.GameConstants.GAMEPLAY.blockHeight;

      const base = this.makeBlock(this.scale.width * 0.5, this.baseY, baseW, baseH, this.pickBlockColor());
      base.depth = 5;
      this.stack.push(base);

      // First moving block
      this.spawnNextBlock();
    }

    restartGame() {
      // small lock to avoid double taps during destroy/recreate
      this.inputLocked = true;
      this.hideGameOver();

      this.time.delayedCall(80, () => {
        this.startGame();
      });
    }

    clearAll() {
      this.stopMoveTween();

      if (this.current) {
        this.current.destroy();
        this.current = null;
      }

      for (let i = 0; i < this.stack.length; i++) {
        this.stack[i].destroy();
      }
      this.stack.length = 0;

      this.hideGameOver();
    }

    // ---------- Blocks ----------
    makeBlock(x, y, w, h, color) {
      const r = this.add.rectangle(x, y, w, h, color, 1);
      r.setOrigin(0.5, 0.5);
      return r;
    }

    pickBgColor() {
      const arr = window.GameConstants.BG_COLORS;
      this.bgIndex = (this.bgIndex + 1) % arr.length;
      return arr[this.bgIndex];
    }

    pickBlockColor() {
      const arr = window.GameConstants.BLOCK_COLORS;
      this.blockColorIndex = (this.blockColorIndex + 1) % arr.length;
      return arr[this.blockColorIndex];
    }

    applyBg(forceIndex) {
      const arr = window.GameConstants.BG_COLORS;
      const c = arr[Math.abs(forceIndex) % arr.length];
      this.cameras.main.setBackgroundColor(c);
    }

    spawnNextBlock() {
      const prev = this.stack[this.stack.length - 1];

      const nextY = prev.y - window.GameConstants.GAMEPLAY.verticalStep;
      const nextW = prev.width;
      const nextH = window.GameConstants.GAMEPLAY.blockHeight;

      const block = this.makeBlock(this.minX, nextY, nextW, nextH, this.pickBlockColor());
      block.depth = 10;

      this.current = block;
      this.startMoveTween(block);

      this.keepTowerInView();
      this.inputLocked = false;
    }

    startMoveTween(block) {
      this.stopMoveTween();

      const dist = this.maxX - this.minX;
      const speed = window.GameConstants.GAMEPLAY.moveSpeed; // px/sec
      const duration = Math.max(420, Math.floor((dist / speed) * 1000));

      this.moveTween = this.tweens.add({
        targets: block,
        x: this.maxX,
        duration,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut"
      });
    }

    stopMoveTween() {
      if (this.moveTween) {
        this.moveTween.stop();
        this.moveTween = null;
      }
    }

    dropBlock() {
      if (!this.current) return;

      this.inputLocked = true;
      this.hud.hintText.setVisible(false);
      this.stopMoveTween();

      const prev = this.stack[this.stack.length - 1];
      const cur = this.current;

      const prevL = prev.x - prev.width * 0.5;
      const prevR = prev.x + prev.width * 0.5;

      const curL = cur.x - cur.width * 0.5;
      const curR = cur.x + cur.width * 0.5;

      const left = Math.max(prevL, curL);
      const right = Math.min(prevR, curR);
      const overlap = right - left;

      if (overlap <= 0) {
        this.missAnim(cur);
        this.current = null;
        this.onGameOver();
        return;
      }

      // Perfect check
      const perfectPx = window.GameConstants.GAMEPLAY.perfectThresholdPx;
      const delta = Math.abs(cur.x - prev.x);
      const isPerfect = delta <= perfectPx;

      // cutoff pieces (polish)
      const cutLeftW = Math.max(0, left - curL);
      const cutRightW = Math.max(0, curR - right);
      if (cutLeftW > 0.5) this.spawnCutoff(cur, curL, left);
      if (cutRightW > 0.5) this.spawnCutoff(cur, right, curR);

      // Trim
      cur.width = overlap;
      cur.x = (left + right) * 0.5;

      // settle bounce
      this.tweens.add({
        targets: cur,
        y: cur.y + 2,
        duration: 70,
        yoyo: true,
        ease: "Quad.out"
      });

      this.stack.push(cur);
      this.current = null;

      // Score
      this.score += 1;
      if (isPerfect) {
        this.score += window.GameConstants.GAMEPLAY.perfectBonus;
        this.toast.show("Perfect +" + window.GameConstants.GAMEPLAY.perfectBonus);
        this.cameras.main.shake(70, 0.004);
      }

      // Background shift
      this.cameras.main.setBackgroundColor(this.pickBgColor());

      this.updateHUD();

      // Next block
      this.spawnNextBlock();
    }

    spawnCutoff(block, pieceL, pieceR) {
      const w = pieceR - pieceL;
      if (w <= 0) return;

      const x = (pieceL + pieceR) * 0.5;
      const y = block.y;

      const piece = this.makeBlock(x, y, w, block.height, block.fillColor, 1);
      piece.depth = 1;

      this.tweens.add({
        targets: piece,
        y: y + 240,
        angle: Phaser.Math.Between(-10, 10),
        alpha: 0,
        duration: 520,
        ease: "Quad.in",
        onComplete: () => piece.destroy()
      });
    }

    missAnim(block) {
      this.tweens.add({
        targets: block,
        y: block.y + 320,
        alpha: 0,
        duration: 560,
        ease: "Quad.in",
        onComplete: () => block.destroy()
      });
    }

    keepTowerInView() {
      const top = this.stack[this.stack.length - 1];
      const minY = Math.floor(this.scale.height * 0.28);

      if (top.y < minY) {
        const dy = minY - top.y;

        // Smooth shift (polish)
        const all = this.stack.slice();
        if (this.current) all.push(this.current);

        this.tweens.add({
          targets: all,
          y: "+=" + dy,
          duration: 140,
          ease: "Quad.out"
        });
      }
    }

    // ---------- UI / GameOver ----------
    updateHUD() {
      this.hud.scoreText.setText("Score: " + this.score);
      this.hud.highText.setText("High: " + this.highScore);
    }

    onGameOver() {
      this.isGameOver = true;
      this.inputLocked = false;
      this.stopMoveTween();

      if (this.score > this.highScore) {
        this.highScore = this.score;
        window.StorageUtil.saveHighScore(this.highScore);
      }

      this.updateHUD();
      this.showGameOver();
    }

    showGameOver() {
      this.overlay.setInfo(this.score, this.highScore);
      this.overlay.setVisible(true);
    }

    hideGameOver() {
      if (this.overlay) this.overlay.setVisible(false);
    }
  }

  window.GameScene = GameScene;
})();
