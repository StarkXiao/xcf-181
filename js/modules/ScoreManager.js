(function() {
  var MountainRacer = window.MountainRacer || {};

  MountainRacer.ScoreManager = function(scene, level) {
    this.scene = scene;
    this.level = level;
    this.dataManager = MountainRacer.DataManager.getInstance();
    this.dataManager.init();
    this.highScoreMgr = this.dataManager.getHighScoreManager();
    this.unlockMgr = this.dataManager.getUnlockManager();
    this.settingsMgr = this.dataManager.getSettingsManager();
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

    this.destructiblesDestroyed = 0;
    this.cratesDestroyed = 0;
    this.barrelsDestroyed = 0;
    this.signsDestroyed = 0;
    this.destructibleScore = 0;
    this.destructibleCombo = 0;

    this.rolloverDamageCooldown = 0;
    this.rolloverDamageCooldownDuration = 5.0;
    this.rolloverDamageAmount = 15;
    this.rolloverCount = 0;
    this.lastRolloverDamageTime = 0;

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
      comboBonus: 0,
      destructibleBonus: 0
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

    this.midGameSettings = this.settingsMgr.getMidGameSettings();

    this.runHistory = [];
    this.highScoreThresholds = [0.8, 0.9, 0.95, 1.0, 1.05, 1.1];
    this.highScoreBreakthrough = null;
    this.segmentScores = [];
    this.lastSegmentX = 0;
    this.segmentInterval = 500;

    this.replayData = {
      speedSamples: [],
      hitEvents: [],
      mistakes: [],
      bestSegments: [],
      lastSampleDistance: 0,
      sampleDistanceInterval: 50,
      segmentWindow: 500,
      bestSegmentScore: 0
    };

    this.starRating = null;
    this.hiddenObjectives = {
      hiddenBranchesVisited: 0,
      totalHiddenBranches: 0,
      allBranchesExplored: false,
      secretEventsTriggered: 0,
      totalSecretEvents: 0
    };

    this.applyMidGameSettings = function(settings) {
      this.settingsMgr.applyMidGameSettings(settings);
      this.midGameSettings = this.settingsMgr.getMidGameSettings();
    };

    this.getMidGameSettings = function() {
      return this.settingsMgr.getMidGameSettings();
    };

    this.updateSegmentScore = function(currentX) {
      if (currentX - this.lastSegmentX < this.segmentInterval) return;
      var segment = {
        startX: this.lastSegmentX,
        endX: currentX,
        score: this.score,
        distance: this.distance,
        branch: this.currentBranch,
        combo: this.comboCount,
        health: this.health,
        timestamp: Date.now() - this.startTime
      };
      this.segmentScores.push(segment);
      this.lastSegmentX = currentX;
    };

    this.checkHighScoreBreakthrough = function() {
      var highScore = this.getHighScore();
      if (highScore <= 0) return null;
      var ratio = this.score / highScore;
      var passedThresholds = [];
      for (var i = 0; i < this.highScoreThresholds.length; i++) {
        var threshold = this.highScoreThresholds[i];
        if (ratio >= threshold) {
          passedThresholds.push({
            threshold: threshold,
            label: this.getThresholdLabel(threshold),
            percentage: Math.floor(threshold * 100)
          });
        }
      }
      if (passedThresholds.length > 0) {
        var latest = passedThresholds[passedThresholds.length - 1];
        if (!this.highScoreBreakthrough || this.highScoreBreakthrough.threshold < latest.threshold) {
          this.highScoreBreakthrough = latest;
          return latest;
        }
      }
      return null;
    };

    this.getThresholdLabel = function(threshold) {
      var labels = {
        0.8: '接近高分',
        0.9: '逼近纪录',
        0.95: '差一点!',
        1.0: '🏆 平纪录!',
        1.05: '🌟 超越高分!',
        1.1: '💎 大幅超越!'
      };
      return labels[threshold] || '突破';
    };

    this.getReplayComparisonData = function() {
      var current = this.getDetailedStats();
      var prev = this.previousBestStats;
      if (!prev) {
        return {
          hasComparison: false,
          current: current,
          previous: null,
          diff: null,
          segmentComparison: null
        };
      }
      var diff = {};
      var numericKeys = ['totalScore', 'distance', 'maxSpeed', 'health', 'damageTaken', 'collectibleValue', 'mergeCount', 'hiddenBranchesFound', 'jumpCombo'];
      for (var i = 0; i < numericKeys.length; i++) {
        var key = numericKeys[i];
        diff[key] = (current[key] || 0) - (prev[key] || 0);
      }
      diff.time = (prev.time || 0) - (current.time || 0);
      var currentCombo = current.comboInfo || {};
      var prevCombo = prev.comboInfo || {};
      diff.maxCombo = (currentCombo.maxCombo || 0) - (prevCombo.maxCombo || 0);
      diff.totalObstaclePasses = (currentCombo.totalObstaclePasses || 0) - (prevCombo.totalObstaclePasses || 0);
      var currentBranches = Object.keys(current.branches || {}).length;
      var prevBranches = Object.keys(prev.branches || {}).length;
      diff.branchesExplored = currentBranches - prevBranches;
      diff.perfectRun = current.perfectRun && !prev.perfectRun;
      var segmentComparison = this.buildSegmentComparison(current, prev);
      return {
        hasComparison: true,
        current: current,
        previous: prev,
        diff: diff,
        segmentComparison: segmentComparison
      };
    };

    this.buildSegmentComparison = function(current, prev) {
      var currentSegments = this.segmentScores || [];
      if (currentSegments.length === 0) return null;
      var prevSegments = prev.segmentScores || [];
      var maxLen = Math.max(currentSegments.length, prevSegments.length);
      var result = [];
      for (var i = 0; i < maxLen; i++) {
        var cs = currentSegments[i] || null;
        var ps = prevSegments[i] || null;
        result.push({
          index: i,
          current: cs,
          previous: ps,
          scoreDiff: cs && ps ? cs.score - ps.score : null
        });
      }
      return result;
    };
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

    this.updateSegmentScore(currentX);

    var breakthrough = this.checkHighScoreBreakthrough();
    if (breakthrough) {
      this.highScoreBreakthrough = breakthrough;
    }
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

  proto.takeRolloverDamage = function() {
    if (this.rolloverDamageCooldown > 0) {
      return { applied: false, reason: 'cooldown', dead: false, cooldownRemaining: this.rolloverDamageCooldown };
    }

    var dead = this.takeDamage(this.rolloverDamageAmount);
    this.rolloverCount++;
    this.rolloverDamageCooldown = this.rolloverDamageCooldownDuration;
    this.lastRolloverDamageTime = Date.now() - this.startTime;
    return { applied: true, damage: this.rolloverDamageAmount, dead: dead, rolloverCount: this.rolloverCount };
  };

  proto.updateRolloverCooldown = function(delta) {
    this.rolloverDamageCooldown = Math.max(0, this.rolloverDamageCooldown - delta / 1000);
  };

  proto.getRolloverCooldownRemaining = function() {
    return this.rolloverDamageCooldown;
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
    this.destructibleCombo = 0;
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

  proto.registerDestructibleDestroyed = function(type, basePoints) {
    this.destructiblesDestroyed++;
    this.destructibleCombo++;

    if (type === 'crate') this.cratesDestroyed++;
    else if (type === 'barrel') this.barrelsDestroyed++;
    else if (type === 'sign') this.signsDestroyed++;

    var branchConfig = this.getBranchConfig(this.currentBranch);
    var multiplier = branchConfig ? branchConfig.rewardMultiplier : 1.0;
    var comboMult = this.comboCount > 0 ? this.comboMultiplier : 1.0;

    var bonusPoints = 0;
    if (this.destructibleCombo >= 3) {
      bonusPoints = this.destructibleCombo * 20;
    }

    var weighted = Math.floor((basePoints + bonusPoints) * multiplier * comboMult);
    this.score += weighted;
    this.bonusScores.destructibleBonus += weighted;
    this.destructibleScore += weighted;

    var comboReason = type === 'barrel' ? 'explosion' : 'destruction';
    this.incrementCombo(comboReason, basePoints);

    return {
      totalPoints: weighted,
      basePoints: basePoints,
      bonusPoints: bonusPoints,
      destructibleCombo: this.destructibleCombo,
      multiplier: multiplier * comboMult
    };
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
      comboHistory: this.comboHistory.slice(-10),
      destructibleCombo: this.destructibleCombo,
      destructiblesDestroyed: this.destructiblesDestroyed
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
      this.calculateScoreImprovements();
      this.calculateStarRating();

      this.saveHighScore();
      this.saveBestStats();
      this.saveBranchProgress();
      this.saveStarRating();

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
      comboInfo: this.getComboInfo(),
      segmentScores: this.segmentScores,
      highScoreBreakthrough: this.highScoreBreakthrough,
      midGameSettings: this.getMidGameSettings(),
      destructiblesDestroyed: this.destructiblesDestroyed,
      cratesDestroyed: this.cratesDestroyed,
      barrelsDestroyed: this.barrelsDestroyed,
      signsDestroyed: this.signsDestroyed,
      destructibleScore: this.destructibleScore
    };
  };

  proto.getHighScore = function() {
    return this.highScoreMgr.getHighScore(this.level);
  };

  proto.saveHighScore = function() {
    this.highScoreMgr.setHighScore(this.level, this.score);
    if (this.isComplete) {
      this.unlockMgr.checkAndUnlockNextLevel(this.level, true);
    }
  };

  proto.saveBranchProgress = function() {
    this.unlockMgr.updateBranchesFromRun(this.level, this.branchDistances, this.score);
  };

  proto.getUnlockedBranches = function() {
    var data = this.unlockMgr.getUnlockedBranches(this.level);
    return data.unlockedBranches;
  };

  proto.getUnlockedLevels = function() {
    return this.unlockMgr.getUnlockedLevels();
  };

  proto.loadPreviousBest = function() {
    this.previousBestStats = this.highScoreMgr.getBestStats(this.level);
  };

  proto.saveBestStats = function() {
    var current = this.getDetailedStats();
    this.highScoreMgr.setBestStats(this.level, current);

    var runRecord = {
      score: current.totalScore,
      time: current.time,
      distance: current.distance,
      health: current.health,
      perfectRun: current.perfectRun,
      maxSpeed: current.maxSpeed,
      maxCombo: current.comboInfo ? current.comboInfo.maxCombo : 0,
      branches: Object.keys(current.branches || {}).length,
      timestamp: Date.now(),
      win: this.isComplete,
      segmentScores: current.segmentScores || [],
      bonusScores: current.bonusScores || {},
      damageTaken: current.damageTaken || 0,
      collectibleValue: current.collectibleValue || 0,
      jumpCombo: current.jumpCombo || 0
    };
    this.highScoreMgr.addRunRecord(this.level, runRecord);
  };

  proto.getRunHistory = function() {
    return this.highScoreMgr.getRunHistory(this.level);
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

    var currentCombo = current.comboInfo ? current.comboInfo.maxCombo : 0;
    var prevCombo = prev.comboInfo ? prev.comboInfo.maxCombo : 0;
    var comboDiff = currentCombo - prevCombo;
    if (comboDiff > 0) {
      improvements.push({
        label: '最大连击',
        current: currentCombo,
        previous: prevCombo,
        diff: comboDiff,
        percent: ((comboDiff / Math.max(1, prevCombo)) * 100).toFixed(1),
        icon: '🔥'
      });
      newRecords.push('最大连击');
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

    var currentObstacles = current.comboInfo ? current.comboInfo.totalObstaclePasses : 0;
    var prevObstacles = prev.comboInfo ? prev.comboInfo.totalObstaclePasses : 0;
    var obstacleDiff = currentObstacles - prevObstacles;
    if (obstacleDiff > 0) {
      improvements.push({
        label: '连续过障',
        current: currentObstacles,
        previous: prevObstacles,
        diff: obstacleDiff,
        percent: ((obstacleDiff / Math.max(1, prevObstacles)) * 100).toFixed(1),
        icon: '🎯'
      });
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

    return {
      grade: grade,
      ...gradeInfo[grade],
      scoreBreakdown: this.getScoreDimensionBreakdown()
    };
  };

  proto.getScoreDimensionBreakdown = function() {
    var stats = this.getDetailedStats();
    var bonus = stats.bonusScores || {};

    var totalScore = Math.max(1, stats.totalScore);
    var speedScore = Math.floor((stats.maxSpeed / 200) * 100);
    var explorationScore = Math.min(100, Object.keys(stats.branches || {}).length * 25);
    var skillScore = Math.min(100, (stats.comboInfo ? stats.comboInfo.maxCombo : 0) * 10);
    var riskScore = Math.min(100, ((stats.weightBreakdown || {}).avgRiskLevel || 1) * 30);
    var survivalScore = Math.floor((stats.health / 100) * 100);
    var collectionScore = Math.min(100, (stats.collectibleValue / 500) * 100);

    var speedPct = (bonus.distance || 0) / totalScore;
    var explorationPct = ((bonus.branchBonus || 0) + (bonus.explorationBonus || 0)) / totalScore;
    var skillPct = ((bonus.comboBonus || 0) + (bonus.styleBonus || 0)) / totalScore;
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
    return this.settingsMgr.getAllSettings();
  };

  proto.saveGameSettings = function(settings) {
    if (settings) {
      this.settingsMgr.batchSetSettings(settings);
    }
  };

  proto.getStarConfig = function() {
    var config = MountainRacer.LEVEL_CONFIGS[this.level];
    if (!config) return null;
    var lengthKm = config.length / 1000;
    var defaultTimeTargets = {
      1: { threeStar: 50, twoStar: 70 },
      2: { threeStar: 80, twoStar: 110 },
      3: { threeStar: 115, twoStar: 160 }
    };
    var defaultHealthTargets = {
      1: { threeStar: 85, twoStar: 60 },
      2: { threeStar: 75, twoStar: 50 },
      3: { threeStar: 65, twoStar: 40 }
    };
    var levelIdx = this.level || 1;
    return {
      time: config.starConfig && config.starConfig.time ?
        config.starConfig.time :
        defaultTimeTargets[levelIdx] || defaultTimeTargets[1],
      health: config.starConfig && config.starConfig.health ?
        config.starConfig.health :
        defaultHealthTargets[levelIdx] || defaultHealthTargets[1],
      requiresAllBranches: true,
      requiresPerfectBonus: false
    };
  };

  proto.updateHiddenObjectives = function() {
    var config = MountainRacer.LEVEL_CONFIGS[this.level];
    if (!config || !config.branches) return;

    var totalHidden = 0;
    var visitedHidden = 0;
    var totalBranches = config.branches.length;
    var uniqueVisited = Object.keys(this.branchDistances).length;

    for (var i = 0; i < config.branches.length; i++) {
      var b = config.branches[i];
      if (b.hidden) {
        totalHidden++;
        if (this.branchDistances[b.id] && this.branchDistances[b.id] > 100) {
          visitedHidden++;
        }
      }
    }

    this.hiddenObjectives.hiddenBranchesVisited = visitedHidden;
    this.hiddenObjectives.totalHiddenBranches = totalHidden;
    this.hiddenObjectives.allBranchesExplored = uniqueVisited >= totalBranches;

    var totalSecret = 0;
    var triggeredSecret = 0;
    for (var j = 0; j < config.branches.length; j++) {
      var branch = config.branches[j];
      if (branch.specialEvents) {
        for (var k = 0; k < branch.specialEvents.length; k++) {
          var evt = branch.specialEvents[k];
          if (evt.type === 'secretBonus') {
            totalSecret++;
          }
        }
      }
    }
    this.hiddenObjectives.totalSecretEvents = totalSecret;
    this.hiddenObjectives.secretEventsTriggered = triggeredSecret;
  };

  proto.calculateStarRating = function() {
    if (!this.isComplete) {
      this.starRating = { stars: 0, details: {} };
      return this.starRating;
    }

    this.updateHiddenObjectives();
    var starConfig = this.getStarConfig();
    var elapsed = this.getElapsedTime();
    var healthPct = this.health;

    var timeThreeStar = elapsed <= starConfig.time.threeStar;
    var timeTwoStar = elapsed <= starConfig.time.twoStar;
    var healthThreeStar = healthPct >= starConfig.health.threeStar;
    var healthTwoStar = healthPct >= starConfig.health.twoStar;
    var hiddenDone = this.hiddenObjectives.allBranchesExplored ||
      (starConfig.requiresAllBranches === false && this.hiddenObjectives.hiddenBranchesVisited > 0) ||
      (this.hiddenObjectives.totalHiddenBranches > 0 &&
        this.hiddenObjectives.hiddenBranchesVisited >= this.hiddenObjectives.totalHiddenBranches);

    var stars = 0;
    var starConditions = {
      star1: {
        achieved: true,
        label: '通关关卡',
        detail: '成功到达终点',
        icon: '🏁'
      },
      star2: {
        achieved: timeTwoStar && healthTwoStar,
        label: '时间与生命',
        detail: '用时 ≤ ' + starConfig.time.twoStar + '秒 且 生命 ≥ ' + starConfig.health.twoStar + '%',
        actual: '用时 ' + Math.floor(elapsed) + '秒 / 生命 ' + Math.floor(healthPct) + '%',
        icon: '⏱❤️'
      },
      star3: {
        achieved: timeThreeStar && healthThreeStar && hiddenDone,
        label: '完美探索',
        detail: '用时 ≤ ' + starConfig.time.threeStar + '秒 且 生命 ≥ ' + starConfig.health.threeStar + '% 且 探索所有路线',
        actual: '用时 ' + Math.floor(elapsed) + '秒 / 生命 ' + Math.floor(healthPct) + '% / 路线 ' +
          Object.keys(this.branchDistances).length + '/' +
          (MountainRacer.LEVEL_CONFIGS[this.level] && MountainRacer.LEVEL_CONFIGS[this.level].branches ?
            MountainRacer.LEVEL_CONFIGS[this.level].branches.length : 1),
        icon: '✨🗺️'
      }
    };

    if (starConditions.star1.achieved) stars++;
    if (starConditions.star2.achieved) stars++;
    if (starConditions.star3.achieved) stars++;

    this.starRating = {
      stars: stars,
      maxStars: 3,
      conditions: starConditions,
      breakdown: {
        time: {
          value: Math.floor(elapsed),
          threeStarTarget: starConfig.time.threeStar,
          twoStarTarget: starConfig.time.twoStar,
          threeStar: timeThreeStar,
          twoStar: timeTwoStar
        },
        health: {
          value: Math.floor(healthPct),
          threeStarTarget: starConfig.health.threeStar,
          twoStarTarget: starConfig.health.twoStar,
          threeStar: healthThreeStar,
          twoStar: healthTwoStar
        },
        hidden: {
          allBranchesExplored: this.hiddenObjectives.allBranchesExplored,
          hiddenBranchesVisited: this.hiddenObjectives.hiddenBranchesVisited,
          totalHiddenBranches: this.hiddenObjectives.totalHiddenBranches,
          branchesVisited: Object.keys(this.branchDistances).length,
          totalBranches: MountainRacer.LEVEL_CONFIGS[this.level] &&
            MountainRacer.LEVEL_CONFIGS[this.level].branches ?
            MountainRacer.LEVEL_CONFIGS[this.level].branches.length : 1,
          achieved: hiddenDone
        }
      }
    };

    return this.starRating;
  };

  proto.getStarRating = function() {
    if (!this.starRating) {
      this.calculateStarRating();
    }
    return this.starRating;
  };

  proto.saveStarRating = function() {
    if (!this.starRating) {
      this.calculateStarRating();
    }
    if (this.isComplete) {
      this.highScoreMgr.setStarRating(this.level, {
        stars: this.starRating.stars,
        totalStars: 3,
        score: this.score,
        time: this.getElapsedTime(),
        health: this.health,
        breakdown: this.starRating.breakdown
      });
    }
  };

  proto.getSavedStarRating = function(level) {
    var lvl = level || this.level;
    return this.highScoreMgr.getStarRating(lvl);
  };

  proto.getChapterStarSummary = function() {
    return this.highScoreMgr.getChapterStarSummary(3);
  };

  proto.recordReplaySample = function(carPhysics) {
    if (!carPhysics) return;
    var rd = this.replayData;
    var currentDist = Math.floor(this.distance);

    if (currentDist - rd.lastSampleDistance < rd.sampleDistanceInterval) return;
    rd.lastSampleDistance = currentDist;

    var speed = carPhysics.getSpeed();
    var speedKmh = Math.round(speed * 0.6);

    rd.speedSamples.push({
      distance: currentDist,
      speed: speedKmh,
      health: this.health,
      combo: this.comboCount,
      branch: this.currentBranch,
      time: Date.now() - this.startTime
    });

    var segStartIdx = null;
    for (var i = rd.speedSamples.length - 1; i >= 0; i--) {
      if (currentDist - rd.speedSamples[i].distance >= rd.segmentWindow) {
        segStartIdx = i;
        break;
      }
    }

    if (segStartIdx !== null && rd.speedSamples.length > 0) {
      var startSample = rd.speedSamples[segStartIdx];
      var avgSpeed = 0;
      var count = 0;
      var hadHit = false;

      for (var s = segStartIdx; s < rd.speedSamples.length; s++) {
        avgSpeed += rd.speedSamples[s].speed;
        count++;
      }

      for (var h = rd.hitEvents.length - 1; h >= 0; h--) {
        var hit = rd.hitEvents[h];
        if (hit.distance >= startSample.distance && hit.distance <= currentDist) {
          hadHit = true;
          break;
        }
      }

      if (count > 0) avgSpeed = avgSpeed / count;
      var healthDelta = this.health - startSample.health;
      var segScore = avgSpeed + (healthDelta >= 0 ? 20 : 0) + (hadHit ? 0 : 30);

      if (segScore > rd.bestSegmentScore) {
        rd.bestSegmentScore = segScore;
        rd.bestSegments = [{
          startDistance: startSample.distance,
          endDistance: currentDist,
          avgSpeed: Math.round(avgSpeed),
          healthDelta: healthDelta,
          hadHit: hadHit,
          branch: this.currentBranch,
          score: segScore
        }];
      }
    }
  };

  proto.recordHitEvent = function(type, damage) {
    this.replayData.hitEvents.push({
      type: type,
      damage: damage,
      distance: Math.floor(this.distance),
      health: this.health,
      combo: this.comboCount,
      branch: this.currentBranch,
      time: Date.now() - this.startTime
    });

    var isMajorMistake = damage >= 15 || (this.comboCount >= 3 && type !== 'sign');
    var isMediumMistake = damage >= 5 || this.comboCount >= 1;
    var severity = isMajorMistake ? 'major' : (isMediumMistake ? 'medium' : 'minor');

    var labels = {
      'rock': '撞石',
      'barrel': '油桶',
      'crate': '木箱',
      'sign': '路牌',
      'dangerZone': '危险区',
      'rollover': '翻车'
    };

    var consequences = [];
    if (damage > 0) consequences.push('生命-' + damage);
    if (this.comboCount === 0 && this.comboBreakReason === 'damage') consequences.push('连击中断');
    if (this.health <= 20) consequences.push('濒危状态');

    this.replayData.mistakes.push({
      type: type,
      label: labels[type] || type,
      severity: severity,
      damage: damage,
      distance: Math.floor(this.distance),
      health: this.health,
      comboLost: this.comboBreakReason === 'damage' ? this.comboCount : 0,
      consequences: consequences,
      branch: this.currentBranch,
      time: Date.now() - this.startTime
    });
  };

  proto.getReplayAnalysis = function() {
    var rd = this.replayData;
    var samples = rd.speedSamples;
    var levelLen = this.levelLength > 0 ? this.levelLength : Math.max(this.distance, 1);

    var analysis = {
      speedCurve: [],
      hitNodes: [],
      keyMistakes: [],
      bestSegment: null,
      speedStats: null,
      distanceTotal: Math.floor(this.distance)
    };

    for (var i = 0; i < samples.length; i++) {
      var s = samples[i];
      analysis.speedCurve.push({
        distance: s.distance,
        speed: s.speed,
        health: s.health,
        combo: s.combo,
        branch: s.branch,
        pct: Math.min(1, s.distance / levelLen)
      });
    }

    for (var h = 0; h < rd.hitEvents.length; h++) {
      var hit = rd.hitEvents[h];
      analysis.hitNodes.push({
        type: hit.type,
        damage: hit.damage,
        distance: hit.distance,
        health: hit.health,
        combo: hit.combo,
        branch: hit.branch,
        pct: Math.min(1, hit.distance / levelLen)
      });
    }

    var majorMistakes = [];
    var mediumMistakes = [];
    for (var m = 0; m < rd.mistakes.length; m++) {
      var mistake = rd.mistakes[m];
      var mistakeData = {
        type: mistake.type,
        label: mistake.label,
        severity: mistake.severity,
        damage: mistake.damage,
        distance: mistake.distance,
        health: mistake.health,
        comboLost: mistake.comboLost,
        consequences: mistake.consequences,
        branch: mistake.branch,
        pct: Math.min(1, mistake.distance / levelLen)
      };
      if (mistake.severity === 'major') majorMistakes.push(mistakeData);
      else if (mistake.severity === 'medium') mediumMistakes.push(mistakeData);
    }
    analysis.keyMistakes = majorMistakes.concat(mediumMistakes.slice(0, 5));

    if (rd.bestSegments.length > 0) {
      var best = rd.bestSegments[0];
      analysis.bestSegment = {
        startDistance: best.startDistance,
        endDistance: best.endDistance,
        avgSpeed: best.avgSpeed,
        healthDelta: best.healthDelta,
        hadHit: best.hadHit,
        branch: best.branch,
        startPct: best.startDistance / levelLen,
        endPct: best.endDistance / levelLen
      };
    }

    if (samples.length > 0) {
      var maxSpd = 0, minSpd = Infinity, totalSpd = 0;
      for (var sp = 0; sp < samples.length; sp++) {
        var spd = samples[sp].speed;
        if (spd > maxSpd) maxSpd = spd;
        if (spd < minSpd) minSpd = spd;
        totalSpd += spd;
      }
      analysis.speedStats = {
        max: maxSpd,
        min: minSpd === Infinity ? 0 : minSpd,
        avg: Math.round(totalSpd / samples.length)
      };
    }

    return analysis;
  };

  proto.destroy = function() {};

  window.MountainRacer = MountainRacer;
})();
