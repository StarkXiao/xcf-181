(function() {
  var MountainRacer = window.MountainRacer || {};

  var SEASON_CONFIGS = {
    season_1: {
      id: 'season_1',
      name: '荒野远征',
      description: '征服绵延山脉，开启你的赛车生涯！',
      icon: '🏔️',
      startDate: null,
      endDate: null,
      chapters: ['chapter_1', 'chapter_2', 'chapter_3'],
      totalRewards: {
        coins: 5000,
        parts: ['engine_sport', 'tires_sport', 'suspension_sport'],
        cars: [],
        achievements: ['season_1_complete']
      },
      difficulty: 'normal'
    }
  };

  var CHAPTER_CONFIGS = {
    chapter_1: {
      id: 'chapter_1',
      name: '山麓启程',
      description: '从山脚下出发，熟悉赛车性能，掌握基本技巧。',
      icon: '🌄',
      season: 'season_1',
      chapterNumber: 1,
      mapTheme: 'foothills',
      backgroundGradient: ['#87CEEB', '#90EE90'],
      requiredPower: 0,
      unlockStars: 0,
      nodes: [
        {
          id: 'node_1_1',
          type: 'race',
          name: '新手试炼',
          description: '简单的直线赛道，熟悉操作。',
          position: { x: 10, y: 50 },
          level: 1,
          branchConfig: 'main_only',
          rewards: { coins: 200, parts: [], stars: 3, seasonXP: 50 },
          unlockRequirement: null,
          nextNodes: ['node_1_2', 'node_1_3'],
          isStart: true,
          difficulty: 1
        },
        {
          id: 'node_1_2',
          type: 'event',
          name: '时间挑战',
          description: '限时到达终点！',
          position: { x: 30, y: 30 },
          eventType: 'time_trial',
          eventConfig: {
            timeLimit: 90,
            bonusPerSecond: 10,
            targetScore: 3000
          },
          level: 1,
          branchConfig: 'main_only',
          rewards: { coins: 300, parts: [], stars: 3, seasonXP: 80 },
          unlockRequirement: { type: 'node_clear', nodeId: 'node_1_1' },
          nextNodes: ['node_1_4'],
          isEnd: false,
          difficulty: 2
        },
        {
          id: 'node_1_3',
          type: 'event',
          name: '无伤挑战',
          description: '无伤通过关卡！',
          position: { x: 30, y: 70 },
          eventType: 'no_damage',
          eventConfig: {
            maxDamage: 0,
            damagePenalty: 500,
            bonusPerHP: 15
          },
          level: 1,
          branchConfig: 'main_only',
          rewards: { coins: 350, parts: ['tires_basic_upgrade'], stars: 3, seasonXP: 100 },
          unlockRequirement: { type: 'node_clear', nodeId: 'node_1_1' },
          nextNodes: ['node_1_4'],
          isEnd: false,
          difficulty: 2
        },
        {
          id: 'node_1_4',
          type: 'race',
          name: '双线抉择',
          description: '选择你的路线：安全的主路还是奖励丰厚的险路？',
          position: { x: 55, y: 50 },
          level: 1,
          branchConfig: 'two_path',
          rewards: { coins: 400, parts: [], stars: 3, seasonXP: 120 },
          unlockRequirement: { type: 'any_node_clear', nodeIds: ['node_1_2', 'node_1_3'] },
          nextNodes: ['node_1_5'],
          isEnd: false,
          difficulty: 3
        },
        {
          id: 'node_1_5',
          type: 'boss',
          name: '山麓之王',
          description: '击败山麓冠军，赢得丰厚奖励！',
          position: { x: 85, y: 50 },
          bossType: 'chase',
          bossConfig: {
            bossName: '老司机老王',
            bossCar: 'car_basic',
            bossMultiplier: 1.2,
            winCondition: 'finish_before',
            leadDistance: 500
          },
          level: 2,
          branchConfig: 'main_only',
          rewards: {
            coins: 1000,
            parts: ['engine_sport_unlock'],
            cars: [],
            stars: 5,
            seasonXP: 300,
            achievements: ['chapter_1_complete']
          },
          unlockRequirement: { type: 'node_clear', nodeId: 'node_1_4', minStars: 6 },
          nextNodes: [],
          isEnd: true,
          difficulty: 4,
          isBoss: true
        }
      ],
      chapterRewards: {
        coins: 500,
        parts: ['suspension_sport_unlock'],
        seasonXP: 200
      }
    },

    chapter_2: {
      id: 'chapter_2',
      name: '盘山险路',
      description: '蜿蜒的盘山公路，考验你的驾驶技术与路线选择。',
      icon: '⛰️',
      season: 'season_1',
      chapterNumber: 2,
      mapTheme: 'mountain_road',
      backgroundGradient: ['#4A90A4', '#2E5939'],
      requiredPower: 80,
      unlockStars: 8,
      nodes: [
        {
          id: 'node_2_1',
          type: 'race',
          name: '盘山启程',
          description: '进入盘山公路，注意弯道。',
          position: { x: 10, y: 50 },
          level: 2,
          branchConfig: 'main_only',
          rewards: { coins: 500, parts: [], stars: 3, seasonXP: 100 },
          unlockRequirement: { type: 'chapter_complete', chapterId: 'chapter_1' },
          nextNodes: ['node_2_2', 'node_2_3'],
          isStart: true,
          difficulty: 3
        },
        {
          id: 'node_2_2',
          type: 'event',
          name: '收集挑战',
          description: '收集赛道上的所有收集品！',
          position: { x: 30, y: 25 },
          eventType: 'collect_all',
          eventConfig: {
            collectibleCount: 15,
            bonusPerCollectible: 50,
            allCollectedBonus: 500
          },
          level: 2,
          branchConfig: 'three_path',
          rewards: { coins: 600, parts: [], stars: 3, seasonXP: 150 },
          unlockRequirement: { type: 'node_clear', nodeId: 'node_2_1' },
          nextNodes: ['node_2_4'],
          isEnd: false,
          difficulty: 4
        },
        {
          id: 'node_2_3',
          type: 'event',
          name: '特技秀',
          description: '跳跃吧！在空中完成特技！',
          position: { x: 30, y: 75 },
          eventType: 'stunt_master',
          eventConfig: {
            minAirTime: 8,
            minJumpCount: 10,
            bonusPerSecond: 100,
            bonusPerJump: 30
          },
          level: 2,
          branchConfig: 'main_with_secret',
          rewards: { coins: 650, parts: ['suspension_racing_unlock'], stars: 3, seasonXP: 180 },
          unlockRequirement: { type: 'node_clear', nodeId: 'node_2_1' },
          nextNodes: ['node_2_4'],
          isEnd: false,
          difficulty: 4
        },
        {
          id: 'node_2_4',
          type: 'race',
          name: '山脊狂飙',
          description: '沿着山脊高速前进！',
          position: { x: 55, y: 50 },
          level: 2,
          branchConfig: 'three_path',
          rewards: { coins: 700, parts: [], stars: 3, seasonXP: 180 },
          unlockRequirement: { type: 'any_node_clear', nodeIds: ['node_2_2', 'node_2_3'] },
          nextNodes: ['node_2_5', 'node_2_6'],
          isEnd: false,
          difficulty: 4
        },
        {
          id: 'node_2_5',
          type: 'event',
          name: '连击大师',
          description: '保持连击不断！',
          position: { x: 75, y: 30 },
          eventType: 'combo_master',
          eventConfig: {
            minCombo: 15,
            maxComboBreak: 3,
            bonusPerCombo: 40,
            bonusForNoBreak: 1000
          },
          level: 2,
          branchConfig: 'main_only',
          rewards: { coins: 800, parts: [], stars: 3, seasonXP: 200 },
          unlockRequirement: { type: 'node_clear', nodeId: 'node_2_4' },
          nextNodes: ['node_2_7'],
          isEnd: false,
          difficulty: 5
        },
        {
          id: 'node_2_6',
          type: 'event',
          name: '探索者',
          description: '探索所有分支路线！',
          position: { x: 75, y: 70 },
          eventType: 'explorer',
          eventConfig: {
            requiredBranchCount: 3,
            bonusPerBranch: 200,
            allBranchesBonus: 800
          },
          level: 2,
          branchConfig: 'three_path',
          rewards: { coins: 850, parts: ['tires_offroad_unlock'], stars: 3, seasonXP: 220 },
          unlockRequirement: { type: 'node_clear', nodeId: 'node_2_4' },
          nextNodes: ['node_2_7'],
          isEnd: false,
          difficulty: 5
        },
        {
          id: 'node_2_7',
          type: 'boss',
          name: '山道车神',
          description: '在盘山公路上击败传说中的山道车神！',
          position: { x: 92, y: 50 },
          bossType: 'time_trial',
          bossConfig: {
            bossName: '山道之狼',
            bossCar: 'car_sport',
            bossMultiplier: 1.35,
            winCondition: 'beat_time',
            targetTime: 150,
            timeReward: 20
          },
          level: 3,
          branchConfig: 'two_path',
          rewards: {
            coins: 2000,
            parts: ['brakes_racing_unlock', 'body_racing_unlock'],
            cars: ['car_sport_unlock'],
            stars: 5,
            seasonXP: 500,
            achievements: ['chapter_2_complete']
          },
          unlockRequirement: { type: 'any_node_clear', nodeIds: ['node_2_5', 'node_2_6'], minStars: 18 },
          nextNodes: [],
          isEnd: true,
          difficulty: 6,
          isBoss: true
        }
      ],
      chapterRewards: {
        coins: 1000,
        parts: ['engine_racing_unlock'],
        seasonXP: 500
      }
    },

    chapter_3: {
      id: 'chapter_3',
      name: '巅峰对决',
      description: '挑战最高难度，成为真正的山地赛车传奇！',
      icon: '🏔️',
      season: 'season_1',
      chapterNumber: 3,
      mapTheme: 'alpine',
      backgroundGradient: ['#6B7B8D', '#FFFFFF'],
      requiredPower: 200,
      unlockStars: 20,
      nodes: [
        {
          id: 'node_3_1',
          type: 'race',
          name: '雪线入口',
          description: '进入高山雪线区域，小心打滑！',
          position: { x: 10, y: 50 },
          level: 3,
          branchConfig: 'two_path',
          rewards: { coins: 800, parts: [], stars: 3, seasonXP: 150 },
          unlockRequirement: { type: 'chapter_complete', chapterId: 'chapter_2' },
          nextNodes: ['node_3_2', 'node_3_3'],
          isStart: true,
          difficulty: 5
        },
        {
          id: 'node_3_2',
          type: 'event',
          name: '极限生存',
          description: '高难度赛道，安全到达终点！',
          position: { x: 30, y: 25 },
          eventType: 'survival',
          eventConfig: {
            minHealthPercent: 30,
            obstacleDensity: 1.5,
            healthBonus: 1000,
            perfectBonus: 2000
          },
          level: 3,
          branchConfig: 'high_risk',
          rewards: { coins: 1000, parts: ['body_tank_unlock'], stars: 3, seasonXP: 250 },
          unlockRequirement: { type: 'node_clear', nodeId: 'node_3_1' },
          nextNodes: ['node_3_4'],
          isEnd: false,
          difficulty: 7
        },
        {
          id: 'node_3_3',
          type: 'event',
          name: '极速挑战',
          description: '追求极速！突破你的最高速度！',
          position: { x: 30, y: 75 },
          eventType: 'speed_demon',
          eventConfig: {
            minAvgSpeed: 120,
            minMaxSpeed: 180,
            speedBonus: 5,
            recordBonus: 3000
          },
          level: 3,
          branchConfig: 'speed_focus',
          rewards: { coins: 1100, parts: ['nitro_medium_unlock'], stars: 3, seasonXP: 280 },
          unlockRequirement: { type: 'node_clear', nodeId: 'node_3_1' },
          nextNodes: ['node_3_4'],
          isEnd: false,
          difficulty: 7
        },
        {
          id: 'node_3_4',
          type: 'race',
          name: '冰川山脊',
          description: '穿越冰川山脊，注意结冰路面！',
          position: { x: 55, y: 50 },
          level: 3,
          branchConfig: 'three_path',
          rewards: { coins: 1200, parts: [], stars: 3, seasonXP: 250 },
          unlockRequirement: { type: 'any_node_clear', nodeIds: ['node_3_2', 'node_3_3'] },
          nextNodes: ['node_3_5', 'node_3_6'],
          isEnd: false,
          difficulty: 7
        },
        {
          id: 'node_3_5',
          type: 'event',
          name: '完美主义',
          description: '完美通关！三星达成！',
          position: { x: 75, y: 30 },
          eventType: 'perfectionist',
          eventConfig: {
            requiredStars: 3,
            requiredPerfectRun: true,
            starBonus: 2000,
            perfectBonus: 3000
          },
          level: 3,
          branchConfig: 'three_path',
          rewards: { coins: 1500, parts: ['engine_turbo_unlock'], stars: 5, seasonXP: 400 },
          unlockRequirement: { type: 'node_clear', nodeId: 'node_3_4', minStars: 2 },
          nextNodes: ['node_3_7'],
          isEnd: false,
          difficulty: 9
        },
        {
          id: 'node_3_6',
          type: 'event',
          name: '隐藏宝藏',
          description: '发现所有隐藏秘密！',
          position: { x: 75, y: 70 },
          eventType: 'treasure_hunt',
          eventConfig: {
            hiddenBranchRequired: true,
            secretEventsRequired: 3,
            discoveryBonus: 800,
            allFoundBonus: 5000
          },
          level: 3,
          branchConfig: 'all_secret',
          rewards: { coins: 1600, parts: ['suspension_pro_unlock'], stars: 5, seasonXP: 420 },
          unlockRequirement: { type: 'node_clear', nodeId: 'node_3_4', minStars: 2 },
          nextNodes: ['node_3_7'],
          isEnd: false,
          difficulty: 9
        },
        {
          id: 'node_3_7',
          type: 'boss',
          name: '传奇对决',
          description: '终极挑战！击败山地赛车传奇！',
          position: { x: 92, y: 50 },
          bossType: 'ultimate',
          bossConfig: {
            bossName: '传奇·山巅之王',
            bossCar: 'car_super',
            bossMultiplier: 1.5,
            winCondition: 'all_conditions',
            requiredStars: 3,
            requiredTime: 180,
            requiredHealth: 50,
            requiredBranches: 3
          },
          level: 3,
          branchConfig: 'all_secret',
          rewards: {
            coins: 5000,
            parts: ['engine_pro_unlock', 'tires_slick_unlock', 'brakes_carbon_unlock', 'body_pro_unlock', 'nitro_ultimate_unlock'],
            cars: ['car_super_unlock'],
            stars: 5,
            seasonXP: 1000,
            achievements: ['chapter_3_complete', 'season_1_legend']
          },
          unlockRequirement: { type: 'any_node_clear', nodeIds: ['node_3_5', 'node_3_6'], minStars: 35 },
          nextNodes: [],
          isEnd: true,
          difficulty: 10,
          isBoss: true,
          isFinal: true
        }
      ],
      chapterRewards: {
        coins: 3000,
        parts: ['nitro_large_unlock'],
        cars: ['car_muscle_unlock'],
        seasonXP: 1000
      }
    }
  };

  var EVENT_TYPES = {
    time_trial: {
      name: '时间挑战',
      icon: '⏱️',
      description: '在限定时间内完成比赛',
      evaluation: 'timeBased'
    },
    no_damage: {
      name: '无伤挑战',
      icon: '🛡️',
      description: '不受到任何伤害完成比赛',
      evaluation: 'damageBased'
    },
    collect_all: {
      name: '收集挑战',
      icon: '💎',
      description: '收集赛道上所有的收集品',
      evaluation: 'collectBased'
    },
    stunt_master: {
      name: '特技大师',
      icon: '🤸',
      description: '完成足够的跳跃和空中特技',
      evaluation: 'stuntBased'
    },
    combo_master: {
      name: '连击大师',
      icon: '🔥',
      description: '保持高连击数完成比赛',
      evaluation: 'comboBased'
    },
    explorer: {
      name: '探索者',
      icon: '🗺️',
      description: '探索所有可能的路线分支',
      evaluation: 'explorationBased'
    },
    survival: {
      name: '极限生存',
      icon: '💪',
      description: '在高密度障碍中存活到达终点',
      evaluation: 'survivalBased'
    },
    speed_demon: {
      name: '极速狂魔',
      icon: '🚀',
      description: '达成最高速度挑战',
      evaluation: 'speedBased'
    },
    perfectionist: {
      name: '完美主义',
      icon: '💯',
      description: '完美三星通关',
      evaluation: 'perfectionBased'
    },
    treasure_hunt: {
      name: '寻宝探险',
      icon: '💰',
      description: '发现所有隐藏内容和秘密',
      evaluation: 'treasureBased'
    }
  };

  var NODE_TYPES = {
    race: { name: '常规比赛', icon: '🏁', color: '#4CAF50' },
    event: { name: '事件关卡', icon: '⭐', color: '#FF9800' },
    boss: { name: 'Boss战', icon: '👑', color: '#F44336' }
  };

  var SEASON_LEVELS = [
    { level: 1, xpRequired: 0, title: '新秀车手', reward: { coins: 100 } },
    { level: 2, xpRequired: 100, title: '见习车手', reward: { coins: 200 } },
    { level: 3, xpRequired: 300, title: '正式车手', reward: { coins: 300, parts: ['engine_sport_discount'] } },
    { level: 4, xpRequired: 600, title: '熟练车手', reward: { coins: 400 } },
    { level: 5, xpRequired: 1000, title: '精英车手', reward: { coins: 500, parts: ['tires_racing_discount'] } },
    { level: 6, xpRequired: 1500, title: '专家车手', reward: { coins: 600 } },
    { level: 7, xpRequired: 2100, title: '大师车手', reward: { coins: 800, parts: ['suspension_racing_discount'] } },
    { level: 8, xpRequired: 2800, title: '传奇车手', reward: { coins: 1000, cars: ['car_sport_discount'] } },
    { level: 9, xpRequired: 3600, title: '车神', reward: { coins: 1500 } },
    { level: 10, xpRequired: 4500, title: '山地车王', reward: { coins: 3000, cars: ['car_super_discount'], achievements: ['season_max_level'] } }
  ];

  MountainRacer.SeasonConfig = {
    getSeason: function(seasonId) {
      return SEASON_CONFIGS[seasonId] || null;
    },

    getAllSeasons: function() {
      return SEASON_CONFIGS;
    },

    getCurrentSeason: function() {
      var keys = Object.keys(SEASON_CONFIGS);
      return keys.length > 0 ? SEASON_CONFIGS[keys[0]] : null;
    },

    getChapter: function(chapterId) {
      return CHAPTER_CONFIGS[chapterId] || null;
    },

    getChaptersBySeason: function(seasonId) {
      var season = this.getSeason(seasonId);
      if (!season) return [];
      var result = [];
      for (var i = 0; i < season.chapters.length; i++) {
        var chapter = this.getChapter(season.chapters[i]);
        if (chapter) result.push(chapter);
      }
      return result;
    },

    getNode: function(chapterId, nodeId) {
      var chapter = this.getChapter(chapterId);
      if (!chapter) return null;
      for (var i = 0; i < chapter.nodes.length; i++) {
        if (chapter.nodes[i].id === nodeId) return chapter.nodes[i];
      }
      return null;
    },

    getNodesByChapter: function(chapterId) {
      var chapter = this.getChapter(chapterId);
      return chapter ? chapter.nodes : [];
    },

    getEventType: function(eventType) {
      return EVENT_TYPES[eventType] || null;
    },

    getAllEventTypes: function() {
      return EVENT_TYPES;
    },

    getNodeType: function(nodeType) {
      return NODE_TYPES[nodeType] || null;
    },

    getAllNodeTypes: function() {
      return NODE_TYPES;
    },

    getSeasonLevel: function(level) {
      if (level < 1 || level > SEASON_LEVELS.length) return null;
      return SEASON_LEVELS[level - 1];
    },

    getSeasonLevelByXP: function(xp) {
      var currentLevel = SEASON_LEVELS[0];
      for (var i = 0; i < SEASON_LEVELS.length; i++) {
        if (xp >= SEASON_LEVELS[i].xpRequired) {
          currentLevel = SEASON_LEVELS[i];
        } else {
          break;
        }
      }
      return currentLevel;
    },

    getSeasonLevels: function() {
      return SEASON_LEVELS;
    },

    getNextLevelXP: function(currentXP) {
      for (var i = 0; i < SEASON_LEVELS.length; i++) {
        if (SEASON_LEVELS[i].xpRequired > currentXP) {
          return SEASON_LEVELS[i].xpRequired;
        }
      }
      return SEASON_LEVELS[SEASON_LEVELS.length - 1].xpRequired;
    },

    getChapterStartNode: function(chapterId) {
      var chapter = this.getChapter(chapterId);
      if (!chapter) return null;
      for (var i = 0; i < chapter.nodes.length; i++) {
        if (chapter.nodes[i].isStart) return chapter.nodes[i];
      }
      return chapter.nodes.length > 0 ? chapter.nodes[0] : null;
    },

    getChapterEndNodes: function(chapterId) {
      var chapter = this.getChapter(chapterId);
      if (!chapter) return [];
      var result = [];
      for (var i = 0; i < chapter.nodes.length; i++) {
        if (chapter.nodes[i].isEnd) result.push(chapter.nodes[i]);
      }
      return result;
    },

    getBranchConfig: function(configName) {
      var configs = {
        main_only: { branches: 1, description: '单一路线' },
        two_path: { branches: 2, description: '双重选择' },
        three_path: { branches: 3, description: '三路分岔' },
        main_with_secret: { branches: 2, hasSecret: true, description: '含隐藏路线' },
        high_risk: { branches: 2, riskLevel: 5, description: '高风险高回报' },
        speed_focus: { branches: 2, focus: 'speed', description: '速度为主' },
        all_secret: { branches: 4, hasSecret: true, description: '大量隐藏路线' }
      };
      return configs[configName] || configs.main_only;
    }
  };

  MountainRacer.SEASON_CONFIGS = SEASON_CONFIGS;
  MountainRacer.CHAPTER_CONFIGS = CHAPTER_CONFIGS;
  MountainRacer.EVENT_TYPES = EVENT_TYPES;
  MountainRacer.NODE_TYPES = NODE_TYPES;
  MountainRacer.SEASON_LEVELS = SEASON_LEVELS;

  window.MountainRacer = MountainRacer;
})();
