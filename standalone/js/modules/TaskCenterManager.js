(function() {
  var MountainRacer = window.MountainRacer || {};

  MountainRacer.TaskCenterManager = function(dataManager) {
    this._dm = dataManager;
    this._cachedDailyChallenges = null;
    this._cachedDailyDate = null;
  };

  var proto = MountainRacer.TaskCenterManager.prototype;

  proto._ensureInitialized = function() {
    if (!this._dm._data.taskCenter) {
      this._dm._data.taskCenter = {
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
      };
      this._dm._saveData();
    }

    var stats = this._dm._data.taskCenter.stats;
    if (stats.consecutiveDays === undefined) stats.consecutiveDays = 0;
    if (stats.totalDays === undefined) stats.totalDays = 0;
    if (stats.lastLoginDate === undefined) stats.lastLoginDate = null;
    if (stats.firstLoginDate === undefined) stats.firstLoginDate = null;
    if (stats.totalJumps === undefined) stats.totalJumps = 0;
    if (stats.maxAirTime === undefined) stats.maxAirTime = 0;

    if (!this._dm._data.taskCenter.stageRewards) {
      this._dm._data.taskCenter.stageRewards = {
        completedTaskCount: 0,
        claimedStages: []
      };
    }
  };

  proto._updateLoginStreak = function() {
    this._ensureInitialized();
    var stats = this._dm._data.taskCenter.stats;
    var today = new Date();
    var todayKey = MountainRacer.TaskCenterConfig.getTodayKey();

    if (!stats.firstLoginDate) {
      stats.firstLoginDate = today.getTime();
      stats.totalDays = 1;
      stats.consecutiveDays = 1;
      stats.lastLoginDate = today.getTime();
    } else if (stats.lastLoginDate) {
      var lastLogin = new Date(stats.lastLoginDate);
      var yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (!MountainRacer.TaskCenterConfig.isSameDay(stats.lastLoginDate, today.getTime())) {
        if (MountainRacer.TaskCenterConfig.isSameDay(stats.lastLoginDate, yesterday.getTime())) {
          stats.consecutiveDays++;
        } else {
          stats.consecutiveDays = 1;
        }
        stats.totalDays++;
        stats.lastLoginDate = today.getTime();
      }
    }

    this._checkAchievements();
    this._dm._saveData();
  };

  proto.getDailyChallenges = function(forceRefresh) {
    this._ensureInitialized();
    this._updateLoginStreak();

    var today = new Date();
    var todayKey = MountainRacer.TaskCenterConfig.getTodayKey();

    if (!forceRefresh && this._cachedDailyChallenges && this._cachedDailyDate === todayKey) {
      return this._cachedDailyChallenges;
    }

    var stored = this._dm._data.taskCenter.dailyChallenges[todayKey];
    var challenges;

    if (stored && stored.length > 0) {
      challenges = stored;
    } else {
      challenges = MountainRacer.TaskCenterConfig.getDailyChallenges(today);
      this._dm._data.taskCenter.dailyChallenges[todayKey] = challenges;
      this._dm._saveData();
    }

    var dailyProgress = this._dm._data.taskCenter.dailyProgress[todayKey] || {};
    for (var i = 0; i < challenges.length; i++) {
      var challenge = challenges[i];
      var progress = dailyProgress[challenge.id];
      if (progress !== undefined) {
        challenge.progress = progress;
      }
      var claimed = this._dm._data.taskCenter.dailyChallenges[todayKey + '_claimed_' + challenge.id];
      if (claimed) {
        challenge.claimedTiers = claimed;
      }
    }

    this._cachedDailyChallenges = challenges;
    this._cachedDailyDate = todayKey;

    return challenges;
  };

  proto.updateDailyProgress = function(runStats) {
    this._ensureInitialized();
    var todayKey = MountainRacer.TaskCenterConfig.getTodayKey();
    var challenges = this.getDailyChallenges();
    var dailyProgress = this._dm._data.taskCenter.dailyProgress[todayKey] || {};
    var updated = [];

    for (var i = 0; i < challenges.length; i++) {
      var challenge = challenges[i];
      var currentProgress = challenge.progress || 0;
      var newValue = currentProgress;

      switch (challenge.type) {
        case 'score':
          newValue = Math.max(currentProgress, runStats.totalScore || 0);
          break;
        case 'distance':
          newValue = Math.max(currentProgress, runStats.distance || 0);
          break;
        case 'maxSpeed':
          newValue = Math.max(currentProgress, runStats.maxSpeed || 0);
          break;
        case 'maxCombo':
          newValue = Math.max(currentProgress, runStats.maxCombo || 0);
          break;
        case 'collectibles':
          newValue = Math.max(currentProgress, runStats.collectibles || 0);
          break;
        case 'stars':
          newValue = Math.max(currentProgress, runStats.stars || 0);
          break;
        case 'noDamage':
          if (runStats.isComplete && (runStats.damageTaken === 0 || runStats.damage === 0)) {
            newValue = 1;
          }
          break;
        case 'airTime':
          newValue = Math.max(currentProgress, Math.floor(runStats.airTime || 0));
          break;
        case 'branches':
          var branches = runStats.branchesExplored || (runStats.branchDistances ? Object.keys(runStats.branchDistances).length : 0);
          newValue = Math.max(currentProgress, branches);
          break;
        case 'wins':
          if (runStats.isComplete) {
            newValue = currentProgress + 1;
          }
          break;
      }

      if (newValue !== currentProgress) {
        challenge.progress = newValue;
        dailyProgress[challenge.id] = newValue;
        updated.push({
          challenge: challenge,
          oldValue: currentProgress,
          newValue: newValue,
          completedTiers: this._getCompletedTiers(challenge, newValue)
        });
      }
    }

    this._dm._data.taskCenter.dailyProgress[todayKey] = dailyProgress;
    this._dm._data.taskCenter.dailyChallenges[todayKey] = challenges;

    this._updateGlobalStats(runStats);

    if (updated.length > 0) {
      this._recalculateCompletedTaskCount();
      this._checkStageRewards();
      this._dm._saveData();
      this._dm._emit('dailyChallengesUpdated', { updates: updated });
    }

    return updated;
  };

  proto._getCompletedTiers = function(challenge, progress) {
    var completed = [];
    for (var t = 0; t < challenge.targets.length; t++) {
      if (progress >= challenge.targets[t]) {
        completed.push(t);
      }
    }
    return completed;
  };

  proto.claimDailyReward = function(challengeId, tier) {
    this._ensureInitialized();
    var todayKey = MountainRacer.TaskCenterConfig.getTodayKey();
    var challenges = this.getDailyChallenges();
    var challenge = null;

    for (var i = 0; i < challenges.length; i++) {
      if (challenges[i].id === challengeId) {
        challenge = challenges[i];
        break;
      }
    }

    if (!challenge) {
      return { success: false, reason: 'challenge_not_found' };
    }

    var claimedKey = todayKey + '_claimed_' + challengeId;
    var claimed = this._dm._data.taskCenter.dailyChallenges[claimedKey] || [];

    if (claimed.indexOf(tier) !== -1) {
      return { success: false, reason: 'already_claimed' };
    }

    if (challenge.progress < challenge.targets[tier]) {
      return { success: false, reason: 'not_completed' };
    }

    var reward = challenge.rewards[tier];
    var garageMgr = this._dm.getGarageManager();
    var seasonDM = this._dm.getSeasonDataManager();

    if (reward.coins) {
      garageMgr.addCoins(reward.coins, 'daily_challenge:' + challengeId + ':tier_' + tier);
    }
    if (reward.seasonXP) {
      seasonDM.addSeasonXP(reward.seasonXP, 'daily_challenge:' + challengeId + ':tier_' + tier);
    }

    claimed.push(tier);
    challenge.claimedTiers = claimed;
    this._dm._data.taskCenter.dailyChallenges[claimedKey] = claimed;

    this._recalculateCompletedTaskCount();
    this._checkStageRewards();
    this._checkAchievements();

    this._dm._saveData();
    this._dm._emit('dailyRewardClaimed', {
      challengeId: challengeId,
      tier: tier,
      reward: reward
    });

    return { success: true, reward: reward, challenge: challenge };
  };

  proto.getAchievements = function() {
    this._ensureInitialized();
    this._updateLoginStreak();

    var allAchievements = MountainRacer.TaskCenterConfig.getAchievements();
    var unlocked = this._dm.getData('unlocks.achievements', []);
    var progress = this._dm._data.taskCenter.achievements;
    var result = [];

    var keys = Object.keys(allAchievements);
    for (var i = 0; i < keys.length; i++) {
      var id = keys[i];
      var ach = allAchievements[id];
      var isUnlocked = unlocked.indexOf(id) !== -1;
      var currentProgress = progress[id] || 0;
      var completion = this._getAchievementProgress(ach, currentProgress);

      result.push({
        ...ach,
        unlocked: isUnlocked,
        progress: completion.current,
        target: completion.target,
        percent: completion.percent
      });
    }

    return result;
  };

  proto._getAchievementProgress = function(achievement, currentValue) {
    var condition = achievement.condition;
    var target = condition.value;
    var current = currentValue;

    if (condition.type === 'chapterComplete' || condition.type === 'seasonComplete' ||
        condition.type === 'chapterAllStars') {
      current = this._checkSpecialCondition(condition) ? 1 : 0;
    }

    var percent = Math.min(100, Math.floor((current / target) * 100));

    return {
      current: current,
      target: target,
      percent: percent
    };
  };

  proto._checkSpecialCondition = function(condition) {
    var seasonDM = this._dm.getSeasonDataManager();

    switch (condition.type) {
      case 'chapterComplete':
        return seasonDM.isChapterComplete(condition.value);
      case 'seasonComplete':
        return seasonDM.isSeasonComplete(condition.value);
      case 'chapterAllStars':
        return this._checkChapterAllStars(condition.value);
      default:
        return false;
    }
  };

  proto._checkChapterAllStars = function(chapterId) {
    var nodes = MountainRacer.SeasonConfig.getNodesByChapter(chapterId);
    var seasonDM = this._dm.getSeasonDataManager();

    for (var i = 0; i < nodes.length; i++) {
      var nodeProgress = seasonDM.getNodeProgress(chapterId, nodes[i].id);
      if (!nodeProgress || (nodeProgress.stars || 0) < 3) {
        return false;
      }
    }
    return nodes.length > 0;
  };

  proto._checkAchievements = function() {
    this._ensureInitialized();
    var allAchievements = MountainRacer.TaskCenterConfig.getAchievements();
    var unlockMgr = this._dm.getUnlockManager();
    var unlockedIds = unlockMgr.getUnlockedAchievements();
    var newlyUnlocked = [];
    var stats = this._dm._data.taskCenter.stats;
    var progress = this._dm._data.taskCenter.achievements;

    var keys = Object.keys(allAchievements);
    for (var i = 0; i < keys.length; i++) {
      var id = keys[i];
      if (unlockedIds.indexOf(id) !== -1) continue;

      var ach = allAchievements[id];
      var condition = ach.condition;
      var currentValue = 0;

      switch (condition.type) {
        case 'totalRaces':
          currentValue = stats.totalRaces;
          break;
        case 'maxSpeed':
          currentValue = stats.maxSpeed;
          break;
        case 'totalStars':
          currentValue = stats.totalStars;
          break;
        case 'maxCombo':
          currentValue = stats.maxCombo;
          break;
        case 'totalDistance':
          currentValue = stats.totalDistance;
          break;
        case 'totalCoins':
          currentValue = stats.totalCoinsEarned;
          break;
        case 'chapterComplete':
        case 'seasonComplete':
        case 'chapterAllStars':
          currentValue = this._checkSpecialCondition(condition) ? 1 : 0;
          break;
        case 'carsUnlocked':
          currentValue = this._dm.getGarageManager().getOwnedCars().length;
          break;
        case 'power':
          currentValue = this._dm.getGarageManager().getCurrentPerformanceRating();
          break;
        case 'stuntJumps':
          currentValue = stats.totalJumps;
          break;
        case 'allBranches':
          currentValue = progress[id] || 0;
          break;
        case 'consecutiveDays':
          currentValue = stats.consecutiveDays;
          break;
        case 'totalDays':
          currentValue = stats.totalDays;
          break;
        case 'perfectRun':
          currentValue = progress[id] || 0;
          break;
      }

      progress[id] = currentValue;

      if (currentValue >= condition.value) {
        if (unlockMgr.unlockAchievement(id)) {
          newlyUnlocked.push(ach);
          this._grantAchievementReward(ach);
        }
      }
    }

    this._dm._data.taskCenter.achievements = progress;

    if (newlyUnlocked.length > 0) {
      this._recalculateCompletedTaskCount();
      this._checkStageRewards();
      this._dm._saveData();
      this._dm._emit('achievementsUnlocked', { achievements: newlyUnlocked });
    }

    return newlyUnlocked;
  };

  proto._grantAchievementReward = function(achievement) {
    var reward = achievement.reward;
    if (!reward) return;

    var garageMgr = this._dm.getGarageManager();
    var seasonDM = this._dm.getSeasonDataManager();

    if (reward.coins) {
      garageMgr.addCoins(reward.coins, 'achievement:' + achievement.id);
    }
    if (reward.seasonXP) {
      seasonDM.addSeasonXP(reward.seasonXP, 'achievement:' + achievement.id);
    }
  };

  proto._updateGlobalStats = function(runStats) {
    var stats = this._dm._data.taskCenter.stats;

    if (runStats.isComplete) {
      stats.totalRaces++;
    }
    stats.totalDistance += (runStats.distance || 0);
    stats.totalStars += (runStats.stars || 0);
    stats.totalCoinsEarned += (runStats.coinsEarned || 0);
    stats.maxSpeed = Math.max(stats.maxSpeed, runStats.maxSpeed || 0);
    stats.maxCombo = Math.max(stats.maxCombo, runStats.maxCombo || 0);
    stats.maxAirTime = Math.max(stats.maxAirTime, runStats.airTime || 0);
    stats.totalJumps += (runStats.jumpCount || 0);

    if (runStats.isComplete && runStats.stars >= 3 && (runStats.damageTaken === 0 || runStats.damage === 0)) {
      var progress = this._dm._data.taskCenter.achievements;
      progress['perfect_run'] = 1;
    }

    var branchesExplored = runStats.branchesExplored ||
      (runStats.branchDistances ? Object.keys(runStats.branchDistances).length : 0);
    if (branchesExplored >= 3) {
      var progress2 = this._dm._data.taskCenter.achievements;
      progress2['explore_all_branches'] = 1;
    }

    this._dm._data.taskCenter.stats = stats;
  };

  proto._incrementCompletedTaskCount = function() {
    this._ensureInitialized();
    if (!this._dm._data.taskCenter.stageRewards) {
      this._dm._data.taskCenter.stageRewards = {
        completedTaskCount: 0,
        claimedStages: []
      };
    }
    this._dm._data.taskCenter.stageRewards.completedTaskCount++;
    this._dm._data.taskCenter.completedDailyTasks = this._dm._data.taskCenter.stageRewards.completedTaskCount;
  };

  proto._recalculateCompletedTaskCount = function() {
    this._ensureInitialized();
    var total = 0;

    var dailyChallenges = this._dm._data.taskCenter.dailyChallenges || {};
    var dailyProgress = this._dm._data.taskCenter.dailyProgress || {};
    var dateKeys = {};

    var allKeys = Object.keys(dailyChallenges);
    for (var k = 0; k < allKeys.length; k++) {
      var key = allKeys[k];
      if (key.indexOf('_claimed_') !== -1) continue;
      var challenges = dailyChallenges[key] || [];
      var progressForDay = dailyProgress[key] || {};
      for (var c = 0; c < challenges.length; c++) {
        var ch = challenges[c];
        var prog = progressForDay[ch.id] !== undefined ? progressForDay[ch.id] : (ch.progress || 0);
        for (var t = 0; t < ch.targets.length; t++) {
          if (prog >= ch.targets[t]) {
            total++;
          }
        }
      }
    }

    var unlockedIds = this._dm.getUnlockManager().getUnlockedAchievements();
    total += unlockedIds.length;

    if (!this._dm._data.taskCenter.stageRewards) {
      this._dm._data.taskCenter.stageRewards = {
        completedTaskCount: 0,
        claimedStages: []
      };
    }
    this._dm._data.taskCenter.stageRewards.completedTaskCount = total;
    this._dm._data.taskCenter.completedDailyTasks = total;
    this._dm._data.taskCenter.completedAchievements = unlockedIds.length;
  };

  proto.getStageRewards = function() {
    this._ensureInitialized();
    this._recalculateCompletedTaskCount();
    var stages = MountainRacer.TaskCenterConfig.getStageRewards();
    var state = this._dm._data.taskCenter.stageRewards;
    var result = [];

    for (var i = 0; i < stages.length; i++) {
      var stage = stages[i];
      var isClaimed = state.claimedStages.indexOf(stage.id) !== -1;
      var canClaim = state.completedTaskCount >= stage.requiredTasks && !isClaimed;

      result.push({
        ...stage,
        currentProgress: state.completedTaskCount,
        required: stage.requiredTasks,
        percent: Math.min(100, Math.floor((state.completedTaskCount / stage.requiredTasks) * 100)),
        canClaim: canClaim,
        claimed: isClaimed
      });
    }

    return result;
  };

  proto._checkStageRewards = function() {
    var stages = this.getStageRewards();
    var available = stages.filter(function(s) { return s.canClaim; });

    if (available.length > 0) {
      this._dm._emit('stageRewardsAvailable', { stages: available });
    }

    return available;
  };

  proto.claimStageReward = function(stageId) {
    this._ensureInitialized();
    this._recalculateCompletedTaskCount();

    var state = this._dm._data.taskCenter.stageRewards;
    var stagesConfig = MountainRacer.TaskCenterConfig.getStageRewards();
    var stageConfig = null;

    for (var i = 0; i < stagesConfig.length; i++) {
      if (stagesConfig[i].id === stageId) {
        stageConfig = stagesConfig[i];
        break;
      }
    }

    if (!stageConfig) {
      return { success: false, reason: 'stage_not_found' };
    }

    var isClaimed = state.claimedStages.indexOf(stageId) !== -1;
    var canClaim = state.completedTaskCount >= stageConfig.requiredTasks && !isClaimed;

    if (isClaimed) {
      return { success: false, reason: 'already_claimed' };
    }

    if (!canClaim) {
      return { success: false, reason: 'not_completed' };
    }

    var reward = JSON.parse(JSON.stringify(stageConfig.reward));
    var garageMgr = this._dm.getGarageManager();
    var seasonDM = this._dm.getSeasonDataManager();

    if (reward.coins) {
      garageMgr.addCoins(reward.coins, 'stage_reward:' + stageId);
    }
    if (reward.seasonXP) {
      seasonDM.addSeasonXP(reward.seasonXP, 'stage_reward:' + stageId);
    }
    if (reward.parts) {
      for (var pi = 0; pi < reward.parts.length; pi++) {
        var partReward = this._dm.getRewardSystem()._unlockPartByRewardId(reward.parts[pi]);
        if (partReward && partReward.newlyUnlocked) {
          reward.parts[pi] = partReward;
        }
      }
    }
    if (reward.cars) {
      for (var ci = 0; ci < reward.cars.length; ci++) {
        var carReward = this._dm.getRewardSystem()._unlockCarByRewardId(reward.cars[ci]);
        if (carReward && carReward.newlyUnlocked) {
          reward.cars[ci] = carReward;
        }
      }
    }

    state.claimedStages.push(stageId);
    this._dm._saveData();

    var resultStage = {
      ...stageConfig,
      currentProgress: state.completedTaskCount,
      required: stageConfig.requiredTasks,
      percent: 100,
      canClaim: false,
      claimed: true
    };

    this._dm._emit('stageRewardClaimed', {
      stageId: stageId,
      reward: reward
    });

    return { success: true, reward: reward, stage: resultStage };
  };

  proto.getSummary = function() {
    this._ensureInitialized();
    this._updateLoginStreak();
    this._recalculateCompletedTaskCount();

    var daily = this.getDailyChallenges();
    var achievements = this.getAchievements();
    var stages = this.getStageRewards();

    var dailyCompleted = 0;
    var dailyTotal = daily.length * 3;
    var dailyClaimable = 0;

    for (var d = 0; d < daily.length; d++) {
      var ch = daily[d];
      for (var t = 0; t < ch.targets.length; t++) {
        if (ch.progress >= ch.targets[t]) {
          dailyCompleted++;
          if (ch.claimedTiers.indexOf(t) === -1) {
            dailyClaimable++;
          }
        }
      }
    }

    var achievementsUnlocked = achievements.filter(function(a) { return a.unlocked; }).length;
    var achievementsTotal = achievements.length;

    var stageClaimable = stages.filter(function(s) { return s.canClaim; }).length;
    var stageClaimed = stages.filter(function(s) { return s.claimed; }).length;

    var totalClaimable = dailyClaimable + stageClaimable;

    return {
      dailyChallenges: {
        completed: dailyCompleted,
        total: dailyTotal,
        claimable: dailyClaimable,
        challenges: daily
      },
      achievements: {
        unlocked: achievementsUnlocked,
        total: achievementsTotal,
        progress: Math.floor((achievementsUnlocked / achievementsTotal) * 100)
      },
      stageRewards: {
        completed: stageClaimed,
        total: stages.length,
        claimable: stageClaimable,
        completedTaskCount: this._dm._data.taskCenter.stageRewards.completedTaskCount
      },
      totalClaimable: totalClaimable,
      stats: this._dm._data.taskCenter.stats
    };
  };

  proto.refreshAll = function() {
    this._cachedDailyChallenges = null;
    this._cachedDailyDate = null;

    var daily = this.getDailyChallenges(true);
    var achievements = this._checkAchievements();
    var stages = this._checkStageRewards();

    return {
      dailyChallenges: daily,
      newlyUnlockedAchievements: achievements,
      availableStageRewards: stages
    };
  };

  proto.getTaskCenterIconState = function() {
    var summary = this.getSummary();
    return {
      hasClaimable: summary.totalClaimable > 0,
      claimableCount: summary.totalClaimable,
      dailyProgress: summary.dailyChallenges.completed / summary.dailyChallenges.total,
      achievementProgress: summary.achievements.progress
    };
  };

  proto.processGameEnd = function(runStats) {
    var dailyUpdates = this.updateDailyProgress(runStats);
    var achievements = this._checkAchievements();
    var stages = this._checkStageRewards();

    return {
      dailyUpdates: dailyUpdates,
      newlyUnlockedAchievements: achievements,
      availableStageRewards: stages
    };
  };

  window.MountainRacer = MountainRacer;
})();
