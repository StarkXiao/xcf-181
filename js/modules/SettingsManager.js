(function() {
  var MountainRacer = window.MountainRacer || {};

  var DEFAULT_SETTINGS = {
    soundEnabled: true,
    musicEnabled: true,
    vibrationEnabled: true,
    difficulty: 'normal',
    controlMode: 'touch',
    showHints: true,
    particleEffects: true,
    sfxEnabled: true,
    cameraShake: true,
    showFPS: false
  };

  var DIFFICULTY_OPTIONS = ['easy', 'normal', 'hard', 'extreme'];
  var CONTROL_MODE_OPTIONS = ['keyboard', 'touch', 'gamepad'];

  MountainRacer.SettingsManager = function(dataManager) {
    this._dm = dataManager;
    this._cachedSettings = null;
  };

  var proto = MountainRacer.SettingsManager.prototype;

  proto._ensureCache = function() {
    if (!this._cachedSettings) {
      var saved = this._dm.getData('settings', {});
      this._cachedSettings = Object.assign({}, DEFAULT_SETTINGS, saved || {});
    }
  };

  proto.getAllSettings = function() {
    this._ensureCache();
    return Object.assign({}, this._cachedSettings);
  };

  proto.getSetting = function(key, defaultValue) {
    this._ensureCache();
    if (typeof this._cachedSettings[key] !== 'undefined') {
      return this._cachedSettings[key];
    }
    return typeof defaultValue !== 'undefined' ? defaultValue :
      (typeof DEFAULT_SETTINGS[key] !== 'undefined' ? DEFAULT_SETTINGS[key] : null);
  };

  proto.setSetting = function(key, value) {
    this._ensureCache();
    var oldValue = this._cachedSettings[key];
    if (oldValue === value) return false;

    if (key === 'difficulty' && DIFFICULTY_OPTIONS.indexOf(value) === -1) {
      value = 'normal';
    }
    if (key === 'controlMode' && CONTROL_MODE_OPTIONS.indexOf(value) === -1) {
      value = 'touch';
    }

    this._cachedSettings[key] = value;
    this._dm.setData('settings', Object.assign({}, this._cachedSettings));
    this._dm._emit('settingChanged', { key: key, newValue: value, oldValue: oldValue });
    return true;
  };

  proto.batchSetSettings = function(settings) {
    if (!settings || typeof settings !== 'object') return false;
    this._ensureCache();
    var changed = {};
    var keys = Object.keys(settings);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var oldValue = this._cachedSettings[key];
      var newValue = settings[key];

      if (key === 'difficulty' && DIFFICULTY_OPTIONS.indexOf(newValue) === -1) continue;
      if (key === 'controlMode' && CONTROL_MODE_OPTIONS.indexOf(newValue) === -1) continue;
      if (oldValue === newValue) continue;

      changed[key] = { oldValue: oldValue, newValue: newValue };
      this._cachedSettings[key] = newValue;
    }
    if (Object.keys(changed).length > 0) {
      this._dm.setData('settings', Object.assign({}, this._cachedSettings));
      this._dm._emit('settingsChanged', { changed: changed, batch: true });
      return true;
    }
    return false;
  };

  proto.resetSettings = function() {
    this._cachedSettings = Object.assign({}, DEFAULT_SETTINGS);
    this._dm.setData('settings', Object.assign({}, DEFAULT_SETTINGS));
    this._dm._emit('settingsReset', { defaults: DEFAULT_SETTINGS });
  };

  proto.getDifficulty = function() {
    return this.getSetting('difficulty');
  };

  proto.setDifficulty = function(difficulty) {
    return this.setSetting('difficulty', difficulty);
  };

  proto.isSoundEnabled = function() {
    return !!this.getSetting('soundEnabled');
  };

  proto.setSoundEnabled = function(enabled) {
    return this.setSetting('soundEnabled', !!enabled);
  };

  proto.isMusicEnabled = function() {
    return !!this.getSetting('musicEnabled');
  };

  proto.setMusicEnabled = function(enabled) {
    return this.setSetting('musicEnabled', !!enabled);
  };

  proto.isSFXEnabled = function() {
    return !!this.getSetting('sfxEnabled');
  };

  proto.setSFXEnabled = function(enabled) {
    return this.setSetting('sfxEnabled', !!enabled);
  };

  proto.isVibrationEnabled = function() {
    return !!this.getSetting('vibrationEnabled');
  };

  proto.setVibrationEnabled = function(enabled) {
    return this.setSetting('vibrationEnabled', !!enabled);
  };

  proto.getControlMode = function() {
    return this.getSetting('controlMode');
  };

  proto.setControlMode = function(mode) {
    return this.setSetting('controlMode', mode);
  };

  proto.isCameraShakeEnabled = function() {
    return !!this.getSetting('cameraShake');
  };

  proto.setCameraShakeEnabled = function(enabled) {
    return this.setSetting('cameraShake', !!enabled);
  };

  proto.showFPS = function() {
    return !!this.getSetting('showFPS');
  };

  proto.setShowFPS = function(enabled) {
    return this.setSetting('showFPS', !!enabled);
  };

  proto.getDifficultyConfig = function() {
    var difficulty = this.getDifficulty();
    var configs = {
      easy: {
        label: '简单',
        scoreMultiplier: 0.8,
        enemySpeedMultiplier: 0.85,
        damageMultiplier: 0.7,
        obstacleDensity: 0.75
      },
      normal: {
        label: '普通',
        scoreMultiplier: 1.0,
        enemySpeedMultiplier: 1.0,
        damageMultiplier: 1.0,
        obstacleDensity: 1.0
      },
      hard: {
        label: '困难',
        scoreMultiplier: 1.3,
        enemySpeedMultiplier: 1.15,
        damageMultiplier: 1.3,
        obstacleDensity: 1.25
      },
      extreme: {
        label: '极限',
        scoreMultiplier: 1.6,
        enemySpeedMultiplier: 1.3,
        damageMultiplier: 1.6,
        obstacleDensity: 1.5
      }
    };
    return configs[difficulty] || configs.normal;
  };

  proto.getMidGameSettings = function() {
    return {
      difficulty: this.getDifficulty(),
      sfxEnabled: this.isSFXEnabled(),
      controlMode: this.getControlMode(),
      cameraShake: this.isCameraShakeEnabled(),
      showFPS: this.showFPS()
    };
  };

  proto.applyMidGameSettings = function(settings) {
    if (!settings || typeof settings !== 'object') return;
    var mapping = {
      difficulty: 'difficulty',
      sfxEnabled: 'sfxEnabled',
      controlMode: 'controlMode',
      cameraShake: 'cameraShake',
      showFPS: 'showFPS'
    };
    var updates = {};
    var keys = Object.keys(mapping);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (typeof settings[k] !== 'undefined') {
        updates[mapping[k]] = settings[k];
      }
    }
    if (Object.keys(updates).length > 0) {
      this.batchSetSettings(updates);
    }
  };

  proto.getAvailableDifficulties = function() {
    return DIFFICULTY_OPTIONS.slice();
  };

  proto.getAvailableControlModes = function() {
    return CONTROL_MODE_OPTIONS.slice();
  };

  proto.getDefaultSettings = function() {
    return Object.assign({}, DEFAULT_SETTINGS);
  };

  window.MountainRacer = MountainRacer;
})();
