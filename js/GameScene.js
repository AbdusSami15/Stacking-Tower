// js/GameScene.js
import { UI } from "./ui.js";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });

    this.blocks = [];
    this.activeBlock = null;
    this.ghost = null;

    this.direction = 1;
    this.speed = 240;
    this.speedInc = 9;
    this.maxSpeed = 520;

    this.blockHeight = 42;
    this.startWidth = 290;

    this.score = 0;
    this.combo = 0;
    this.gameOver = false;

    this.worldPadding = 18;
    this.perfectTolerance = 6;

    this.overhangDropDistance = 1200;
    this.overhangDropDurationMs = 650;

    this.cameraStepPerTile = 20;
    this.cameraTweenMs = 170;

    this.bgRect = null;
    this.paletteBg = [0xe6ffe9, 0xeaf3ff, 0xfff0f6, 0xfff7e6, 0xe9fffb];
    this.paletteBlock = [0x9ee7ff, 0xffb3c7, 0xffe7a3, 0xbfffa6, 0xb7f2ff, 0xffd3a6, 0xd1c4ff];
    this.bgIndex = 0;
    this.blockIndex = 0;

    this.feedbackText = null;

    this.bestKey = "stacking_tower_best";

    this.isDropping = false;

    this._audioBound = false;
  }

  preload() {
    // Audio assets (ensure files exist in assets/audio/)
    this.load.audio("tap", "./assets/audio/tap.mp3");
    this.load.audio("cut", "./assets/audio/cut.mp3");
    this.load.audio("perfect", "./assets/audio/perfect.mp3");
    this.load.audio("combo", "./assets/audio/combo.mp3");
    this.load.audio("lose", "./assets/audio/lose.mp3");
    this.load.audio("ui", "./assets/audio/ui.mp3");
  }

  create() {
    this.gameOver = false;
    this.isDropping = false;
    this.score = 0;
    this.combo = 0;

    UI.setScore(0);
    UI.setBest(this._getBest());
    UI.hideAllOverlays();

    // bind AudioUtil to this scene once
    if (!this._audioBound) {
      this._audioBound = true;
      window.AudioUtil?.setScene?.(this);
    }

    const width = this.scale.gameSize.width;
    const height = this.scale.gameSize.height;

    this.physics.world.setBounds(0, -50000, width, 60000);

    const cam = this.cameras.main;
    cam.setBounds(0, -50000, width, 60000);
    cam.scrollY = 0;

    if (this.bgRect) this.bgRect.destroy();
    this.bgRect = this.add.rectangle(width * 0.5, height * 0.5, width, height, this.paletteBg[this.bgIndex], 1);
    this.bgRect.setScrollFactor(0);
    this.bgRect.setDepth(-100);

    for (const b of this.blocks) if (b && b.destroy) b.destroy();
    this.blocks.length = 0;

    if (this.ghost) this.ghost.destroy();
    this.ghost = null;

    if (this.feedbackText) this.feedbackText.destroy();
    this.feedbackText = null;

    this.worldLeft = this.worldPadding;
    this.worldRight = width - this.worldPadding;

    const baseY = height - 210;

    const base = this._spawnBlock({
      x: width * 0.5,
      y: baseY,
      w: this.startWidth,
      h: this.blockHeight,
      color: this._nextBlockColor(),
      isStatic: true,
      alpha: 1,
    });

    this.blocks.push(base);

    this._spawnMovingBlock();

    this.input.off("pointerdown");
    this.input.on("pointerdown", () => {
      // unlock on first gesture
      window.AudioUtil?.unlock?.();

      if (this.gameOver) return;
      if (!this.activeBlock) return;
      if (this.isDropping) return;

      window.AudioUtil?.tap?.();
      this._dropActiveBlock();
    });
  }

  update(_, delta) {
    if (this.gameOver) return;
    if (this.isDropping) return;
    if (!this.activeBlock) return;

    const dt = delta / 1000;
    const b = this.activeBlock;

    b.x += this.direction * this.speed * dt;

    const half = b.displayWidth * 0.5;
    if (b.x - half <= this.worldLeft) {
      b.x = this.worldLeft + half;
      this.direction = 1;
    } else if (b.x + half >= this.worldRight) {
      b.x = this.worldRight - half;
      this.direction = -1;
    }

    this._updateGhost();
  }

  _spawnMovingBlock() {
    const last = this.blocks[this.blocks.length - 1];
    const w = last.displayWidth;
    const y = last.y - this.blockHeight;

    const spawnFromLeft = (this.score % 2) === 0;
    this.direction = spawnFromLeft ? 1 : -1;

    const x = spawnFromLeft
      ? (this.worldLeft + w * 0.5)
      : (this.worldRight - w * 0.5);

    this.activeBlock = this._spawnBlock({
      x,
      y,
      w,
      h: this.blockHeight,
      color: this._nextBlockColor(),
      isStatic: false,
      alpha: 1,
    });

    this.activeBlock.body.setAllowGravity(false);
    this.activeBlock.body.setImmovable(true);

    if (!this.ghost) {
      this.ghost = this.add.rectangle(0, 0, 10, 10, 0x000000, 0.08);
      this.ghost.setDepth(-5);
    }

    this._updateGhost();
  }

  _updateGhost() {
    if (!this.ghost || !this.activeBlock) return;

    const a = this.activeBlock;
    const last = this.blocks[this.blocks.length - 1];

    const aLeft = a.x - a.displayWidth * 0.5;
    const aRight = a.x + a.displayWidth * 0.5;

    const lLeft = last.x - last.displayWidth * 0.5;
    const lRight = last.x + last.displayWidth * 0.5;

    const overlapLeft = Math.max(aLeft, lLeft);
    const overlapRight = Math.min(aRight, lRight);
    const overlapW = overlapRight - overlapLeft;

    if (overlapW <= 1) {
      this.ghost.setVisible(false);
      return;
    }

    const dx = Math.abs(a.x - last.x);
    const isPerfect = dx <= this.perfectTolerance;

    const w = isPerfect ? last.displayWidth : overlapW;
    const cx = isPerfect ? last.x : (overlapLeft + overlapRight) * 0.5;

    this.ghost.setVisible(true);
    this.ghost.x = cx;
    this.ghost.y = a.y;
    this.ghost.displayWidth = w;
    this.ghost.displayHeight = this.blockHeight;
  }

  _dropActiveBlock() {
    this.isDropping = true;
    if (this.ghost) this.ghost.setVisible(false);

    const a = this.activeBlock;
    const last = this.blocks[this.blocks.length - 1];
    if (!a || !last) {
      this.isDropping = false;
      return;
    }

    const dx = Math.abs(a.x - last.x);
    const isPerfect = dx <= this.perfectTolerance;

    const aLeft = a.x - a.displayWidth * 0.5;
    const aRight = a.x + a.displayWidth * 0.5;

    const lLeft = last.x - last.displayWidth * 0.5;
    const lRight = last.x + last.displayWidth * 0.5;

    if (isPerfect) {
      a.x = last.x;
      this.combo += 1;

      if (this.combo >= 2) window.AudioUtil?.combo?.();
      else window.AudioUtil?.perfect?.();

      this._showFeedback(this.combo >= 2 ? "PERFECT" : "GOOD");
      this._shake(true);

      this._placeAndContinue(a, true);
      return;
    }

    const overlapLeft = Math.max(aLeft, lLeft);
    const overlapRight = Math.min(aRight, lRight);
    const overlapW = overlapRight - overlapLeft;

    if (overlapW <= 1) {
      window.AudioUtil?.lose?.();
      this._gameOver(a);
      return;
    }

    this.combo = 0;

    window.AudioUtil?.cut?.();

    const overhangW = a.displayWidth - overlapW;
    const overlapCenterX = (overlapLeft + overlapRight) * 0.5;

    a.x = overlapCenterX;
    a.displayWidth = overlapW;
    a.body.setSize(overlapW, this.blockHeight, true);

    if (overhangW > 1) {
      const isRightOverhang = aRight > lRight;
      const overhangX = isRightOverhang
        ? overlapRight + overhangW * 0.5
        : overlapLeft - overhangW * 0.5;

      const falling = this._spawnBlock({
        x: overhangX,
        y: a.y,
        w: overhangW,
        h: this.blockHeight,
        color: a.fillColor,
        isStatic: false,
        alpha: 0.95,
      });

      if (falling.body) falling.body.setEnable(false);

      this.tweens.add({
        targets: falling,
        y: falling.y + this.overhangDropDistance,
        angle: Phaser.Math.FloatBetween(-20, 20),
        duration: this.overhangDropDurationMs,
        ease: "Cubic.easeIn",
        onComplete: () => falling && falling.destroy(),
      });
    }

    this._showFeedback("GOOD");
    this._shake(false);

    this._placeAndContinue(a, false);
  }

  _placeAndContinue(placed, wasPerfect) {
    placed.body.setAllowGravity(false);
    placed.body.setImmovable(true);

    this.blocks.push(placed);
    this.activeBlock = null;

    this.score += 1;
    if (wasPerfect && this.combo >= 2) this.score += 1;

    UI.setScore(this.score);

    this.speed = Math.min(this.maxSpeed, this.speed + this.speedInc);

    this._cameraUpStep();
    this._bgShift();

    this._spawnMovingBlock();

    if (this.blocks.length > 40) {
      const removeCount = this.blocks.length - 35;
      for (let i = 0; i < removeCount; i++) {
        const old = this.blocks[i];
        if (old && old.destroy) old.destroy();
      }
      this.blocks.splice(0, removeCount);
    }

    this.isDropping = false;
  }

  _cameraUpStep() {
    const cam = this.cameras.main;
    const target = cam.scrollY - this.cameraStepPerTile;

    this.tweens.add({
      targets: cam,
      scrollY: target,
      duration: this.cameraTweenMs,
      ease: "Sine.easeOut",
    });
  }

  _bgShift() {
    const from = Phaser.Display.Color.IntegerToColor(this.paletteBg[this.bgIndex]);
    this.bgIndex = (this.bgIndex + 1) % this.paletteBg.length;
    const to = Phaser.Display.Color.IntegerToColor(this.paletteBg[this.bgIndex]);

    const tmp = { t: 0 };
    this.tweens.add({
      targets: tmp,
      t: 1,
      duration: 260,
      ease: "Sine.easeInOut",
      onUpdate: () => {
        const c = Phaser.Display.Color.Interpolate.ColorWithColor(from, to, 100, tmp.t * 100);
        this.bgRect.fillColor = Phaser.Display.Color.GetColor(c.r, c.g, c.b);
      },
    });
  }

  _nextBlockColor() {
    const c = this.paletteBlock[this.blockIndex];
    this.blockIndex = (this.blockIndex + 1) % this.paletteBlock.length;
    return c;
  }

  _shake(isPerfect) {
    this.cameras.main.shake(isPerfect ? 120 : 70, isPerfect ? 0.006 : 0.003);
  }

  _showFeedback(text) {
    const w = this.scale.gameSize.width;
    const h = this.scale.gameSize.height;

    if (!this.feedbackText) {
      this.feedbackText = this.add.text(w * 0.5, h * 0.38, "", {
        fontFamily: "Arial",
        fontSize: "44px",
        fontStyle: "800",
        color: "rgba(0,0,0,0.35)",
      });
      this.feedbackText.setOrigin(0.5);
      this.feedbackText.setScrollFactor(0);
      this.feedbackText.setDepth(200);
    }

    this.feedbackText.setText(text);
    this.feedbackText.setAlpha(0);
    this.feedbackText.y = h * 0.38;

    this.tweens.killTweensOf(this.feedbackText);

    this.tweens.add({
      targets: this.feedbackText,
      alpha: 1,
      duration: 90,
      ease: "Sine.easeOut",
      onComplete: () => {
        this.tweens.add({
          targets: this.feedbackText,
          y: this.feedbackText.y - 26,
          alpha: 0,
          duration: 260,
          ease: "Sine.easeIn",
        });
      },
    });
  }

  _gameOver(failedBlock) {
    this.gameOver = true;
    this.isDropping = false;

    if (this.ghost) this.ghost.setVisible(false);

    if (failedBlock && failedBlock.body) {
      failedBlock.body.setAllowGravity(true);
      failedBlock.body.setImmovable(false);
      failedBlock.body.setVelocity(0, 120);
    }

    this._setBest(this.score);
    const best = this._getBest();

    window.__STACKING_APP__?.setBest?.(best);
    window.__STACKING_APP__?.setLast?.(this.score);

    UI.setBest(best);
    UI.showGameOver(this.score, best);
  }

  _spawnBlock({ x, y, w, h, color, isStatic, alpha }) {
    const rect = this.add.rectangle(x, y, w, h, color, alpha);
    this.physics.add.existing(rect);
    rect.body.setAllowGravity(!isStatic);
    rect.body.setImmovable(isStatic);
    rect.body.setCollideWorldBounds(false);
    return rect;
  }

  _getBest() {
    return parseInt(localStorage.getItem(this.bestKey) || "0", 10) | 0;
  }

  _setBest(score) {
    const best = Math.max(this._getBest(), score | 0);
    localStorage.setItem(this.bestKey, String(best));
  }
}
