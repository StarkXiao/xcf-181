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

    this.comboCount = 0;
    this.comboMultiplier = 1.0;
    this.maxCombo = 0;
    this.comboTimer = 0;
    this.comboTimeout = 3.0;
    this.obstaclePassCount = 0;
    this.totalObstaclePasses = 0;
    this.damageFreeDistance = 0;
    this.damageFreeSegments = 0;
    this.damageFreeSegmentThreshold = 500;
    this.lastDamageX = 0;
    this.comboBonusTotal = 0;
    this.comboHistory = [];
    this.comboBreakReason = null;

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
      mergeBonus: 0,
      comboBonus: 0
    };

    this.weightBreakdown = {
      baseMultiplier: 1.0,
      riskWeight: 0,
      explorationWeight: 0,
      perfectWeight: 0,
      branchWeight: 0,
      mergeWeight: 0,
      hiddenWeight: 0,
      comboWeight: 0,
      finalMultiplier: 1.0
    };

    this.branchScoreBreakdown = {};
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

    if (this.comboCount > 0) {
      this.damageFreeDistance += delta;
      if (this.damageFreeDistance >= this.damageFreeSegmentThreshold) {
        var segments = Math.floor(this.damageFreeDistance / this.damageFreeSegmentThreshold);
        var extraSegments = segments - this.damageFreeSegments;
        if (extraSegments > 0) {
          this.damageFreeSegments = segments;
          this.incrementCombo('damageFree', extraSegments * 80);
        }
      }
    }

    var branchConfig = this.getBranchConfig(this.currentBranch);
    var multiplier = branchConfig ? branchConfig.rewardMultiplier : 1.0;
    var comboMult = this.comboCount > 0 ? this.comboMultiplier : 1.0;

    if (!this.branchDistances[this.currentBranch]) {
      this.branchDistances[this.currentBranch] = 0;
    }
    this.branchDistances[this.currentBranch] += delta;

    var baseScore = Math.floor(delta * 0.1);
    var weightedScore = Math.floor(baseScore * multiplier * comboMult);
    this.score += weightedScore;
    this.lastDistanceX = currentX;

    this.bonusScores.distance = Math.floor(this.distance * 0.1);
  };

  proto.addBonusScore = function(points, type) {
    var branchConfig = this.getBranchConfig(this.currentBranch);
    var multiplier = branchConfig ? branchConfig.rewardMultiplier : 1.0;
    var comboMult = this.comboCount > 0 ? this.comboMultiplier : 1.0;
    var weightedPoints = Math.floor(points * multiplier * comboMult);
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
    var comboMult = this.comboCount > 0 ? this.comboMultiplier : 1.0;
    var weighted = Math.floor(value * multiplier * comboMult);
    this.score += weighted;
    this.bonusScores.collectibleBonus += weighted;
    this.collectibleValue += weighted;
    return weighted;
  };

  proto.takeDamage = function(amount) {
    this.health = Math.max(0, this.health - amount);
    this.damageTaken += amount;
    this.perfectRun = false;
    if (this.comboCount > 0) {
      this.breakCombo('damage');
    }
    this.damageFreeDistance = 0;
    this.damageFreeSegments = 0;
    this.lastDamageX = this.distance;
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
    if (!config || !config.branches) {
      return { rewardMultiplier: 1.0, riskLevel: 1 };
    }
    for (var i = 0; i < config.branches.length; i++) {
      if (config.branches[i].id === branchId) return config.branches[i];
    }
    return { rewardMultiplier: 1.0, riskLevel: 1 };
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
        var airComboPoints = 0;
        if (this.airTime > 1.0) {
          airComboPoints = Math.floor((this.airTime - 1.0) * 80);
          this.incrementCombo('airTime', airComboPoints);
        } else if (this.airTime > 0.7) {
          airComboPoints = Math.floor(this.airTime * 30);
          this.incrementCombo('airTime', airComboPoints);
        }
      }
      this.airTime = 0;
    }
  };

  proto.incrementCombo = function(reason, points) {
    this.comboCount++;
    this.comboTimer = this.comboTimeout;
    this.comboMultiplier = 1.0 + (this.comboCount - 1) * 0.15;
    if (this.comboMultiplier > 5.0) this.comboMultiplier = 5.0;
    if (this.comboCount > this.maxCombo) {
      this.maxCombo = this.comboCount;
    }

    var bonusPoints = Math.floor(points * this.comboMultiplier);
    this.score += bonusPoints;
    this.bonusScores.comboBonus += bonusPoints;
    this.comboBonusTotal += bonusPoints;

    this.comboHistory.push({
      reason: reason,
      comboCount: this.comboCount,
      multiplier: this.comboMultiplier,
      points: bonusPoints,
      distance: Math.floor(this.distance),
      time: Date.now() - this.startTime
    });

    if (reason === 'obstaclePass') {
      this.totalObstaclePasses++;
    }

    return bonusPoints;
  };

  proto.breakCombo = function(reason) {
    if (this.comboCount <= 0) return;
    this.comboBreakReason = reason;
    this.comboCount = 0;
    this.comboMultiplier = 1.0;
    this.comboTimer = 0;
    this.obstaclePassCount = 0;
  };

  proto.updateCombo = function(delta) {
    if (this.comboCount <= 0) return;
    var dt = delta / 1000;
    this.comboTimer -= dt;
    if (this.comboTimer <= 0) {
      this.breakCombo('timeout');
    }
  };

  proto.registerObstaclePass = function() {
    this.obstaclePassCount++;
    var points = 30 + this.obstaclePassCount * 15;
    this.incrementCombo('obstaclePass', points);
  };

  proto.registerDamageFreeSegment = function() {
    this.damageFreeSegments++;
    var points = this.damageFreeSegments * 80;
    this.incrementCombo('damageFree', points);
  };

  proto.getComboInfo = function() {
    return {
      comboCount: this.comboCount,
      comboMultiplier: this.comboMultiplier,
      maxCombo: this.maxCombo,
      comboTimer: this.comboTimer,
      obstaclePassCount: this.obstaclePassCount,
      totalObstaclePasses: this.totalObstaclePasses,
      damageFreeDistance: Math.floor(this.damageFreeDistance),
      damageFreeSegments: this.damageFreeSegments,
      comboBonusTotal: this.comboBonusTotal,
      comboBreakReason: this.comboBreakReason,
      comboHistory: this.comboHistory.slice(-10)
    };
  };

  proto.checkLevelComplete = function(currentX) {
    if (this.isComplete) return false;
    if (currentX >= this.levelLength - 200) {
      this.isComplete = true;

      var config = MountainRacer.LEVEL_CONFIGS[this.level];
      if (!config) return false;
      var weightConfig = config.weightConfig || {
        baseMultiplier: 1.0,
        riskWeightPerLevel: 0.15,
        explorationWeightPerBranch: 0.08,
        perfectRunWeight: 0.25,
        lowDamageWeight: 0.1,
        mergeWeight: 0.05,
        hiddenBranchBonus: 0.2
      };

      var elapsed = this.getElapsedTime();
      var timeBonus = Math.floor(Math.max(0, 300 - elapsed) * 10);

      var healthBonus = Math.floor(this.health * 5);

      var branchBonus = 0;
      var hiddenBonus = 0;
      var uniqueBranches = Object.keys(this.branchDistances);
      var totalBranches = config.branches ? config.branches.length : 1;
      var hiddenBranchesVisited = 0;

      for (var i = 0; i < uniqueBranches.length; i++) {
        var branchId = uniqueBranches[i];
        var branchCfg = this.getBranchConfig(branchId);
        if (branchCfg && branchCfg.hidden) {
          hiddenBonus += 500;
          hiddenBranchesVisited++;
        }
      }
      branchBonus += (uniqueBranches.length - 1) * 200;

      var explorationRatio = uniqueBranches.length / totalBranches;
      var explorationBonus = Math.floor(explorationRatio * 800);

      var styleBonus = Math.floor(this.jumpCombo * 100);

      var avgRiskLevel = 1;
      var totalBranchDist = 0;
      var weightedRisk = 0;
      var maxRiskLevel = 1;

      for (var bi = 0; bi < uniqueBranches.length; bi++) {
        var bid = uniqueBranches[bi];
        var bCfg = this.getBranchConfig(bid);
        var bDist = this.branchDistances[bid] || 0;
        if (bCfg) {
          weightedRisk += (bCfg.riskLevel || 1) * bDist;
          totalBranchDist += bDist;
          maxRiskLevel = Math.max(maxRiskLevel, bCfg.riskLevel || 1);
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

      var hiddenBonusExtra = hiddenBranchesVisited * 200;
      if (hiddenBranchesVisited > 0) {
        explorationBonus += hiddenBonusExtra;
      }

      this.weightBreakdown.baseMultiplier = weightConfig.baseMultiplier;
      this.weightBreakdown.riskWeight = (avgRiskLevel - 1) * weightConfig.riskWeightPerLevel;
      this.weightBreakdown.explorationWeight = explorationRatio * weightConfig.explorationWeightPerBranch * uniqueBranches.length;
      this.weightBreakdown.perfectWeight = this.perfectRun ? weightConfig.perfectRunWeight :
        (this.damageTaken < 30 ? weightConfig.lowDamageWeight : 0);
      this.weightBreakdown.branchWeight = (uniqueBranches.length - 1) * weightConfig.explorationWeightPerBranch;
      this.weightBreakdown.mergeWeight = this.mergeCount * weightConfig.mergeWeight;
      this.weightBreakdown.hiddenWeight = hiddenBranchesVisited * weightConfig.hiddenBranchBonus;
      this.weightBreakdown.comboWeight = this.maxCombo * 0.03;
      this.weightBreakdown.finalMultiplier = 1.0 +
        this.weightBreakdown.riskWeight +
        this.weightBreakdown.explorationWeight +
        this.weightBreakdown.perfectWeight +
        this.weightBreakdown.branchWeight +
        this.weightBreakdown.mergeWeight +
        this.weightBreakdown.hiddenWeight +
        this.weightBreakdown.comboWeight;

      this.weightBreakdown.avgRiskLevel = avgRiskLevel;
      this.weightBreakdown.maxRiskLevel = maxRiskLevel;
      this.weightBreakdown.uniqueBranches = uniqueBranches.length;
      this.weightBreakdown.totalBranches = totalBranches;
      this.weightBreakdown.hiddenBranches = hiddenBranchesVisited;
      this.weightBreakdown.mergeCount = this.mergeCount;
      this.weightBreakdown.maxCombo = this.maxCombo;
      this.weightBreakdown.totalObstaclePasses = this.totalObstaclePasses;
      this.weightBreakdown.damageFreeSegments = this.damageFreeSegments;

      var comboBonus = this.bonusScores.comboBonus;
      var comboFinishBonus = 0;
      if (this.maxCombo >= 10) {
        comboFinishBonus = this.maxCombo * 50;
      } else if (this.maxCombo >= 5) {
        comboFinishBonus = this.maxCombo * 25;
      }
      this.bonusScores.comboBonus += comboFinishBonus;

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
        styleBonus + riskBonus + explorationBonus + perfectBonus + mergeBonus + comboBonus + comboFinishBonus;
      var weightedBonus = Math.floor(totalBonus * this.weightBreakdown.finalMultiplier);
      this.score += weightedBonus;

      this.calculateBranchScoreBreakdown();

      this.saveHighScore();
      this.saveBranchProgress();

      return true;
    }
    return false;
  };

  proto.calculateBranchScoreBreakdown = function() {
    var uniqueBranches = Object.keys(this.branchDistances);

    for (var i = 0; i < uniqueBranches.length; i++) {
      var branchId = uniqueBranches[i];
      var branchCfg = this.getBranchConfig(branchId);
      var distance = this.branchDistances[branchId] || 0;
      var baseScore = Math.floor(distance * 0.1);
      var multiplier = branchCfg ? branchCfg.rewardMultiplier : 1.0;
      var weightedScore = Math.floor(baseScore * multiplier);

      var riskContribution = 0;
      var explorationContribution = 0;

      if (branchCfg) {
        riskContribution = Math.floor(baseScore * ((branchCfg.riskLevel - 1) * 0.1));
        if (branchCfg.hidden) {
          explorationContribution = Math.floor(baseScore * 0.2);
        }
      }

      this.branchScoreBreakdown[branchId] = {
        distance: Math.floor(distance),
        baseScore: baseScore,
        multiplier: multiplier,
        weightedScore: weightedScore,
        riskContribution: riskContribution,
        explorationContribution: explorationContribution,
        total: weightedScore + riskContribution + explorationContribution,
        config: branchCfg
      };
    }
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
      branchScoreBreakdown: this.branchScoreBreakdown,
      mergeCount: this.mergeCount,
      hiddenBranchesFound: this.hiddenBranchesFound,
      totalWeightedMultiplier: this.totalWeightedMultiplier,
      comboInfo: this.getComboInfo()
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

  proto.destroy = function() {};

  window.MountainRacer = MountainRacer;
})();
