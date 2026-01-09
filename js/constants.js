(function () {
  window.GameConstants = {
    STORAGE_KEY_HS: "stacking_highscore_v1",

    DESIGN_W: 360,
    DESIGN_H: 640,

    BG_COLORS: [0x0b0f14, 0x0b1220, 0x0f172a, 0x111827, 0x0a1020],

    BLOCK_COLORS: [0x3b82f6, 0x22c55e, 0xf59e0b, 0xec4899, 0x8b5cf6, 0x06b6d4],

    UI: {
      scoreX: 16,
      scoreY: 12,
      highY: 36
    },

    GAMEPLAY: {
      baseWidth: 220,
      blockHeight: 28,
      verticalStep: 28,

      // horizontal movement padding from edges
      edgePadding: 40,

      // speed (px/sec) for tween movement
      moveSpeed: 520,

      // overlap threshold for "Perfect"
      perfectThresholdPx: 3,

      // perfect bonus score
      perfectBonus: 1
    }
  };
})();
