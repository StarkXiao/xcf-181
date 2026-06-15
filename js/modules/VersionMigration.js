(function() {
  var MountainRacer = window.MountainRacer || {};

  MountainRacer.VersionMigration = function() {
    this._migrations = {};
    this._registerDefaultMigrations();
  };

  var proto = MountainRacer.VersionMigration.prototype;

  proto._registerDefaultMigrations = function() {
    this.registerMigration(0, 1, function(data) {
      if (!data._meta) {
        data._meta = { createdAt: Date.now(), updatedAt: Date.now(), migrations: [] };
      }
      if (!data.highScores) data.highScores = {};
      if (!data.unlocks) {
        data.unlocks = { levels: [1], branches: {}, achievements: [] };
      } else {
        if (!Array.isArray(data.unlocks.levels)) data.unlocks.levels = [1];
        if (!data.unlocks.branches || typeof data.unlocks.branches !== 'object') {
          data.unlocks.branches = {};
        }
        if (!Array.isArray(data.unlocks.achievements)) data.unlocks.achievements = [];
      }
      if (!data.settings) {
        data.settings = {
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
      } else {
        if (typeof data.settings.sfxEnabled === 'undefined') {
          data.settings.sfxEnabled = data.settings.soundEnabled !== false;
        }
        if (typeof data.settings.cameraShake === 'undefined') {
          data.settings.cameraShake = true;
        }
        if (typeof data.settings.showFPS === 'undefined') {
          data.settings.showFPS = false;
        }
        if (typeof data.settings.vibrationEnabled === 'undefined') {
          data.settings.vibrationEnabled = true;
        }
        if (typeof data.settings.showHints === 'undefined') {
          data.settings.showHints = true;
        }
        if (typeof data.settings.particleEffects === 'undefined') {
          data.settings.particleEffects = true;
        }
      }
      if (!data.buttonLayout) {
        data.buttonLayout = { presets: {}, activePreset: '默认', scenePresets: {} };
      }
      if (!data.gameRecords) {
        data.gameRecords = { bestStats: {}, runHistory: {}, starRatings: {} };
      }
      data._version = 1;
      return data;
    });
  };

  proto.registerMigration = function(fromVersion, toVersion, migrationFn) {
    var key = fromVersion + '_' + toVersion;
    if (!this._migrations[key]) {
      this._migrations[key] = [];
    }
    this._migrations[key].push(migrationFn);
  };

  proto.migrate = function(data, fromVersion, toVersion) {
    var result = {
      success: true,
      data: data,
      appliedSteps: [],
      errors: []
    };

    if (fromVersion >= toVersion) {
      return result;
    }

    var current = fromVersion;
    var migrationData = JSON.parse(JSON.stringify(data));

    while (current < toVersion) {
      var nextVersion = current + 1;
      var key = current + '_' + nextVersion;
      var migrations = this._migrations[key] || [];

      if (migrations.length === 0) {
        migrationData._version = nextVersion;
        current = nextVersion;
        continue;
      }

      for (var i = 0; i < migrations.length; i++) {
        try {
          migrationData = migrations[i](migrationData) || migrationData;
          result.appliedSteps.push({
            from: current,
            to: nextVersion,
            index: i,
            timestamp: Date.now()
          });
        } catch (e) {
          result.errors.push({
            from: current,
            to: nextVersion,
            index: i,
            error: e.message || String(e)
          });
          console.error('[VersionMigration] 迁移失败 v' + current + '->v' + nextVersion + ' step ' + i + ':', e);
        }
      }

      migrationData._version = nextVersion;
      current = nextVersion;
    }

    result.data = migrationData;
    result.success = result.errors.length === 0;
    return result;
  };

  proto.canMigrate = function(fromVersion, toVersion) {
    if (fromVersion >= toVersion) return true;
    var current = fromVersion;
    while (current < toVersion) {
      var next = current + 1;
      var key = current + '_' + next;
      if (!this._migrations[key] || this._migrations[key].length === 0) {
        return false;
      }
      current = next;
    }
    return true;
  };

  proto.getMigrationPath = function(fromVersion, toVersion) {
    var path = [];
    if (fromVersion >= toVersion) return path;
    var current = fromVersion;
    while (current < toVersion) {
      var next = current + 1;
      var key = current + '_' + next;
      var steps = (this._migrations[key] || []).length;
      path.push({ from: current, to: next, steps: steps, hasMigration: steps > 0 });
      current = next;
    }
    return path;
  };

  proto.getRegisteredMigrations = function() {
    var keys = Object.keys(this._migrations);
    var result = {};
    for (var i = 0; i < keys.length; i++) {
      result[keys[i]] = this._migrations[keys[i]].length;
    }
    return result;
  };

  window.MountainRacer = MountainRacer;
})();
