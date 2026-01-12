// js/audio.js
(function () {
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  class HybridSfx {
    constructor() {
      this.enabled = true;

      this.scene = null;

      // WebAudio fallback
      this.ctx = null;
      this.master = null;
      this.unlocked = false;
      this.volume01 = 0.18;

      // per-key volumes (match your preference)
      this.keyVolumes = {
        ui: 0.7,
        tap: 0.8,
        cut: 0.8,
        perfect: 0.9,
        combo: 0.9,
        lose: 1.0,
      };
    }

    setScene(scene) {
      this.scene = scene || null;
    }

    initWebAudio() {
      if (this.ctx) return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume01;
      this.master.connect(this.ctx.destination);
    }

    unlock() {
      this.initWebAudio();
      if (!this.ctx || this.unlocked) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      gain.gain.value = 0.0001;

      osc.type = "sine";
      osc.frequency.value = 440;
      osc.connect(gain);
      gain.connect(this.master);

      osc.start(now);
      osc.stop(now + 0.01);

      this.unlocked = true;
      this.ctx.resume && this.ctx.resume();
    }

    setEnabled(v) { this.enabled = !!v; }
    toggle() { this.enabled = !this.enabled; return this.enabled; }

    setVolume(v01) {
      this.volume01 = clamp(v01, 0, 1);
      if (this.master) this.master.gain.value = this.volume01;
    }

    _isPhaserMuted() {
      const s = this.scene;
      if (!s || !s.game || !s.game.sound) return false;
      return !!s.game.sound.mute;
    }

    // Try Phaser sound first (if key exists), else beep fallback
    playKey(key, fallbackFn) {
      if (!this.enabled) return;
      if (this._isPhaserMuted()) return;

      const s = this.scene;
      if (s && s.sound && s.cache && s.cache.audio && s.cache.audio.exists(key)) {
        const vol = this.keyVolumes[key] ?? 0.7;
        s.sound.play(key, { volume: vol });
        return;
      }

      if (fallbackFn) fallbackFn();
    }

    beep(freq, dur, type, vol) {
      if (!this.enabled) return;
      if (this._isPhaserMuted()) return;

      this.initWebAudio();
      if (!this.ctx || !this.master) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type || "sine";
      osc.frequency.setValueAtTime(freq, now);

      const v = clamp(vol == null ? 1 : vol, 0, 1);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.12 * v, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      osc.connect(gain);
      gain.connect(this.master);

      osc.start(now);
      osc.stop(now + dur + 0.02);
    }

    ui()      { this.playKey("ui",      () => this.beep(640, 0.06, "sine",     0.8)); }
    tap()     { this.playKey("tap",     () => this.beep(720, 0.07, "square",   0.9)); }
    cut()     { this.playKey("cut",     () => this.beep(520, 0.09, "triangle", 0.9)); }
    perfect() { this.playKey("perfect", () => this.beep(920, 0.12, "sine",     1.0)); }
    combo()   { this.playKey("combo",   () => this.beep(1080,0.14, "sine",     1.0)); }
    lose()    { this.playKey("lose",    () => this.beep(180, 0.28, "sawtooth", 1.0)); }
  }

  window.AudioUtil = new HybridSfx();
})();
