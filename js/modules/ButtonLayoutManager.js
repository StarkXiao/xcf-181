(function() {
  var MountainRacer = window.MountainRacer || {};

  var STORAGE_KEY = 'mountain_racer_btn_layouts';
  var ACTIVE_KEY = 'mountain_racer_btn_layout_active';
  var SCENE_KEY = 'mountain_racer_btn_layout_scene';

  var DEFAULT_BUTTONS = {
    accelerate: { label: '▲', action: 'accelerate', color: 0xff6b35 },
    brake: { label: '▼', action: 'brake', color: 0x4a90d9 },
    left: { label: '◀', action: 'left', color: 0x333333 },
    right: { label: '▶', action: 'right', color: 0x333333 }
  };

  function defaultLayout(canvasW, canvasH) {
    var btnSize = 80;
    var margin = 20;
    return {
      accelerate: { x: canvasW - margin - btnSize / 2, y: canvasH - margin - btnSize / 2, scale: 1.0, opacity: 0.5 },
      brake: { x: canvasW - margin - btnSize / 2 - btnSize - margin, y: canvasH - margin - btnSize / 2, scale: 1.0, opacity: 0.5 },
      left: { x: margin + btnSize / 2, y: canvasH - margin - btnSize / 2, scale: 1.0, opacity: 0.5 },
      right: { x: margin + btnSize / 2 + btnSize + margin, y: canvasH - margin - btnSize / 2, scale: 1.0, opacity: 0.5 }
    };
  }

  function defaultPresets(canvasW, canvasH) {
    var btnSize = 80;
    var margin = 20;
    return {
      '默认': {
        name: '默认',
        icon: '🎮',
        scene: 'all',
        buttons: defaultLayout(canvasW, canvasH)
      },
      '左撇子': {
        name: '左撇子',
        icon: '🤚',
        scene: 'all',
        buttons: {
          accelerate: { x: margin + btnSize / 2, y: canvasH - margin - btnSize / 2, scale: 1.0, opacity: 0.5 },
          brake: { x: margin + btnSize / 2 + btnSize + margin, y: canvasH - margin - btnSize / 2, scale: 1.0, opacity: 0.5 },
          left: { x: canvasW - margin - btnSize / 2 - btnSize - margin, y: canvasH - margin - btnSize / 2, scale: 1.0, opacity: 0.5 },
          right: { x: canvasW - margin - btnSize / 2, y: canvasH - margin - btnSize / 2, scale: 1.0, opacity: 0.5 }
        }
      },
      '大按钮': {
        name: '大按钮',
        icon: '🔍',
        scene: 'all',
        buttons: {
          accelerate: { x: canvasW - margin - 50, y: canvasH - margin - 50, scale: 1.4, opacity: 0.6 },
          brake: { x: canvasW - margin - 50 - 120, y: canvasH - margin - 50, scale: 1.4, opacity: 0.6 },
          left: { x: margin + 50, y: canvasH - margin - 50, scale: 1.4, opacity: 0.6 },
          right: { x: margin + 50 + 120, y: canvasH - margin - 50, scale: 1.4, opacity: 0.6 }
        }
      },
      '竞速': {
        name: '竞速',
        icon: '🏎️',
        scene: 'racing',
        buttons: {
          accelerate: { x: canvasW - margin - 50, y: canvasH - margin - 50, scale: 1.3, opacity: 0.7 },
          brake: { x: canvasW - margin - 50 - 100, y: canvasH - margin - 50, scale: 0.9, opacity: 0.4 },
          left: { x: margin + 50, y: canvasH - margin - 40, scale: 1.1, opacity: 0.6 },
          right: { x: margin + 50 + 100, y: canvasH - margin - 40, scale: 1.1, opacity: 0.6 }
        }
      },
      '探索': {
        name: '探索',
        icon: '🗺️',
        scene: 'exploration',
        buttons: {
          accelerate: { x: canvasW - margin - 50, y: canvasH - margin - 50, scale: 1.0, opacity: 0.4 },
          brake: { x: canvasW - margin - 50 - 90, y: canvasH - margin - 50, scale: 1.0, opacity: 0.4 },
          left: { x: margin + 50, y: canvasH - margin - 50, scale: 1.2, opacity: 0.5 },
          right: { x: margin + 50 + 110, y: canvasH - margin - 50, scale: 1.2, opacity: 0.5 }
        }
      }
    };
  }

  MountainRacer.ButtonLayoutManager = function(canvasW, canvasH) {
    this.canvasW = canvasW;
    this.canvasH = canvasH;
    this.baseBtnSize = 80;
    this.presets = {};
    this.activePresetName = null;
    this.currentLayout = null;
    this.editMode = false;
    this.dragging = null;
    this.dragOffset = { x: 0, y: 0 };
    this._loadPresets();
    if (!this.activePresetName) {
      this.activePresetName = '默认';
    }
    this._applyActivePreset();
  };

  var proto = MountainRacer.ButtonLayoutManager.prototype;

  proto._loadPresets = function() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        var data = JSON.parse(saved);
        this.presets = data.presets || {};
        this._migrateIfNeeded();
      } else {
        this.presets = defaultPresets(this.canvasW, this.canvasH);
        this._savePresets();
      }
    } catch (e) {
      this.presets = defaultPresets(this.canvasW, this.canvasH);
    }

    try {
      this.activePresetName = localStorage.getItem(ACTIVE_KEY) || '默认';
    } catch (e) {
      this.activePresetName = '默认';
    }
  };

  proto._migrateIfNeeded = function() {
    var defaults = defaultPresets(this.canvasW, this.canvasH);
    var defaultKeys = Object.keys(defaults);
    for (var i = 0; i < defaultKeys.length; i++) {
      if (!this.presets[defaultKeys[i]]) {
        this.presets[defaultKeys[i]] = defaults[defaultKeys[i]];
      }
    }
  };

  proto._savePresets = function() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ presets: this.presets }));
    } catch (e) {}
  };

  proto._saveActivePreset = function() {
    try {
      localStorage.setItem(ACTIVE_KEY, this.activePresetName || '默认');
    } catch (e) {}
  };

  proto._applyActivePreset = function() {
    var preset = this.presets[this.activePresetName];
    if (preset && preset.buttons) {
      this.currentLayout = JSON.parse(JSON.stringify(preset.buttons));
    } else {
      this.currentLayout = defaultLayout(this.canvasW, this.canvasH);
    }
  };

  proto.getLayout = function() {
    return this.currentLayout;
  };

  proto.getButtonConfig = function(action) {
    if (this.currentLayout && this.currentLayout[action]) {
      return this.currentLayout[action];
    }
    return null;
  };

  proto.getButtonMeta = function(action) {
    return DEFAULT_BUTTONS[action] || null;
  };

  proto.getAllButtonActions = function() {
    return Object.keys(DEFAULT_BUTTONS);
  };

  proto.switchPreset = function(name) {
    if (this.presets[name]) {
      this.activePresetName = name;
      this._applyActivePreset();
      this._saveActivePreset();
      return true;
    }
    return false;
  };

  proto.getActivePresetName = function() {
    return this.activePresetName;
  };

  proto.getPresetList = function() {
    var list = [];
    var keys = Object.keys(this.presets);
    for (var i = 0; i < keys.length; i++) {
      var p = this.presets[keys[i]];
      list.push({
        name: p.name,
        icon: p.icon || '🎮',
        scene: p.scene || 'all',
        isActive: keys[i] === this.activePresetName
      });
    }
    return list;
  };

  proto.getPresetsForScene = function(sceneType) {
    var list = [];
    var keys = Object.keys(this.presets);
    for (var i = 0; i < keys.length; i++) {
      var p = this.presets[keys[i]];
      if (p.scene === 'all' || p.scene === sceneType) {
        list.push({
          name: p.name,
          icon: p.icon || '🎮',
          scene: p.scene || 'all',
          isActive: keys[i] === this.activePresetName
        });
      }
    }
    return list;
  };

  proto.saveCurrentAsPreset = function(name, icon, scene) {
    if (!name || name.trim() === '') return false;
    var trimmed = name.trim();
    this.presets[trimmed] = {
      name: trimmed,
      icon: icon || '🎮',
      scene: scene || 'all',
      buttons: JSON.parse(JSON.stringify(this.currentLayout))
    };
    this._savePresets();
    return true;
  };

  proto.deletePreset = function(name) {
    if (name === '默认') return false;
    if (!this.presets[name]) return false;
    delete this.presets[name];
    if (this.activePresetName === name) {
      this.activePresetName = '默认';
      this._applyActivePreset();
      this._saveActivePreset();
    }
    this._savePresets();
    return true;
  };

  proto.updateButtonPosition = function(action, x, y) {
    if (!this.currentLayout[action]) return;
    this.currentLayout[action].x = x;
    this.currentLayout[action].y = y;
  };

  proto.updateButtonScale = function(action, scale) {
    if (!this.currentLayout[action]) return;
    this.currentLayout[action].scale = Math.max(0.5, Math.min(2.0, scale));
  };

  proto.updateButtonOpacity = function(action, opacity) {
    if (!this.currentLayout[action]) return;
    this.currentLayout[action].opacity = Math.max(0.1, Math.min(1.0, opacity));
  };

  proto.updateAllScales = function(scale) {
    var clamped = Math.max(0.5, Math.min(2.0, scale));
    var actions = this.getAllButtonActions();
    for (var i = 0; i < actions.length; i++) {
      if (this.currentLayout[actions[i]]) {
        this.currentLayout[actions[i]].scale = clamped;
      }
    }
  };

  proto.updateAllOpacity = function(opacity) {
    var clamped = Math.max(0.1, Math.min(1.0, opacity));
    var actions = this.getAllButtonActions();
    for (var i = 0; i < actions.length; i++) {
      if (this.currentLayout[actions[i]]) {
        this.currentLayout[actions[i]].opacity = clamped;
      }
    }
  };

  proto.resetToDefault = function() {
    this.currentLayout = defaultLayout(this.canvasW, this.canvasH);
  };

  proto.saveScenePreset = function(sceneType) {
    try {
      var key = SCENE_KEY + '_' + sceneType;
      var saveData = {
        activePresetName: this.activePresetName,
        layout: {}
      };
      var actions = this.getAllButtonActions();
      for (var i = 0; i < actions.length; i++) {
        var action = actions[i];
        var cfg = this.getButtonConfig(action);
        if (cfg) {
          saveData.layout[action] = {
            x: cfg.x,
            y: cfg.y,
            scale: cfg.scale,
            opacity: cfg.opacity,
            visible: cfg.visible !== false
          };
        }
      }
      saveData.baseBtnSize = this.baseBtnSize;
      localStorage.setItem(key, JSON.stringify(saveData));
    } catch (e) {}
  };

  proto.loadScenePreset = function(sceneType) {
    try {
      var key = SCENE_KEY + '_' + sceneType;
      var saved = localStorage.getItem(key);
      if (!saved) return false;

      var data = JSON.parse(saved);
      if (!data.layout) return false;

      if (data.activePresetName && this.presets[data.activePresetName]) {
        this.activePresetName = data.activePresetName;
      } else {
        this.activePresetName = '场景方案';
      }

      var actions = this.getAllButtonActions();
      for (var i = 0; i < actions.length; i++) {
        var action = actions[i];
        var savedCfg = data.layout[action];
        if (savedCfg && this.currentLayout[action]) {
          this.currentLayout[action].x = typeof savedCfg.x === 'number' ? savedCfg.x : this.currentLayout[action].x;
          this.currentLayout[action].y = typeof savedCfg.y === 'number' ? savedCfg.y : this.currentLayout[action].y;
          this.currentLayout[action].scale = typeof savedCfg.scale === 'number' ? savedCfg.scale : 1.0;
          this.currentLayout[action].opacity = typeof savedCfg.opacity === 'number' ? savedCfg.opacity : 0.5;
          if (typeof savedCfg.visible !== 'undefined') {
            this.currentLayout[action].visible = savedCfg.visible;
          }
        }
      }

      if (typeof data.baseBtnSize === 'number') {
        this.baseBtnSize = data.baseBtnSize;
      }

      this._saveActivePreset();
      return true;
    } catch (e) {}
    return false;
  };

  proto.hasScenePreset = function(sceneType) {
    try {
      var key = SCENE_KEY + '_' + sceneType;
      var saved = localStorage.getItem(key);
      if (saved) {
        var data = JSON.parse(saved);
        return data && data.layout && Object.keys(data.layout).length > 0;
      }
    } catch (e) {}
    return false;
  };

  proto.getEffectiveButtonSize = function(action) {
    var config = this.getButtonConfig(action);
    var scale = config ? config.scale : 1.0;
    return this.baseBtnSize * scale;
  };

  proto.exportLayout = function() {
    return {
      activePresetName: this.activePresetName,
      currentLayout: this.currentLayout,
      presets: this.presets
    };
  };

  proto.importLayout = function(data) {
    if (!data) return false;
    try {
      if (data.presets) {
        this.presets = data.presets;
      }
      if (data.activePresetName && this.presets[data.activePresetName]) {
        this.activePresetName = data.activePresetName;
      }
      if (data.currentLayout) {
        this.currentLayout = data.currentLayout;
      }
      this._savePresets();
      this._saveActivePreset();
      return true;
    } catch (e) {
      return false;
    }
  };

  proto.resize = function(canvasW, canvasH) {
    var scaleX = canvasW / this.canvasW;
    var scaleY = canvasH / this.canvasH;
    this.canvasW = canvasW;
    this.canvasH = canvasH;
    var actions = this.getAllButtonActions();
    for (var i = 0; i < actions.length; i++) {
      if (this.currentLayout[actions[i]]) {
        this.currentLayout[actions[i]].x *= scaleX;
        this.currentLayout[actions[i]].y *= scaleY;
      }
    }
  };

  window.MountainRacer = MountainRacer;
})();
