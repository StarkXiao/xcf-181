(function() {
  var MountainRacer = window.MountainRacer || {};

  MountainRacer.ScoreManager = function(scene, level) {
    this.scene = scene;
    this.level = level;
    this.score = 0;
    this.health = 100;
    this.maxHealth = 100;
    this.startTime = Date.now();
    this.lastDistanceX = 0;
    this.distance = 0;
    this.levelLength = 0;
    this.isComplete = false;
    this.isGameOver = false;

    this.currentBranch = 'main';
    this.branchHistory = [];
    this.branchDistances = {};
    this.branchScores = {};
    this.totalWeightedMultiplier = 1.0;
    this.airTime = 0;
    this.jumpCombo = 0;
    this.perfectRun = true;
    this.maxSpeed = 0;
    this.damageTaken = 0;
    this.collectibleValue = 0;
    this.mergeCount = 0;
    this.hiddenBranchesFound = 0;

    this.bonusScores = {
      distance: 0,
      timeBonus: 0,
      healthBonus: 0,
      branchBonus: 0,
      hiddenBonus: 0,
      styleBonus: 0,
      collectibleBonus: 0,
      riskBonus: 0,
      explorationBonus: 0,
      perfectBonus: 0,
      mergeBonus: 0
    };

    this.weightBreakdown = {
      baseMultiplier: 1.0,
      riskWeight: 0,
      explorationWeight: 0,
      perfectWeight: 0,
      branchWeight: 0,
      mergeWeight: 0,
      hiddenWeight: 0,
      finalMultiplier: 1.0
    };

    this.branchScoreBreakdown = {};

    this.midGameSettings = {
      difficulty: 'normal',
      sfxEnabled: true,
      controlMode: 'keyboard',
      cameraShake: true,
      showFPS: false
    };

    this.runHistory = [];
    this.highScoreThresholds = [0.8, 0.9, 0.95, 1.0, 1.05, 1.1];
    this.highScoreBreakthrough = null;
    this.segmentScores = [];
    this.lastSegmentX = 0;
    this.segmentInterval = 500;

    this.previousBestStats = null;
    this.scoreImprovements = {};
    this.loadPreviousBest();
  };

  var proto = MountainRacer.ScoreManager.prototype;

  proto.setLevelLength = function(length) {
    this.levelLength = length;
  };

  proto.setCurrentBranch = function(branchId, x) {
    if (this.currentBranch !== branchId) {
      this.branchHistory.push({
        from: this.currentBranch,
        to: branchId,
        x: x,
        time: Date.now()
      });
    }
    this.currentBranch = branchId;
    if (!this.branchDistances[branchId]) {
      this.branchDistances[branchId] = 0;
    }
  };

  proto.addDistanceScore = function(currentX) {
    var delta = Math.max(0, currentX - this.lastDistanceX);
    this.distance += delta;

    if (currentX - this.lastSegmentX >= this.segmentInterval) {
      this.segmentScores.push({
        x: Math.floor(currentX),
        score: this.score,
        distance: Math.floor(this.distance),
        branch: this.currentBranch,
        combo: this.comboCount,
        time: Date.now() - this.startTime
      });
      this.lastSegmentX = currentX;
    }

    var branchConfig = this.getBranchConfig(this.currentBranch);
    var multiplier = branchConfig ? branchConfig.rewardMultiplier : 1.0;

    if (!this.branchDistances[this.currentBranch]) {
      this.branchDistances[this.currentBranch] = 0;
    }
    this.branchDistances[this.currentBranch] += delta;

    var baseScore = Math.floor(delta * 0.1);
    var weightedScore = Math.floor(baseScore * multiplier);
    this.score += weightedScore;
    this.lastDistanceX = currentX;

    this.bonusScores.distance = Math.floor(this.distance * 0.1);
  };

  proto.addBonusScore = function(points, type) {
    var branchConfig = this.getBranchConfig(this.currentBranch);
    var multiplier = branchConfig ? branchConfig.rewardMultiplier : 1.0;
    var weightedPoints = Math.floor(points * multiplier);
    this.score += weightedPoints;

    if (type && this.bonusScores.hasOwnProperty(type)) {
      this.bonusScores[type] += weightedPoints;
    }
    if (type === 'collectibleBonus') {
      this.collectibleValue += weightedPoints;
    }
  };

  proto.addCollectibleScore = function(value, type) {
    var branchConfig = this.getBranchConfig(this.currentBranch);
    var multiplier = branchConfig ? branchConfig.rewardMultiplier : 1.0;
    var weighted = Math.floor(value * multiplier);
    this.score += weighted;
    this.bonusScores.collectibleBonus += weighted;
    this.collectibleValue += weighted;
    return weighted;
  };

  proto.takeDamage = function(amount) {
    this.health = Math.max(0, this.health - amount);
    this.damageTaken += amount;
    this.perfectRun = false;
    if (this.health <= 0) {
      this.isGameOver = true;
    }
    return this.health <= 0;
  };

  proto.getHealthPercent = function() {
    return this.health / this.maxHealth;
  };

  proto.getProgress = function() {
    if (this.levelLength <= 0) return 0;
    return Math.min(1, this.distance / this.levelLength);
  };

  proto.getElapsedTime = function() {
    return (Date.now() - this.startTime) / 1000;
  };

  proto.formatTime = function(seconds) {
    var mins = Math.floor(seconds / 60);
    var secs = Math.floor(seconds % 60);
    var ms = Math.floor((seconds % 1) * 100);
    return (
      mins.toString().padStart(2, '0') +
      ':' +
      secs.toString().padStart(2, '0') +
      '.' +
      ms.toString().padStart(2, '0')
    );
  };

  proto.getBranchConfig = function(branchId) {
    var config = MountainRacer.LEVEL_CONFIGS[this.level];
    if (!config || !config.branches) return null;
    for (var i = 0; i < config.branches.length; i++) {
      if (config.branches[i].id === branchId) return config.branches[i];
    }
    return null;
  };

  proto.updateStats = function(carPhysics) {
    if (!carPhysics) return;

    var speed = carPhysics.getSpeed();
    if (speed > this.maxSpeed) {
      this.maxSpeed = speed;
    }

    if (!carPhysics.isGrounded) {
      this.airTime += 1 / 60;
    } else {
      if (this.airTime > 0.5) {
        this.jumpCombo++;
        var stylePoints = Math.floor(this.airTime * 50);
        this.addBonusScore(stylePoints, 'styleBonus');
      }
      this.airTime = 0;
    }
  };

  proto.checkLevelComplete = function(currentX) {
    if (this.isComplete) return false;
    if (currentX >= this.levelLength - 200) {
      this.isComplete = true;

      var elapsed = this.getElapsedTime();
      var timeBonus = Math.floor(Math.max(0, 300 - elapsed) * 10);

      var healthBonus = Math.floor(this.health * 5);

      var branchBonus = 0;
      var hiddenBonus = 0;
      var uniqueBranches = Object.keys(this.branchDistances);
      var totalBranches = (MountainRacer.LEVEL_CONFIGS[this.level] && MountainRacer.LEVEL_CONFIGS[this.level].branches) ?
        MountainRacer.LEVEL_CONFIGS[this.level].branches.length : 1;

      for (var i = 0; i < uniqueBranches.length; i++) {
        var branchId = uniqueBranches[i];
        var branchCfg = this.getBranchConfig(branchId);
        if (branchCfg && branchCfg.hidden) {
          hiddenBonus += 500;
        }
      }
      branchBonus += (uniqueBranches.length - 1) * 200;

      var explorationRatio = uniqueBranches.length / totalBranches;
      var explorationBonus = Math.floor(explorationRatio * 800);

      var styleBonus = Math.floor(this.jumpCombo * 100);

      var avgRiskLevel = 1;
      var totalBranchDist = 0;
      var weightedRisk = 0;
      for (var bi = 0; bi < uniqueBranches.length; bi++) {
        var bid = uniqueBranches[bi];
        var bCfg = this.getBranchConfig(bid);
        var bDist = this.branchDistances[bid] || 0;
        if (bCfg) {
          weightedRisk += (bCfg.riskLevel || 1) * bDist;
          totalBranchDist += bDist;
        }
      }
      if (totalBranchDist > 0) {
        avgRiskLevel = weightedRisk / totalBranchDist;
      }
      var riskBonus = Math.floor((avgRiskLevel - 1) * 300);
      if (riskBonus < 0) riskBonus = 0;

      var perfectBonus = 0;
      if (this.perfectRun) {
        perfectBonus = 1000;
      } else if (this.damageTaken < 30) {
        perfectBonus = 300;
      } else if (this.damageTaken < 60) {
        perfectBonus = 100;
      }

      var mergeBonus = 0;
      if (this.branchHistory.length >= 2) {
        mergeBonus = this.branchHistory.length * 150;
      }

      this.weightBreakdown.baseMultiplier = 1.0;
      this.weightBreakdown.riskWeight = (avgRiskLevel - 1) * 0.15;
      this.weightBreakdown.explorationWeight = explorationRatio * 0.2;
      this.weightBreakdown.perfectWeight = this.perfectRun ? 0.25 : (this.damageTaken < 30 ? 0.1 : 0);
      this.weightBreakdown.branchWeight = (uniqueBranches.length - 1) * 0.08;
      this.weightBreakdown.finalMultiplier = 1.0 +
        this.weightBreakdown.riskWeight +
        this.weightBreakdown.explorationWeight +
        this.weightBreakdown.perfectWeight +
        this.weightBreakdown.branchWeight;

      this.bonusScores.timeBonus = timeBonus;
      this.bonusScores.healthBonus = healthBonus;
      this.bonusScores.branchBonus = branchBonus;
      this.bonusScores.hiddenBonus = hiddenBonus;
      this.bonusScores.styleBonus += styleBonus;
      this.bonusScores.riskBonus = riskBonus;
      this.bonusScores.explorationBonus = explorationBonus;
      this.bonusScores.perfectBonus = perfectBonus;
      this.bonusScores.mergeBonus = mergeBonus;

      var totalBonus = timeBonus + healthBonus + branchBonus + hiddenBonus +
        styleBonus + riskBonus + explorationBonus + perfectBonus + mergeBonus;
      this.score += Math.floor(totalBonus * this.weightBreakdown.finalMultiplier);

      this.calculateScoreImprovements();
      this.saveBestStats();

      this.saveHighScore();
      this.saveBranchProgress();

      return true;
    }
    return false;
  };

  proto.getScore = function() {
    return this.score;
  };

  proto.getDetailedStats = function() {
    return {
      totalScore: this.score,
      distance: Math.floor(this.distance),
      time: this.getElapsedTime(),
      health: this.health,
      maxSpeed: Math.round(this.maxSpeed * 0.6),
      branches: this.branchDistances,
      branchHistory: this.branchHistory,
      bonusScores: this.bonusScores,
      jumpCombo: this.jumpCombo,
      perfectRun: this.perfectRun,
      damageTaken: this.damageTaken,
      collectibleValue: this.collectibleValue,
      weightBreakdown: this.weightBreakdown,
      segmentScores: this.segmentScores,
      midGameSettings: this.midGameSettings
    };
  };

  proto.getHighScore = function() {
    try {
      var key = 'mountain_racer_highscore_' + this.level;
      var saved = localStorage.getItem(key);
      return saved ? parseInt(saved, 10) : 0;
    } catch (e) {
      return 0;
    }
  };

  proto.saveHighScore = function() {
    try {
      var key = 'mountain_racer_highscore_' + this.level;
      var current = this.getHighScore();
      if (this.score > current) {
        localStorage.setItem(key, this.score.toString());
      }

      var unlockKey = 'mountain_racer_unlocked';
      var unlocked = this.getUnlockedLevels();
      if (this.isComplete && this.level < 3) {
        unlocked.push(this.level + 1);
        var unique = [];
        for (var i = 0; i < unlocked.length; i++) {
          if (unique.indexOf(unlocked[i]) === -1) {
            unique.push(unlocked[i]);
          }
        }
        localStorage.setItem(unlockKey, JSON.stringify(unique));
      }
    } catch (e) {}
  };

  proto.saveBranchProgress = function() {
    try {
      var key = 'mountain_racer_branches_' + this.level;
      var saved = localStorage.getItem(key);
      var data = saved ? JSON.parse(saved) : { unlockedBranches: [], bestScores: {} };

      var uniqueBranches = Object.keys(this.branchDistances);
      for (var i = 0; i < uniqueBranches.length; i++) {
        if (data.unlockedBranches.indexOf(uniqueBranches[i]) === -1) {
          data.unlockedBranches.push(uniqueBranches[i]);
        }
        if (!data.bestScores[uniqueBranches[i]] ||
            this.score > data.bestScores[uniqueBranches[i]]) {
          data.bestScores[uniqueBranches[i]] = this.score;
        }
      }

      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {}
  };

  proto.getUnlockedBranches = function() {
    try {
      var key = 'mountain_racer_branches_' + this.level;
      var saved = localStorage.getItem(key);
      var data = saved ? JSON.parse(saved) : { unlockedBranches: ['main'] };
      return data.unlockedBranches || ['main'];
    } catch (e) {
      return ['main'];
    }
  };

  proto.getUnlockedLevels = function() {
    try {
      var key = 'mountain_racer_unlocked';
      var saved = localStorage.getItem(key);
      var arr = saved ? JSON.parse(saved) : [1];
      return Array.isArray(arr) ? arr : [1];
    } catch (e) {
      return [1];
    }
  };

  proto.loadPreviousBest = function() {
    try {
      var key = 'mountain_racer_best_stats_' + this.level;
      var saved = localStorage.getItem(key);
      if (saved) {
        this.previousBestStats = JSON.parse(saved);
      }
    } catch (e) {}
  };

  proto.saveBestStats = function() {
    try {
      var key = 'mountain_racer_best_stats_' + this.level;
      var current = this.getDetailedStats();
      var previous = this.previousBestStats;

      if (!previous || current.totalScore > previous.totalScore) {
        localStorage.setItem(key, JSON.stringify(current));
      }

      var historyKey = 'mountain_racer_run_history_' + this.level;
      var history = [];
      try {
        var savedHistory = localStorage.getItem(historyKey);
        if (savedHistory) {
          history = JSON.parse(savedHistory);
        }
      } catch (e) {}

      var runRecord = {
        score: current.totalScore,
        time: current.time,
        distance: current.distance,
        health: current.health,
        perfectRun: current.perfectRun,
        maxSpeed: current.maxSpeed,
        maxCombo: 0,
        branches: Object.keys(current.branches || {}).length,
        timestamp: Date.now(),
        win: this.isComplete
      };

      history.unshift(runRecord);
      if (history.length > 10) history = history.slice(0, 10);
      localStorage.setItem(historyKey, JSON.stringify(history));
    } catch (e) {}
  };

  proto.getRunHistory = function() {
    try {
      var key = 'mountain_racer_run_history_' + this.level;
      var saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  };

  proto.calculateScoreImprovements = function() {
    if (!this.previousBestStats) {
      this.scoreImprovements = { isNewBest: true, improvements: [], newRecords: [] };
      return this.scoreImprovements;
    }

    var current = this.getDetailedStats();
    var prev = this.previousBestStats;
    var improvements = [];
    var newRecords = [];

    var scoreDiff = current.totalScore - prev.totalScore;
    if (scoreDiff > 0) {
      improvements.push({
        label: '总分',
        current: current.totalScore,
        previous: prev.totalScore,
        diff: scoreDiff,
        percent: ((scoreDiff / prev.totalScore) * 100).toFixed(1),
        icon: '🏆',
        major: true
      });
      newRecords.push('总分');
    }

    var timeDiff = prev.time - current.time;
    if (this.isComplete && timeDiff > 0.1) {
      improvements.push({
        label: '用时',
        current: current.time,
        previous: prev.time,
        diff: timeDiff,
        percent: ((timeDiff / prev.time) * 100).toFixed(1),
        icon: '⏱',
        faster: true
      });
      newRecords.push('用时');
    }

    var healthDiff = current.health - prev.health;
    if (healthDiff > 0) {
      improvements.push({
        label: '剩余生命',
        current: current.health,
        previous: prev.health,
        diff: healthDiff,
        percent: ((healthDiff / Math.max(1, prev.health)) * 100).toFixed(1),
        icon: '❤️'
      });
    }

    var speedDiff = current.maxSpeed - prev.maxSpeed;
    if (speedDiff > 0) {
      improvements.push({
        label: '最高时速',
        current: current.maxSpeed,
        previous: prev.maxSpeed,
        diff: speedDiff,
        percent: ((speedDiff / Math.max(1, prev.maxSpeed)) * 100).toFixed(1),
        icon: '🚗'
      });
    }

    var currentBranches = Object.keys(current.branches || {}).length;
    var prevBranches = Object.keys(prev.branches || {}).length;
    var branchDiff = currentBranches - prevBranches;
    if (branchDiff > 0) {
      improvements.push({
        label: '探索路线',
        current: currentBranches,
        previous: prevBranches,
        diff: branchDiff,
        percent: ((branchDiff / Math.max(1, prevBranches)) * 100).toFixed(1),
        icon: '🗺️'
      });
      newRecords.push('探索路线');
    }

    if (current.perfectRun && !prev.perfectRun) {
      improvements.push({
        label: '完美通关',
        current: '✅',
        previous: '❌',
        diff: 1,
        percent: '100',
        icon: '💯',
        major: true,
        isBoolean: true
      });
      newRecords.push('完美通关');
    }

    this.scoreImprovements = {
      isNewBest: scoreDiff > 0 || !this.previousBestStats,
      improvements: improvements,
      newRecords: newRecords,
      previousScore: prev ? prev.totalScore : 0
    };

    return this.scoreImprovements;
  };

  proto.getPerformanceGrade = function() {
    var stats = this.getDetailedStats();
    var grade = 'C';
    var score = stats.totalScore;
    var criteria = {
      S: { score: 15000, perfect: true, minBranches: 3 },
      A: { score: 10000, minBranches: 2 },
      B: { score: 6000 },
      C: { score: 0 }
    };

    if (stats.perfectRun && score >= criteria.S.score &&
        Object.keys(stats.branches || {}).length >= criteria.S.minBranches) {
      grade = 'S';
    } else if (score >= criteria.A.score &&
               Object.keys(stats.branches || {}).length >= criteria.A.minBranches) {
      grade = 'A';
    } else if (score >= criteria.B.score) {
      grade = 'B';
    }

    var gradeInfo = {
      'S': { label: 'S 级', color: '#ffd700', desc: '传奇车手！完美表现！', stars: 5 },
      'A': { label: 'A 级', color: '#ff6b35', desc: '优秀表现！继续保持！', stars: 4 },
      'B': { label: 'B 级', color: '#4caf50', desc: '不错的成绩！还有提升空间', stars: 3 },
      'C': { label: 'C 级', color: '#2196f3', desc: '继续努力，你可以做得更好！', stars: 2 }
    };

    var info = gradeInfo[grade];

    return {
      grade: grade,
      label: info.label,
      color: info.color,
      desc: info.desc,
      stars: info.stars,
      scoreBreakdown: this.getScoreDimensionBreakdown()
    };
  };

  proto.getScoreDimensionBreakdown = function() {
    var stats = this.getDetailedStats();
    var bonus = stats.bonusScores || {};

    var totalScore = Math.max(1, stats.totalScore);
    var speedScore = Math.floor((stats.maxSpeed / 200) * 100);
    var explorationScore = Math.min(100, Object.keys(stats.branches || {}).length * 25);
    var skillScore = 0;
    var riskScore = Math.min(100, ((stats.weightBreakdown || {}).avgRiskLevel || 1) * 30);
    var survivalScore = Math.floor((stats.health / 100) * 100);
    var collectionScore = Math.min(100, (stats.collectibleValue / 500) * 100);

    var speedPct = (bonus.distance || 0) / totalScore;
    var explorationPct = ((bonus.branchBonus || 0) + (bonus.explorationBonus || 0)) / totalScore;
    var skillPct = (bonus.styleBonus || 0) / totalScore;
    var riskPct = (bonus.riskBonus || 0) / totalScore;
    var survivalPct = (bonus.healthBonus || 0) / totalScore;
    var collectionPct = (bonus.collectibleBonus || 0) / totalScore;

    return [
      {
        id: 'speed',
        label: '速度',
        icon: '🚗',
        score: speedScore,
        percentage: Math.max(speedPct, 0.1),
        color: '#2196f3',
        description: '行驶速度和距离得分'
      },
      {
        id: 'exploration',
        label: '探索',
        icon: '🗺️',
        score: explorationScore,
        percentage: Math.max(explorationPct, 0.05),
        color: '#9c27b0',
        description: '路线探索和发现奖励'
      },
      {
        id: 'skill',
        label: '技巧',
        icon: '🔥',
        score: skillScore,
        percentage: Math.max(skillPct, 0.05),
        color: '#ff5722',
        description: '连击和特技表现'
      },
      {
        id: 'risk',
        label: '冒险',
        icon: '⚠️',
        score: riskScore,
        percentage: Math.max(riskPct, 0.05),
        color: '#f44336',
        description: '高风险路线奖励'
      },
      {
        id: 'survival',
        label: '生存',
        icon: '❤️',
        score: survivalScore,
        percentage: Math.max(survivalPct, 0.05),
        color: '#e91e63',
        description: '生命值保持和无伤奖励'
      },
      {
        id: 'collection',
        label: '收集',
        icon: '💎',
        score: collectionScore,
        percentage: Math.max(collectionPct, 0.05),
        color: '#00bcd4',
        description: '收集品和隐藏内容'
      }
    ];
  };

  proto.getGameSettings = function() {
    try {
      var key = 'mountain_racer_settings';
      var saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : {
        soundEnabled: true,
        musicEnabled: true,
        vibrationEnabled: true,
        difficulty: 'normal',
        controlMode: 'touch',
        showHints: true,
        particleEffects: true
      };
    } catch (e) {
      return {
        soundEnabled: true,
        musicEnabled: true,
        vibrationEnabled: true,
        difficulty: 'normal',
        controlMode: 'touch',
        showHints: true,
        particleEffects: true
      };
    }
  };

  proto.saveGameSettings = function(settings) {
    try {
      var key = 'mountain_racer_settings';
      localStorage.setItem(key, JSON.stringify(settings));
    } catch (e) {}
  };

  proto.updateMidGameSettings = function(key, value) {
    this.midGameSettings[key] = value;
  };

  proto.destroy = function() {};

  window.MountainRacer = MountainRacer;
})();
