(function() {
  var MountainRacer = window.MountainRacer || {};

  MountainRacer.CarGrowthSystem = function(dataManager) {
    this._dm = dataManager;
  };

  var proto = MountainRacer.CarGrowthSystem.prototype;

  proto.getGrowthStats = function() {
    var garageMgr = this._dm.getGarageManager();
    var seasonDM = this._dm.getSeasonDataManager();
    var rewardSystem = this._dm.getRewardSystem();

    return {
      currentPerformance: garageMgr.getCurrentPerformanceRating(),
      currentStats: garageMgr.calculateCarStats(),
      seasonLevel: seasonDM.getSeasonLevelProgress(),
      growth: rewardSystem.calculateGrowthProgress(),
      currentCar: garageMgr.getCurrentCarId(),
      ownedCars: garageMgr.getOwnedCars(),
      equippedParts: garageMgr.getEquippedParts(),
      unlockedParts: garageMgr.getUnlockedParts()
    };
  };

  proto.getRecommendedUpgrades = function(chapterId) {
    var chapter = MountainRacer.SeasonConfig.getChapter(chapterId);
    if (!chapter) return null;

    var garageMgr = this._dm.getGarageManager();
    var requiredPower = chapter.requiredPower || 0;
    var currentPower = garageMgr.getCurrentPerformanceRating();
    var currentStats = garageMgr.calculateCarStats();
    var equipped = garageMgr.getEquippedParts();

    if (currentPower >= requiredPower) {
      return {
        ready: true,
        requiredPower: requiredPower,
        currentPower: currentPower,
        recommendations: [],
        message: '✅ 车辆性能充足，可以挑战本章！'
      };
    }

    var deficit = requiredPower - currentPower;
    var recommendations = [];
    var categories = ['engine', 'tires', 'suspension', 'brakes', 'body', 'nitro'];
    var catNames = {
      engine: '引擎', tires: '轮胎', suspension: '悬挂',
      brakes: '刹车', body: '车身', nitro: '氮气'
    };

    for (var ci = 0; ci < categories.length; ci++) {
      var cat = categories[ci];
      var currentPartId = equipped[cat];
      var currentPartCfg = MountainRacer.PartsConfig.getPartConfig(cat, currentPartId);
      var currentTier = currentPartCfg ? currentPartCfg.tier : 0;
      var allParts = MountainRacer.PartsConfig.getAllPartsByCategory(cat);
      var partIds = Object.keys(allParts);
      var bestUpgrade = null;
      var bestPowerGain = 0;

      for (var pi = 0; pi < partIds.length; pi++) {
        var partId = partIds[pi];
        var partCfg = allParts[partId];
        if (!partCfg || partCfg.tier <= currentTier) continue;
        if (!garageMgr.isPartUnlocked(partId)) continue;
        var powerGain = (partCfg.stats.power || 0) - (currentPartCfg ? (currentPartCfg.stats.power || 0) : 0);
        if (powerGain > bestPowerGain) {
          bestPowerGain = powerGain;
          bestUpgrade = {
            partId: partId,
            category: cat,
            categoryName: catNames[cat],
            current: currentPartCfg ? currentPartCfg.name : '无',
            upgrade: partCfg.name,
            powerGain: powerGain,
            canUpgrade: true
          };
        }
      }

      if (!bestUpgrade) {
        var coins = garageMgr.getCoins();
        for (var pj = 0; pj < partIds.length; pj++) {
          var pid = partIds[pj];
          var pcfg = allParts[pid];
          if (!pcfg || pcfg.tier <= currentTier) continue;
          var check = garageMgr.canUnlockPart(pid);
          if (check.canUnlock && pcfg.price <= coins) {
            var pg = (pcfg.stats.power || 0) - (currentPartCfg ? (currentPartCfg.stats.power || 0) : 0);
            if (pg > bestPowerGain) {
              bestPowerGain = pg;
              bestUpgrade = {
                partId: pid,
                category: cat,
                categoryName: catNames[cat],
                current: currentPartCfg ? currentPartCfg.name : '无',
                upgrade: pcfg.name,
                powerGain: pg,
                canUpgrade: false,
                canBuy: true,
                price: pcfg.price,
                needPurchase: true
              };
            }
          }
        }
      }

      if (bestUpgrade) {
        recommendations.push(bestUpgrade);
      }
    }

    recommendations.sort(function(a, b) { return b.powerGain - a.powerGain; });

    return {
      ready: false,
      requiredPower: requiredPower,
      currentPower: currentPower,
      deficit: deficit,
      recommendations: recommendations.slice(0, 4),
      message: '⚙️ 需要提升车辆性能 ' + deficit + ' 点',
      coins: garageMgr.getCoins()
    };
  };

  proto.getChapterUnlockHints = function(chapterId) {
    var chapter = MountainRacer.SeasonConfig.getChapter(chapterId);
    var seasonDM = this._dm.getSeasonDataManager();
    var garageMgr = this._dm.getGarageManager();

    if (!chapter) return null;

    var result = {
      unlocked: seasonDM.isChapterUnlocked(chapterId),
      requirements: []
    };

    var requiredStars = chapter.unlockStars || 0;
    var currentStars = seasonDM.getTotalStars();
    var starsOk = currentStars >= requiredStars;
    result.requirements.push({
      type: 'stars',
      label: '赛季星星',
      required: requiredStars,
      current: currentStars,
      met: starsOk,
      deficit: Math.max(0, requiredStars - currentStars)
    });

    var requiredPower = chapter.requiredPower || 0;
    var currentPower = garageMgr.getCurrentPerformanceRating();
    var powerOk = currentPower >= requiredPower;
    result.requirements.push({
      type: 'power',
      label: '车辆性能',
      required: requiredPower,
      current: currentPower,
      met: powerOk,
      deficit: Math.max(0, requiredPower - currentPower)
    });

    result.allMet = starsOk && powerOk;
    result.canUnlock = !result.unlocked && result.allMet;

    return result;
  };

  proto.getNodeUnlockHints = function(chapterId, nodeId) {
    var node = MountainRacer.SeasonConfig.getNode(chapterId, nodeId);
    var seasonDM = this._dm.getSeasonDataManager();
    if (!node) return null;

    var result = {
      unlocked: seasonDM.isNodeUnlocked(chapterId, nodeId),
      requirements: []
    };

    if (!node.unlockRequirement) {
      result.requirements.push({ type: 'none', label: '无前置需求', met: true });
      result.allMet = true;
    } else {
      var req = node.unlockRequirement;
      switch (req.type) {
        case 'node_clear':
          var p1 = seasonDM.getNodeProgress(req.nodeId);
          var met1 = p1.cleared;
          var stars1 = seasonDM.getStarsForNode(req.nodeId);
          var minStars1 = req.minStars || 0;
          var starsMet1 = stars1 >= minStars1;
          result.requirements.push({
            type: 'node_clear',
            label: '通过前置关卡',
            requiredNodeId: req.nodeId,
            cleared: met1,
            requiredStars: minStars1,
            currentStars: stars1,
            starsMet: starsMet1,
            met: met1 && starsMet1
          });
          break;
        case 'any_node_clear':
          var anyCleared = false;
          var totalStars = 0;
          for (var i = 0; i < req.nodeIds.length; i++) {
            var prog = seasonDM.getNodeProgress(req.nodeIds[i]);
            if (prog.cleared) anyCleared = true;
            totalStars += seasonDM.getStarsForNode(req.nodeIds[i]);
          }
          var minStars = req.minStars || 0;
          result.requirements.push({
            type: 'any_node_clear',
            label: '通过任意前置关卡',
            requiredNodeIds: req.nodeIds,
            anyCleared: anyCleared,
            requiredStars: minStars,
            totalStars: totalStars,
            starsMet: totalStars >= minStars,
            met: anyCleared && totalStars >= minStars
          });
          break;
        case 'chapter_complete':
          var chComplete = seasonDM.isChapterComplete(req.chapterId);
          result.requirements.push({
            type: 'chapter_complete',
            label: '完成上一章节',
            chapterId: req.chapterId,
            met: chComplete
          });
          break;
      }
    }

    result.allMet = result.requirements.every(function(r) { return r.met; });
    result.canUnlock = !result.unlocked && result.allMet;

    return result;
  };

  proto.applyGrowthToPhysics = function(carPhysics) {
    if (!carPhysics) return false;
    var garageMgr = this._dm.getGarageManager();
    var stats = garageMgr.calculateCarStats();
    if (!stats) return false;

    if (typeof carPhysics.applyCarStats === 'function') {
      carPhysics.applyCarStats(stats);
    } else {
      if (stats.maxSpeed) carPhysics.maxSpeed = stats.maxSpeed;
      if (stats.acceleration) carPhysics.acceleration = stats.acceleration;
      if (stats.brakePower) carPhysics.brakeAcceleration = stats.brakePower;
      if (stats.grip) carPhysics.gripMultiplier = stats.grip;
      if (stats.damageReduction) carPhysics.damageReduction = stats.damageReduction;
      if (stats.rollResist) carPhysics.rollResist = stats.rollResist;
      if (stats.suspensionStiffness) carPhysics.suspensionStiffness = stats.suspensionStiffness;
      if (stats.suspensionDamping) carPhysics.suspensionDamping = stats.suspensionDamping;
      if (stats.landingBonus) carPhysics.landingBonus = stats.landingBonus;
      if (stats.nitroBoost) carPhysics.nitroBoost = stats.nitroBoost;
      if (stats.nitroCount) carPhysics.nitroCount = stats.nitroCount;
      if (stats.nitroDuration) carPhysics.nitroDuration = stats.nitroDuration;
    }

    carPhysics.appliedStats = stats;
    var verify = garageMgr.verifyConsistency(carPhysics);

    this._dm._emit('carStatsApplied', {
      stats: stats,
      verification: verify
    });

    return verify.powerMatch || true;
  };

  proto.getStartingHealth = function() {
    var garageMgr = this._dm.getGarageManager();
    var stats = garageMgr.calculateCarStats();
    return stats ? (stats.baseHealth || 100) : 100;
  };

  proto.getGrowthMilestones = function() {
    var seasonDM = this._dm.getSeasonDataManager();
    var rewardSystem = this._dm.getRewardSystem();
    var growth = rewardSystem.calculateGrowthProgress();

    var milestones = [
      { id: 'power_100', label: '性能等级 I', target: 100, type: 'power',
        reward: '解锁更多部件购买权限', icon: '⚙️' },
      { id: 'power_200', label: '性能等级 II', target: 200, type: 'power',
        reward: '解锁高级部件购买权限', icon: '🔧' },
      { id: 'power_350', label: '性能等级 III', target: 350, type: 'power',
        reward: '解锁顶级部件购买权限', icon: '🛠️' },
      { id: 'power_500', label: '性能等级 IV', target: 500, type: 'power',
        reward: '解锁传奇级部件', icon: '💎' },
      { id: 'stars_10', label: '初级探索者', target: 10, type: 'stars',
        reward: '额外金币奖励倍率', icon: '⭐' },
      { id: 'stars_30', label: '中级探索者', target: 30, type: 'stars',
        reward: '隐藏路线提示', icon: '🌟' },
      { id: 'stars_50', label: '高级探索者', target: 50, type: 'stars',
        reward: '宝箱掉落率提升', icon: '✨' },
      { id: 'season_lv5', label: '熟练车手', target: 5, type: 'seasonLevel',
        reward: '每日签到奖励加成', icon: '🏅' },
      { id: 'season_lv8', label: '传奇车手', target: 8, type: 'seasonLevel',
        reward: '专属装饰外观', icon: '🏆' }
    ];

    var currentPower = growth.performanceRating;
    var currentStars = growth.totalStars;
    var currentLevel = growth.seasonLevel.level;

    for (var i = 0; i < milestones.length; i++) {
      var m = milestones[i];
      var current = 0;
      if (m.type === 'power') current = currentPower;
      else if (m.type === 'stars') current = currentStars;
      else if (m.type === 'seasonLevel') current = currentLevel;
      m.current = current;
      m.achieved = current >= m.target;
      m.progress = Math.min(100, Math.floor((current / m.target) * 100));
    }

    return {
      milestones: milestones,
      achievedCount: milestones.filter(function(m) { return m.achieved; }).length,
      totalCount: milestones.length
    };
  };

  proto.getPowerCurve = function() {
    var garageMgr = this._dm.getGarageManager();
    var seasonDM = this._dm.getSeasonDataManager();
    var currentStats = garageMgr.calculateCarStats();

    var curve = [];
    var categories = ['engine', 'tires', 'suspension', 'brakes', 'body', 'nitro'];
    var catNames = {
      engine: '引擎', tires: '轮胎', suspension: '悬挂',
      brakes: '刹车', body: '车身', nitro: '氮气'
    };
    var equipped = garageMgr.getEquippedParts();

    for (var ci = 0; ci < categories.length; ci++) {
      var cat = categories[ci];
      var currentPart = equipped[cat];
      var currentCfg = MountainRacer.PartsConfig.getPartConfig(cat, currentPart);
      var allParts = MountainRacer.PartsConfig.getAllPartsByCategory(cat);
      var partIds = Object.keys(allParts);
      var tiers = [];

      for (var pi = 0; pi < partIds.length; pi++) {
        var pid = partIds[pi];
        var pcfg = allParts[pid];
        if (!pcfg) continue;
        tiers.push({
          tier: pcfg.tier,
          name: pcfg.name,
          power: pcfg.stats.power || 0,
          unlocked: garageMgr.isPartUnlocked(pid),
          equipped: pid === currentPart,
          canBuy: garageMgr.canUnlockPart(pid).canUnlock
        });
      }

      tiers.sort(function(a, b) { return a.tier - b.tier; });

      curve.push({
        category: cat,
        categoryName: catNames[cat],
        currentTier: currentCfg ? currentCfg.tier : 0,
        currentPart: currentCfg ? currentCfg.name : '无',
        tiers: tiers
      });
    }

    return {
      categories: curve,
      currentPower: currentStats ? currentStats.performanceRating : 0,
      currentCar: garageMgr.getCurrentCarId()
    };
  };

  window.MountainRacer = MountainRacer;
})();
