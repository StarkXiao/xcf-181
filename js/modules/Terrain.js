(function() {
  var MountainRacer = window.MountainRacer || {};

  MountainRacer.TERRAIN_PRESETS = {
    steepSlopeUp: {
      type: 'steepSlope',
      name: '连续上坡',
      direction: 'up',
      minAngle: 0.15,
      maxAngle: 0.4,
      minLength: 300,
      maxLength: 800
    },
    steepSlopeDown: {
      type: 'steepSlope',
      name: '连续下坡',
      direction: 'down',
      minAngle: 0.15,
      maxAngle: 0.45,
      minLength: 300,
      maxLength: 900
    },
    brokenBridge: {
      type: 'brokenBridge',
      name: '断桥落差',
      minGap: 80,
      maxGap: 200,
      minDrop: 40,
      maxDrop: 120,
      approachLength: 100
    },
    bufferPlatform: {
      type: 'bufferPlatform',
      name: '缓冲平台',
      minLength: 150,
      maxLength: 400
    },
    stepSlope: {
      type: 'stepSlope',
      name: '阶梯式起伏',
      stepCount: [3, 6],
      stepHeight: [20, 50],
      stepWidth: [80, 150]
    }
  };

  MountainRacer.DIFFICULTY_CONFIGS = {
    easy: {
      featureDensity: 0.0008,
      maxFeatures: 4,
      allowedTypes: ['bufferPlatform', 'steepSlopeUp', 'steepSlopeDown'],
      steepSlopeMaxAngle: 0.2,
      brokenBridgeMaxDrop: 50,
      brokenBridgeMaxGap: 100
    },
    normal: {
      featureDensity: 0.0015,
      maxFeatures: 7,
      allowedTypes: ['bufferPlatform', 'steepSlopeUp', 'steepSlopeDown', 'brokenBridge', 'stepSlope'],
      steepSlopeMaxAngle: 0.32,
      brokenBridgeMaxDrop: 90,
      brokenBridgeMaxGap: 150
    },
    hard: {
      featureDensity: 0.0025,
      maxFeatures: 12,
      allowedTypes: ['steepSlopeUp', 'steepSlopeDown', 'brokenBridge', 'stepSlope', 'bufferPlatform'],
      steepSlopeMaxAngle: 0.45,
      brokenBridgeMaxDrop: 140,
      brokenBridgeMaxGap: 200
    },
    extreme: {
      featureDensity: 0.0035,
      maxFeatures: 16,
      allowedTypes: ['steepSlopeDown', 'brokenBridge', 'stepSlope'],
      steepSlopeMaxAngle: 0.55,
      brokenBridgeMaxDrop: 180,
      brokenBridgeMaxGap: 250
    }
  };

  MountainRacer.LEVEL_CONFIGS = {
    1: {
      name: '初级赛道',
      sceneType: 'exploration',
      length: 5000,
      baseHeight: 450,
      amplitude: 60,
      roughness: 0.006,
      obstacleDensity: 0.015,
      bgLayers: 3,
      achievements: [
        { id: 'explorer_lv1', name: '初级探险家', description: '探索所有可见分支', condition: { type: 'uniqueBranches', value: 2 } },
        { id: 'speed_demon_lv1', name: '速度恶魔', description: '在秘径中达到高速', condition: { type: 'branchSpeed', branch: 'shortcut', value: 450 } },
        { id: 'pathfinder_lv1', name: '开路先锋', description: '发现隐藏路线', condition: { type: 'unlockHidden', value: 1 } }
      ],
      branches: [
        {
          id: 'main',
          name: '主路',
          type: 'main',
          riskLevel: 1,
          rewardMultiplier: 1.0,
          obstacleMultiplier: 1.0,
          lengthMultiplier: 1.0,
          color: 0x4caf50,
          hidden: false,
          description: '平坦安全的主路',
          difficulty: '简单',
          terrainDifficulty: 'easy',
          estimatedTime: '~60秒',
          pros: ['安全稳定', '障碍稀少', '适合新手'],
          cons: ['奖励一般', '缺乏挑战'],
          dangerZones: [],
          rewardZones: [
            { startX: 1800, endX: 2000, type: 'coin', density: 0.05 },
            { startX: 4000, endX: 4200, type: 'coin', density: 0.05 }
          ],
          specialEvents: [
            { x: 2500, type: 'speedBoost', name: '加速带', multiplier: 1.3, duration: 3 }
          ],
          mergeSmoothness: 1.0,
          weightContribution: { risk: 0, exploration: 0.1, perfect: 0.25 }
        },
        {
          id: 'risky',
          name: '险道',
          type: 'risky',
          riskLevel: 2,
          rewardMultiplier: 1.5,
          obstacleMultiplier: 1.8,
          lengthMultiplier: 0.9,
          amplitudeBonus: 30,
          color: 0xff9800,
          hidden: false,
          description: '崎岖但更短，奖励更高',
          difficulty: '中等',
          terrainDifficulty: 'normal',
          estimatedTime: '~55秒',
          pros: ['距离更短', '奖励更高', '跳跃更多'],
          cons: ['地形崎岖', '落石危险', '路面湿滑'],
          dangerZones: [
            { startX: 1600, endX: 1800, type: 'rockfall', damage: 15, warningX: 1500 },
            { startX: 2200, endX: 2400, type: 'slippery', slowdown: 0.3, warningX: 2100 }
          ],
          rewardZones: [
            { startX: 2000, endX: 2200, type: 'gem', density: 0.03 }
          ],
          specialEvents: [
            { x: 1900, type: 'riskBonus', name: '险道奖励', points: 100, condition: { type: 'noDamage', range: 500 } }
          ],
          mergeSmoothness: 0.8,
          weightContribution: { risk: 0.15, exploration: 0.15, perfect: 0.2 }
        },
        {
          id: 'shortcut',
          name: '秘径',
          type: 'shortcut',
          riskLevel: 3,
          rewardMultiplier: 2.0,
          obstacleMultiplier: 2.5,
          lengthMultiplier: 0.75,
          amplitudeBonus: 50,
          color: 0x9c27b0,
          hidden: true,
          unlockCondition: { type: 'speed', value: 400 },
          unlockHint: '🚀 达到 400+ 速度解锁',
          description: '隐藏捷径，超高奖励',
          difficulty: '困难',
          terrainDifficulty: 'hard',
          estimatedTime: '~45秒',
          pros: ['距离最短', '奖励最高', '宝石密集'],
          cons: ['极其崎岖', '悬崖危险', '落石频繁'],
          dangerZones: [
            { startX: 3600, endX: 3800, type: 'rockfall', damage: 25, warningX: 3500 },
            { startX: 4100, endX: 4300, type: 'cliff', fallChance: 0.3, warningX: 4000 }
          ],
          rewardZones: [
            { startX: 3800, endX: 4000, type: 'gem', density: 0.06 },
            { startX: 4300, endX: 4500, type: 'coin', density: 0.08 }
          ],
          specialEvents: [
            { x: 3900, type: 'secretBonus', name: '秘境宝藏', points: 500, oneTime: true }
          ],
          mergeSmoothness: 0.6,
          weightContribution: { risk: 0.3, exploration: 0.25, perfect: 0.15 }
        }
      ],
      branchPoints: [
        { x: 1200, type: 'split', branches: ['main', 'risky'], mergeBackX: 2800, hint: '选择你的路线' },
        { x: 2800, type: 'merge', from: ['main', 'risky'], bonus: 200 },
        { x: 3500, type: 'split', branches: ['main', 'shortcut'], hidden: true, mergeBackX: 4700, hint: '✨ 发现隐藏路线!' }
      ],
      mergePoint: 4700,
      finalMergeSmoothRange: 300,
      weightConfig: {
        baseMultiplier: 1.0,
        riskWeightPerLevel: 0.15,
        explorationWeightPerBranch: 0.08,
        perfectRunWeight: 0.25,
        lowDamageWeight: 0.1,
        mergeWeight: 0.05,
        hiddenBranchBonus: 0.2
      }
    },
    2: {
      name: '中级赛道',
      sceneType: 'all',
      length: 8000,
      baseHeight: 430,
      amplitude: 90,
      roughness: 0.008,
      obstacleDensity: 0.025,
      bgLayers: 4,
      achievements: [
        { id: 'explorer_lv2', name: '山地探险家', description: '探索所有3条可见分支', condition: { type: 'uniqueBranches', value: 3 } },
        { id: 'air_master_lv2', name: '空中大师', description: '累计飞行超过3秒', condition: { type: 'totalAirTime', value: 3 } },
        { id: 'pathfinder_lv2', name: '秘境探索者', description: '发现中级赛道隐藏路线', condition: { type: 'unlockHidden', value: 1 } }
      ],
      branches: [
        {
          id: 'main',
          name: '主路',
          type: 'main',
          riskLevel: 1,
          rewardMultiplier: 1.0,
          obstacleMultiplier: 1.0,
          lengthMultiplier: 1.0,
          color: 0x4caf50,
          hidden: false,
          description: '标准主路',
          difficulty: '简单',
          terrainDifficulty: 'easy',
          estimatedTime: '~90秒',
          pros: ['路线熟悉', '障碍适中'],
          cons: ['奖励一般'],
          dangerZones: [],
          rewardZones: [
            { startX: 2000, endX: 2200, type: 'coin', density: 0.04 }
          ],
          specialEvents: [],
          mergeSmoothness: 1.0,
          weightContribution: { risk: 0, exploration: 0.1, perfect: 0.25 }
        },
        {
          id: 'risky',
          name: '险道',
          type: 'risky',
          riskLevel: 2,
          rewardMultiplier: 1.6,
          obstacleMultiplier: 2.0,
          lengthMultiplier: 0.85,
          amplitudeBonus: 40,
          color: 0xff9800,
          hidden: false,
          description: '高风险高回报',
          difficulty: '中等',
          terrainDifficulty: 'normal',
          estimatedTime: '~80秒',
          pros: ['速度快', '奖励高'],
          cons: ['障碍多', '易损坏'],
          dangerZones: [
            { startX: 2500, endX: 2800, type: 'rockfall', damage: 18, warningX: 2400 },
            { startX: 3200, endX: 3500, type: 'slippery', slowdown: 0.25, warningX: 3100 }
          ],
          rewardZones: [
            { startX: 2800, endX: 3000, type: 'gem', density: 0.04 }
          ],
          specialEvents: [
            { x: 3000, type: 'riskBonus', name: '勇者奖励', points: 150, condition: { type: 'noDamage', range: 600 } }
          ],
          mergeSmoothness: 0.8,
          weightContribution: { risk: 0.15, exploration: 0.15, perfect: 0.2 }
        },
        {
          id: 'mountain',
          name: '山道',
          type: 'mountain',
          riskLevel: 3,
          rewardMultiplier: 2.2,
          obstacleMultiplier: 1.5,
          lengthMultiplier: 1.2,
          amplitudeBonus: 80,
          color: 0x795548,
          hidden: false,
          description: '翻山越岭，距离长但障碍少',
          difficulty: '困难',
          terrainDifficulty: 'hard',
          estimatedTime: '~100秒',
          pros: ['障碍稀少', '视野开阔', '跳跃极多'],
          cons: ['距离最长', '大起大落', '需要技巧'],
          dangerZones: [
            { startX: 3000, endX: 3300, type: 'cliff', fallChance: 0.2, warningX: 2900 }
          ],
          rewardZones: [
            { startX: 4500, endX: 4800, type: 'gem', density: 0.05 },
            { startX: 5200, endX: 5500, type: 'coin', density: 0.06 }
          ],
          specialEvents: [
            { x: 4000, type: 'jumpChallenge', name: '飞跃挑战', points: 200, condition: { type: 'airTime', value: 1.0 } }
          ],
          mergeSmoothness: 0.7,
          weightContribution: { risk: 0.2, exploration: 0.2, perfect: 0.15 }
        },
        {
          id: 'shortcut',
          name: '秘径',
          type: 'shortcut',
          riskLevel: 4,
          rewardMultiplier: 2.5,
          obstacleMultiplier: 3.0,
          lengthMultiplier: 0.7,
          amplitudeBonus: 60,
          color: 0x9c27b0,
          hidden: true,
          unlockCondition: { type: 'airtime', value: 1.5 },
          unlockHint: '🦘 单次飞行 1.5秒+ 解锁',
          description: '终极捷径，需要飞行技术',
          difficulty: '极难',
          terrainDifficulty: 'extreme',
          estimatedTime: '~65秒',
          pros: ['距离最短', '奖励最高'],
          cons: ['极其危险', '需要技术'],
          dangerZones: [
            { startX: 5200, endX: 5500, type: 'rockfall', damage: 30, warningX: 5100 },
            { startX: 5800, endX: 6100, type: 'cliff', fallChance: 0.35, warningX: 5700 }
          ],
          rewardZones: [
            { startX: 5500, endX: 5700, type: 'gem', density: 0.07 },
            { startX: 6100, endX: 6400, type: 'gem', density: 0.05 }
          ],
          specialEvents: [
            { x: 5600, type: 'secretBonus', name: '空中宝藏', points: 600, oneTime: true }
          ],
          mergeSmoothness: 0.5,
          weightContribution: { risk: 0.35, exploration: 0.25, perfect: 0.1 }
        }
      ],
      branchPoints: [
        { x: 1500, type: 'split', branches: ['main', 'risky', 'mountain'], hint: '三条路线任你选择' },
        { x: 4000, type: 'merge', from: ['main', 'risky'], bonus: 250 },
        { x: 5000, type: 'split', branches: ['main', 'shortcut'], hidden: true, hint: '✨ 秘径已开启!' },
        { x: 6000, type: 'merge', from: ['mountain', 'main'], bonus: 300 }
      ],
      mergePoint: 7600,
      finalMergeSmoothRange: 350,
      weightConfig: {
        baseMultiplier: 1.0,
        riskWeightPerLevel: 0.15,
        explorationWeightPerBranch: 0.08,
        perfectRunWeight: 0.25,
        lowDamageWeight: 0.1,
        mergeWeight: 0.05,
        hiddenBranchBonus: 0.2
      }
    },
    3: {
      name: '高级赛道',
      sceneType: 'racing',
      length: 12000,
      baseHeight: 400,
      amplitude: 120,
      roughness: 0.01,
      obstacleDensity: 0.035,
      bgLayers: 5,
      achievements: [
        { id: 'explorer_lv3', name: '极限探险家', description: '探索所有可见分支', condition: { type: 'uniqueBranches', value: 3 } },
        { id: 'combo_master', name: '连击大师', description: '达成5次跳跃连击', condition: { type: 'jumpCombo', value: 5 } },
        { id: 'pathfinder_lv3', name: '传说开路者', description: '发现所有隐藏路线', condition: { type: 'unlockHidden', value: 2 } },
        { id: 'perfect_runner', name: '完美车手', description: '无伤通关高级赛道', condition: { type: 'perfectRun', value: true } }
      ],
      branches: [
        {
          id: 'main',
          name: '主路',
          type: 'main',
          riskLevel: 2,
          rewardMultiplier: 1.0,
          obstacleMultiplier: 1.0,
          lengthMultiplier: 1.0,
          color: 0x4caf50,
          hidden: false,
          description: '标准主路',
          difficulty: '中等',
          terrainDifficulty: 'normal',
          estimatedTime: '~130秒',
          pros: ['路线熟悉'],
          cons: ['障碍较多'],
          dangerZones: [
            { startX: 3000, endX: 3200, type: 'rockfall', damage: 20, warningX: 2900 }
          ],
          rewardZones: [
            { startX: 2500, endX: 2700, type: 'coin', density: 0.04 }
          ],
          specialEvents: [],
          mergeSmoothness: 1.0,
          weightContribution: { risk: 0.1, exploration: 0.1, perfect: 0.25 }
        },
        {
          id: 'risky',
          name: '险道',
          type: 'risky',
          riskLevel: 3,
          rewardMultiplier: 1.8,
          obstacleMultiplier: 2.2,
          lengthMultiplier: 0.8,
          amplitudeBonus: 50,
          color: 0xff9800,
          hidden: false,
          description: '危险但快速',
          difficulty: '困难',
          terrainDifficulty: 'hard',
          estimatedTime: '~110秒',
          pros: ['速度快', '奖励较高'],
          cons: ['障碍密集', '危险区域多'],
          dangerZones: [
            { startX: 2800, endX: 3100, type: 'rockfall', damage: 22, warningX: 2700 },
            { startX: 3800, endX: 4100, type: 'slippery', slowdown: 0.2, warningX: 3700 }
          ],
          rewardZones: [
            { startX: 3200, endX: 3500, type: 'gem', density: 0.04 }
          ],
          specialEvents: [
            { x: 3500, type: 'riskBonus', name: '极限挑战', points: 200, condition: { type: 'noDamage', range: 800 } }
          ],
          mergeSmoothness: 0.75,
          weightContribution: { risk: 0.2, exploration: 0.15, perfect: 0.2 }
        },
        {
          id: 'canyon',
          name: '峡谷',
          type: 'canyon',
          riskLevel: 4,
          rewardMultiplier: 2.0,
          obstacleMultiplier: 2.8,
          lengthMultiplier: 0.9,
          amplitudeBonus: 100,
          color: 0x795548,
          hidden: false,
          description: '峡谷穿行，大起大落',
          difficulty: '极难',
          terrainDifficulty: 'extreme',
          estimatedTime: '~120秒',
          pros: ['地形刺激', '奖励丰厚'],
          cons: ['起伏剧烈', '极易坠落'],
          dangerZones: [
            { startX: 3500, endX: 3800, type: 'cliff', fallChance: 0.25, warningX: 3400 },
            { startX: 6000, endX: 6300, type: 'rockfall', damage: 28, warningX: 5900 },
            { startX: 7000, endX: 7300, type: 'cliff', fallChance: 0.3, warningX: 6900 }
          ],
          rewardZones: [
            { startX: 4000, endX: 4300, type: 'gem', density: 0.05 },
            { startX: 6500, endX: 6800, type: 'gem', density: 0.06 }
          ],
          specialEvents: [
            { x: 5000, type: 'jumpChallenge', name: '峡谷飞跃', points: 300, condition: { type: 'airTime', value: 1.2 } }
          ],
          mergeSmoothness: 0.65,
          weightContribution: { risk: 0.3, exploration: 0.2, perfect: 0.15 }
        },
        {
          id: 'skyroad',
          name: '天路',
          type: 'skyroad',
          riskLevel: 5,
          rewardMultiplier: 2.8,
          obstacleMultiplier: 1.2,
          lengthMultiplier: 1.1,
          amplitudeBonus: -40,
          baseHeightBonus: -80,
          color: 0x03a9f4,
          hidden: true,
          unlockCondition: { type: 'combo', value: 3 },
          unlockHint: '🦘 达成 3次+ 跳跃连击解锁',
          description: '高空赛道，需要多次跳跃解锁',
          difficulty: '传说',
          terrainDifficulty: 'extreme',
          estimatedTime: '~140秒',
          pros: ['障碍极少', '风景绝美', '独特体验'],
          cons: ['位置高', '坠落即死', '需要跳跃技巧'],
          dangerZones: [
            { startX: 9500, endX: 9800, type: 'cliff', fallChance: 0.4, warningX: 9400 }
          ],
          rewardZones: [
            { startX: 9200, endX: 9500, type: 'gem', density: 0.08 },
            { startX: 10000, endX: 10300, type: 'gem', density: 0.06 }
          ],
          specialEvents: [
            { x: 9700, type: 'secretBonus', name: '天空宝藏', points: 800, oneTime: true },
            { x: 10100, type: 'speedBoost', name: '天际加速', multiplier: 1.4, duration: 4 }
          ],
          mergeSmoothness: 0.5,
          weightContribution: { risk: 0.4, exploration: 0.3, perfect: 0.1 }
        },
        {
          id: 'shortcut',
          name: '秘径',
          type: 'shortcut',
          riskLevel: 5,
          rewardMultiplier: 3.0,
          obstacleMultiplier: 3.5,
          lengthMultiplier: 0.65,
          amplitudeBonus: 70,
          color: 0x9c27b0,
          hidden: true,
          unlockCondition: { type: 'perfectRun', value: true },
          unlockHint: '💯 前半程无伤解锁',
          description: '传说中的捷径',
          difficulty: '传说',
          terrainDifficulty: 'extreme',
          estimatedTime: '~85秒',
          pros: ['距离最短', '奖励最高', '传奇成就'],
          cons: ['极度危险', '障碍密布', '解锁条件苛刻'],
          dangerZones: [
            { startX: 6800, endX: 7100, type: 'rockfall', damage: 35, warningX: 6700 },
            { startX: 7300, endX: 7600, type: 'cliff', fallChance: 0.4, warningX: 7200 },
            { startX: 7800, endX: 8100, type: 'rockfall', damage: 30, warningX: 7700 }
          ],
          rewardZones: [
            { startX: 7100, endX: 7300, type: 'gem', density: 0.08 },
            { startX: 7600, endX: 7800, type: 'gem', density: 0.07 },
            { startX: 8100, endX: 8400, type: 'gem', density: 0.06 }
          ],
          specialEvents: [
            { x: 7500, type: 'secretBonus', name: '传说宝藏', points: 1000, oneTime: true }
          ],
          mergeSmoothness: 0.45,
          weightContribution: { risk: 0.45, exploration: 0.3, perfect: 0.05 }
        }
      ],
      branchPoints: [
        { x: 2000, type: 'split', branches: ['main', 'risky', 'canyon'], hint: '选择你的冒险' },
        { x: 5000, type: 'merge', from: ['main', 'risky'], bonus: 300 },
        { x: 6500, type: 'split', branches: ['main', 'shortcut'], hidden: true, hint: '✨ 传说之路开启!' },
        { x: 8000, type: 'merge', from: ['canyon', 'main'], bonus: 400 },
        { x: 9000, type: 'split', branches: ['main', 'skyroad'], hidden: true, hint: '☁️ 天空之路开启!' }
      ],
      mergePoint: 11500,
      finalMergeSmoothRange: 400,
      weightConfig: {
        baseMultiplier: 1.0,
        riskWeightPerLevel: 0.15,
        explorationWeightPerBranch: 0.08,
        perfectRunWeight: 0.25,
        lowDamageWeight: 0.1,
        mergeWeight: 0.05,
        hiddenBranchBonus: 0.2
      }
    }
  };

  MountainRacer.Terrain = function(scene, level) {
    this.scene = scene;
    this.config = MountainRacer.LEVEL_CONFIGS[level] || MountainRacer.LEVEL_CONFIGS[1];
    this.level = level;
    this.points = [];
    this.texture = null;
    this.currentBranch = 'main';
    this.branchPaths = {};
    this.branchPoints = [];
    this.activeBranches = ['main'];
    this.hiddenUnlocked = {};
    this.branchHistory = [];
    this.branchTerrainFeatures = {};
    this.generate();
  };

  var proto = MountainRacer.Terrain.prototype;

  proto.noise2D = function(x, y, seed) {
    seed = seed || 0;
    var n = Math.sin(x * 12.9898 + y * 78.233 + seed * 43758.5453) * 43758.5453;
    return n - Math.floor(n);
  };

  proto.smoothNoise = function(x, seed) {
    seed = seed || 0;
    var intX = Math.floor(x);
    var fracX = x - intX;
    var v1 = this.noise2D(intX, 0, seed);
    var v2 = this.noise2D(intX + 1, 0, seed);
    var i = fracX * fracX * (3 - 2 * fracX);
    return v1 * (1 - i) + v2 * i;
  };

  proto.fbm = function(x, seed) {
    seed = seed || 0;
    var total = 0;
    var freq = 1;
    var amp = 1;
    var maxValue = 0;
    for (var i = 0; i < 4; i++) {
      total += this.smoothNoise(x * freq, seed + i * 100) * amp;
      maxValue += amp;
      amp *= 0.5;
      freq *= 2;
    }
    return total / maxValue;
  };

  proto.getBranchConfig = function(branchId) {
    var branches = this.config.branches || [];
    for (var i = 0; i < branches.length; i++) {
      if (branches[i].id === branchId) return branches[i];
    }
    return branches[0] || { id: 'main', rewardMultiplier: 1.0 };
  };

  proto.getDifficultyConfig = function(difficultyKey) {
    return MountainRacer.DIFFICULTY_CONFIGS[difficultyKey] || MountainRacer.DIFFICULTY_CONFIGS.normal;
  };

  proto.randomRange = function(min, max) {
    return min + Math.random() * (max - min);
  };

  proto.randomIntRange = function(min, max) {
    return Math.floor(this.randomRange(min, max + 1));
  };

  proto.generateTerrainFeaturesForBranch = function(branchId, length) {
    var branchCfg = this.getBranchConfig(branchId);
    var difficultyKey = branchCfg.terrainDifficulty || 'normal';
    var diffCfg = this.getDifficultyConfig(difficultyKey);
    var presets = MountainRacer.TERRAIN_PRESETS;

    var features = [];
    var targetCount = Math.min(
      diffCfg.maxFeatures,
      Math.floor(length * diffCfg.featureDensity)
    );

    var minSpacing = 350;
    var attempts = 0;
    var maxAttempts = targetCount * 8;

    while (features.length < targetCount && attempts < maxAttempts) {
      attempts++;
      var allowedTypes = diffCfg.allowedTypes.slice();
      var typePresetName = allowedTypes[this.randomIntRange(0, allowedTypes.length - 1)];
      var preset = presets[typePresetName];
      if (!preset) continue;

      var feature = {
        id: 'feat_' + branchId + '_' + features.length,
        branchId: branchId,
        type: preset.type,
        presetName: typePresetName,
        name: preset.name
      };

      var startX = 0;
      var endX = 0;

      if (preset.type === 'steepSlope') {
        var slopeLength = this.randomRange(preset.minLength, preset.maxLength);
        var maxAngle = Math.min(preset.maxAngle, diffCfg.steepSlopeMaxAngle || preset.maxAngle);
        startX = this.randomRange(600, length - slopeLength - 600);
        endX = startX + slopeLength;
        feature.startX = startX;
        feature.endX = endX;
        feature.length = slopeLength;
        feature.angle = this.randomRange(preset.minAngle, maxAngle);
        feature.direction = preset.direction;
      } else if (preset.type === 'brokenBridge') {
        var gap = this.randomRange(preset.minGap, Math.min(preset.maxGap, diffCfg.brokenBridgeMaxGap || preset.maxGap));
        var drop = this.randomRange(preset.minDrop, Math.min(preset.maxDrop, diffCfg.brokenBridgeMaxDrop || preset.maxDrop));
        var approach = preset.approachLength;
        startX = this.randomRange(600 + approach, length - gap - approach - 600);
        endX = startX + approach * 2 + gap;
        feature.startX = startX;
        feature.endX = endX;
        feature.gapStartX = startX + approach;
        feature.gapEndX = startX + approach + gap;
        feature.gapWidth = gap;
        feature.dropHeight = drop;
        feature.approachLength = approach;
      } else if (preset.type === 'bufferPlatform') {
        var platLen = this.randomRange(preset.minLength, preset.maxLength);
        startX = this.randomRange(600, length - platLen - 600);
        endX = startX + platLen;
        feature.startX = startX;
        feature.endX = endX;
        feature.length = platLen;
      } else if (preset.type === 'stepSlope') {
        var stepCount = this.randomIntRange(preset.stepCount[0], preset.stepCount[1]);
        var stepHeight = this.randomRange(preset.stepHeight[0], preset.stepHeight[1]);
        var stepWidth = this.randomRange(preset.stepWidth[0], preset.stepWidth[1]);
        var totalLen = stepCount * stepWidth + 200;
        startX = this.randomRange(600, length - totalLen - 600);
        endX = startX + totalLen;
        feature.startX = startX;
        feature.endX = endX;
        feature.stepCount = stepCount;
        feature.stepHeight = stepHeight;
        feature.stepWidth = stepWidth;
        feature.direction = Math.random() < 0.5 ? 'up' : 'down';
      } else {
        continue;
      }

      var overlaps = false;
      for (var fi = 0; fi < features.length; fi++) {
        var existing = features[fi];
        if (startX < existing.endX + minSpacing && endX > existing.startX - minSpacing) {
          overlaps = true;
          break;
        }
      }
      if (overlaps) continue;

      features.push(feature);
    }

    features.sort(function(a, b) { return a.startX - b.startX; });
    return features;
  };

  proto.getPathIndexAtX = function(path, x) {
    var step = 4;
    return Math.min(Math.floor(x / step), path.length - 1);
  };

  proto.applyTerrainFeatures = function(branchId, path) {
    var features = this.branchTerrainFeatures[branchId] || [];
    if (features.length === 0) return path;

    for (var fi = 0; fi < features.length; fi++) {
      var f = features[fi];
      if (f.type === 'steepSlope') {
        this.applySteepSlope(path, f);
      } else if (f.type === 'brokenBridge') {
        this.applyBrokenBridge(path, f);
      } else if (f.type === 'bufferPlatform') {
        this.applyBufferPlatform(path, f);
      } else if (f.type === 'stepSlope') {
        this.applyStepSlope(path, f);
      }
    }
    return path;
  };

  proto.applySteepSlope = function(path, feature) {
    var startIdx = this.getPathIndexAtX(path, feature.startX);
    var endIdx = this.getPathIndexAtX(path, feature.endX);
    if (endIdx <= startIdx) return;

    var startY = path[startIdx].y;
    var dirMul = feature.direction === 'up' ? -1 : 1;
    var totalDelta = Math.tan(feature.angle) * (feature.endX - feature.startX) * dirMul;

    for (var i = startIdx; i <= endIdx; i++) {
      var p = path[i];
      var t = (p.x - feature.startX) / (feature.endX - feature.startX);
      var ease = t * t * (3 - 2 * t);
      var delta = totalDelta * ease;
      p.y += delta;
    }

    var margin = 60;
    var preStart = Math.max(0, this.getPathIndexAtX(path, feature.startX - margin));
    for (var j = preStart; j < startIdx; j++) {
      var pt = path[j];
      var tm = 1 - (feature.startX - pt.x) / margin;
      pt.y += totalDelta * tm * tm * 0.3;
    }
    var postEnd = Math.min(path.length - 1, this.getPathIndexAtX(path, feature.endX + margin));
    for (var k = endIdx + 1; k <= postEnd; k++) {
      var pk = path[k];
      var tm2 = 1 - (pk.x - feature.endX) / margin;
      pk.y += totalDelta * (1 - (1 - tm2) * (1 - tm2)) * 0.3;
    }
  };

  proto.applyBrokenBridge = function(path, feature) {
    var approachStartIdx = this.getPathIndexAtX(path, feature.startX);
    var gapStartIdx = this.getPathIndexAtX(path, feature.gapStartX);
    var gapEndIdx = this.getPathIndexAtX(path, feature.gapEndX);
    var approachEndIdx = this.getPathIndexAtX(path, feature.endX);

    var leftPlatformY = path[gapStartIdx].y;
    var rightPlatformY = leftPlatformY + feature.dropHeight;

    for (var i = approachStartIdx; i <= gapStartIdx; i++) {
      var p = path[i];
      var t = (p.x - feature.startX) / (feature.gapStartX - feature.startX);
      path[i].y = p.y * (1 - t) + leftPlatformY * t;
    }

    for (var j = gapEndIdx; j <= approachEndIdx; j++) {
      var pj = path[j];
      var t2 = (pj.x - feature.gapEndX) / (feature.endX - feature.gapEndX);
      path[j].y = rightPlatformY * (1 - t2) + pj.y * t2;
    }

    for (var k = gapStartIdx; k <= gapEndIdx; k++) {
      path[k].isGap = true;
      path[k].gapFeature = feature;
      path[k].leftY = leftPlatformY;
      path[k].rightY = rightPlatformY;
    }
    if (gapStartIdx > 0) {
      path[gapStartIdx - 1].isGapEdge = 'left';
    }
    if (gapEndIdx < path.length - 1) {
      path[gapEndIdx + 1].isGapEdge = 'right';
    }
  };

  proto.applyBufferPlatform = function(path, feature) {
    var startIdx = this.getPathIndexAtX(path, feature.startX);
    var endIdx = this.getPathIndexAtX(path, feature.endX);
    if (endIdx <= startIdx) return;

    var sumY = 0;
    var sampleCount = 0;
    for (var s = startIdx; s <= Math.min(startIdx + 5, endIdx); s++) {
      sumY += path[s].y;
      sampleCount++;
    }
    var platformY = sumY / sampleCount;

    for (var i = startIdx; i <= endIdx; i++) {
      var p = path[i];
      var t = 0;
      if (i < startIdx + 10) {
        t = (i - startIdx) / 10;
      } else if (i > endIdx - 10) {
        t = (endIdx - i) / 10;
      } else {
        t = 1;
      }
      t = Math.max(0, Math.min(1, t));
      var easeT = t * t * (3 - 2 * t);
      path[i].y = p.y * (1 - easeT) + platformY * easeT;
    }
  };

  proto.applyStepSlope = function(path, feature) {
    var startIdx = this.getPathIndexAtX(path, feature.startX);
    var endIdx = this.getPathIndexAtX(path, feature.endX);
    if (endIdx <= startIdx) return;

    var dirMul = feature.direction === 'up' ? -1 : 1;
    var baseY = path[startIdx].y;
    var currentStep = 0;

    for (var i = startIdx; i <= endIdx; i++) {
      var p = path[i];
      var stepIdx = Math.floor((p.x - feature.startX) / feature.stepWidth);
      if (stepIdx >= 0 && stepIdx < feature.stepCount) {
        currentStep = stepIdx;
      } else if (stepIdx >= feature.stepCount) {
        currentStep = feature.stepCount;
      }
      var targetY = baseY + currentStep * feature.stepHeight * dirMul;
      path[i].y = path[i].y * 0.4 + targetY * 0.6;
    }
  };

  proto.getTerrainFeatureAt = function(x, branchId) {
    branchId = branchId || this.currentBranch;
    var features = this.branchTerrainFeatures[branchId] || [];
    for (var i = 0; i < features.length; i++) {
      var f = features[i];
      if (x >= f.startX && x <= f.endX) return f;
    }
    return null;
  };

  proto.generate = function() {
    var config = this.config;
    var length = config.length;
    var baseHeight = config.baseHeight;
    var amplitude = config.amplitude;
    var roughness = config.roughness;
    var step = 4;

    this.points = [];
    this.branchPaths = {};
    this.branchPoints = [];

    var branches = config.branches || [];
    for (var b = 0; b < branches.length; b++) {
      this.branchPaths[branches[b].id] = [];
    }

    var branchPoints = config.branchPoints || [];
    var mergePoint = config.mergePoint || (length - 300);

    var currentSegmentStart = 0;
    var activeBranches = ['main'];
    var segments = [];

    for (var bp = 0; bp < branchPoints.length; bp++) {
      var bpConfig = branchPoints[bp];
      segments.push({
        startX: currentSegmentStart,
        endX: bpConfig.x,
        branches: activeBranches.slice(),
        type: bpConfig.type
      });
      if (bpConfig.type === 'split') {
        for (var bb = 0; bb < bpConfig.branches.length; bb++) {
          if (activeBranches.indexOf(bpConfig.branches[bb]) === -1) {
            activeBranches.push(bpConfig.branches[bb]);
          }
        }
      } else if (bpConfig.type === 'merge') {
          var newActive = [];
          for (var ba = 0; ba < activeBranches.length; ba++) {
            if (bpConfig.from.indexOf(activeBranches[ba]) === -1) {
              newActive.push(activeBranches[ba]);
            }
          }
          if (newActive.length === 0) newActive = ['main'];
          activeBranches = newActive;
        }
      currentSegmentStart = bpConfig.x;
    }

    segments.push({
      startX: currentSegmentStart,
      endX: length,
      branches: activeBranches.slice(),
      type: 'end'
    });

    this.segments = segments;
    this.branchPointConfigs = branchPoints;

    var mainPoints = [];
    for (var x = 0; x <= length; x += step) {
      var n1 = this.fbm(x * roughness, 1) * 2 - 1;
      var n2 = this.fbm(x * roughness * 3, 2) * 2 - 1;
      var combined = n1 * 0.7 + n2 * 0.3;
      var y = baseHeight + combined * amplitude;

      if (x > length - 300) {
        var t = (x - (length - 300)) / 300;
        y = y * (1 - t) + (baseHeight + 100) * t;
      }
      if (x < 200) {
        var t2 = x / 200;
        y = (baseHeight + 100) * (1 - t2) + y * t2;
      }
      mainPoints.push({ x: x, y: y });
    }

    this.branchTerrainFeatures['main'] = this.generateTerrainFeaturesForBranch('main', length);
    this.applyTerrainFeatures('main', mainPoints);
    this.branchPaths['main'] = mainPoints;
    this.points = mainPoints.slice();

    for (var brIdx = 0; brIdx < branches.length; brIdx++) {
      var branch = branches[brIdx];
      if (branch.id === 'main') continue;

      var branchPath = [];
      var branchAmplitude = amplitude + (branch.amplitudeBonus || 0);
      var branchBase = baseHeight + (branch.baseHeightBonus || 0);
      var seedOffset = branch.id.charCodeAt(0) * 100;

      for (var xb = 0; xb <= length; xb += step) {
        var n1b = this.fbm(xb * roughness * 1.2, 1 + seedOffset) * 2 - 1;
        var n2b = this.fbm(xb * roughness * 4, 2 + seedOffset) * 2 - 1;
        var combinedB = n1b * 0.6 + n2b * 0.4;
        var yb = branchBase + combinedB * branchAmplitude;

        if (xb > length - 300) {
          var tb = (xb - (length - 300)) / 300;
          yb = yb * (1 - tb) + (baseHeight + 100) * tb;
        }
        if (xb < 200) {
          var t2b = xb / 200;
          yb = (baseHeight + 100) * (1 - t2b) + yb * t2b;
        }
        branchPath.push({ x: xb, y: yb });
      }

      this.branchTerrainFeatures[branch.id] = this.generateTerrainFeaturesForBranch(branch.id, length);
      this.applyTerrainFeatures(branch.id, branchPath);
      this.branchPaths[branch.id] = branchPath;
    }

    this.generateBranchPointMarkers();
  };

  proto.generateBranchPointMarkers = function() {
    var branchPoints = this.config.branchPoints || [];
    this.branchPointMarkers = [];

    for (var i = 0; i < branchPoints.length; i++) {
      var bp = branchPoints[i];
      if (bp.type === 'split') {
        var y = this.getHeightAtBranch(bp.x, 'main');
        this.branchPointMarkers.push({
          x: bp.x,
          y: y,
          type: 'split',
          branches: bp.branches,
          hidden: bp.hidden || false
        });
      }
    }
  };

  proto.getHeightAtBranch = function(x, branchId) {
    var path = this.branchPaths[branchId];
    if (!path || path.length === 0) return 450;
    if (x <= 0) return path[0].y;
    if (x >= this.config.length) return path[path.length - 1].y;

    var step = 4;
    var idx = Math.floor(x / step);
    var i1 = Math.min(idx, path.length - 1);
    var i2 = Math.min(idx + 1, path.length - 1);
    var p1 = path[i1];
    var p2 = path[i2];

    if (p1.isGap || p2.isGap) {
      var feat = p1.gapFeature || p2.gapFeature;
      if (feat) {
        if (x <= feat.gapStartX) return p1.leftY || p1.y;
        if (x >= feat.gapEndX) return p2.rightY || p2.y;
        var tGap = (x - feat.gapStartX) / feat.gapWidth;
        return p1.leftY * (1 - tGap) + p2.rightY * tGap + 9999;
      }
    }

    if (p1.x === p2.x) return p1.y;

    var t = (x - p1.x) / (p2.x - p1.x);
    return p1.y + (p2.y - p1.y) * t;
  };

  proto.getHeight = function(x) {
    return this.getHeightAtBranch(x, this.currentBranch);
  };

  proto.getAngle = function(x) {
    var h1 = this.getHeight(x - 10);
    var h2 = this.getHeight(x + 10);
    return Math.atan2(h2 - h1, 20);
  };

  proto.getNormal = function(x) {
    var angle = this.getAngle(x);
    return { x: -Math.sin(angle), y: Math.cos(angle) };
  };

  proto.switchBranch = function(branchId, switchX) {
    if (this.branchPaths[branchId]) {
      var oldBranch = this.currentBranch;
      this.currentBranch = branchId;
      this.points = this.branchPaths[branchId];
      this.lastSwitchX = switchX || (this.scene.carPhysics ? this.scene.carPhysics.car.x : 0);
      this._isBlending = true;
      this.branchHistory.push({
        from: oldBranch,
        to: branchId,
        x: this.lastSwitchX
      });
      return true;
    }
    return false;
  };

  proto.getBlendedHeight = function(x) {
    if (this.currentBranch === 'main' && !this._isBlending) {
      return this.getHeight(x);
    }

    var blendRange = this.config.finalMergeSmoothRange || 300;
    if (this.lastSwitchX === undefined) {
      return this.getHeight(x);
    }

    var distFromSwitch = x - this.lastSwitchX;
    if (distFromSwitch < 0) {
      return this.getHeight(x);
    }

    var isMerging = false;
    if (this.currentBranch !== 'main') {
      var autoMerge = this.shouldAutoMerge(x);
      if (autoMerge) {
        isMerging = true;
        var distToMerge = autoMerge.mergeX - x;
        if (distToMerge > 0 && distToMerge < blendRange) {
          var t = 1 - (distToMerge / blendRange);
          var easeT = t * t * (3 - 2 * t);
          var currentHeight = this.getHeightAtBranch(x, this.currentBranch);
          var mainHeight = this.getHeightAtBranch(x, 'main');
          return currentHeight * (1 - easeT) + mainHeight * easeT;
        }
      }
    }

    if (distFromSwitch >= blendRange) {
      this._isBlending = false;
      return this.getHeight(x);
    }

    var t = distFromSwitch / blendRange;
    var easeT = t * t * (3 - 2 * t);
    var prevBranch = 'main';
    if (this.branchHistory.length > 0) {
      var lastEntry = this.branchHistory[this.branchHistory.length - 1];
      prevBranch = lastEntry.from;
    }
    var oldHeight = this.getHeightAtBranch(x, prevBranch);
    var newHeight = this.getHeight(x);
    return oldHeight * (1 - easeT) + newHeight * easeT;
  };

  proto.isInDangerZone = function(x, branchId) {
    branchId = branchId || this.currentBranch;
    var branch = this.getBranchConfig(branchId);
    if (!branch || !branch.dangerZones) return null;
    for (var i = 0; i < branch.dangerZones.length; i++) {
      var zone = branch.dangerZones[i];
      if (x >= zone.startX && x <= zone.endX) {
        return zone;
      }
    }
    return null;
  };

  proto.isInRewardZone = function(x, branchId) {
    branchId = branchId || this.currentBranch;
    var branch = this.getBranchConfig(branchId);
    if (!branch || !branch.rewardZones) return null;
    for (var i = 0; i < branch.rewardZones.length; i++) {
      var zone = branch.rewardZones[i];
      if (x >= zone.startX && x <= zone.endX) {
        return zone;
      }
    }
    return null;
  };

  proto.isNearMergePoint = function(x, threshold) {
    threshold = threshold || 150;
    var mergePoint = this.config.mergePoint;
    if (mergePoint && Math.abs(x - mergePoint) < threshold) {
      return { near: true, point: mergePoint, isFinal: true };
    }
    var branchPoints = this.config.branchPoints || [];
    for (var i = 0; i < branchPoints.length; i++) {
      var bp = branchPoints[i];
      if (bp.type === 'merge' && Math.abs(x - bp.x) < threshold) {
        return { near: true, point: bp.x, isFinal: false, config: bp };
      }
    }
    return { near: false, point: null, isFinal: false, config: null };
  };

  proto.getUpcomingMergePoint = function(x) {
    var result = null;
    var minDist = Infinity;

    var mergePoint = this.config.mergePoint;
    if (mergePoint && mergePoint > x) {
      var dist = mergePoint - x;
      if (dist < minDist) {
        minDist = dist;
        result = { point: mergePoint, isFinal: true };
      }
    }

    var branchPoints = this.config.branchPoints || [];
    for (var i = 0; i < branchPoints.length; i++) {
      var bp = branchPoints[i];
      if (bp.type === 'merge' && bp.x > x) {
        var d = bp.x - x;
        if (d < minDist) {
          minDist = d;
          result = { point: bp.x, isFinal: false, config: bp };
        }
      }
    }

    return result;
  };

  proto.shouldAutoMerge = function(x) {
    if (this.currentBranch === 'main') return null;

    var branchPoints = this.config.branchPoints || [];
    for (var i = 0; i < branchPoints.length; i++) {
      var bp = branchPoints[i];
      if (bp.type === 'merge' && bp.from && bp.from.indexOf(this.currentBranch) !== -1) {
        if (x >= bp.x - 20 && x <= bp.x + 80) {
          return { merge: true, mergeX: bp.x, config: bp };
        }
      }
    }

    var finalMerge = this.config.mergePoint;
    if (finalMerge && x >= finalMerge - 20) {
      return { merge: true, mergeX: finalMerge, isFinal: true };
    }

    return null;
  };

  proto.performMerge = function(mergeX) {
    var oldBranch = this.currentBranch;
    this.currentBranch = 'main';
    this.points = this.branchPaths['main'];
    this.lastSwitchX = mergeX;
    this.branchHistory.push({
      from: oldBranch,
      to: 'main',
      x: mergeX,
      isMerge: true
    });
    return oldBranch;
  };

  proto.isBranchUnlocked = function(branchId) {
    var branch = this.getBranchConfig(branchId);
    if (!branch) return false;
    if (!branch.hidden) return true;
    return this.hiddenUnlocked[branchId] === true;
  };

  proto.checkHiddenUnlock = function(condition, playerStats) {
    if (!condition) return false;
    var type = condition.type;
    var value = condition.value;

    switch (type) {
      case 'speed':
        return playerStats.speed >= value;
      case 'airtime':
        return playerStats.airTime >= value;
      case 'combo':
        return playerStats.jumpCombo >= value;
      case 'perfectRun':
        return playerStats.perfectRun === true;
      default:
        return false;
    }
  };

  proto.unlockHiddenBranch = function(branchId) {
    this.hiddenUnlocked[branchId] = true;
  };

  proto.getAvailableBranchesAt = function(x) {
    var segments = this.segments || [];
    for (var i = 0; i < segments.length; i++) {
      var seg = segments[i];
      if (x >= seg.startX && x < seg.endX) {
        var visible = [];
        for (var b = 0; b < seg.branches.length; b++) {
          var bid = seg.branches[b];
          var branch = this.getBranchConfig(bid);
          if (!branch.hidden || this.hiddenUnlocked[bid]) {
            visible.push(bid);
          }
        }
        return visible;
      }
    }
    return ['main'];
  };

  proto.isAtBranchPoint = function(x, threshold) {
    threshold = threshold || 80;
    var branchPoints = this.config.branchPoints || [];
    for (var i = 0; i < branchPoints.length; i++) {
      var bp = branchPoints[i];
      if (bp.type === 'split' && Math.abs(x - bp.x) < threshold) {
        var visibleBranches = [];
        for (var b = 0; b < bp.branches.length; b++) {
          var branch = this.getBranchConfig(bp.branches[b]);
          if (!branch.hidden || this.hiddenUnlocked[bp.branches[b]]) {
            visibleBranches.push(bp.branches[b]);
          }
        }
        if (visibleBranches.length > 1) {
          return { atPoint: true, point: bp, visibleBranches: visibleBranches };
        }
      }
    }
    return { atPoint: false, point: null, visibleBranches: [] };
  };

  proto.render = function() {
    var length = this.config.length;
    var bgLayers = this.config.bgLayers;
    var height = 600;

    this.renderBackground(bgLayers, length, height);
    this.renderAllBranches(length, height);
    this.renderForeground(length, height);
    this.renderBranchIndicators();
  };

  proto.renderBackground = function(layers, length, height) {
    var colors = [
      ['#6b8e23', '#556b2f'],
      ['#556b2f', '#3e511f'],
      ['#3e511f', '#2d3e16'],
      ['#2d3e16', '#1e2b0e'],
      ['#1e2b0e', '#141d08']
    ];

    for (var i = 0; i < layers; i++) {
      var parallax = 0.2 + i * 0.15;
      var amp = 40 + i * 30;
      var baseY = 300 + i * 50;

      var graphics = this.scene.add.graphics();
      var c1 = Phaser.Display.Color.HexStringToColor(colors[i % colors.length][0]).color;
      var c2 = Phaser.Display.Color.HexStringToColor(colors[i % colors.length][1]).color;
      graphics.fillGradientStyle(c1, c1, c2, c2);

      graphics.beginPath();
      graphics.moveTo(0, height);

      for (var x = 0; x <= 800; x += 10) {
        var worldX = x / parallax;
        var n = this.fbm(worldX * 0.003 + i * 50, i + 50) * 2 - 1;
        var y = baseY + n * amp;
        graphics.lineTo(x, y);
      }

      graphics.lineTo(800, height);
      graphics.closePath();
      graphics.fillPath();
      graphics.setScrollFactor(parallax);
      graphics.setDepth(-10 - i);
    }

    var skyGraphics = this.scene.add.graphics();
    skyGraphics.fillGradientStyle(0x87ceeb, 0x87ceeb, 0xe0f6ff, 0xe0f6ff);
    skyGraphics.fillRect(0, 0, 800, 350);
    skyGraphics.setScrollFactor(0);
    skyGraphics.setDepth(-100);

    for (var j = 0; j < 6; j++) {
      var cloudX = Phaser.Math.Between(0, length);
      var cloudY = Phaser.Math.Between(30, 150);
      this.createCloud(cloudX, cloudY, 0.3 + Math.random() * 0.4);
    }
  };

  proto.createCloud = function(x, y, scale) {
    var graphics = this.scene.add.graphics();
    graphics.fillStyle(0xffffff, 0.85);

    var s = scale;
    graphics.fillCircle(0, 0, 30 * s);
    graphics.fillCircle(35 * s, -5 * s, 25 * s);
    graphics.fillCircle(60 * s, 0, 30 * s);
    graphics.fillCircle(25 * s, 10 * s, 22 * s);
    graphics.fillCircle(50 * s, 12 * s, 24 * s);

    graphics.x = x;
    graphics.y = y;
    graphics.setScrollFactor(0.15);
    graphics.setDepth(-50);
  };

  proto.renderAllBranches = function(length, height) {
    var branches = this.config.branches || [];
    var segments = this.segments || [];

    for (var i = 0; i < segments.length; i++) {
      var seg = segments[i];
      for (var b = 0; b < seg.branches.length; b++) {
        var branchId = seg.branches[b];
        var branchConfig = this.getBranchConfig(branchId);
        if (branchId === 'main') continue;
        if (branchConfig.hidden && !this.hiddenUnlocked[branchId]) continue;

        this.renderBranchSegment(branchId, seg.startX, seg.endX, branchConfig.color || 0x888888);
      }
    }
  };

  proto.renderBranchSegment = function(branchId, startX, endX, color) {
    var path = this.branchPaths[branchId];
    if (!path) return;

    var graphics = this.scene.add.graphics();
    graphics.setDepth(3);

    var step = 4;
    var startIdx = Math.floor(startX / step);
    var endIdx = Math.ceil(endX / step);

    graphics.fillGradientStyle(color, color, 0x555555, 0x555555);
    graphics.beginPath();
    graphics.moveTo(startX, 600);

    var inSegGap = false;
    for (var i = startIdx; i <= endIdx && i < path.length; i++) {
      var p = path[i];
      if (p.x < startX || p.x > endX) continue;
      if (p.isGap) {
        if (!inSegGap) {
          graphics.lineTo(p.x, 600);
          inSegGap = true;
        }
        continue;
      }
      if (inSegGap) {
        graphics.moveTo(p.x, 600);
        graphics.lineTo(p.x, p.y);
        inSegGap = false;
      } else {
        graphics.lineTo(p.x, p.y);
      }
    }

    graphics.lineTo(endX, 600);
    graphics.closePath();
    graphics.fillPath();
    graphics.setAlpha(0.4);
  };

  proto.drawPathWithGaps = function(graphics, points, height, isFill) {
    var inGap = false;
    for (var i = 0; i < points.length; i++) {
      var p = points[i];
      if (p.isGap) {
        if (!inGap) {
          if (isFill) graphics.lineTo(p.x, height);
          inGap = true;
        }
        continue;
      }
      if (inGap && !p.isGap) {
        if (isFill) {
          graphics.moveTo(p.x, height);
          graphics.lineTo(p.x, p.y);
        } else {
          graphics.moveTo(p.x, p.y);
        }
        inGap = false;
        continue;
      }
      if (isFill || i === 0) {
        graphics.lineTo(p.x, p.y);
      } else {
        graphics.lineTo(p.x, p.y);
      }
    }
  };

  proto.renderForeground = function(length, height) {
    this.mainGraphics = this.scene.add.graphics();
    this.mainGraphics.setDepth(5);

    this.mainGraphics.fillGradientStyle(0x8b7355, 0x8b7355, 0x654321, 0x654321);
    this.mainGraphics.beginPath();
    this.mainGraphics.moveTo(0, height);
    this.drawPathWithGaps(this.mainGraphics, this.points, height, true);
    this.mainGraphics.lineTo(length, height);
    this.mainGraphics.closePath();
    this.mainGraphics.fillPath();

    this.topGraphics = this.scene.add.graphics();
    this.topGraphics.setDepth(6);
    this.topGraphics.lineStyle(5, 0x228b22, 1);
    this.topGraphics.beginPath();

    var topInGap = false;
    for (var j = 0; j < this.points.length; j++) {
      var p2 = this.points[j];
      if (p2.isGap) {
        topInGap = true;
        continue;
      }
      if (topInGap) {
        this.topGraphics.moveTo(p2.x, p2.y);
        topInGap = false;
      } else if (j === 0) {
        this.topGraphics.moveTo(p2.x, p2.y);
      } else {
        this.topGraphics.lineTo(p2.x, p2.y);
      }
    }
    this.topGraphics.strokePath();

    this.grassGraphics = this.scene.add.graphics();
    this.grassGraphics.setDepth(6);

    for (var k = 0; k < this.points.length; k++) {
      var p3 = this.points[k];
      if (p3.isGap) continue;
      if (Math.random() < 0.08) {
        var angle = this.getAngle(p3.x);
        var nx = -Math.sin(angle);
        var ny = Math.cos(angle);
        var gh = 8 + Math.random() * 8;
        this.grassGraphics.lineStyle(2, 0x32cd32, 0.8);
        this.grassGraphics.beginPath();
        this.grassGraphics.moveTo(p3.x, p3.y);
        this.grassGraphics.lineTo(p3.x + nx * gh + (Math.random() - 0.5) * 4, p3.y - ny * gh);
        this.grassGraphics.strokePath();
      }
    }

    this.renderTerrainFeatureDecorations(length, height);

    var flagGraphics = this.scene.add.graphics();
    flagGraphics.setDepth(20);
    var endX = length - 100;
    var endY = this.getHeight(endX);

    flagGraphics.fillStyle(0x8b4513);
    flagGraphics.fillRect(endX, endY - 100, 6, 100);

    flagGraphics.fillStyle(0xff0000);
    flagGraphics.fillTriangle(endX + 6, endY - 100, endX + 50, endY - 85, endX + 6, endY - 70);

    flagGraphics.fillStyle(0xffd700);
    flagGraphics.fillCircle(endX + 3, endY - 100, 5);

    var endZone = this.scene.add.zone(endX, endY - 50, 80, 100);
    this.scene.physics.world.enable(endZone);
    endZone.body.setAllowGravity(false);
    endZone.body.setImmovable(true);
    this.endZone = endZone;
  };

  proto.renderTerrainFeatureDecorations = function(length, height) {
    var features = this.branchTerrainFeatures[this.currentBranch] || [];
    var featGfx = this.scene.add.graphics();
    featGfx.setDepth(7);

    for (var fi = 0; fi < features.length; fi++) {
      var f = features[fi];
      if (f.type === 'brokenBridge') {
        var leftY = this.getHeightAtBranch(f.gapStartX - 4, this.currentBranch);
        var rightY = this.getHeightAtBranch(f.gapEndX + 4, this.currentBranch);

        featGfx.fillStyle(0x5c3a21, 0.9);
        featGfx.fillRect(f.gapStartX - 20, leftY, 20, 20);
        featGfx.fillRect(f.gapEndX, rightY, 20, 20);

        featGfx.lineStyle(4, 0x8b0000, 0.9);
        featGfx.beginPath();
        featGfx.moveTo(f.gapStartX - 20, leftY);
        featGfx.lineTo(f.gapStartX, leftY);
        featGfx.strokePath();

        featGfx.lineStyle(4, 0x8b0000, 0.9);
        featGfx.beginPath();
        featGfx.moveTo(f.gapEndX, rightY);
        featGfx.lineTo(f.gapEndX + 20, rightY);
        featGfx.strokePath();

        featGfx.lineStyle(2, 0xff0000, 0.6);
        for (var wx = 0; wx < f.gapWidth; wx += 12) {
          var wxPos = f.gapStartX + wx;
          var dashTop = Math.max(leftY, rightY) + 15;
          featGfx.beginPath();
          featGfx.moveTo(wxPos, dashTop);
          featGfx.lineTo(wxPos + 6, dashTop);
          featGfx.strokePath();
        }

        var warnGfx = this.scene.add.graphics();
        warnGfx.setDepth(15);
        warnGfx.fillStyle(0xffff00, 0.9);
        warnGfx.fillTriangle(f.startX - 10, leftY - 60, f.startX + 10, leftY - 60, f.startX, leftY - 45);
        warnGfx.lineStyle(2, 0x000000, 0.8);
        warnGfx.strokeTriangle(f.startX - 10, leftY - 60, f.startX + 10, leftY - 60, f.startX, leftY - 45);

        var warnText = this.scene.add.text(f.startX, leftY - 75, '⚠️ 断桥', {
          fontSize: '12px',
          fontWeight: 'bold',
          color: '#ff0000'
        }).setOrigin(0.5);
        warnText.setDepth(16);

        if (!this.featureDecorationElements) this.featureDecorationElements = [];
        this.featureDecorationElements.push(warnGfx, warnText);
      } else if (f.type === 'bufferPlatform') {
        var platY = this.getHeightAtBranch(f.startX + 20, this.currentBranch);
        featGfx.lineStyle(3, 0x4fc3f7, 0.6);
        featGfx.beginPath();
        featGfx.moveTo(f.startX, platY - 3);
        featGfx.lineTo(f.endX, platY - 3);
        featGfx.strokePath();
      } else if (f.type === 'steepSlope') {
        var arrowY = this.getHeightAtBranch((f.startX + f.endX) / 2, this.currentBranch);
        var slopeArrow = this.scene.add.graphics();
        slopeArrow.setDepth(8);
        slopeArrow.fillStyle(f.direction === 'up' ? 0xff5722 : 0x2196f3, 0.7);
        var arrowX = (f.startX + f.endX) / 2;
        if (f.direction === 'up') {
          slopeArrow.fillTriangle(arrowX - 12, arrowY - 30, arrowX + 12, arrowY - 30, arrowX, arrowY - 55);
        } else {
          slopeArrow.fillTriangle(arrowX - 12, arrowY - 55, arrowX + 12, arrowY - 55, arrowX, arrowY - 30);
        }
        if (!this.featureDecorationElements) this.featureDecorationElements = [];
        this.featureDecorationElements.push(slopeArrow);
      }
    }
    if (!this.featureDecorationElements) this.featureDecorationElements = [];
    this.featureDecorationElements.push(featGfx);
  };

  proto.renderBranchIndicators = function() {
    if (this.indicatorGraphics) {
      for (var d = 0; d < this.indicatorGraphics.length; d++) {
        this.indicatorGraphics[d].destroy();
      }
    }
    this.indicatorGraphics = [];

    var branchPoints = this.config.branchPoints || [];

    for (var i = 0; i < branchPoints.length; i++) {
      var bp = branchPoints[i];
      if (bp.type !== 'split') continue;

      var hasVisible = false;
      for (var b = 0; b < bp.branches.length; b++) {
        var branchCfg = this.getBranchConfig(bp.branches[b]);
        if (!branchCfg.hidden && !this.hiddenUnlocked[bp.branches[b]]) continue;
        hasVisible = true;
        break;
      }
      if (!hasVisible) continue;

      var y = this.getHeightAtBranch(bp.x, 'main');

      var signGfx = this.scene.add.graphics();
      signGfx.setDepth(15);
      signGfx.x = bp.x;
      signGfx.y = y - 80;

      signGfx.fillStyle(0xffffff, 0.9);
      signGfx.fillRoundedRect(-60, -30, 120, 50, 8);
      signGfx.lineStyle(3, 0xff9800, 1);
      signGfx.strokeRoundedRect(-60, -30, 120, 50, 8);

      this.indicatorGraphics.push(signGfx);

      var text = this.scene.add.text(bp.x, y - 90, '🔀 分岔路口', {
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#333333'
      }).setOrigin(0.5);
      text.setDepth(16);

      var subText = this.scene.add.text(bp.x, y - 72, '选择路线', {
        fontSize: '11px',
        color: '#666666'
      }).setOrigin(0.5);
      subText.setDepth(16);

      this.indicatorGraphics.push(text);
      this.indicatorGraphics.push(subText);

      var arrowGfx = this.scene.add.graphics();
      arrowGfx.setDepth(16);
      arrowGfx.x = bp.x;
      arrowGfx.y = y - 30;
      arrowGfx.fillStyle(0xff9800, 1);
      arrowGfx.fillTriangle(0, 0, -8, -15, 8, -15);

      this.scene.tweens.add({
        targets: arrowGfx,
        y: y - 20,
        duration: 800,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1
      });

      this.indicatorGraphics.push(arrowGfx);
    }
  };

  proto.updateActivePath = function() {
    if (this.mainGraphics) this.mainGraphics.destroy();
    if (this.topGraphics) this.topGraphics.destroy();
    if (this.grassGraphics) this.grassGraphics.destroy();
    if (this.featureDecorationElements) {
      for (var di = 0; di < this.featureDecorationElements.length; di++) {
        if (this.featureDecorationElements[di] && this.featureDecorationElements[di].destroy) {
          this.featureDecorationElements[di].destroy();
        }
      }
      this.featureDecorationElements = [];
    }

    var length = this.config.length;
    var height = 600;

    this.mainGraphics = this.scene.add.graphics();
    this.mainGraphics.setDepth(5);

    this.mainGraphics.fillGradientStyle(0x8b7355, 0x8b7355, 0x654321, 0x654321);
    this.mainGraphics.beginPath();
    this.mainGraphics.moveTo(0, height);

    var inGap = false;
    for (var i = 0; i < this.points.length; i++) {
      var p = this.points[i];
      if (p.isGap) {
        if (!inGap) {
          this.mainGraphics.lineTo(p.x, height);
          inGap = true;
        }
        continue;
      }
      if (inGap) {
        this.mainGraphics.moveTo(p.x, height);
        this.mainGraphics.lineTo(p.x, p.y);
        inGap = false;
      } else {
        this.mainGraphics.lineTo(p.x, p.y);
      }
    }

    this.mainGraphics.lineTo(length, height);
    this.mainGraphics.closePath();
    this.mainGraphics.fillPath();

    this.topGraphics = this.scene.add.graphics();
    this.topGraphics.setDepth(6);
    this.topGraphics.lineStyle(5, 0x228b22, 1);
    this.topGraphics.beginPath();

    var topInGap2 = false;
    for (var j = 0; j < this.points.length; j++) {
      var p2 = this.points[j];
      if (p2.isGap) {
        topInGap2 = true;
        continue;
      }
      if (topInGap2) {
        this.topGraphics.moveTo(p2.x, p2.y);
        topInGap2 = false;
      } else if (j === 0) {
        this.topGraphics.moveTo(p2.x, p2.y);
      } else {
        this.topGraphics.lineTo(p2.x, p2.y);
      }
    }
    this.topGraphics.strokePath();

    this.grassGraphics = this.scene.add.graphics();
    this.grassGraphics.setDepth(6);

    for (var k = 0; k < this.points.length; k++) {
      var p3 = this.points[k];
      if (p3.isGap) continue;
      if (Math.random() < 0.08) {
        var angle = this.getAngle(p3.x);
        var nx = -Math.sin(angle);
        var ny = Math.cos(angle);
        var gh = 8 + Math.random() * 8;
        this.grassGraphics.lineStyle(2, 0x32cd32, 0.8);
        this.grassGraphics.beginPath();
        this.grassGraphics.moveTo(p3.x, p3.y);
        this.grassGraphics.lineTo(p3.x + nx * gh + (Math.random() - 0.5) * 4, p3.y - ny * gh);
        this.grassGraphics.strokePath();
      }
    }

    this.renderTerrainFeatureDecorations(length, height);
  };

  proto.destroy = function() {
    if (this.indicatorGraphics) {
      for (var i = 0; i < this.indicatorGraphics.length; i++) {
        this.indicatorGraphics[i].destroy();
      }
    }
    if (this.featureDecorationElements) {
      for (var j = 0; j < this.featureDecorationElements.length; j++) {
        if (this.featureDecorationElements[j] && this.featureDecorationElements[j].destroy) {
          this.featureDecorationElements[j].destroy();
        }
      }
    }
    if (this.mainGraphics) { this.mainGraphics.destroy(); this.mainGraphics = null; }
    if (this.topGraphics) { this.topGraphics.destroy(); this.topGraphics = null; }
    if (this.grassGraphics) { this.grassGraphics.destroy(); this.grassGraphics = null; }
  };

  window.MountainRacer = MountainRacer;
})();
