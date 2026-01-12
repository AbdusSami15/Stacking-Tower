(function () {
  /**
   * Tower Stacking Game Scene (Step Camera Rise Every Tile)
   * - Camera moves up a little AFTER EVERY successful placement (not only when needed)
   * - Smooth pastel background color transition per tile
   * - Tiny zoom punch per placement
   * - Flush cutting aligned to previous block (outside piece falls, overlap stays)
   * - Uses displayWidth consistently + setSize/setDisplaySize (no visual drift)
   * - No speed increase (difficulty from shrinking blocks)
   */

  class GameScene extends Phaser.Scene {
    constructor() {
      super("GameScene");

      this.stack = [];
      this.current = null;
      this.moveTween = null;

      this.score = 0;
      this.highScore = 0;
      this.combo = 0;
      this.maxCombo = 0;
      this.isGameOver = false;
      this.inputLocked = false;

      this.minX = 0;
      this.maxX = 0;
      this.baseY = 0;

      this.blockColorIndex = 0;

      this.currentSpeed = 0;
      this.currentWidth = 0;

      // Camera + background
      this.cameraTween = null;
      this.zoomTween = null;
      this.bgTween = null;
      this.bgRect = null;

      // "Step rise" tracking
      this.cameraStepIndex = 0;

      // Pastel palette
      this.PASTEL_BG = [
        0xd8eaff,
        0xf6ddff,
        0xffe3ee,
        0xffe9de,
        0xfff1de,
        0xf0ffe6
      ];
      this.bgIndex = 0;
      this.currentBgColor = this.PASTEL_BG[0];
    }

    create() {
      this.highScore = window.StorageUtil.loadHighScore();

      this.createBackground();

      this.hud = window.UIFactory.createHUD(this);
      this.toast = window.UIFactory.createToast(this);
      this.overlay = window.UIFactory.createGameOverOverlay(this, () => this.restartGame());

      this.updateHUD();

      this.input.on("pointerdown", () => this.handleInput());
      this.scale.on("resize", () => this.handleResize());

      this.recomputeBounds();
      this.startGame();
    }

    // ---------- sizing helpers ----------
    getW(block) {
      return block && typeof block.displayWidth === "number" ? block.displayWidth : block.width;
    }

    setW(block, w) {
      if (!block) return;

      if (typeof block.setSize === "function") block.setSize(w, block.height);
      if (typeof block.setDisplaySize === "function") block.setDisplaySize(w, block.height);

      block.width = w;
      block.displayWidth = w;
    }

    left(block) {
      const w = this.getW(block);
      return block.x - w * 0.5;
    }

    right(block) {
      const w = this.getW(block);
      return block.x + w * 0.5;
    }
    // -----------------------------------

    createBackground() {
      const w = this.scale.width;
      const h = this.scale.height;

      if (this.bgRect) this.bgRect.destroy();

      this.bgRect = this.add.rectangle(w * 0.5, h * 0.5, w, h, this.currentBgColor, 1);
      this.bgRect.setOrigin(0.5, 0.5);
      this.bgRect.setScrollFactor(0);
      this.bgRect.depth = -1000;
    }

    tweenBackgroundTo(colorInt) {
      if (this.currentBgColor === colorInt) return;

      if (this.bgTween) this.bgTween.stop();

      const from = Phaser.Display.Color.IntegerToColor(this.currentBgColor);
      const to = Phaser.Display.Color.IntegerToColor(colorInt);

      this.bgTween = this.tweens.addCounter({
        from: 0,
        to: 100,
        duration: 240,
        ease: "Sine.out",
        onUpdate: (tw) => {
          const t = tw.getValue() / 100;
          const c = Phaser.Display.Color.Interpolate.ColorWithColor(from, to, 1, t);
          const out = Phaser.Display.Color.GetColor(c.r, c.g, c.b);
          this.bgRect.fillColor = out;
        },
        onComplete: () => {
          this.currentBgColor = colorInt;
        }
      });
    }

    pickNextPastelBg() {
      this.bgIndex = (this.bgIndex + 1) % this.PASTEL_BG.length;
      return this.PASTEL_BG[this.bgIndex];
    }

    startGame() {
      this.clearAll();

      this.isGameOver = false;
      this.inputLocked = false;
      this.score = 0;
      this.combo = 0;
      this.maxCombo = 0;

      this.currentSpeed = window.GameConstants.GAMEPLAY.moveSpeed;
      this.currentWidth = window.GameConstants.GAMEPLAY.baseWidth;

      // Reset camera
      const cam = this.cameras.main;
      cam.scrollY = 0;
      cam.zoom = 1;

      this.cameraStepIndex = 0;

      // Reset bg
      this.bgIndex = 0;
      this.currentBgColor = this.PASTEL_BG[0];
      if (this.bgRect) this.bgRect.fillColor = this.currentBgColor;

      this.hud.hintText.setVisible(true);
      this.updateHUD();

      const baseH = window.GameConstants.GAMEPLAY.blockHeight;
      const base = this.makeBlock(
        this.scale.width * 0.5,
        this.baseY,
        this.currentWidth,
        baseH,
        this.pickBlockColor()
      );
      base.depth = 5;
      this.setW(base, this.currentWidth);

      this.stack.push(base);
      this.spawnNextBlock();
    }

    restartGame() {
      this.inputLocked = true;
      this.hideGameOver();
      this.time.delayedCall(100, () => this.startGame());
    }

    clearAll() {
      this.stopMoveTween();

      if (this.cameraTween) {
        this.cameraTween.stop();
        this.cameraTween = null;
      }
      if (this.zoomTween) {
        this.zoomTween.stop();
        this.zoomTween = null;
      }
      if (this.bgTween) {
        this.bgTween.stop();
        this.bgTween = null;
      }

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

    makeBlock(x, y, w, h, color) {
      const block = this.add.rectangle(x, y, w, h, color, 1);
      block.setOrigin(0.5, 0.5);
      this.setW(block, w);
      return block;
    }

    spawnNextBlock() {
      const prev = this.stack[this.stack.length - 1];
      const nextY = prev.y - window.GameConstants.GAMEPLAY.verticalStep;
      const nextW = this.getW(prev);
      const nextH = window.GameConstants.GAMEPLAY.blockHeight;

      const block = this.makeBlock(this.minX, nextY, nextW, nextH, this.pickBlockColor());
      block.depth = 10;

      this.current = block;
      this.startMoveTween(block);

      this.inputLocked = false;
    }

    // Camera rises by a small fixed step every placement
    stepCameraUp() {
      const cam = this.cameras.main;

      // Step amount: based on verticalStep to match tower rhythm
      const step = window.GameConstants.GAMEPLAY.verticalStep * 0.55; // tweak 0.45 - 0.75

      this.cameraStepIndex++;
      const targetScrollY = -(this.cameraStepIndex * step);

      if (this.cameraTween) this.cameraTween.stop();
      this.cameraTween = this.tweens.add({
        targets: cam,
        scrollY: targetScrollY,
        duration: 220,
        ease: "Quad.out"
      });
    }

    onPlacementJuice() {
      // Smooth BG transition per tile
      this.tweenBackgroundTo(this.pickNextPastelBg());

      // Tiny zoom punch
      const cam = this.cameras.main;
      if (this.zoomTween) this.zoomTween.stop();

      this.zoomTween = this.tweens.add({
        targets: cam,
        zoom: 1.03,
        duration: 70,
        yoyo: true,
        ease: "Quad.out"
      });

      // Camera step up EVERY tile
      this.stepCameraUp();
    }

    dropBlock() {
      if (!this.current || this.inputLocked) return;

      this.inputLocked = true;
      this.hud.hintText.setVisible(false);
      this.stopMoveTween();

      const prev = this.stack[this.stack.length - 1];
      const cur = this.current;

      const centerOffset = cur.x - prev.x;
      const absCenterOffset = Math.abs(centerOffset);

      const perfectThreshold = window.GameConstants.GAMEPLAY.perfectThresholdPx || 3;
      if (absCenterOffset <= perfectThreshold) {
        this.handlePerfectPlacement(cur, prev);
        return;
      }

      const prevLeft = this.left(prev);
      const prevRight = this.right(prev);
      const curLeft = this.left(cur);
      const curRight = this.right(cur);

      const overlapLeft = Math.max(prevLeft, curLeft);
      const overlapRight = Math.min(prevRight, curRight);
      const overlapWidth = overlapRight - overlapLeft;

      if (overlapWidth <= 0) {
        this.handleMiss(cur);
        return;
      }

      const minWidth = window.GameConstants.GAMEPLAY.minBlockWidth || 15;
      if (overlapWidth < minWidth) {
        this.handleMiss(cur);
        return;
      }

      // Only outside overhang falls
      if (curLeft < prevLeft) this.spawnCutoff(cur, curLeft, prevLeft);
      if (curRight > prevRight) this.spawnCutoff(cur, prevRight, curRight);

      // Overlap remains, perfectly flush
      cur.x = (overlapLeft + overlapRight) * 0.5;
      this.setW(cur, overlapWidth);

      this.tweens.add({
        targets: cur,
        y: cur.y + 2,
        duration: 70,
        yoyo: true,
        ease: "Quad.out"
      });

      this.stack.push(cur);
      this.current = null;

      const goodThreshold = window.GameConstants.GAMEPLAY.goodThresholdPx || 8;
      if (absCenterOffset <= goodThreshold) {
        this.combo++;
        const goodBonus = window.GameConstants.GAMEPLAY.goodBonus || 2;
        this.score += 1 + goodBonus;
        this.toast.show("GOOD! +" + (1 + goodBonus));
      } else {
        this.combo = 0;
        this.score += 1;
      }

      this.maxCombo = Math.max(this.maxCombo, this.combo);

      this.updateHUD();
      this.updateDifficulty(); // no speed scaling
      this.onPlacementJuice();
      this.spawnNextBlock();
    }

    handlePerfectPlacement(cur, prev) {
      cur.x = prev.x;
      this.setW(cur, this.getW(prev));

      this.tweens.add({
        targets: cur,
        y: cur.y + 3,
        duration: 80,
        yoyo: true,
        ease: "Quad.out"
      });

      this.stack.push(cur);
      this.current = null;

      this.combo++;
      this.maxCombo = Math.max(this.maxCombo, this.combo);

      const points = 1 + (window.GameConstants.GAMEPLAY.perfectBonus || 5) + Math.floor(this.combo / 3);
      this.score += points;

      this.cameras.main.shake(60, 0.002);

      this.toast.show(this.combo >= 3 ? `PERFECT! +${points} (x${this.combo} combo)` : `PERFECT! +${points}`);

      this.updateHUD();
      this.updateDifficulty(); // no speed scaling
      this.onPlacementJuice();
      this.spawnNextBlock();
    }

    handleMiss(block) {
      this.tweens.add({
        targets: block,
        y: block.y + 420,
        angle: Phaser.Math.Between(-20, 20),
        alpha: 0,
        duration: 600,
        ease: "Quad.in",
        onComplete: () => block.destroy()
      });

      this.current = null;
      this.onGameOver();
    }

    updateDifficulty() {
      // Intentionally disabled.
    }

    startMoveTween(block) {
      this.stopMoveTween();

      block.x = Phaser.Math.Clamp(block.x, this.minX, this.maxX);

      const dist = this.maxX - this.minX;
      const duration = Math.max(400, Math.floor((dist / this.currentSpeed) * 1000));

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

    spawnCutoff(block, pieceLeft, pieceRight) {
      const width = pieceRight - pieceLeft;
      if (width <= 0.1) return;

      const x = (pieceLeft + pieceRight) * 0.5;
      const y = block.y;

      const piece = this.makeBlock(x, y, width, block.height, block.fillColor);
      piece.depth = 1;

      this.tweens.add({
        targets: piece,
        y: y + 330,
        angle: Phaser.Math.Between(-15, 15),
        alpha: 0,
        duration: 560,
        ease: "Quad.in",
        onComplete: () => piece.destroy()
      });
    }

    updateHUD() {
      this.hud.scoreText.setText("Score: " + this.score);
      this.hud.highText.setText("High: " + this.highScore);

      if (this.hud.comboText) {
        this.hud.comboText.setVisible(this.combo >= 3);
        this.hud.comboText.setText("Combo: x" + this.combo);
      }
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

    handleInput() {
      if (this.isGameOver) {
        this.restartGame();
        return;
      }
      if (this.inputLocked) return;
      this.dropBlock();
    }

    handleResize() {
      this.recomputeBounds();
      this.createBackground();

      if (this.overlay) {
        this.overlay.root.destroy();
        this.overlay = window.UIFactory.createGameOverOverlay(this, () => this.restartGame());
        if (this.isGameOver) {
          this.overlay.setInfo(this.score, this.highScore);
          this.overlay.setVisible(true);
        }
      }

      if (this.current && !this.isGameOver) {
        this.current.x = Phaser.Math.Clamp(this.current.x, this.minX, this.maxX);
        this.startMoveTween(this.current);
      }

      if (this.stack.length > 0) {
        const base = this.stack[0];
        base.x = this.scale.width * 0.5;
      }

      // Keep background rect centered
      if (this.bgRect) {
        this.bgRect.setPosition(this.scale.width * 0.5, this.scale.height * 0.5);
        this.bgRect.setSize(this.scale.width, this.scale.height);
      }
    }

    recomputeBounds() {
      const pad = window.GameConstants.GAMEPLAY.edgePadding || 20;
      this.baseY = Math.floor(this.scale.height * 0.86);
      this.minX = pad;
      this.maxX = this.scale.width - pad;
    }

    pickBlockColor() {
      const colors = window.GameConstants.BLOCK_COLORS;
      this.blockColorIndex = (this.blockColorIndex + 1) % colors.length;
      return colors[this.blockColorIndex];
    }
  }

  window.GameScene = GameScene;
})();
