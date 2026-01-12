// js/GameScene.js
import { UI } from "./app.js";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });

    this.blocks = [];
    this.activeBlock = null;

    this.direction = 1;
    this.speed = 260;
    this.speedInc = 8;
    this.maxSpeed = 520;

    this.blockHeight = 48;
    this.startWidth = 260;

    this.score = 0;
    this.gameOver = false;

    this.worldLeft = 20;
    this.worldRight = 0;

    this.lastColorHue = 200;
  }

  create() {
    this.gameOver = false;
    this.score = 0;

    UI.setScore(0);
    UI.setState("playing");

    const width = this.scale.gameSize.width;
    const height = this.scale.gameSize.height;

    // Debug text (agar ye dikh raha hai, scene render ho raha hai)
    this.add.text(16, 16, "GameScene Running", {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#ffffff",
    }).setScrollFactor(0);

    this.physics.world.setBounds(0, -50000, width, 60000);
    this.cameras.main.setBackgroundColor("#0b0f14");
    this.cameras.main.setBounds(0, -50000, width, 60000);
    this.cameras.main.scrollY = 0;

    this.worldRight = width - 20;

    // Base platform (visible near bottom)
    const baseY = height - 140;

    this.blocks.length = 0;
    this.activeBlock = null;

    const base = this._spawnBlock({
      x: width * 0.5,
      y: baseY,
      w: this.startWidth,
      h: this.blockHeight,
      color: this._nextColor(),
      isStatic: true,
      alpha: 1,
    });

    this.blocks.push(base);

    this._spawnMovingBlock();

    this.input.off("pointerdown");
    this.input.on("pointerdown", () => {
      if (this.gameOver) return;
      this._dropActiveBlock();
    });

    UI.onRestart = () => this.scene.restart();
  }

  update(_, delta) {
    if (this.gameOver) return;
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
  }

  _spawnMovingBlock() {
    const width = this.scale.gameSize.width;

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
      color: this._nextColor(),
      isStatic: false,
      alpha: 1,
    });

    this.activeBlock.body.setAllowGravity(false);
    this.activeBlock.body.setImmovable(true);
  }

  _dropActiveBlock() {
    const a = this.activeBlock;
    const last = this.blocks[this.blocks.length - 1];
    if (!a || !last) return;

    const aLeft = a.x - a.displayWidth * 0.5;
    const aRight = a.x + a.displayWidth * 0.5;

    const lLeft = last.x - last.displayWidth * 0.5;
    const lRight = last.x + last.displayWidth * 0.5;

    const overlapLeft = Math.max(aLeft, lLeft);
    const overlapRight = Math.min(aRight, lRight);
    const overlapW = overlapRight - overlapLeft;

    if (overlapW <= 0.5) {
      this._triggerGameOver(a);
      return;
    }

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

      falling.body.setAllowGravity(true);
      falling.body.setVelocity(0, 80);
      falling.body.setAngularVelocity(Phaser.Math.FloatBetween(-1.2, 1.2));

      this.time.delayedCall(2500, () => {
        if (falling && falling.active) falling.destroy();
      });
    }

    a.body.setAllowGravity(false);
    a.body.setImmovable(true);

    this.blocks.push(a);
    this.activeBlock = null;

    this.score += 1;
    UI.setScore(this.score);

    this.speed = Math.min(this.maxSpeed, this.speed + this.speedInc);

    this._moveCameraUp();
    this._spawnMovingBlock();
  }

  _moveCameraUp() {
    const cam = this.cameras.main;
    const top = this.blocks[this.blocks.length - 1];
    const targetScrollY = top.y - (this.scale.gameSize.height * 0.55);

    this.tweens.add({
      targets: cam,
      scrollY: targetScrollY,
      duration: 220,
      ease: "Sine.easeOut",
    });
  }

  _triggerGameOver(failedBlock) {
    this.gameOver = true;

    if (failedBlock && failedBlock.body) {
      failedBlock.body.setAllowGravity(true);
      failedBlock.body.setImmovable(false);
      failedBlock.body.setVelocity(0, 150);
      failedBlock.body.setAngularVelocity(Phaser.Math.FloatBetween(-2, 2));
    }

    UI.setState("gameover");
  }

  _spawnBlock({ x, y, w, h, color, isStatic, alpha }) {
    const rect = this.add.rectangle(x, y, w, h, color, alpha);
    this.physics.add.existing(rect);

    rect.body.setCollideWorldBounds(false);
    rect.body.setAllowGravity(!isStatic);
    rect.body.setImmovable(isStatic);

    return rect;
  }

  _nextColor() {
    this.lastColorHue = (this.lastColorHue + 24) % 360;
    const rgb = Phaser.Display.Color.HSLToColor(this.lastColorHue / 360, 0.8, 0.55);
    return rgb.color;
  }
}
