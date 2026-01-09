(function () {
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  class TinySfx {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.enabled = true;
      this.unlocked = false;
    }

    init() {
      if (this.ctx) return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.18;
      this.master.connect(this.ctx.destination);
    }

    unlock() {
      this.init();
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
      if (!this.master) return;
      this.master.gain.value = clamp(v01, 0, 1);
    }

    beep(freq, dur, type, vol) {
      if (!this.enabled) return;
      this.init();
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

    tap()     { this.beep(720, 0.07, "square", 0.9); }
    cut()     { this.beep(520, 0.09, "triangle", 0.9); }
    perfect() { this.beep(920, 0.12, "sine", 1.0); }
    lose()    { this.beep(180, 0.28, "sawtooth", 1.0); }
  }

  window.AudioUtil = new TinySfx();
})();
