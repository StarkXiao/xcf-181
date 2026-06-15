(function() {
  var MountainRacer = window.MountainRacer || {};

  MountainRacer.ButtonLayoutStorage = function(dataManager) {
    this._dm = dataManager;
  };

  var proto = MountainRacer.ButtonLayoutStorage.prototype;

  proto.getAllPresets = function() {
    return this._dm.getData('buttonLayout.presets', {});
  };

  proto.setAllPresets = function(presets) {
    this._dm.setData('buttonLayout.presets', presets || {});
  };

  proto.getPreset = function(name) {
    var presets = this.getAllPresets();
    return presets[name] || null;
  };

  proto.savePreset = function(name, presetData) {
    if (!name || !presetData) return false;
    var presets = this.getAllPresets();
    presets[name] = presetData;
    this.setAllPresets(presets);
    return true;
  };

  proto.deletePreset = function(name) {
    if (name === '默认') return false;
    var presets = this.getAllPresets();
    if (!presets[name]) return false;
    delete presets[name];
    this.setAllPresets(presets);
    if (this.getActivePreset() === name) {
      this.setActivePreset('默认');
    }
    return true;
  };

  proto.getActivePreset = function() {
    return this._dm.getData('buttonLayout.activePreset', '默认');
  };

  proto.setActivePreset = function(name) {
    this._dm.setData('buttonLayout.activePreset', name || '默认');
  };

  proto.getScenePreset = function(sceneType) {
    if (!sceneType) return null;
    return this._dm.getData('buttonLayout.scenePresets.' + sceneType, null);
  };

  proto.saveScenePreset = function(sceneType, data) {
    if (!sceneType || !data) return false;
    this._dm.setData('buttonLayout.scenePresets.' + sceneType, data);
    return true;
  };

  proto.hasScenePreset = function(sceneType) {
    return !!this.getScenePreset(sceneType);
  };

  window.MountainRacer = MountainRacer;
})();
