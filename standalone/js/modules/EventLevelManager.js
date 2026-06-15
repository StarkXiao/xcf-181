(function() {
  var MountainRacer = window.MountainRacer || {};

  MountainRacer.EventLevelManager = function(dataManager) {
    this._dm = dataManager;
    this._activeEvent = null;
    this._eventContext = null;
  };

  var proto = MountainRacer.EventLevelManager.prototype;

  proto.initializeEvent = function(chapterId, nodeId) {
    var node = MountainRacer.SeasonConfig.getNode(chapterId, nodeId);
    if (!node || node.type !== 'event') {
      return { success: false, reason: 'not_event_node' };
    }
    var eventType = node.eventType;
    var eventConfig = node.eventConfig || {};
    var eventTypeInfo = MountainRacer.SeasonConfig.getEventType(eventType);
    if (!eventTypeInfo) {
      return { success: false, reason: 'unknown_event_type' };
    }

    this._activeEvent = {
      chapterId: chapterId,
      nodeId: nodeId,
      node: node,
      eventType: eventType,
      eventConfig: eventConfig,
      eventTypeInfo: eventTypeInfo,
      startedAt: Date.now()
    };

    this._eventContext = this._initializeEventContext(eventType, eventConfig);

    var seasonDM = this._dm.getSeasonDataManager();
    seasonDM.setRunContext({
      mode: 'season_event',
      chapterId: chapterId,
      nodeId: nodeId,
      eventType: eventType
    });

    this._dm._emit('eventStarted', this._activeEvent);
    return { success: true, event: this._activeEvent };
  };

  proto._initializeEventContext = function(eventType, config) {
    var ctx = {
      tracking: {},
      objectives: [],
      bonuses: {},
      penalties: {},
      passConditions: [],
      failConditions: []
    };

    switch (eventType) {
      case 'time_trial':
        ctx.objectives = [
          { id: 'finish_in_time', label: '在时间限制内完成', type: 'condition' }
        ];
        ctx.tracking = { timeRemaining: config.timeLimit || 120 };
        ctx.bonuses = {
          extraTime: config.bonusPerSecond || 10
        };
        break;
      case 'no_damage':
        ctx.objectives = [
          { id: 'zero_damage', label: '不受任何伤害', type: 'condition' },
          { id: 'finish', label: '到达终点', type: 'condition' }
        ];
        ctx.tracking = { damageTaken: 0, damageEvents: [] };
        ctx.penalties = {
          damage: config.damagePenalty || 500
        };
        ctx.bonuses = {
          extraHP: config.bonusPerHP || 15
        };
        break;
      case 'collect_all':
        ctx.objectives = [
          { id: 'collect_all', label: '收集所有收集品', type: 'count', target: config.collectibleCount || 10 }
        ];
        ctx.tracking = { collected: 0, totalCollectibles: config.collectibleCount || 10, collectibles: [] };
        ctx.bonuses = {
          perCollectible: config.bonusPerCollectible || 50,
          allCollected: config.allCollectedBonus || 500
        };
        break;
      case 'stunt_master':
        ctx.objectives = [
          { id: 'air_time', label: '累计空中时间', type: 'time', target: config.minAirTime || 5 },
          { id: 'jump_count', label: '完成跳跃次数', type: 'count', target: config.minJumpCount || 8 }
        ];
        ctx.tracking = { airTime: 0, jumpCount: 0, jumps: [] };
        ctx.bonuses = {
          perSecond: config.bonusPerSecond || 100,
          perJump: config.bonusPerJump || 30
        };
        break;
      case 'combo_master':
        ctx.objectives = [
          { id: 'keep_combo', label: '达成目标连击', type: 'count', target: config.minCombo || 10 },
          { id: 'no_break', label: '连击中断少于限制', type: 'count', target: config.maxComboBreak || 5, inverse: true }
        ];
        ctx.tracking = { maxCombo: 0, comboBreaks: 0, combos: [] };
        ctx.bonuses = {
          perCombo: config.bonusPerCombo || 40,
          noBreakBonus: config.bonusForNoBreak || 1000
        };
        break;
      case 'explorer':
        ctx.objectives = [
          { id: 'explore_branches', label: '探索足够分支', type: 'count', target: config.requiredBranchCount || 2 }
        ];
        ctx.tracking = { branchesVisited: [], branchCount: 0 };
        ctx.bonuses = {
          perBranch: config.bonusPerBranch || 200,
          allBranches: config.allBranchesBonus || 800
        };
        break;
      case 'survival':
        ctx.objectives = [
          { id: 'survive', label: '保持生命在安全线以上', type: 'condition' },
          { id: 'finish', label: '到达终点', type: 'condition' }
        ];
        ctx.tracking = { minHealthPercent: 100, lowestHealth: 100 };
        ctx.bonuses = {
          healthBonus: config.healthBonus || 1000,
          perfectBonus: config.perfectBonus || 2000
        };
        break;
      case 'speed_demon':
        ctx.objectives = [
          { id: 'avg_speed', label: '平均速度达标', type: 'speed', target: config.minAvgSpeed || 100 },
          { id: 'max_speed', label: '最高速度达标', type: 'speed', target: config.minMaxSpeed || 160 }
        ];
        ctx.tracking = { speedSamples: [], maxSpeed: 0, avgSpeed: 0 };
        ctx.bonuses = {
          perSpeed: config.speedBonus || 5,
          recordBonus: config.recordBonus || 3000
        };
        break;
      case 'perfectionist':
        ctx.objectives = [
          { id: 'three_stars', label: '获得三星评价', type: 'condition' },
          { id: 'perfect_run', label: '完美通关', type: 'condition' }
        ];
        ctx.tracking = { damageEvents: 0, mistakes: 0 };
        ctx.bonuses = {
          starBonus: config.starBonus || 2000,
          perfectBonus: config.perfectBonus || 3000
        };
        break;
      case 'treasure_hunt':
        ctx.objectives = [
          { id: 'find_hidden', label: '发现隐藏路线', type: 'condition' },
          { id: 'secret_events', label: '触发所有秘密事件', type: 'count', target: config.secretEventsRequired || 2 }
        ];
        ctx.tracking = { foundHidden: false, secretEvents: 0, discoveries: [] };
        ctx.bonuses = {
          discovery: config.discoveryBonus || 800,
          allFound: config.allFoundBonus || 5000
        };
        break;
    }

    return ctx;
  };

  proto.getActiveEvent = function() {
    return this._activeEvent;
  };

  proto.getEventContext = function() {
    return this._eventContext;
  };

  proto.isEventActive = function() {
    return !!this._activeEvent;
  };

  proto.trackEvent = function(trackType, data) {
    if (!this._activeEvent || !this._eventContext) return;
    var eventType = this._activeEvent.eventType;

    switch (eventType) {
      case 'time_trial':
        this._trackTimeTrial(trackType, data);
        break;
      case 'no_damage':
        this._trackNoDamage(trackType, data);
        break;
      case 'collect_all':
        this._trackCollectAll(trackType, data);
        break;
      case 'stunt_master':
        this._trackStuntMaster(trackType, data);
        break;
      case 'combo_master':
        this._trackComboMaster(trackType, data);
        break;
      case 'explorer':
        this._trackExplorer(trackType, data);
        break;
      case 'survival':
        this._trackSurvival(trackType, data);
        break;
      case 'speed_demon':
        this._trackSpeedDemon(trackType, data);
        break;
      case 'perfectionist':
        this._trackPerfectionist(trackType, data);
        break;
      case 'treasure_hunt':
        this._trackTreasureHunt(trackType, data);
        break;
    }

    this._dm._emit('eventTracked', {
      eventType: eventType,
      trackType: trackType,
      data: data,
      context: this._eventContext
    });
  };

  proto._trackTimeTrial = function(type, data) {
    var ctx = this._eventContext;
    if (type === 'update' && data.elapsedTime) {
      ctx.tracking.timeRemaining = Math.max(0,
        (this._activeEvent.eventConfig.timeLimit || 120) - data.elapsedTime);
    }
  };

  proto._trackNoDamage = function(type, data) {
    var ctx = this._eventContext;
    if (type === 'damage' && data.amount > 0) {
      ctx.tracking.damageTaken += data.amount;
      ctx.tracking.damageEvents.push({
        amount: data.amount,
        type: data.damageType,
        time: Date.now() - this._activeEvent.startedAt
      });
    }
  };

  proto._trackCollectAll = function(type, data) {
    var ctx = this._eventContext;
    if (type === 'collect') {
      ctx.tracking.collected++;
      ctx.tracking.collectibles.push({
        id: data.collectibleId,
        type: data.collectibleType,
        value: data.value,
        distance: data.distance
      });
    }
  };

  proto._trackStuntMaster = function(type, data) {
    var ctx = this._eventContext;
    if (type === 'air_time' && data.duration) {
      ctx.tracking.airTime += data.duration;
    } else if (type === 'jump') {
      ctx.tracking.jumpCount++;
      ctx.tracking.jumps.push({
        airTime: data.airTime || 0,
        distance: data.distance || 0,
        height: data.height || 0
      });
    }
  };

  proto._trackComboMaster = function(type, data) {
    var ctx = this._eventContext;
    if (type === 'combo_update' && data.count) {
      if (data.count > ctx.tracking.maxCombo) {
        ctx.tracking.maxCombo = data.count;
      }
    } else if (type === 'combo_break') {
      ctx.tracking.comboBreaks++;
      ctx.tracking.combos.push({
        maxCount: data.maxCount || 0,
        breakReason: data.reason,
        time: Date.now() - this._activeEvent.startedAt
      });
    }
  };

  proto._trackExplorer = function(type, data) {
    var ctx = this._eventContext;
    if (type === 'branch_enter' && data.branchId) {
      if (ctx.tracking.branchesVisited.indexOf(data.branchId) === -1) {
        ctx.tracking.branchesVisited.push(data.branchId);
        ctx.tracking.branchCount = ctx.tracking.branchesVisited.length;
      }
    }
  };

  proto._trackSurvival = function(type, data) {
    var ctx = this._eventContext;
    if (type === 'health_update' && typeof data.healthPercent !== 'undefined') {
      ctx.tracking.lowestHealth = Math.min(ctx.tracking.lowestHealth, data.healthPercent);
    }
  };

  proto._trackSpeedDemon = function(type, data) {
    var ctx = this._eventContext;
    if (type === 'speed_update' && typeof data.speed !== 'undefined') {
      ctx.tracking.speedSamples.push({
        speed: data.speed,
        time: Date.now() - this._activeEvent.startedAt,
        distance: data.distance || 0
      });
      if (data.speed > ctx.tracking.maxSpeed) {
        ctx.tracking.maxSpeed = data.speed;
      }
      var total = 0;
      for (var i = 0; i < ctx.tracking.speedSamples.length; i++) {
        total += ctx.tracking.speedSamples[i].speed;
      }
      ctx.tracking.avgSpeed = Math.round(total / ctx.tracking.speedSamples.length);
    }
  };

  proto._trackPerfectionist = function(type, data) {
    var ctx = this._eventContext;
    if (type === 'damage') {
      ctx.tracking.damageEvents++;
    } else if (type === 'mistake') {
      ctx.tracking.mistakes++;
    }
  };

  proto._trackTreasureHunt = function(type, data) {
    var ctx = this._eventContext;
    if (type === 'hidden_branch' && data.branchId) {
      if (!ctx.tracking.foundHidden) {
        ctx.tracking.foundHidden = true;
        ctx.tracking.discoveries.push({ type: 'hidden_branch', branchId: data.branchId });
      }
    } else if (type === 'secret_event') {
      ctx.tracking.secretEvents++;
      ctx.tracking.discoveries.push({ type: 'secret_event', eventId: data.eventId });
    }
  };

  proto.evaluateEvent = function(runStats, starRating) {
    if (!this._activeEvent) {
      return { success: false, reason: 'no_active_event' };
    }

    var eventType = this._activeEvent.eventType;
    var config = this._activeEvent.eventConfig;
    var result = {
      eventType: eventType,
      passed: false,
      objectivesStatus: [],
      bonusScore: 0,
      penalties: 0,
      eventScore: 0,
      details: {}
    };

    var ctx = this._eventContext;
    var objectives = ctx.objectives;

    for (var i = 0; i < objectives.length; i++) {
      var obj = objectives[i];
      var status = this._evaluateObjective(obj, eventType, runStats, starRating);
      result.objectivesStatus.push({ objective: obj, ...status });
    }

    var allPassed = true;
    for (var j = 0; j < result.objectivesStatus.length; j++) {
      if (!result.objectivesStatus[j].passed) {
        allPassed = false;
        break;
      }
    }
    result.passed = allPassed;

    result.bonusScore = this._calculateEventBonus(eventType, config, runStats, starRating, ctx);
    result.penalties = this._calculateEventPenalty(eventType, config, runStats, ctx);
    result.eventScore = Math.max(0, runStats.totalScore + result.bonusScore - result.penalties);

    var finalStars = starRating ? starRating.stars || 0 : 0;
    if (result.passed && finalStars < 1) finalStars = 1;
    result.finalStars = result.passed ? finalStars : 0;

    result.details = this._buildEventDetails(eventType, runStats, ctx);
    result.summary = this._buildEventSummary(eventType, result);

    return result;
  };

  proto._evaluateObjective = function(objective, eventType, runStats, starRating) {
    var ctx = this._eventContext;
    var tracking = ctx.tracking;
    var passed = false;
    var actual = null;
    var target = objective.target || null;
    var progress = 0;

    switch (objective.id) {
      case 'finish_in_time':
        var timeLimit = this._activeEvent.eventConfig.timeLimit || 120;
        actual = runStats.time || 0;
        passed = actual <= timeLimit;
        progress = timeLimit > 0 ? Math.min(100, Math.max(0, ((timeLimit - actual) / timeLimit) * 100)) : 0;
        break;
      case 'zero_damage':
        actual = tracking.damageTaken || 0;
        passed = actual <= 0;
        progress = actual <= 0 ? 100 : 0;
        break;
      case 'finish':
        passed = !!runStats.isComplete;
        actual = runStats.isComplete;
        progress = passed ? 100 : (runStats.distance || 0) / (runStats.levelLength || 1) * 100;
        break;
      case 'collect_all':
        actual = tracking.collected || 0;
        target = objective.target;
        passed = actual >= target;
        progress = target > 0 ? Math.min(100, (actual / target) * 100) : 0;
        break;
      case 'air_time':
        actual = tracking.airTime || 0;
        target = objective.target;
        passed = actual >= target;
        progress = target > 0 ? Math.min(100, (actual / target) * 100) : 0;
        break;
      case 'jump_count':
        actual = tracking.jumpCount || 0;
        target = objective.target;
        passed = actual >= target;
        progress = target > 0 ? Math.min(100, (actual / target) * 100) : 0;
        break;
      case 'keep_combo':
        actual = tracking.maxCombo || 0;
        target = objective.target;
        passed = actual >= target;
        progress = target > 0 ? Math.min(100, (actual / target) * 100) : 0;
        break;
      case 'no_break':
        actual = tracking.comboBreaks || 0;
        target = objective.target;
        passed = actual <= target;
        progress = target > 0 ? Math.min(100, Math.max(0, (1 - actual / target) * 100)) : 0;
        break;
      case 'explore_branches':
        actual = tracking.branchCount || 0;
        target = objective.target;
        passed = actual >= target;
        progress = target > 0 ? Math.min(100, (actual / target) * 100) : 0;
        break;
      case 'survive':
        var minRequired = this._activeEvent.eventConfig.minHealthPercent || 30;
        actual = tracking.lowestHealth || 0;
        passed = actual >= minRequired;
        progress = 100 > 0 ? Math.min(100, Math.max(0, (actual / minRequired) * 100)) : 0;
        break;
      case 'avg_speed':
        actual = tracking.avgSpeed || 0;
        target = objective.target;
        passed = actual >= target;
        progress = target > 0 ? Math.min(100, (actual / target) * 100) : 0;
        break;
      case 'max_speed':
        actual = tracking.maxSpeed || 0;
        target = objective.target;
        passed = actual >= target;
        progress = target > 0 ? Math.min(100, (actual / target) * 100) : 0;
        break;
      case 'three_stars':
        actual = starRating ? (starRating.stars || 0) : 0;
        passed = actual >= 3;
        progress = Math.min(100, actual / 3 * 100);
        break;
      case 'perfect_run':
        actual = !!runStats.perfectRun;
        passed = actual;
        progress = passed ? 100 : 0;
        break;
      case 'find_hidden':
        actual = tracking.foundHidden;
        passed = !!actual;
        progress = passed ? 100 : 0;
        break;
      case 'secret_events':
        actual = tracking.secretEvents || 0;
        target = objective.target;
        passed = actual >= target;
        progress = target > 0 ? Math.min(100, (actual / target) * 100) : 0;
        break;
      default:
        passed = true;
        actual = true;
        progress = 100;
    }

    return {
      passed: passed,
      actual: actual,
      target: target,
      progress: Math.floor(progress),
      description: objective.label
    };
  };

  proto._calculateEventBonus = function(eventType, config, runStats, starRating, ctx) {
    var bonus = 0;
    var tracking = ctx.tracking;
    var bonuses = ctx.bonuses;

    switch (eventType) {
      case 'time_trial':
        var timeLimit = config.timeLimit || 120;
        var timeSaved = Math.max(0, timeLimit - (runStats.time || 0));
        bonus += timeSaved * (bonuses.extraTime || 10);
        break;
      case 'no_damage':
        if (tracking.damageTaken <= 0) {
          bonus += runStats.health * (bonuses.extraHP || 15);
        }
        break;
      case 'collect_all':
        bonus += (tracking.collected || 0) * (bonuses.perCollectible || 50);
        var target = config.collectibleCount || 10;
        if ((tracking.collected || 0) >= target) {
          bonus += bonuses.allCollected || 500;
        }
        break;
      case 'stunt_master':
        bonus += (tracking.airTime || 0) * (bonuses.perSecond || 100);
        bonus += (tracking.jumpCount || 0) * (bonuses.perJump || 30);
        break;
      case 'combo_master':
        bonus += (tracking.maxCombo || 0) * (bonuses.perCombo || 40);
        if ((tracking.comboBreaks || 0) === 0) {
          bonus += bonuses.noBreakBonus || 1000;
        }
        break;
      case 'explorer':
        bonus += (tracking.branchCount || 0) * (bonuses.perBranch || 200);
        var allBranches = MountainRacer.SeasonConfig.getBranchConfig(this._activeEvent.node.branchConfig);
        if (allBranches && (tracking.branchCount || 0) >= allBranches.branches) {
          bonus += bonuses.allBranches || 800;
        }
        break;
      case 'survival':
        if (tracking.lowestHealth >= (config.minHealthPercent || 30)) {
          bonus += bonuses.healthBonus || 1000;
        }
        if (runStats.perfectRun) {
          bonus += bonuses.perfectBonus || 2000;
        }
        break;
      case 'speed_demon':
        var speedBonus = Math.max(0, (tracking.maxSpeed || 0) - (config.minMaxSpeed || 160));
        bonus += speedBonus * (bonuses.perSpeed || 5);
        if ((tracking.maxSpeed || 0) >= (config.minMaxSpeed || 160) &&
            (tracking.avgSpeed || 0) >= (config.minAvgSpeed || 100)) {
          bonus += bonuses.recordBonus || 3000;
        }
        break;
      case 'perfectionist':
        if (starRating && starRating.stars >= 3) {
          bonus += bonuses.starBonus || 2000;
        }
        if (runStats.perfectRun) {
          bonus += bonuses.perfectBonus || 3000;
        }
        break;
      case 'treasure_hunt':
        bonus += (tracking.discoveries || []).length * (bonuses.discovery || 800);
        var allFound = tracking.foundHidden &&
          (tracking.secretEvents || 0) >= (config.secretEventsRequired || 2);
        if (allFound) {
          bonus += bonuses.allFound || 5000;
        }
        break;
    }

    return Math.floor(bonus);
  };

  proto._calculateEventPenalty = function(eventType, config, runStats, ctx) {
    var penalty = 0;
    var tracking = ctx.tracking;
    var penalties = ctx.penalties;

    switch (eventType) {
      case 'no_damage':
        penalty = (tracking.damageTaken || 0) * (penalties.damage || 500 / 100);
        break;
      default:
        break;
    }

    return Math.floor(penalty);
  };

  proto._buildEventDetails = function(eventType, runStats, ctx) {
    var tracking = ctx.tracking;
    var details = {};

    switch (eventType) {
      case 'time_trial':
        details = {
          timeUsed: runStats.time || 0,
          timeLimit: this._activeEvent.eventConfig.timeLimit || 120,
          timeSaved: Math.max(0, (this._activeEvent.eventConfig.timeLimit || 120) - (runStats.time || 0))
        };
        break;
      case 'no_damage':
        details = {
          damageTaken: tracking.damageTaken || 0,
          damageEvents: tracking.damageEvents || [],
          finalHealth: runStats.health || 0
        };
        break;
      case 'collect_all':
        details = {
          collected: tracking.collected || 0,
          total: this._activeEvent.eventConfig.collectibleCount || 10,
          collectibles: tracking.collectibles || []
        };
        break;
      case 'stunt_master':
        details = {
          airTime: tracking.airTime || 0,
          jumpCount: tracking.jumpCount || 0,
          jumps: tracking.jumps || []
        };
        break;
      case 'combo_master':
        details = {
          maxCombo: tracking.maxCombo || 0,
          comboBreaks: tracking.comboBreaks || 0
        };
        break;
      case 'explorer':
        details = {
          branchCount: tracking.branchCount || 0,
          branchesVisited: tracking.branchesVisited || []
        };
        break;
      case 'survival':
        details = {
          lowestHealth: tracking.lowestHealth || 0,
          finalHealth: runStats.health || 0
        };
        break;
      case 'speed_demon':
        details = {
          maxSpeed: tracking.maxSpeed || 0,
          avgSpeed: tracking.avgSpeed || 0,
          samples: tracking.speedSamples ? tracking.speedSamples.length : 0
        };
        break;
      case 'perfectionist':
        details = {
          damageEvents: tracking.damageEvents || 0,
          mistakes: tracking.mistakes || 0,
          isPerfect: !!runStats.perfectRun
        };
        break;
      case 'treasure_hunt':
        details = {
          foundHidden: tracking.foundHidden,
          secretEvents: tracking.secretEvents || 0,
          discoveries: tracking.discoveries || []
        };
        break;
    }

    return details;
  };

  proto._buildEventSummary = function(eventType, result) {
    var typeInfo = this._activeEvent.eventTypeInfo;
    var summary = {
      title: typeInfo.name,
      icon: typeInfo.icon,
      result: result.passed ? '✅ 挑战成功！' : '❌ 挑战失败',
      bonus: result.bonusScore,
      penalty: result.penalties,
      totalScore: result.eventScore,
      stars: result.finalStars
    };
    if (result.objectivesStatus.length > 0) {
      var passedCount = 0;
      for (var i = 0; i < result.objectivesStatus.length; i++) {
        if (result.objectivesStatus[i].passed) passedCount++;
      }
      summary.objectives = passedCount + '/' + result.objectivesStatus.length + ' 目标达成';
    }
    return summary;
  };

  proto.finalizeEvent = function(runStats, starRating) {
    if (!this._activeEvent) {
      return { success: false, reason: 'no_active_event' };
    }

    var evaluation = this.evaluateEvent(runStats, starRating);
    var finalRunStats = {
      ...runStats,
      totalScore: evaluation.eventScore,
      stars: evaluation.finalStars,
      eventResult: evaluation,
      isComplete: evaluation.passed ? runStats.isComplete : false
    };

    var seasonDM = this._dm.getSeasonDataManager();
    var updateResult = seasonDM.updateNodeProgress(
      this._activeEvent.chapterId,
      this._activeEvent.nodeId,
      finalRunStats
    );

    var rewards = null;
    if (evaluation.passed && runStats.isComplete) {
      var rewardSystem = this._dm.getRewardSystem();
      rewards = rewardSystem.processNodeRewards(
        this._activeEvent.chapterId,
        this._activeEvent.nodeId,
        finalRunStats,
        evaluation
      );
    }

    var result = {
      success: true,
      evaluation: evaluation,
      runStats: finalRunStats,
      updateResult: updateResult,
      rewards: rewards
    };

    this._dm._emit('eventFinalized', {
      event: this._activeEvent,
      result: result
    });

    this._activeEvent = null;
    this._eventContext = null;
    seasonDM.clearRunContext();

    return result;
  };

  proto.cancelEvent = function() {
    if (!this._activeEvent) return { success: false, reason: 'no_active_event' };
    var event = this._activeEvent;
    this._activeEvent = null;
    this._eventContext = null;
    var seasonDM = this._dm.getSeasonDataManager();
    seasonDM.clearRunContext();
    this._dm._emit('eventCancelled', { event: event });
    return { success: true };
  };

  proto.getEventProgressReport = function() {
    if (!this._activeEvent || !this._eventContext) return null;
    var ctx = this._eventContext;
    var objectives = [];
    for (var i = 0; i < ctx.objectives.length; i++) {
      var obj = ctx.objectives[i];
      var status = this._getObjectiveLiveStatus(obj);
      objectives.push({ objective: obj, ...status });
    }
    return {
      event: this._activeEvent,
      objectives: objectives,
      tracking: ctx.tracking
    };
  };

  proto._getObjectiveLiveStatus = function(objective) {
    var tracking = this._eventContext.tracking;
    var actual = null;
    var target = objective.target || null;
    var progress = 0;

    switch (objective.id) {
      case 'collect_all':
        actual = tracking.collected || 0;
        target = objective.target;
        progress = target > 0 ? (actual / target) * 100 : 0;
        break;
      case 'air_time':
        actual = tracking.airTime || 0;
        target = objective.target;
        progress = target > 0 ? (actual / target) * 100 : 0;
        break;
      case 'jump_count':
        actual = tracking.jumpCount || 0;
        target = objective.target;
        progress = target > 0 ? (actual / target) * 100 : 0;
        break;
      case 'keep_combo':
        actual = tracking.maxCombo || 0;
        target = objective.target;
        progress = target > 0 ? (actual / target) * 100 : 0;
        break;
      case 'explore_branches':
        actual = tracking.branchCount || 0;
        target = objective.target;
        progress = target > 0 ? (actual / target) * 100 : 0;
        break;
      case 'secret_events':
        actual = tracking.secretEvents || 0;
        target = objective.target;
        progress = target > 0 ? (actual / target) * 100 : 0;
        break;
      default:
        progress = 0;
        actual = null;
    }

    return {
      actual: actual,
      target: target,
      progress: Math.floor(Math.min(100, progress)),
      description: objective.label
    };
  };

  window.MountainRacer = MountainRacer;
})();
