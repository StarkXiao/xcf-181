(function() {
  var MountainRacer = window.MountainRacer || {};

  MountainRacer.LEVEL_CONFIGS = {
    1: {
      name: '初级赛道',
      length: 5000,
      baseHeight: 450,
      amplitude: 60,
      roughness: 0.006,
      obstacleDensity: 0.015,
      bgLayers: 3,
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
          dangerZones: [],
          rewardZones: [
            { startX: 1800, endX: 2000, type: 'coin', density: 0.05 },
            { startX: 4000, endX: 4200, type: 'coin', density: 0.05 }
          ],
          mergeSmoothness: 1.0
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
          dangerZones: [
            { startX: 1600, endX: 1800, type: 'rockfall', damage: 15 },
            { startX: 2200, endX: 2400, type: 'slippery', slowdown: 0.3 }
          ],
          rewardZones: [
            { startX: 2000, endX: 2200, type: 'gem', density: 0.03 }
          ],
          mergeSmoothness: 0.8
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
          description: '隐藏捷径，超高奖励',
          dangerZones: [
            { startX: 3600, endX: 3800, type: 'rockfall', damage: 25 },
            { startX: 4100, endX: 4300, type: 'cliff', fallChance: 0.3 }
          ],
          rewardZones: [
            { startX: 3800, endX: 4000, type: 'gem', density: 0.06 },
            { startX: 4300, endX: 4500, type: 'coin', density: 0.08 }
          ],
          mergeSmoothness: 0.6
        }
      ],
      branchPoints: [
        { x: 1200, type: 'split', branches: ['main', 'risky'], mergeBackX: 2800 },
        { x: 2800, type: 'merge', from: ['main', 'risky'] },
        { x: 3500, type: 'split', branches: ['main', 'shortcut'], hidden: true, mergeBackX: 4700 }
      ],
      mergePoint: 4700,
      finalMergeSmoothRange: 300
    },
    2: {
      name: '中级赛道',
      length: 8000,
      baseHeight: 430,
      amplitude: 90,
      roughness: 0.008,
      obstacleDensity: 0.025,
      bgLayers: 4,
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
          description: '标准主路'
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
          description: '高风险高回报'
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
          description: '翻山越岭，距离长但障碍少'
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
          description: '终极捷径，需要飞行技术'
        }
      ],
      branchPoints: [
        { x: 1500, type: 'split', branches: ['main', 'risky', 'mountain'] },
        { x: 4000, type: 'merge', from: ['main', 'risky'] },
        { x: 5000, type: 'split', branches: ['main', 'shortcut'], hidden: true },
        { x: 6000, type: 'merge', from: ['mountain', 'main'] }
      ],
      mergePoint: 7600
    },
    3: {
      name: '高级赛道',
      length: 12000,
      baseHeight: 400,
      amplitude: 120,
      roughness: 0.01,
      obstacleDensity: 0.035,
      bgLayers: 5,
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
          description: '标准主路'
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
          description: '危险但快速'
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
          description: '峡谷穿行，大起大落'
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
          description: '高空赛道，需要多次跳跃解锁'
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
          description: '传说中的捷径'
        }
      ],
      branchPoints: [
        { x: 2000, type: 'split', branches: ['main', 'risky', 'canyon'] },
        { x: 5000, type: 'merge', from: ['main', 'risky'] },
        { x: 6500, type: 'split', branches: ['main', 'shortcut'], hidden: true },
        { x: 8000, type: 'merge', from: ['canyon', 'main'] },
        { x: 9000, type: 'split', branches: ['main', 'skyroad'], hidden: true }
      ],
      mergePoint: 11500
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

    for (var i = startIdx; i <= endIdx && i < path.length; i++) {
      var p = path[i];
      if (p.x >= startX && p.x <= endX) {
        graphics.lineTo(p.x, p.y);
      }
    }

    graphics.lineTo(endX, 600);
    graphics.closePath();
    graphics.fillPath();
    graphics.setAlpha(0.4);
  };

  proto.renderForeground = function(length, height) {
    var mainGraphics = this.scene.add.graphics();
    mainGraphics.setDepth(5);

    mainGraphics.fillGradientStyle(0x8b7355, 0x8b7355, 0x654321, 0x654321);
    mainGraphics.beginPath();
    mainGraphics.moveTo(0, height);

    for (var i = 0; i < this.points.length; i++) {
      var p = this.points[i];
      mainGraphics.lineTo(p.x, p.y);
    }

    mainGraphics.lineTo(length, height);
    mainGraphics.closePath();
    mainGraphics.fillPath();

    var topGraphics = this.scene.add.graphics();
    topGraphics.setDepth(6);
    topGraphics.lineStyle(5, 0x228b22, 1);
    topGraphics.beginPath();

    for (var j = 0; j < this.points.length; j++) {
      var p2 = this.points[j];
      if (j === 0) {
        topGraphics.moveTo(p2.x, p2.y);
      } else {
        topGraphics.lineTo(p2.x, p2.y);
      }
    }
    topGraphics.strokePath();

    var grassGraphics = this.scene.add.graphics();
    grassGraphics.setDepth(6);

    for (var k = 0; k < this.points.length; k++) {
      var p3 = this.points[k];
      if (Math.random() < 0.08) {
        var angle = this.getAngle(p3.x);
        var nx = -Math.sin(angle);
        var ny = Math.cos(angle);
        var gh = 8 + Math.random() * 8;
        grassGraphics.lineStyle(2, 0x32cd32, 0.8);
        grassGraphics.beginPath();
        grassGraphics.moveTo(p3.x, p3.y);
        grassGraphics.lineTo(p3.x + nx * gh + (Math.random() - 0.5) * 4, p3.y - ny * gh);
        grassGraphics.strokePath();
      }
    }

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

  proto.renderBranchIndicators = function() {
    var branchPoints = this.config.branchPoints || [];
    this.indicatorGraphics = [];

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
    var mainGraphics = null;
  };

  proto.destroy = function() {
    if (this.indicatorGraphics) {
      for (var i = 0; i < this.indicatorGraphics.length; i++) {
        this.indicatorGraphics[i].destroy();
      }
    }
  };

  window.MountainRacer = MountainRacer;
})();
