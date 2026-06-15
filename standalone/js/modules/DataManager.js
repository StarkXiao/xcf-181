(function() {
  var MountainRacer = window.MountainRacer || {};

  var CURRENT_VERSION = 1;
  var ROOT_STORAGE_KEY = 'mountain_racer_data_v' + CURRENT_VERSION;
  var LEGACY_KEYS_MARKER = 'mountain_racer_legacy_migrated';

  var DEFAULT_DATA_STRUCTURE = {
    _version: CURRENT_VERSION,
    _meta: {
      createdAt: 0,
      updatedAt: 0,
      migrations: []
    },
    highScores: {},
    unlocks: {
      levels: [1],
      branches: {},
      achievements: [],
      parts: ['engine_basic', 'tires_basic', 'suspension_basic', 'brakes_basic', 'body_basic', 'nitro_none']
    },
    settings: {
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
    },
    buttonLayout: {
      presets: {},
      activePreset: '默认',
      scenePresets: {}
    },
    gameRecords: {
      bestStats: {},
      runHistory: {},
      starRatings: {}
    },
    economy: {
      coins: 500,
      totalCoinsEarned: 0,
      totalCoinsSpent: 0
    },
    garage: {
      currentCar: 'car_basic',
      ownedCars: ['car_basic'],
      equippedParts: {
        engine: 'engine_basic',
        tires: 'tires_basic',
        suspension: 'suspension_basic',
        brakes: 'brakes_basic',
        body: 'body_basic',
        nitro: 'nitro_none'
      },
      carCustomizations: {
        car_basic: {
          color: '#ff4500',
          decals: []
        }
      },
      levelRequirements: {
        level_1: { minPower: 0, coinsRequired: 0 },
        level_2: { minPower: 80, coinsRequired: 0 },
        level_3: { minPower: 200, coinsRequired: 0 }
      }
    },
    season: {
      currentSeason: 'season_1',
      currentChapter: null,
      currentNode: null,
      seasonXP: 0,
      seasonLevel: 1,
      unlockedSeasons: ['season_1'],
      unlockedChapters: ['chapter_1'],
      unlockedNodes: {
        chapter_1: ['node_1_1']
      },
      nodeProgress: {},
      chapterProgress: {},
      seasonProgress: {},
      claimedRewards: {
        seasonLevels: [],
        chapters: [],
        nodes: []
      },
      playStats: {
        totalRuns: 0,
        totalWins: 0,
        totalDistance: 0,
        totalCoinsEarned: 0,
        totalSeasonXPEarned: 0,
        bestScorePerNode: {},
        bestTimePerNode: {}
      },
      currentRunContext: null
    },
    taskCenter: {
      dailyChallenges: {},
      dailyProgress: {},
      achievements: {},
      stageRewards: {
        completedTaskCount: 0,
        claimedStages: []
      },
      stats: {
        totalRaces: 0,
        totalDistance: 0,
        totalStars: 0,
        totalCoinsEarned: 0,
        maxSpeed: 0,
        maxCombo: 0,
        maxAirTime: 0,
        totalJumps: 0,
        consecutiveDays: 0,
        totalDays: 0,
        lastLoginDate: null,
        firstLoginDate: null
      },
      completedDailyTasks: 0,
      completedAchievements: 0,
      pendingRewards: []
    },
    tournament: {
      tickets: 5,
      lastTicketRegen: 0,
      lastFreeTicketDay: null,
      registrations: {},
      activeTournament: null,
      tournamentHistory: {},
      instances: {},
      earnedTitles: [],
      scheduleState: {
        lastDailyGenerated: null,
        lastWeeklyGenerated: null,
        generatedTournaments: []
      },
      stats: {
        totalParticipations: 0,
        totalWins: 0,
        bestRank: null,
        totalCoinsEarned: 0,
        totalTicketsSpent: 0
      }
    },
    shop: {
      dailyItems: [],
      dailyRefreshTime: 0,
      dailyRefreshCount: 0,
      lastFreeRefreshDay: null,
      freeRefreshUsedToday: 0,
      dailyClaims: {},
      limitedPurchases: {}
    },
    inventory: {
      items: {}
    }
  };

  function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
      var arr = [];
      for (var i = 0; i < obj.length; i++) arr.push(deepClone(obj[i]));
      return arr;
    }
    var result = {};
    var keys = Object.keys(obj);
    for (var j = 0; j < keys.length; j++) {
      result[keys[j]] = deepClone(obj[keys[j]]);
    }
    return result;
  }

  function deepMerge(target, source) {
    if (source === null || typeof source !== 'object') return target;
    var keys = Object.keys(source);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var srcVal = source[key];
      if (srcVal !== null && typeof srcVal === 'object' && !Array.isArray(srcVal)) {
        if (target[key] === null || typeof target[key] !== 'object' || Array.isArray(target[key])) {
          target[key] = {};
        }
        deepMerge(target[key], srcVal);
      } else {
        target[key] = deepClone(srcVal);
      }
    }
    return target;
  }

  MountainRacer.DataManager = (function() {
    var instance = null;

    function DataManagerSingleton() {
      this._data = null;
      this._listeners = {};
      this._initialized = false;
      this._highScoreManager = null;
      this._unlockManager = null;
      this._settingsManager = null;
      this._buttonLayoutManager = null;
      this._migrationManager = null;
    }

    var proto = DataManagerSingleton.prototype;

    proto.init = function() {
      if (this._initialized) return true;

      try {
        this._migrationManager = new MountainRacer.VersionMigration();
        this._loadData();
        this._highScoreManager = new MountainRacer.HighScoreManager(this);
      this._unlockManager = new MountainRacer.UnlockManager(this);
      this._settingsManager = new MountainRacer.SettingsManager(this);
      this._garageManager = new MountainRacer.GarageManager(this);
      this._seasonDataManager = null;
      this._eventLevelManager = null;
      this._rewardSystem = null;
      this._carGrowthSystem = null;
      this._taskCenterManager = null;
      this._tournamentManager = null;
      this._playerProfileManager = null;
      this._shopManager = null;
      this._initialized = true;
        this._emit('initialized', { version: this._data._version });
        return true;
      } catch (e) {
        console.error('[DataManager] 初始化失败:', e);
        this._initializeDefaultData();
        this._initialized = true;
        return false;
      }
    };

    proto._loadData = function() {
      try {
        var saved = localStorage.getItem(ROOT_STORAGE_KEY);
        if (saved) {
          var parsed = JSON.parse(saved);
          this._data = this._applyDefaults(parsed);
          this._checkAndMigrate();
        } else {
          var legacyMigrated = localStorage.getItem(LEGACY_KEYS_MARKER);
          if (!legacyMigrated) {
            this._initializeDefaultData();
            this._migrateFromLegacy();
          } else {
            this._initializeDefaultData();
          }
        }
      } catch (e) {
        console.error('[DataManager] 加载存档失败，使用默认数据:', e);
        this._initializeDefaultData();
      }
    };

    proto._initializeDefaultData = function() {
      this._data = deepClone(DEFAULT_DATA_STRUCTURE);
      var now = Date.now();
      this._data._meta.createdAt = now;
      this._data._meta.updatedAt = now;
      this._saveData();
    };

    proto._applyDefaults = function(parsed) {
      var defaults = deepClone(DEFAULT_DATA_STRUCTURE);
      return deepMerge(defaults, parsed);
    };

    proto._checkAndMigrate = function() {
      if (!this._data._version || this._data._version < CURRENT_VERSION) {
        var oldVersion = this._data._version || 0;
        var migrationResult = this._migrationManager.migrate(this._data, oldVersion, CURRENT_VERSION);
        if (migrationResult.success) {
          this._data = migrationResult.data;
          this._data._meta.migrations = this._data._meta.migrations || [];
          this._data._meta.migrations.push({
            from: oldVersion,
            to: CURRENT_VERSION,
            timestamp: Date.now(),
            steps: migrationResult.appliedSteps
          });
          this._saveData();
        }
      }
    };

    proto._migrateFromLegacy = function() {
      var self = this;
      var legacyKeys = [
        { pattern: /^mountain_racer_highscore_(\d+)$/, handler: function(key, level) {
            var val = localStorage.getItem(key);
            if (val) self._data.highScores['level_' + level] = parseInt(val, 10) || 0;
          }},
        { key: 'mountain_racer_unlocked', handler: function(key) {
            var val = localStorage.getItem(key);
            if (val) {
              try { self._data.unlocks.levels = JSON.parse(val); } catch (e) {}
            }
          }},
        { pattern: /^mountain_racer_branches_(\d+)$/, handler: function(key, level) {
            var val = localStorage.getItem(key);
            if (val) {
              try { self._data.unlocks.branches['level_' + level] = JSON.parse(val); } catch (e) {}
            }
          }},
        { pattern: /^mountain_racer_best_stats_(\d+)$/, handler: function(key, level) {
            var val = localStorage.getItem(key);
            if (val) {
              try { self._data.gameRecords.bestStats['level_' + level] = JSON.parse(val); } catch (e) {}
            }
          }},
        { pattern: /^mountain_racer_run_history_(\d+)$/, handler: function(key, level) {
            var val = localStorage.getItem(key);
            if (val) {
              try { self._data.gameRecords.runHistory['level_' + level] = JSON.parse(val); } catch (e) {}
            }
          }},
        { key: 'mountain_racer_settings', handler: function(key) {
            var val = localStorage.getItem(key);
            if (val) {
              try { deepMerge(self._data.settings, JSON.parse(val)); } catch (e) {}
            }
          }},
        { pattern: /^mountain_racer_stars_(\d+)$/, handler: function(key, level) {
            var val = localStorage.getItem(key);
            if (val) {
              try { self._data.gameRecords.starRatings['level_' + level] = JSON.parse(val); } catch (e) {}
            }
          }},
        { key: 'mountain_racer_achievements', handler: function(key) {
            var val = localStorage.getItem(key);
            if (val) {
              try { self._data.unlocks.achievements = JSON.parse(val); } catch (e) {}
            }
          }},
        { key: 'mountain_racer_btn_layouts', handler: function(key) {
            var val = localStorage.getItem(key);
            if (val) {
              try {
                var parsed = JSON.parse(val);
                self._data.buttonLayout.presets = parsed.presets || {};
              } catch (e) {}
            }
          }},
        { key: 'mountain_racer_btn_layout_active', handler: function(key) {
            var val = localStorage.getItem(key);
            if (val) self._data.buttonLayout.activePreset = val;
          }},
        { pattern: /^mountain_racer_btn_layout_scene_(.+)$/, handler: function(key, scene) {
            var val = localStorage.getItem(key);
            if (val) {
              try { self._data.buttonLayout.scenePresets[scene] = JSON.parse(val); } catch (e) {}
            }
          }}
      ];

      try {
        var allKeys = [];
        for (var i = 0; i < localStorage.length; i++) {
          allKeys.push(localStorage.key(i));
        }

        for (var j = 0; j < legacyKeys.length; j++) {
          var entry = legacyKeys[j];
          if (entry.key) {
            if (allKeys.indexOf(entry.key) !== -1) {
              entry.handler(entry.key);
            }
          } else if (entry.pattern) {
            for (var k = 0; k < allKeys.length; k++) {
              var match = allKeys[k].match(entry.pattern);
              if (match) {
                entry.handler(allKeys[k], match[1]);
              }
            }
          }
        }

        localStorage.setItem(LEGACY_KEYS_MARKER, '1');
        this._saveData();
        this._emit('legacyMigrated', {});
      } catch (e) {
        console.error('[DataManager] 旧数据迁移失败:', e);
      }
    };

    proto._saveData = function() {
      try {
        this._data._meta.updatedAt = Date.now();
        localStorage.setItem(ROOT_STORAGE_KEY, JSON.stringify(this._data));
        return true;
      } catch (e) {
        console.error('[DataManager] 保存存档失败:', e);
        if (e && e.name === 'QuotaExceededError') {
          this._emit('storageFull', { error: e });
        }
        return false;
      }
    };

    proto.save = function() {
      return this._saveData();
    };

    proto.getVersion = function() {
      return this._data ? this._data._version : 0;
    };

    proto.getMeta = function() {
      return this._data ? deepClone(this._data._meta) : null;
    };

    proto.getRawData = function() {
      if (!this._initialized) this.init();
      return deepClone(this._data);
    };

    proto.getData = function(path, defaultValue) {
      if (!this._initialized) this.init();
      var parts = (path || '').split('.');
      var current = this._data;
      for (var i = 0; i < parts.length; i++) {
        if (current === null || current === undefined) return defaultValue;
        current = current[parts[i]];
      }
      return current === undefined ? defaultValue : deepClone(current);
    };

    proto.setData = function(path, value) {
      if (!this._initialized) this.init();
      var parts = (path || '').split('.');
      var current = this._data;
      for (var i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
          current[parts[i]] = {};
        }
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = deepClone(value);
      this._saveData();
      this._emit('dataChanged', { path: path, value: value });
    };

    proto.batchUpdate = function(updates) {
      if (!this._initialized) this.init();
      if (!updates || typeof updates !== 'object') return false;
      var keys = Object.keys(updates);
      for (var i = 0; i < keys.length; i++) {
        var path = keys[i];
        var parts = path.split('.');
        var current = this._data;
        for (var j = 0; j < parts.length - 1; j++) {
          if (!current[parts[j]] || typeof current[parts[j]] !== 'object') {
            current[parts[j]] = {};
          }
          current = current[parts[j]];
        }
        current[parts[parts.length - 1]] = deepClone(updates[path]);
      }
      this._saveData();
      this._emit('dataChanged', { paths: keys, batch: true });
      return true;
    };

    proto.reset = function(keepSettings) {
      var settings = keepSettings ? deepClone(this._data.settings) : null;
      var btnLayout = keepSettings ? deepClone(this._data.buttonLayout) : null;
      this._initializeDefaultData();
      if (settings) {
        this._data.settings = settings;
        this._saveData();
      }
      if (btnLayout) {
        this._data.buttonLayout = btnLayout;
        this._saveData();
      }
      this._emit('reset', { keepSettings: !!keepSettings });
    };

    proto.exportData = function() {
      return JSON.stringify({
        exportedAt: Date.now(),
        version: CURRENT_VERSION,
        data: this.getRawData()
      });
    };

    proto.importData = function(jsonString, options) {
      options = options || { merge: false };
      try {
        var parsed = JSON.parse(jsonString);
        if (!parsed.data || !parsed.version) throw new Error('无效的导出数据格式');
        if (options.merge) {
          this._data = deepMerge(this._data, parsed.data);
        } else {
          this._data = this._applyDefaults(parsed.data);
        }
        this._checkAndMigrate();
        this._saveData();
        this._emit('imported', { merge: options.merge });
        return true;
      } catch (e) {
        console.error('[DataManager] 导入数据失败:', e);
        return false;
      }
    };

    proto.getHighScoreManager = function() {
      if (!this._initialized) this.init();
      return this._highScoreManager;
    };

    proto.getUnlockManager = function() {
      if (!this._initialized) this.init();
      return this._unlockManager;
    };

    proto.getSettingsManager = function() {
      if (!this._initialized) this.init();
      return this._settingsManager;
    };

    proto.getGarageManager = function() {
      if (!this._initialized) this.init();
      if (!this._garageManager) {
        this._garageManager = new MountainRacer.GarageManager(this);
      }
      return this._garageManager;
    };

    proto.getSeasonDataManager = function() {
      if (!this._initialized) this.init();
      if (!this._seasonDataManager) {
        this._seasonDataManager = new MountainRacer.SeasonDataManager(this);
      }
      return this._seasonDataManager;
    };

    proto.getEventLevelManager = function() {
      if (!this._initialized) this.init();
      if (!this._eventLevelManager) {
        this._eventLevelManager = new MountainRacer.EventLevelManager(this);
      }
      return this._eventLevelManager;
    };

    proto.getRewardSystem = function() {
      if (!this._initialized) this.init();
      if (!this._rewardSystem) {
        this._rewardSystem = new MountainRacer.RewardSystem(this);
      }
      return this._rewardSystem;
    };

    proto.getCarGrowthSystem = function() {
      if (!this._initialized) this.init();
      if (!this._carGrowthSystem) {
        this._carGrowthSystem = new MountainRacer.CarGrowthSystem(this);
      }
      return this._carGrowthSystem;
    };

    proto.getTaskCenterManager = function() {
      if (!this._initialized) this.init();
      if (!this._taskCenterManager) {
        this._taskCenterManager = new MountainRacer.TaskCenterManager(this);
      }
      return this._taskCenterManager;
    };

    proto.getTournamentManager = function() {
      if (!this._initialized) this.init();
      if (!this._tournamentManager) {
        this._tournamentManager = new MountainRacer.TournamentManager(this);
      }
      return this._tournamentManager;
    };

    proto.getPlayerProfileManager = function() {
      if (!this._initialized) this.init();
      if (!this._playerProfileManager) {
        this._playerProfileManager = new MountainRacer.PlayerProfileManager(this);
      }
      return this._playerProfileManager;
    };

    proto.getShopManager = function() {
      if (!this._initialized) this.init();
      if (!this._shopManager) {
        this._shopManager = new MountainRacer.ShopManager(this);
      }
      return this._shopManager;
    };

    proto.on = function(event, callback) {
      if (!this._listeners[event]) this._listeners[event] = [];
      this._listeners[event].push(callback);
      return (function(ev, cb) {
        return function() { this.off(ev, cb); }.bind(this);
      }.bind(this))(event, callback);
    };

    proto.off = function(event, callback) {
      if (!this._listeners[event]) return;
      var idx = this._listeners[event].indexOf(callback);
      if (idx !== -1) this._listeners[event].splice(idx, 1);
    };

    proto._emit = function(event, payload) {
      if (!this._listeners[event]) return;
      var listeners = this._listeners[event].slice();
      for (var i = 0; i < listeners.length; i++) {
        try { listeners[i](payload || {}); } catch (e) {}
      }
    };

    return {
      getInstance: function() {
        if (!instance) instance = new DataManagerSingleton();
        return instance;
      },
      VERSION: CURRENT_VERSION
    };
  })();

  window.MountainRacer = MountainRacer;
})();
