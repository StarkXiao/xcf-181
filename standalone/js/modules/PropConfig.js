(function() {
  var MountainRacer = window.MountainRacer || {};

  var PROP_DEFS = {
    speed_boost: {
      id: 'speed_boost',
      name: '加速冲刺',
      icon: '🚀',
      description: '短时间内大幅提升速度',
      rarity: 'common',
      color: 0x2196f3,
      colorStr: '#2196f3',
      category: 'boost',
      stackable: false,
      maxStack: 1,
      cooldown: 30000,
      duration: 5000,
      effect: {
        type: 'speed',
        speedMultiplier: 1.6,
        scoreMultiplier: 1.3
      }
    },
    shield: {
      id: 'shield',
      name: '能量护盾',
      icon: '🛡️',
      description: '免疫一定次数的伤害',
      rarity: 'rare',
      color: 0x4caf50,
      colorStr: '#4caf50',
      category: 'defense',
      stackable: false,
      maxStack: 1,
      cooldown: 45000,
      duration: 8000,
      effect: {
        type: 'shield',
        blockCount: 3,
        damageReduction: 1.0
      }
    },
    magnet: {
      id: 'magnet',
      name: '磁力吸附',
      icon: '🧲',
      description: '自动吸引附近收集品',
      rarity: 'common',
      color: 0x9c27b0,
      colorStr: '#9c27b0',
      category: 'utility',
      stackable: false,
      maxStack: 1,
      cooldown: 25000,
      duration: 6000,
      effect: {
        type: 'magnet',
        attractRadius: 200,
        collectibleMultiplier: 2.0
      }
    },
    heal: {
      id: 'heal',
      name: '修复包',
      icon: '❤️‍🩹',
      description: '立即恢复大量生命值',
      rarity: 'uncommon',
      color: 0xe91e63,
      colorStr: '#e91e63',
      category: 'recovery',
      stackable: true,
      maxStack: 3,
      cooldown: 20000,
      duration: 0,
      effect: {
        type: 'heal',
        healPercent: 35
      }
    },
    score_double: {
      id: 'score_double',
      name: '双倍积分',
      icon: '✨',
      description: '一段时间内得分翻倍',
      rarity: 'rare',
      color: 0xffd700,
      colorStr: '#ffd700',
      category: 'boost',
      stackable: false,
      maxStack: 1,
      cooldown: 60000,
      duration: 7000,
      effect: {
        type: 'scoreMultiply',
        scoreMultiplier: 2.0
      }
    },
    slow_time: {
      id: 'slow_time',
      name: '时间减缓',
      icon: '⏳',
      description: '减缓障碍物移动速度',
      rarity: 'epic',
      color: 0x00bcd4,
      colorStr: '#00bcd4',
      category: 'utility',
      stackable: false,
      maxStack: 1,
      cooldown: 50000,
      duration: 4000,
      effect: {
        type: 'timeSlow',
        timeScale: 0.5
      }
    }
  };

  var RARITY_ORDER = {
    common: 0,
    uncommon: 1,
    rare: 2,
    epic: 3,
    legendary: 4
  };

  var RARITY_WEIGHTS = {
    common: 50,
    uncommon: 30,
    rare: 15,
    epic: 4,
    legendary: 1
  };

  var SPAWN_CONFIG = {
    baseDensity: 0.003,
    minSpacing: 600,
    maxSpacing: 2000,
    branchBonusDensity: {
      risky: 0.002,
      shortcut: 0.001,
      mountain: 0.003,
      canyon: 0.002,
      skyroad: 0.004
    },
    zoneMultiplier: 1.5
  };

  MountainRacer.PropConfig = {
    getPropDef: function(propId) {
      return PROP_DEFS[propId] || null;
    },

    getAllPropDefs: function() {
      return PROP_DEFS;
    },

    getPropsByCategory: function(category) {
      var result = [];
      var keys = Object.keys(PROP_DEFS);
      for (var i = 0; i < keys.length; i++) {
        if (PROP_DEFS[keys[i]].category === category) {
          result.push(PROP_DEFS[keys[i]]);
        }
      }
      return result;
    },

    getPropsByRarity: function(rarity) {
      var result = [];
      var keys = Object.keys(PROP_DEFS);
      for (var i = 0; i < keys.length; i++) {
        if (PROP_DEFS[keys[i]].rarity === rarity) {
          result.push(PROP_DEFS[keys[i]]);
        }
      }
      return result;
    },

    getRandomPropId: function() {
      var keys = Object.keys(PROP_DEFS);
      var pool = [];
      for (var i = 0; i < keys.length; i++) {
        var def = PROP_DEFS[keys[i]];
        var weight = RARITY_WEIGHTS[def.rarity] || 1;
        for (var w = 0; w < weight; w++) {
          pool.push(keys[i]);
        }
      }
      return pool[Math.floor(Math.random() * pool.length)];
    },

    getRarityOrder: function(rarity) {
      return RARITY_ORDER[rarity] !== undefined ? RARITY_ORDER[rarity] : 0;
    },

    getRarityColor: function(rarity) {
      var colors = {
        common: { hex: 0x9e9e9e, str: '#9e9e9e' },
        uncommon: { hex: 0x4caf50, str: '#4caf50' },
        rare: { hex: 0x2196f3, str: '#2196f3' },
        epic: { hex: 0x9c27b0, str: '#9c27b0' },
        legendary: { hex: 0xffd700, str: '#ffd700' }
      };
      return colors[rarity] || colors.common;
    },

    getSpawnConfig: function() {
      return SPAWN_CONFIG;
    }
  };

  window.MountainRacer = MountainRacer;
})();
