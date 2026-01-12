(function () {
  /**
   * Game Constants
   * Centralized configuration for the tower stacking game
   */
  
  window.GameConstants = {
    // Gameplay parameters
    GAMEPLAY: {
      // Block dimensions
      baseWidth: 180,           // Starting width of blocks
      blockHeight: 30,          // Height of each block
      verticalStep: 32,         // Vertical spacing between blocks
      minBlockWidth: 15,        // Minimum width before game over
      
      // Movement
      moveSpeed: 350,           // Initial horizontal speed (px/sec)
      speedIncreasePerLevel: 40, // Speed increase every 5 blocks
      maxSpeed: 800,            // Maximum speed cap
      
      // Placement thresholds (in pixels)
      perfectThresholdPx: 3,    // Perfect: within 3px of center
      goodThresholdPx: 8,       // Good: within 8px of center
      // Anything else is "OK"
      
      // Scoring
      perfectBonus: 5,          // Bonus points for perfect placement
      goodBonus: 2,             // Bonus points for good placement
      
      // Layout
      edgePadding: 20           // Padding from screen edges
    },
    
    // Visual colors (hex format)
    BG_COLORS: [
      0x1a1a2e,  // Dark blue-gray
      0x16213e,  // Deep navy
      0x0f3460,  // Ocean blue
      0x533483,  // Purple
      0x7b2869,  // Magenta
      0x2c3e50,  // Slate
      0x34495e,  // Charcoal
      0x16a085   // Teal
    ],
    
    BLOCK_COLORS: [
      0x00d2ff,  // Cyan
      0x3a86ff,  // Blue
      0x8338ec,  // Purple
      0xff006e,  // Pink
      0xfb5607,  // Orange
      0xffbe0b,  // Yellow
      0x06ffa5,  // Mint
      0xff1654,  // Red
      0x00f5ff,  // Sky blue
      0xb5179e   // Magenta
    ]
  };
})();