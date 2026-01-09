(function () {
  function safeParseInt(v) {
    const n = v ? parseInt(v, 10) : 0;
    return Number.isFinite(n) ? n : 0;
  }

  window.StorageUtil = {
    loadHighScore: function () {
      try {
        return safeParseInt(localStorage.getItem(window.GameConstants.STORAGE_KEY_HS));
      } catch (e) {
        return 0;
      }
    },

    saveHighScore: function (value) {
      try {
        localStorage.setItem(window.GameConstants.STORAGE_KEY_HS, String(value));
      } catch (e) {}
    }
  };
})();
