(function() {
  var MountainRacer = window.MountainRacer || {};

  MountainRacer.RewardSystem = function(dataManager) {
    this._dm = dataManager;
  };

  var proto = MountainRacer.RewardSystem.prototype;

  proto.processNodeRewards = function(chapterId, nodeId, runStats, eventResult) {
    var node = MountainRacer.SeasonConfig.getNode(chapterId, nodeId);
    if (!node) return { success: false, reason: 'invalid_node' };

    var seasonDM = this._dm.getSeasonDataManager();
    if (seasonDM.isRewardClaimed('nodes', nodeId + '_clear')) {
      var existingRewards = this.getClaimedNodeRewards(nodeId);
      return {
        success: true,
        alreadyClaimed: true,
        existingRewards: existingRewards,
        recurringRewards: this._processRecurringRewards(node, runStats)
      };
    }

    var rewardConfig = node.rewards || {};
    var grantedRewards = {
      coins: 0,
      seasonXP: 0,
      parts: [],
      cars: [],
      achievements: []
    };

    var garageMgr = this._dm.getGarageManager();
    var unlockMgr = this._dm.getUnlockManager();

    if (rewardConfig.coins) {
      var coinAmount = rewardConfig.coins;
      garageMgr.addCoins(coinAmount, 'season_node_clear:' + nodeId);
      grantedRewards.coins += coinAmount;
    }

    if (rewardConfig.seasonXP) {
      var xpResult = seasonDM.addSeasonXP(rewardConfig.seasonXP, 'node_clear:' + nodeId);
      grantedRewards.seasonXP += rewardConfig.seasonXP;
      if (xpResult.leveledUp && xpResult.levelUps) {
        for (var li = 0; li < xpResult.levelUps.length; li++) {
          var levelReward = xpResult.levelUps[li].reward || {};
          if (levelReward.coins) {
            garageMgr.addCoins(levelReward.coins, 'season_level_up:' + xpResult.levelUps[li].level);
            grantedRewards.coins += levelReward.coins;
          }
          if (levelReward.parts) {
            for (var lpi = 0; lpi < levelReward.parts.length; lpi++) {
              var partUnlock = this._unlockPartByRewardId(levelReward.parts[lpi]);
              if (partUnlock) grantedRewards.parts.push(partUnlock);
            }
          }
          if (levelReward.cars) {
            for (var lci = 0; lci < levelReward.cars.length; lci++) {
              var carUnlock = this._unlockCarByRewardId(levelReward.cars[lci]);
              if (carUnlock) grantedRewards.cars.push(carUnlock);
            }
          }
        }
      }
    }

    if (rewardConfig.parts && rewardConfig.parts.length > 0) {
      for (var pi = 0; pi < rewardConfig.parts.length; pi++) {
        var partResult = this._unlockPartByRewardId(rewardConfig.parts[pi]);
        if (partResult) grantedRewards.parts.push(partResult);
      }
    }

    if (rewardConfig.cars && rewardConfig.cars.length > 0) {
      for (var ci = 0; ci < rewardConfig.cars.length; ci++) {
        var carResult = this._unlockCarByRewardId(rewardConfig.cars[ci]);
        if (carResult) grantedRewards.cars.push(carResult);
      }
    }

    if (rewardConfig.achievements && rewardConfig.achievements.length > 0) {
      for (var ai = 0; ai < rewardConfig.achievements.length; ai++) {
        if (unlockMgr.unlockAchievement(rewardConfig.achievements[ai])) {
          grantedRewards.achievements.push(rewardConfig.achievements[ai]);
        }
      }
    }

    var recurring = this._processRecurringRewards(node, runStats);
    if (recurring.coins) grantedRewards.coins += recurring.coins;
    if (recurring.seasonXP) grantedRewards.seasonXP += recurring.seasonXP;

    var starsBonus = this._calculateStarsBonus(node, runStats);
    if (starsBonus.coins) {
      garageMgr.addCoins(starsBonus.coins, 'season_node_stars:' + nodeId);
      grantedRewards.coins += starsBonus.coins;
    }
    if (starsBonus.seasonXP) {
      var sbXP = seasonDM.addSeasonXP(starsBonus.seasonXP, 'node_stars:' + nodeId);
      grantedRewards.seasonXP += starsBonus.seasonXP;
    }

    seasonDM.markRewardClaimed('nodes', nodeId + '_clear');

    this._dm._emit('nodeRewardsGranted', {
      chapterId: chapterId,
      nodeId: nodeId,
      rewards: grantedRewards,
      runStats: runStats
    });

    var chapterCompleteCheck = this._checkChapterRewards(chapterId);
    var seasonCompleteCheck = this._checkSeasonRewards();

    return {
      success: true,
      nodeRewards: grantedRewards,
      recurringRewards: recurring,
      starsBonus: starsBonus,
      chapterRewards: chapterCompleteCheck.rewards,
      seasonRewards: seasonCompleteCheck.rewards,
      chapterCompleted: chapterCompleteCheck.completed,
      seasonCompleted: seasonCompleteCheck.completed
    };
  };

  proto._processRecurringRewards = function(node, runStats) {
    var garageMgr = this._dm.getGarageManager();
    var seasonDM = this._dm.getSeasonDataManager();
    var rewards = { coins: 0, seasonXP: 0 };

    var runCoins = garageMgr.calculateCoinsFromRun(runStats);
    if (runCoins > 0) {
      garageMgr.addCoins(runCoins, 'season_run_reward');
      rewards.coins += runCoins;
    }

    var starBonus = (runStats.stars || 0) * 20;
    if (starBonus > 0) {
      var xp = seasonDM.addSeasonXP(starBonus, 'run_stars');
      rewards.seasonXP += starBonus;
    }

    var performanceBonus = Math.floor((runStats.totalScore || 0) / 200);
    if (performanceBonus > 0) {
      var perfXP = seasonDM.addSeasonXP(performanceBonus, 'run_performance');
      rewards.seasonXP += performanceBonus;
    }

    return rewards;
  };

  proto._calculateStarsBonus = function(node, runStats) {
    var stars = runStats.stars || 0;
    var maxStars = (node.rewards && node.rewards.stars) || 3;
    var bonus = { coins: 0, seasonXP: 0 };
    if (stars >= maxStars) {
      bonus.coins = 200;
      bonus.seasonXP = 30;
    } else if (stars >= 2) {
      bonus.coins = 100;
      bonus.seasonXP = 15;
    } else if (stars >= 1) {
      bonus.coins = 50;
      bonus.seasonXP = 5;
    }
    return bonus;
  };

  proto._unlockPartByRewardId = function(rewardId) {
    var garageMgr = this._dm.getGarageManager();
    var actualPartId = rewardId;

    if (rewardId.endsWith('_unlock')) {
      actualPartId = rewardId.replace('_unlock', '');
    } else if (rewardId.endsWith('_discount')) {
      return this._applyPartDiscount(rewardId.replace('_discount', ''));
    } else if (rewardId.endsWith('_upgrade')) {
      return this._upgradePart(rewardId.replace('_upgrade', ''));
    }

    var partInfo = MountainRacer.PartsConfig.getPartById(actualPartId);
    if (!partInfo) return null;

    if (garageMgr.isPartUnlocked(actualPartId)) {
      return { partId: actualPartId, alreadyOwned: true, category: partInfo.category };
    }

    var parts = garageMgr.getUnlockedParts();
    parts.push(actualPartId);
    this._dm.setData('unlocks.parts', parts);
    this._dm._emit('partUnlocked', {
      partId: actualPartId,
      category: partInfo.category,
      config: partInfo.config,
      source: 'season_reward'
    });

    return {
      partId: actualPartId,
      category: partInfo.category,
      config: partInfo.config,
      newlyUnlocked: true
    };
  };

  proto._applyPartDiscount = function(partId) {
    var partInfo = MountainRacer.PartsConfig.getPartById(partId);
    if (!partInfo) return null;
    this._dm._emit('partDiscountGranted', {
      partId: partId,
      category: partInfo.category,
      config: partInfo.config,
      discountPercent: 20
    });
    return {
      partId: partId,
      category: partInfo.category,
      config: partInfo.config,
      discount: 20,
      isDiscount: true
    };
  };

  proto._upgradePart = function(partId) {
    var garageMgr = this._dm.getGarageManager();
    var partInfo = MountainRacer.PartsConfig.getPartById(partId);
    if (!partInfo) return null;
    if (!garageMgr.isPartUnlocked(partId)) {
      var parts = garageMgr.getUnlockedParts();
      parts.push(partId);
      this._dm.setData('unlocks.parts', parts);
    }
    var equipped = garageMgr.getEquippedParts();
    var oldPart = equipped[partInfo.category];
    equipped[partInfo.category] = partId;
    this._dm.setData('garage.equippedParts', equipped);
    this._dm._emit('partUpgraded', {
      partId: partId,
      category: partInfo.category,
      oldPart: oldPart,
      config: partInfo.config
    });
    return {
      partId: partId,
      category: partInfo.category,
      oldPart: oldPart,
      config: partInfo.config,
      isUpgrade: true,
      autoEquipped: true
    };
  };

  proto._unlockCarByRewardId = function(rewardId) {
    var garageMgr = this._dm.getGarageManager();
    var actualCarId = rewardId;

    if (rewardId.endsWith('_unlock')) {
      actualCarId = rewardId.replace('_unlock', '');
    } else if (rewardId.endsWith('_discount')) {
      return {
        carId: rewardId.replace('_discount', ''),
        isDiscount: true,
        discount: 15
      };
    }

    var carConfig = MountainRacer.PartsConfig.getCarConfig(actualCarId);
    if (!carConfig) return null;

    if (garageMgr.isCarOwned(actualCarId)) {
      return { carId: actualCarId, alreadyOwned: true, config: carConfig };
    }

    var cars = garageMgr.getOwnedCars();
    cars.push(actualCarId);
    var customizations = this._dm.getData('garage.carCustomizations', {});
    customizations[actualCarId] = { color: carConfig.color, decals: [] };
    this._dm.batchUpdate({
      'garage.ownedCars': cars,
      'garage.carCustomizations': customizations
    });
    this._dm._emit('carPurchased', {
      carId: actualCarId,
      config: carConfig,
      source: 'season_reward'
    });

    return {
      carId: actualCarId,
      config: carConfig,
      newlyUnlocked: true
    };
  };

  proto._checkChapterRewards = function(chapterId) {
    var seasonDM = this._dm.getSeasonDataManager();
    var result = { completed: false, rewards: null };

    if (!seasonDM.isChapterComplete(chapterId)) return result;

    if (seasonDM.isRewardClaimed('chapters', chapterId + '_complete')) {
      return result;
    }

    var chapter = MountainRacer.SeasonConfig.getChapter(chapterId);
    if (!chapter || !chapter.chapterRewards) return result;

    var rewardConfig = chapter.chapterRewards;
    var garageMgr = this._dm.getGarageManager();
    var unlockMgr = this._dm.getUnlockManager();
    var granted = {
      coins: 0,
      seasonXP: 0,
      parts: [],
      cars: []
    };

    if (rewardConfig.coins) {
      garageMgr.addCoins(rewardConfig.coins, 'season_chapter_complete:' + chapterId);
      granted.coins = rewardConfig.coins;
    }
    if (rewardConfig.seasonXP) {
      seasonDM.addSeasonXP(rewardConfig.seasonXP, 'chapter_complete:' + chapterId);
      granted.seasonXP = rewardConfig.seasonXP;
    }
    if (rewardConfig.parts) {
      for (var pi = 0; pi < rewardConfig.parts.length; pi++) {
        var pr = this._unlockPartByRewardId(rewardConfig.parts[pi]);
        if (pr) granted.parts.push(pr);
      }
    }
    if (rewardConfig.cars) {
      for (var ci = 0; ci < rewardConfig.cars.length; ci++) {
        var cr = this._unlockCarByRewardId(rewardConfig.cars[ci]);
        if (cr) granted.cars.push(cr);
      }
    }

    seasonDM.markRewardClaimed('chapters', chapterId + '_complete');
    result.completed = true;
    result.rewards = granted;

    this._dm._emit('chapterRewardsGranted', {
      chapterId: chapterId,
      rewards: granted
    });

    return result;
  };

  proto._checkSeasonRewards = function() {
    var seasonDM = this._dm.getSeasonDataManager();
    var season = seasonDM.getCurrentSeason();
    var result = { completed: false, rewards: null };

    if (!season) return result;
    if (!seasonDM.isSeasonComplete(season.id)) return result;

    if (seasonDM.isRewardClaimed('season', season.id + '_complete')) {
      return result;
    }

    var rewardConfig = season.totalRewards;
    var garageMgr = this._dm.getGarageManager();
    var unlockMgr = this._dm.getUnlockManager();
    var granted = {
      coins: 0,
      seasonXP: 0,
      parts: [],
      cars: [],
      achievements: []
    };

    if (rewardConfig.coins) {
      garageMgr.addCoins(rewardConfig.coins, 'season_complete:' + season.id);
      granted.coins = rewardConfig.coins;
    }
    if (rewardConfig.parts) {
      for (var pi = 0; pi < rewardConfig.parts.length; pi++) {
        var pr = this._unlockPartByRewardId(rewardConfig.parts[pi]);
        if (pr) granted.parts.push(pr);
      }
    }
    if (rewardConfig.cars) {
      for (var ci = 0; ci < rewardConfig.cars.length; ci++) {
        var cr = this._unlockCarByRewardId(rewardConfig.cars[ci]);
        if (cr) granted.cars.push(cr);
      }
    }
    if (rewardConfig.achievements) {
      for (var ai = 0; ai < rewardConfig.achievements.length; ai++) {
        if (unlockMgr.unlockAchievement(rewardConfig.achievements[ai])) {
          granted.achievements.push(rewardConfig.achievements[ai]);
        }
      }
    }

    seasonDM.markRewardClaimed('season', season.id + '_complete');
    result.completed = true;
    result.rewards = granted;

    this._dm._emit('seasonRewardsGranted', {
      seasonId: season.id,
      rewards: granted
    });

    return result;
  };

  proto.claimSeasonLevelReward = function(level) {
    var seasonDM = this._dm.getSeasonDataManager();
    var levelConfig = MountainRacer.SeasonConfig.getSeasonLevel(level);
    if (!levelConfig) return { success: false, reason: 'invalid_level' };
    if (seasonDM.getSeasonLevel() < level) return { success: false, reason: 'level_not_reached' };
    if (seasonDM.isRewardClaimed('seasonLevels', 'level_' + level)) {
      return { success: false, reason: 'already_claimed' };
    }

    var reward = levelConfig.reward || {};
    var garageMgr = this._dm.getGarageManager();
    var granted = { coins: 0, parts: [], cars: [] };

    if (reward.coins) {
      garageMgr.addCoins(reward.coins, 'season_level_reward:' + level);
      granted.coins = reward.coins;
    }
    if (reward.parts) {
      for (var pi = 0; pi < reward.parts.length; pi++) {
        var pr = this._unlockPartByRewardId(reward.parts[pi]);
        if (pr) granted.parts.push(pr);
      }
    }
    if (reward.cars) {
      for (var ci = 0; ci < reward.cars.length; ci++) {
        var cr = this._unlockCarByRewardId(reward.cars[ci]);
        if (cr) granted.cars.push(cr);
      }
    }

    seasonDM.markRewardClaimed('seasonLevels', 'level_' + level);
    this._dm._emit('seasonLevelRewardClaimed', {
      level: level,
      rewards: granted
    });

    return { success: true, rewards: granted };
  };

  proto.getClaimedNodeRewards = function(nodeId) {
    var seasonDM = this._dm.getSeasonDataManager();
    var claimed = seasonDM.getClaimedRewards();
    var result = {
      clearClaimed: claimed.nodes.indexOf(nodeId + '_clear') !== -1
    };
    return result;
  };

  proto.getNodeRewardsPreview = function(chapterId, nodeId) {
    var node = MountainRacer.SeasonConfig.getNode(chapterId, nodeId);
    if (!node) return null;
    var rewards = node.rewards || {};
    var preview = {
      coins: rewards.coins || 0,
      seasonXP: rewards.seasonXP || 0,
      stars: rewards.stars || 3,
      parts: [],
      cars: [],
      achievements: rewards.achievements || []
    };

    if (rewards.parts) {
      for (var pi = 0; pi < rewards.parts.length; pi++) {
        var partId = rewards.parts[pi].replace(/_unlock|_discount|_upgrade/g, '');
        var partInfo = MountainRacer.PartsConfig.getPartById(partId);
        if (partInfo) {
          preview.parts.push({
            rewardId: rewards.parts[pi],
            partId: partId,
            name: partInfo.config.name,
            category: partInfo.category,
            tier: partInfo.config.tier
          });
        }
      }
    }

    if (rewards.cars) {
      for (var ci = 0; ci < rewards.cars.length; ci++) {
        var carId = rewards.cars[ci].replace(/_unlock|_discount/g, '');
        var carConfig = MountainRacer.PartsConfig.getCarConfig(carId);
        if (carConfig) {
          preview.cars.push({
            rewardId: rewards.cars[ci],
            carId: carId,
            name: carConfig.name,
            color: carConfig.color
          });
        }
      }
    }

    return preview;
  };

  proto.getChapterRewardsPreview = function(chapterId) {
    var chapter = MountainRacer.SeasonConfig.getChapter(chapterId);
    if (!chapter || !chapter.chapterRewards) return null;
    var rewards = chapter.chapterRewards;
    var preview = {
      coins: rewards.coins || 0,
      seasonXP: rewards.seasonXP || 0,
      parts: [],
      cars: []
    };

    if (rewards.parts) {
      for (var pi = 0; pi < rewards.parts.length; pi++) {
        var partId = rewards.parts[pi].replace(/_unlock|_discount|_upgrade/g, '');
        var partInfo = MountainRacer.PartsConfig.getPartById(partId);
        if (partInfo) {
          preview.parts.push({
            rewardId: rewards.parts[pi],
            partId: partId,
            name: partInfo.config.name,
            category: partInfo.category
          });
        }
      }
    }

    if (rewards.cars) {
      for (var ci = 0; ci < rewards.cars.length; ci++) {
        var carId = rewards.cars[ci].replace(/_unlock|_discount/g, '');
        var carConfig = MountainRacer.PartsConfig.getCarConfig(carId);
        if (carConfig) {
          preview.cars.push({
            rewardId: rewards.cars[ci],
            carId: carId,
            name: carConfig.name
          });
        }
      }
    }

    return preview;
  };

  proto.calculateGrowthProgress = function() {
    var seasonDM = this._dm.getSeasonDataManager();
    var garageMgr = this._dm.getGarageManager();
    var partsSummary = garageMgr.getAllPartsSummary();

    var seasonLevel = seasonDM.getSeasonLevelProgress();
    var totalStars = seasonDM.getTotalStars();
    var season = seasonDM.getSeasonSummary();

    var unlockedParts = partsSummary.totalUnlocked || 0;
    var totalParts = partsSummary.totalParts || 1;
    var unlockedCars = garageMgr.getOwnedCars().length;
    var totalCars = Object.keys(MountainRacer.PartsConfig.getAllCars()).length;
    var currentPower = garageMgr.getCurrentPerformanceRating();

    return {
      seasonLevel: seasonLevel,
      totalStars: totalStars,
      seasonCompletion: season ? season.completionPercent : 0,
      partsProgress: {
        unlocked: unlockedParts,
        total: totalParts,
        percent: Math.floor((unlockedParts / totalParts) * 100)
      },
      carsProgress: {
        unlocked: unlockedCars,
        total: totalCars,
        percent: Math.floor((unlockedCars / totalCars) * 100)
      },
      performanceRating: currentPower,
      coins: garageMgr.getCoins(),
      overallGrowth: Math.floor(
        (seasonLevel.percent * 0.25) +
        ((season ? season.completionPercent : 0) * 0.25) +
        (unlockedParts / totalParts * 100 * 0.25) +
        (unlockedCars / totalCars * 100 * 0.15) +
        Math.min(currentPower / 500 * 100, 100) * 0.10
      )
    };
  };

  proto.processGameRunRewards = function(runStats, starRating, isSeasonMode) {
    if (!isSeasonMode) {
      var garageMgr = this._dm.getGarageManager();
      var earned = garageMgr.applyCoinsFromRun(runStats);
      return {
        success: true,
        coins: earned,
        isSeason: false
      };
    }

    var runContext = this._dm.getData('season.currentRunContext', null);
    if (!runContext) {
      return { success: false, reason: 'no_run_context' };
    }

    var seasonDM = this._dm.getSeasonDataManager();
    var chapterId = runContext.chapterId;
    var nodeId = runContext.nodeId;
    var mode = runContext.mode;
    var eventType = runContext.eventType;
    var carGrowth = this._dm.getCarGrowthSystem();

    var finalStats = {
      ...runStats,
      stars: starRating ? (starRating.stars || 0) : 0
    };

    var eventEvaluation = null;

    if (mode === 'season_event') {
      var eventMgr = this._dm.getEventLevelManager();
      if (eventMgr.isEventActive()) {
        var eventResult = eventMgr.finalizeEvent(runStats, starRating);
        if (eventResult && eventResult.success) {
          eventEvaluation = eventResult.evaluation;
          finalStats.totalScore = eventResult.runStats.totalScore;
          finalStats.stars = eventResult.runStats.stars;
          finalStats.isComplete = eventResult.runStats.isComplete;
        }
      } else {
        seasonDM.clearRunContext();
        return { success: false, reason: 'event_already_finalized' };
      }
    }

    var updateResult = null;
    if (runStats.isComplete || finalStats.isComplete) {
      updateResult = seasonDM.updateNodeProgress(chapterId, nodeId, finalStats);
    } else {
      seasonDM.updateNodeProgress(chapterId, nodeId, finalStats);
    }

    var rewards = null;
    if (finalStats.isComplete) {
      rewards = this.processNodeRewards(chapterId, nodeId, finalStats, eventEvaluation);
    }

    var growthResult = null;
    if (carGrowth && finalStats.isComplete) {
      growthResult = carGrowth.applyRaceGrowth(chapterId, nodeId, finalStats);
    }

    seasonDM.clearRunContext();

    var summary = {
      success: true,
      isSeason: true,
      chapterId: chapterId,
      nodeId: nodeId,
      mode: mode,
      eventEvaluation: eventEvaluation,
      updateResult: updateResult,
      rewards: rewards,
      growthResult: growthResult
    };

    if (rewards) {
      var nodeRewards = rewards.nodeRewards || {};
      summary.coins = (nodeRewards.coins || 0) +
        (rewards.recurringRewards ? (rewards.recurringRewards.coins || 0) : 0) +
        (rewards.starsBonus ? (rewards.starsBonus.coins || 0) : 0);
      summary.seasonXP = (nodeRewards.seasonXP || 0) +
        (rewards.recurringRewards ? (rewards.recurringRewards.seasonXP || 0) : 0) +
        (rewards.starsBonus ? (rewards.starsBonus.seasonXP || 0) : 0);
      summary.unlockedParts = (nodeRewards.parts || []).concat(
        rewards.chapterRewards ? (rewards.chapterRewards.parts || []) : [],
        rewards.seasonRewards ? (rewards.seasonRewards.parts || []) : []
      );
      summary.levelUp = !!(nodeRewards.seasonXP > 0 && updateResult);
      summary.newLevel = seasonDM.getSeasonLevel();
      summary.chapterCompleted = rewards.chapterCompleted || false;
      summary.seasonCompleted = rewards.seasonCompleted || false;
      summary.chapterRewards = rewards.chapterRewards;
      summary.seasonRewards = rewards.seasonRewards;

      if (updateResult && updateResult.firstClear) {
        summary.newUnlocks = [];
        var unlockedNodes = this._dm.getData('season.unlockedNodes', {});
        var chapterUnlocked = unlockedNodes[chapterId] || [];
        summary.newUnlocks = chapterUnlocked.map(function(nid) { return nid; });
      }
    } else {
      summary.coins = 0;
      summary.seasonXP = 0;
      summary.unlockedParts = [];
    }

    this._dm._emit('seasonRaceCompleted', summary);

    return summary;
  };

  proto.initializeSeasonRace = function(chapterId, nodeId) {
    var node = MountainRacer.SeasonConfig.getNode(chapterId, nodeId);
    if (!node) return { success: false, reason: 'invalid_node' };

    var seasonDM = this._dm.getSeasonDataManager();
    if (!seasonDM.isNodeUnlocked(chapterId, nodeId)) {
      return { success: false, reason: 'node_locked' };
    }

    var garageMgr = this._dm.getGarageManager();
    var chapter = MountainRacer.SeasonConfig.getChapter(chapterId);
    var reqPower = (chapter && chapter.requiredPower) || 0;
    var curPower = garageMgr.getCurrentPerformanceRating();
    if (reqPower > 0 && curPower < reqPower) {
      return {
        success: false,
        reason: 'insufficient_power',
        required: reqPower,
        current: curPower
      };
    }

    if (node.type === 'event') {
      var eventMgr = this._dm.getEventLevelManager();
      return eventMgr.initializeEvent(chapterId, nodeId);
    }

    var mode = node.type === 'boss' ? 'season_boss' : 'season_race';
    seasonDM.setRunContext({
      mode: mode,
      chapterId: chapterId,
      nodeId: nodeId,
      nodeType: node.type
    });

    this._dm._emit('seasonRaceStarted', {
      chapterId: chapterId,
      nodeId: nodeId,
      node: node,
      mode: mode
    });

    return {
      success: true,
      mode: mode,
      node: node,
      level: node.level,
      branchConfig: node.branchConfig,
      bossConfig: node.bossConfig || null
    };
  };

  window.MountainRacer = MountainRacer;
})();
