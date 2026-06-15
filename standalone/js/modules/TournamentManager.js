(function() {
  var MountainRacer = window.MountainRacer || {};

  MountainRacer.TournamentManager = function(dataManager) {
    this._dm = dataManager;
    this._activeTournamentRun = null;
  };

  var proto = MountainRacer.TournamentManager.prototype;

  proto._ensureInitialized = function() {
    if (!this._dm._data.tournament) {
      this._dm._data.tournament = {
        tickets: MountainRacer.TournamentConfig.getTicketConfig().initialTickets,
        lastTicketRegen: Date.now(),
        registrations: {},
        activeTournament: null,
        tournamentHistory: {},
        scheduleState: {
          lastDailyGenerated: null,
          lastWeeklyGenerated: null,
          generatedTournaments: []
        },
        stats: {
          totalParticipations: 0,
          totalWins: 0,
          bestRank: null,
          totalCoinsEarned: 0,
          totalTicketsSpent: 0
        }
      };
      this._dm._saveData();
    }

    var data = this._dm._data.tournament;
    if (data.scheduleState === undefined) {
      data.scheduleState = {
        lastDailyGenerated: null,
        lastWeeklyGenerated: null,
        generatedTournaments: []
      };
    }
    if (data.stats === undefined) {
      data.stats = {
        totalParticipations: 0,
        totalWins: 0,
        bestRank: null,
        totalCoinsEarned: 0,
        totalTicketsSpent: 0
      };
    }
  };

  proto._getTournamentData = function() {
    return this._dm._data.tournament;
  };

  // ========================================================================
  // 子系统一：报名条件校验
  // ========================================================================

  proto.validateRegistration = function(tournamentId) {
    this._ensureInitialized();
    var tournament = this.getTournament(tournamentId);
    if (!tournament) return { valid: false, reason: 'tournament_not_found' };

    var currentPhase = this.getCurrentPhase(tournamentId);
    if (!currentPhase || currentPhase.id !== 'registration') {
      return { valid: false, reason: 'not_in_registration_phase' };
    }

    var typeConfig = MountainRacer.TournamentConfig.getTournamentType(tournament.type);
    if (!typeConfig) return { valid: false, reason: 'invalid_type' };

    var conditions = typeConfig.conditions;
    var validationResults = [];
    var allPassed = true;

    var seasonLevel = this._dm.getSeasonDataManager().getSeasonLevel();
    if (conditions.minLevel > 0 && seasonLevel < conditions.minLevel) {
      validationResults.push({
        condition: 'minLevel',
        passed: false,
        required: conditions.minLevel,
        current: seasonLevel
      });
      allPassed = false;
    } else if (conditions.minLevel > 0) {
      validationResults.push({
        condition: 'minLevel',
        passed: true,
        required: conditions.minLevel,
        current: seasonLevel
      });
    }

    var garageMgr = this._dm.getGarageManager();
    var currentPower = garageMgr.getCurrentPerformanceRating();
    if (conditions.minPower > 0 && currentPower < conditions.minPower) {
      validationResults.push({
        condition: 'minPower',
        passed: false,
        required: conditions.minPower,
        current: currentPower
      });
      allPassed = false;
    } else if (conditions.minPower > 0) {
      validationResults.push({
        condition: 'minPower',
        passed: true,
        required: conditions.minPower,
        current: currentPower
      });
    }

    var tickets = this.getTickets();
    if (tickets < conditions.requiredTickets) {
      validationResults.push({
        condition: 'requiredTickets',
        passed: false,
        required: conditions.requiredTickets,
        current: tickets
      });
      allPassed = false;
    } else {
      validationResults.push({
        condition: 'requiredTickets',
        passed: true,
        required: conditions.requiredTickets,
        current: tickets
      });
    }

    if (conditions.cooldownHours > 0) {
      var lastEntry = this._getLastEntryTime(tournament.type);
      if (lastEntry && (Date.now() - lastEntry) < conditions.cooldownHours * 3600000) {
        var remaining = conditions.cooldownHours * 3600000 - (Date.now() - lastEntry);
        validationResults.push({
          condition: 'cooldown',
          passed: false,
          remainingMs: remaining,
          remainingHours: Math.ceil(remaining / 3600000)
        });
        allPassed = false;
      } else if (conditions.cooldownHours > 0) {
        validationResults.push({ condition: 'cooldown', passed: true });
      }
    }

    if (conditions.maxDailyEntries > 0) {
      var todayEntries = this._getTodayEntryCount(tournament.type);
      if (todayEntries >= conditions.maxDailyEntries) {
        validationResults.push({
          condition: 'maxDailyEntries',
          passed: false,
          max: conditions.maxDailyEntries,
          current: todayEntries
        });
        allPassed = false;
      } else {
        validationResults.push({
          condition: 'maxDailyEntries',
          passed: true,
          max: conditions.maxDailyEntries,
          current: todayEntries
        });
      }
    }

    if (conditions.requiredAchievements && conditions.requiredAchievements.length > 0) {
      var unlockMgr = this._dm.getUnlockManager();
      var unlockedAch = unlockMgr.getUnlockedAchievements();
      var missingAch = [];
      for (var ai = 0; ai < conditions.requiredAchievements.length; ai++) {
        if (unlockedAch.indexOf(conditions.requiredAchievements[ai]) === -1) {
          missingAch.push(conditions.requiredAchievements[ai]);
        }
      }
      if (missingAch.length > 0) {
        validationResults.push({
          condition: 'requiredAchievements',
          passed: false,
          missing: missingAch
        });
        allPassed = false;
      } else {
        validationResults.push({
          condition: 'requiredAchievements',
          passed: true
        });
      }
    }

    if (conditions.requiredChaptersComplete > 0) {
      var seasonDM = this._dm.getSeasonDataManager();
      var completedCount = this._countCompletedChapters(seasonDM);
      if (completedCount < conditions.requiredChaptersComplete) {
        validationResults.push({
          condition: 'requiredChaptersComplete',
          passed: false,
          required: conditions.requiredChaptersComplete,
          current: completedCount
        });
        allPassed = false;
      } else {
        validationResults.push({
          condition: 'requiredChaptersComplete',
          passed: true,
          required: conditions.requiredChaptersComplete,
          current: completedCount
        });
      }
    }

    var data = this._getTournamentData();
    if (data.registrations[tournamentId]) {
      return {
        valid: false,
        reason: 'already_registered',
        validations: validationResults
      };
    }

    if (tournament.maxParticipants > 0 && tournament.participantCount >= tournament.maxParticipants) {
      validationResults.push({
        condition: 'maxParticipants',
        passed: false,
        max: tournament.maxParticipants,
        current: tournament.participantCount
      });
      allPassed = false;
    }

    return {
      valid: allPassed,
      reason: allPassed ? null : 'conditions_not_met',
      validations: validationResults
    };
  };

  proto._getLastEntryTime = function(typeId) {
    var history = this._getTournamentData().tournamentHistory;
    var lastTime = null;
    var keys = Object.keys(history);
    for (var i = 0; i < keys.length; i++) {
      var entry = history[keys[i]];
      if (entry.type === typeId && entry.registeredAt) {
        if (!lastTime || entry.registeredAt > lastTime) {
          lastTime = entry.registeredAt;
        }
      }
    }
    return lastTime;
  };

  proto._getTodayEntryCount = function(typeId) {
    var history = this._getTournamentData().tournamentHistory;
    var count = 0;
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var todayMs = today.getTime();
    var keys = Object.keys(history);
    for (var i = 0; i < keys.length; i++) {
      var entry = history[keys[i]];
      if (entry.type === typeId && entry.registeredAt && entry.registeredAt >= todayMs) {
        count++;
      }
    }
    return count;
  };

  proto._countCompletedChapters = function(seasonDM) {
    var count = 0;
    var seasons = MountainRacer.SeasonConfig.getAllSeasons ? MountainRacer.SeasonConfig.getAllSeasons() : {};
    var sKeys = Object.keys(seasons);
    for (var s = 0; s < sKeys.length; s++) {
      var season = seasons[sKeys[s]];
      if (season && season.chapters) {
        for (var c = 0; c < season.chapters.length; c++) {
          if (seasonDM.isChapterComplete(season.chapters[c])) count++;
        }
      }
    }
    return count;
  };

  // ========================================================================
  // 子系统二：门票消耗
  // ========================================================================

  proto.getTickets = function() {
    this._ensureInitialized();
    this._regenerateTickets();
    return this._getTournamentData().tickets;
  };

  proto._regenerateTickets = function() {
    var data = this._getTournamentData();
    var config = MountainRacer.TournamentConfig.getTicketConfig();
    var now = Date.now();
    var lastRegen = data.lastTicketRegen || now;
    var elapsed = now - lastRegen;
    var regenMs = config.regenerateMinutes * 60000;

    if (elapsed >= regenMs && data.tickets < config.maxTickets) {
      var ticketsToAdd = Math.floor(elapsed / regenMs);
      data.tickets = Math.min(config.maxTickets, data.tickets + ticketsToAdd);
      data.lastTicketRegen = now;
      this._dm._saveData();
    }
  };

  proto.consumeTickets = function(amount, reason) {
    this._ensureInitialized();
    this._regenerateTickets();
    var data = this._getTournamentData();

    if (amount <= 0) return { success: false, reason: 'invalid_amount' };
    if (data.tickets < amount) {
      return {
        success: false,
        reason: 'insufficient_tickets',
        current: data.tickets,
        needed: amount - data.tickets
      };
    }

    data.tickets -= amount;
    data.stats.totalTicketsSpent += amount;
    this._dm._saveData();
    this._dm._emit('ticketsConsumed', {
      amount: amount,
      remaining: data.tickets,
      reason: reason || 'unknown'
    });
    return { success: true, remaining: data.tickets };
  };

  proto.purchaseTickets = function(count) {
    this._ensureInitialized();
    var config = MountainRacer.TournamentConfig.getTicketConfig();
    var garageMgr = this._dm.getGarageManager();
    var totalCost = config.coinCostPerTicket * count;
    var coins = garageMgr.getCoins();

    if (coins < totalCost) {
      return {
        success: false,
        reason: 'insufficient_coins',
        cost: totalCost,
        current: coins
      };
    }

    var spendResult = garageMgr.spendCoins(totalCost, 'tournament_ticket_purchase');
    if (!spendResult.success) return spendResult;

    var data = this._getTournamentData();
    data.tickets = Math.min(config.maxTickets, data.tickets + count);
    this._dm._saveData();

    this._dm._emit('ticketsPurchased', {
      count: count,
      cost: totalCost,
      total: data.tickets
    });

    return { success: true, ticketsAdded: count, total: data.tickets, cost: totalCost };
  };

  proto.claimDailyFreeTickets = function() {
    this._ensureInitialized();
    var config = MountainRacer.TournamentConfig.getTicketConfig();
    var data = this._getTournamentData();
    var today = new Date();
    var todayKey = today.getFullYear() + '_' + (today.getMonth() + 1) + '_' + today.getDate();

    if (data.lastFreeTicketDay === todayKey) {
      return { success: false, reason: 'already_claimed_today' };
    }

    data.tickets = Math.min(config.maxTickets, data.tickets + config.dailyFreeTickets);
    data.lastFreeTicketDay = todayKey;
    this._dm._saveData();

    this._dm._emit('dailyFreeTicketsClaimed', {
      count: config.dailyFreeTickets,
      total: data.tickets
    });

    return { success: true, ticketsAdded: config.dailyFreeTickets, total: data.tickets };
  };

  proto.getTicketRegenInfo = function() {
    this._ensureInitialized();
    var data = this._getTournamentData();
    var config = MountainRacer.TournamentConfig.getTicketConfig();
    var now = Date.now();
    var lastRegen = data.lastTicketRegen || now;
    var elapsed = now - lastRegen;
    var regenMs = config.regenerateMinutes * 60000;
    var nextRegenIn = Math.max(0, regenMs - elapsed);

    return {
      current: data.tickets,
      max: config.maxTickets,
      nextRegenMs: nextRegenIn,
      nextRegenMinutes: Math.ceil(nextRegenIn / 60000),
      isFull: data.tickets >= config.maxTickets,
      dailyFreeClaimed: data.lastFreeTicketDay ===
        new Date().getFullYear() + '_' + (new Date().getMonth() + 1) + '_' + new Date().getDate()
    };
  };

  // ========================================================================
  // 子系统三：赛事日程管理
  // ========================================================================

  proto.generateScheduledTournaments = function() {
    this._ensureInitialized();
    var data = this._getTournamentData();
    var now = Date.now();
    var generated = [];

    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var todayKey = today.getTime();

    if (!data.scheduleState.lastDailyGenerated || data.scheduleState.lastDailyGenerated < todayKey) {
      var dailyTypes = MountainRacer.TournamentConfig.getTournamentTypesByCategory('daily');
      for (var d = 0; d < dailyTypes.length; d++) {
        var t = this._createTournamentInstance(dailyTypes[d], now);
        generated.push(t);
      }
      data.scheduleState.lastDailyGenerated = todayKey;
    }

    var weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    var weekKey = weekStart.getTime();

    if (!data.scheduleState.lastWeeklyGenerated || data.scheduleState.lastWeeklyGenerated < weekKey) {
      var weeklyTypes = MountainRacer.TournamentConfig.getTournamentTypesByCategory('weekly');
      for (var w = 0; w < weeklyTypes.length; w++) {
        var wt = this._createTournamentInstance(weeklyTypes[w], now);
        generated.push(wt);
      }
      data.scheduleState.lastWeeklyGenerated = weekKey;
    }

    for (var g = 0; g < generated.length; g++) {
      data.scheduleState.generatedTournaments.push(generated[g].id);
    }

    if (generated.length > 0) {
      this._dm._saveData();
      this._dm._emit('tournamentsGenerated', { tournaments: generated });
    }

    return generated;
  };

  proto._createTournamentInstance = function(typeConfig, startAt) {
    var id = MountainRacer.TournamentConfig.generateTournamentId(typeConfig.id);
    var endAt = MountainRacer.TournamentConfig.calculateTournamentEnd(typeConfig.id, startAt);

    var phases = [];
    var phaseStart = startAt;
    for (var i = 0; i < typeConfig.phases.length; i++) {
      var phaseConfig = typeConfig.phases[i];
      var phaseEnd = MountainRacer.TournamentConfig.calculatePhaseEnd(phaseConfig, phaseStart);
      phases.push({
        id: phaseConfig.id,
        name: phaseConfig.name,
        startAt: phaseStart,
        endAt: phaseEnd,
        attempts: phaseConfig.attempts || 0,
        groupsOf: phaseConfig.groupsOf || 0,
        advancePerGroup: phaseConfig.advancePerGroup || 0,
        rounds: phaseConfig.rounds || 0
      });
      phaseStart = phaseEnd;
    }

    return {
      id: id,
      type: typeConfig.id,
      name: typeConfig.name,
      description: typeConfig.description,
      icon: typeConfig.icon,
      category: typeConfig.category,
      startAt: startAt,
      endAt: endAt,
      phases: phases,
      participantCount: 0,
      maxParticipants: typeConfig.maxParticipants,
      ticketCost: typeConfig.ticketCost,
      status: 'upcoming',
      scoring: typeConfig.scoring,
      rewardTiers: typeConfig.rewardTiers
    };
  };

  proto.getAvailableTournaments = function() {
    this._ensureInitialized();
    this.generateScheduledTournaments();

    var data = this._getTournamentData();
    var now = Date.now();
    var available = [];

    var stored = this._dm.getData('tournament.instances', {});
    var instanceKeys = Object.keys(stored);
    for (var i = 0; i < instanceKeys.length; i++) {
      var tournament = stored[instanceKeys[i]];
      this._updateTournamentStatus(tournament, now);
      if (tournament.status !== 'expired' && tournament.status !== 'completed') {
        available.push(tournament);
      }
    }

    available.sort(function(a, b) {
      var order = { registration: 0, active: 1, upcoming: 2, rewards: 3 };
      var aOrder = order[a.status] !== undefined ? order[a.status] : 4;
      var bOrder = order[b.status] !== undefined ? order[b.status] : 4;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.startAt - b.startAt;
    });

    return available;
  };

  proto.getTournament = function(tournamentId) {
    this._ensureInitialized();
    var stored = this._dm.getData('tournament.instances', {});
    var tournament = stored[tournamentId];
    if (tournament) {
      this._updateTournamentStatus(tournament, Date.now());
    }
    return tournament || null;
  };

  proto._updateTournamentStatus = function(tournament, now) {
    if (!tournament || !tournament.phases || tournament.phases.length === 0) return;

    if (tournament.status === 'completed' || tournament.status === 'expired') return;

    if (now < tournament.startAt) {
      tournament.status = 'upcoming';
      return;
    }
    if (now >= tournament.endAt) {
      tournament.status = 'completed';
      return;
    }

    var currentPhaseFound = false;
    for (var i = 0; i < tournament.phases.length; i++) {
      var phase = tournament.phases[i];
      if (now >= phase.startAt && now < phase.endAt) {
        tournament.currentPhaseIndex = i;
        tournament.status = phase.id === 'registration' ? 'registration' :
          phase.id === 'rewards' ? 'rewards' : 'active';
        currentPhaseFound = true;
        break;
      }
    }
    if (!currentPhaseFound) {
      tournament.status = 'active';
    }
  };

  proto.getCurrentPhase = function(tournamentId) {
    var tournament = this.getTournament(tournamentId);
    if (!tournament || !tournament.phases) return null;
    var idx = tournament.currentPhaseIndex;
    if (idx !== undefined && idx >= 0 && idx < tournament.phases.length) {
      return tournament.phases[idx];
    }
    var now = Date.now();
    for (var i = 0; i < tournament.phases.length; i++) {
      if (now >= tournament.phases[i].startAt && now < tournament.phases[i].endAt) {
        return tournament.phases[i];
      }
    }
    return null;
  };

  proto.getPhaseTimeRemaining = function(tournamentId) {
    var phase = this.getCurrentPhase(tournamentId);
    if (!phase) return { ms: 0, minutes: 0, hours: 0, isExpired: true };
    var remaining = Math.max(0, phase.endAt - Date.now());
    return {
      ms: remaining,
      minutes: Math.ceil(remaining / 60000),
      hours: Math.ceil(remaining / 3600000),
      isExpired: remaining <= 0,
      phaseName: phase.name
    };
  };

  // ========================================================================
  // 核心流程：报名（串联条件校验 + 门票消耗）
  // ========================================================================

  proto.registerForTournament = function(tournamentId) {
    this._ensureInitialized();
    var tournament = this.getTournament(tournamentId);
    if (!tournament) return { success: false, reason: 'tournament_not_found' };

    var validation = this.validateRegistration(tournamentId);
    if (!validation.valid) {
      this._dm._emit('registrationFailed', {
        tournamentId: tournamentId,
        reason: validation.reason,
        validations: validation.validations
      });
      return { success: false, reason: validation.reason, validations: validation.validations };
    }

    var typeConfig = MountainRacer.TournamentConfig.getTournamentType(tournament.type);
    var ticketResult = this.consumeTickets(typeConfig.conditions.requiredTickets, 'tournament_register:' + tournamentId);
    if (!ticketResult.success) {
      this._dm._emit('registrationFailed', {
        tournamentId: tournamentId,
        reason: 'ticket_consumption_failed',
        ticketResult: ticketResult
      });
      return { success: false, reason: 'ticket_consumption_failed', ticketResult: ticketResult };
    }

    var data = this._getTournamentData();
    var registration = {
      tournamentId: tournamentId,
      tournamentType: tournament.type,
      registeredAt: Date.now(),
      status: 'registered',
      attemptsUsed: 0,
      bestScore: 0,
      bestTime: null,
      phaseResults: {},
      rank: null,
      rewardsClaimed: false
    };

    data.registrations[tournamentId] = registration;
    tournament.participantCount = (tournament.participantCount || 0) + 1;

    if (!data.tournamentHistory[tournamentId]) {
      data.tournamentHistory[tournamentId] = {
        id: tournamentId,
        type: tournament.type,
        name: tournament.name,
        registeredAt: Date.now(),
        completedAt: null,
        finalRank: null,
        rewardsClaimed: false
      };
    }

    data.stats.totalParticipations++;
    this._saveTournamentInstance(tournament);
    this._dm._saveData();

    this._dm._emit('tournamentRegistered', {
      tournamentId: tournamentId,
      tournament: tournament,
      registration: registration,
      ticketsRemaining: ticketResult.remaining
    });

    return {
      success: true,
      registration: registration,
      ticketsRemaining: ticketResult.remaining
    };
  };

  proto.cancelRegistration = function(tournamentId) {
    this._ensureInitialized();
    var data = this._getTournamentData();
    var registration = data.registrations[tournamentId];

    if (!registration) return { success: false, reason: 'not_registered' };

    var currentPhase = this.getCurrentPhase(tournamentId);
    if (currentPhase && currentPhase.id !== 'registration') {
      return { success: false, reason: 'tournament_already_started' };
    }

    var typeConfig = MountainRacer.TournamentConfig.getTournamentType(registration.tournamentType);
    if (typeConfig) {
      data.tickets += typeConfig.conditions.requiredTickets;
    }

    var tournament = this.getTournament(tournamentId);
    if (tournament) {
      tournament.participantCount = Math.max(0, (tournament.participantCount || 1) - 1);
      this._saveTournamentInstance(tournament);
    }

    delete data.registrations[tournamentId];
    data.stats.totalParticipations = Math.max(0, data.stats.totalParticipations - 1);
    this._dm._saveData();

    this._dm._emit('registrationCancelled', {
      tournamentId: tournamentId,
      ticketsRefunded: typeConfig ? typeConfig.conditions.requiredTickets : 0
    });

    return { success: true };
  };

  proto.getRegistration = function(tournamentId) {
    this._ensureInitialized();
    return this._getTournamentData().registrations[tournamentId] || null;
  };

  proto.getActiveRegistrations = function() {
    this._ensureInitialized();
    var data = this._getTournamentData();
    var registrations = data.registrations;
    var active = [];
    var keys = Object.keys(registrations);
    for (var i = 0; i < keys.length; i++) {
      var reg = registrations[keys[i]];
      if (reg.status !== 'eliminated' && reg.status !== 'completed') {
        active.push(reg);
      }
    }
    return active;
  };

  // ========================================================================
  // 赛事运行与阶段推进
  // ========================================================================

  proto.startTournamentRun = function(tournamentId) {
    this._ensureInitialized();
    var registration = this.getRegistration(tournamentId);
    if (!registration) return { success: false, reason: 'not_registered' };

    var tournament = this.getTournament(tournamentId);
    if (!tournament) return { success: false, reason: 'tournament_not_found' };

    var currentPhase = this.getCurrentPhase(tournamentId);
    if (!currentPhase) return { success: false, reason: 'no_active_phase' };
    if (currentPhase.id === 'registration' || currentPhase.id === 'rewards') {
      return { success: false, reason: 'invalid_phase_for_run' };
    }

    if (currentPhase.attempts > 0 && registration.attemptsUsed >= currentPhase.attempts) {
      return { success: false, reason: 'no_attempts_remaining' };
    }

    this._activeTournamentRun = {
      tournamentId: tournamentId,
      phaseId: currentPhase.id,
      startedAt: Date.now(),
      tracking: {}
    };

    var seasonDM = this._dm.getSeasonDataManager();
    seasonDM.setRunContext({
      mode: 'tournament',
      tournamentId: tournamentId,
      phaseId: currentPhase.id,
      tournamentType: tournament.type
    });

    this._dm._emit('tournamentRunStarted', {
      tournamentId: tournamentId,
      phase: currentPhase,
      attemptsUsed: registration.attemptsUsed,
      attemptsMax: currentPhase.attempts
    });

    return {
      success: true,
      phase: currentPhase,
      attemptsUsed: registration.attemptsUsed,
      attemptsMax: currentPhase.attempts
    };
  };

  proto.submitTournamentResult = function(tournamentId, runStats, starRating) {
    this._ensureInitialized();
    var data = this._getTournamentData();
    var registration = data.registrations[tournamentId];
    if (!registration) return { success: false, reason: 'not_registered' };

    if (!this._activeTournamentRun || this._activeTournamentRun.tournamentId !== tournamentId) {
      return { success: false, reason: 'no_active_run' };
    }

    var currentPhase = this.getCurrentPhase(tournamentId);
    if (!currentPhase) return { success: false, reason: 'no_active_phase' };

    registration.attemptsUsed++;
    var phaseResult = {
      phaseId: currentPhase.id,
      score: runStats.totalScore || 0,
      time: runStats.time || 0,
      stars: starRating ? starRating.stars || 0 : 0,
      isComplete: !!runStats.isComplete,
      distance: runStats.distance || 0,
      submittedAt: Date.now()
    };

    var scoringType = this._getScoringType(tournamentId);
    if (scoringType === 'best_time') {
      if (registration.bestTime === null || phaseResult.time < registration.bestTime) {
        registration.bestTime = phaseResult.time;
        registration.bestScore = phaseResult.score;
      }
    } else if (scoringType === 'best_score' || scoringType === 'cumulative_score') {
      if (phaseResult.score > registration.bestScore) {
        registration.bestScore = phaseResult.score;
        registration.bestTime = phaseResult.time;
      }
    } else if (scoringType === 'boss_rounds_cleared') {
      registration.bestScore = Math.max(registration.bestScore, phaseResult.score);
    }

    if (!registration.phaseResults[currentPhase.id]) {
      registration.phaseResults[currentPhase.id] = [];
    }
    registration.phaseResults[currentPhase.id].push(phaseResult);

    this._activeTournamentRun = null;
    var seasonDM = this._dm.getSeasonDataManager();
    seasonDM.clearRunContext();
    this._dm._saveData();

    this._dm._emit('tournamentResultSubmitted', {
      tournamentId: tournamentId,
      phase: currentPhase,
      result: phaseResult,
      bestScore: registration.bestScore,
      attemptsRemaining: currentPhase.attempts > 0 ? currentPhase.attempts - registration.attemptsUsed : -1
    });

    return {
      success: true,
      result: phaseResult,
      bestScore: registration.bestScore,
      attemptsRemaining: currentPhase.attempts > 0 ? currentPhase.attempts - registration.attemptsUsed : -1
    };
  };

  proto._getScoringType = function(tournamentId) {
    var tournament = this.getTournament(tournamentId);
    if (tournament && tournament.scoring) return tournament.scoring.type;
    return 'best_score';
  };

  // ========================================================================
  // 子系统四：成绩归档
  // ========================================================================

  proto.archiveTournamentResults = function(tournamentId) {
    this._ensureInitialized();
    var tournament = this.getTournament(tournamentId);
    if (!tournament) return { success: false, reason: 'tournament_not_found' };

    var data = this._getTournamentData();
    var registration = data.registrations[tournamentId];
    if (!registration) return { success: false, reason: 'not_registered' };

    if (registration.status === 'archived') {
      return { success: false, reason: 'already_archived' };
    }

    var rank = this._calculateFinalRank(tournamentId, registration);
    registration.rank = rank;
    registration.status = 'archived';
    registration.archivedAt = Date.now();

    var rankBucket = MountainRacer.TournamentConfig.getRankBucket(tournament.type, rank.percentile);
    var rewardTier = rankBucket ? MountainRacer.TournamentConfig.getRewardForRank(tournament.type, rankBucket.rank) : null;

    var archive = {
      tournamentId: tournamentId,
      tournamentType: tournament.type,
      tournamentName: tournament.name,
      category: tournament.category,
      registeredAt: registration.registeredAt,
      archivedAt: Date.now(),
      bestScore: registration.bestScore,
      bestTime: registration.bestTime,
      attemptsUsed: registration.attemptsUsed,
      rank: rank.rank,
      percentile: rank.percentile,
      rankBucket: rankBucket ? rankBucket.label : '参与',
      phaseResults: registration.phaseResults,
      eligibleReward: rewardTier,
      rewardsClaimed: false
    };

    if (!data.tournamentHistory[tournamentId]) {
      data.tournamentHistory[tournamentId] = {};
    }
    data.tournamentHistory[tournamentId] = archive;

    if (data.stats.bestRank === null || rank.rank < data.stats.bestRank) {
      data.stats.bestRank = rank.rank;
    }
    if (rank.rank === 1) {
      data.stats.totalWins++;
    }

    registration.status = 'completed';
    this._dm._saveData();

    this._dm._emit('tournamentResultsArchived', {
      tournamentId: tournamentId,
      archive: archive,
      rank: rank,
      rankBucket: rankBucket
    });

    return {
      success: true,
      archive: archive,
      rank: rank,
      rankBucket: rankBucket
    };
  };

  proto._calculateFinalRank = function(tournamentId, registration) {
    var tournament = this.getTournament(tournamentId);
    var totalParticipants = tournament ? (tournament.participantCount || 1) : 1;

    var simulatedRank = this._simulateRanking(registration, totalParticipants, tournament);
    var percentile = totalParticipants > 0 ? Math.ceil((simulatedRank / totalParticipants) * 100) : 100;

    return {
      rank: simulatedRank,
      totalParticipants: totalParticipants,
      percentile: Math.min(100, percentile)
    };
  };

  proto._simulateRanking = function(registration, totalParticipants, tournament) {
    if (!registration.bestScore || registration.bestScore <= 0) {
      return totalParticipants;
    }

    var score = registration.bestScore;
    var seed = (registration.registeredAt || Date.now()) % 10000;
    var performanceRatio = 0;

    if (tournament && tournament.scoring) {
      switch (tournament.scoring.type) {
        case 'best_time':
          if (registration.bestTime && registration.bestTime > 0) {
            performanceRatio = Math.max(0, Math.min(1, 1 - (registration.bestTime - 60) / 300));
          }
          break;
        case 'best_score':
        case 'cumulative_score':
          performanceRatio = Math.min(1, score / 10000);
          break;
        case 'boss_rounds_cleared':
          performanceRatio = Math.min(1, score / 5);
          break;
        default:
          performanceRatio = Math.min(1, score / 5000);
      }
    }

    var baseRank = Math.ceil(totalParticipants * (1 - performanceRatio));
    var variance = Math.floor((seed % 7) - 3);
    var finalRank = Math.max(1, Math.min(totalParticipants, baseRank + variance));

    return finalRank;
  };

  proto.getTournamentHistory = function(limit) {
    this._ensureInitialized();
    var data = this._getTournamentData();
    var history = data.tournamentHistory;
    var results = [];
    var keys = Object.keys(history);

    for (var i = 0; i < keys.length; i++) {
      var entry = history[keys[i]];
      if (entry.archivedAt) {
        results.push(entry);
      }
    }

    results.sort(function(a, b) {
      return (b.archivedAt || 0) - (a.archivedAt || 0);
    });

    if (limit && limit > 0) {
      results = results.slice(0, limit);
    }

    return results;
  };

  proto.getPlayerStats = function() {
    this._ensureInitialized();
    return this._getTournamentData().stats;
  };

  // ========================================================================
  // 子系统五：奖励发放
  // ========================================================================

  proto.claimTournamentRewards = function(tournamentId) {
    this._ensureInitialized();
    var data = this._getTournamentData();
    var historyEntry = data.tournamentHistory[tournamentId];

    if (!historyEntry) return { success: false, reason: 'no_history' };
    if (historyEntry.rewardsClaimed) return { success: false, reason: 'already_claimed' };

    var eligibleReward = historyEntry.eligibleReward;
    if (!eligibleReward) return { success: false, reason: 'no_eligible_reward' };

    var garageMgr = this._dm.getGarageManager();
    var seasonDM = this._dm.getSeasonDataManager();
    var rewardSystem = this._dm.getRewardSystem();
    var granted = {
      coins: 0,
      seasonXP: 0,
      parts: [],
      cars: [],
      title: null
    };

    if (eligibleReward.coins) {
      garageMgr.addCoins(eligibleReward.coins, 'tournament_reward:' + tournamentId);
      granted.coins = eligibleReward.coins;
      data.stats.totalCoinsEarned += eligibleReward.coins;
    }

    if (eligibleReward.seasonXP) {
      seasonDM.addSeasonXP(eligibleReward.seasonXP, 'tournament_reward:' + tournamentId);
      granted.seasonXP = eligibleReward.seasonXP;
    }

    if (eligibleReward.parts && eligibleReward.parts.length > 0) {
      for (var pi = 0; pi < eligibleReward.parts.length; pi++) {
        var partResult = rewardSystem._unlockPartByRewardId(eligibleReward.parts[pi]);
        if (partResult) granted.parts.push(partResult);
      }
    }

    if (eligibleReward.cars && eligibleReward.cars.length > 0) {
      for (var ci = 0; ci < eligibleReward.cars.length; ci++) {
        var carResult = rewardSystem._unlockCarByRewardId(eligibleReward.cars[ci]);
        if (carResult) granted.cars.push(carResult);
      }
    }

    if (eligibleReward.title) {
      granted.title = eligibleReward.title;
      var titles = this._dm.getData('tournament.earnedTitles', []);
      if (titles.indexOf(eligibleReward.title) === -1) {
        titles.push(eligibleReward.title);
        this._dm.setData('tournament.earnedTitles', titles);
      }
    }

    historyEntry.rewardsClaimed = true;
    historyEntry.claimedAt = Date.now();
    historyEntry.grantedRewards = granted;

    var registration = data.registrations[tournamentId];
    if (registration) {
      registration.rewardsClaimed = true;
    }

    this._dm._saveData();

    this._dm._emit('tournamentRewardsClaimed', {
      tournamentId: tournamentId,
      rewards: granted,
      rank: historyEntry.rank,
      rankBucket: historyEntry.rankBucket
    });

    return {
      success: true,
      rewards: granted,
      rank: historyEntry.rank,
      rankBucket: historyEntry.rankBucket
    };
  };

  proto.getClaimableRewards = function() {
    this._ensureInitialized();
    var data = this._getTournamentData();
    var history = data.tournamentHistory;
    var claimable = [];
    var keys = Object.keys(history);

    for (var i = 0; i < keys.length; i++) {
      var entry = history[keys[i]];
      if (entry.archivedAt && !entry.rewardsClaimed && entry.eligibleReward) {
        claimable.push({
          tournamentId: entry.tournamentId,
          tournamentName: entry.tournamentName,
          rank: entry.rank,
          rankBucket: entry.rankBucket,
          eligibleReward: entry.eligibleReward
        });
      }
    }

    return claimable;
  };

  // ========================================================================
  // 生命周期：赛季重置
  // ========================================================================

  proto.processTournamentEnd = function(tournamentId) {
    this._ensureInitialized();
    var data = this._getTournamentData();
    var registration = data.registrations[tournamentId];

    if (!registration) return { success: false, reason: 'not_registered' };

    if (registration.status === 'completed' || registration.status === 'archived') {
      return { success: false, reason: 'already_processed' };
    }

    var archiveResult = this.archiveTournamentResults(tournamentId);
    if (!archiveResult.success) return archiveResult;

    return {
      success: true,
      archive: archiveResult.archive,
      rank: archiveResult.rank,
      rankBucket: archiveResult.rankBucket,
      claimableReward: archiveResult.archive.eligibleReward
    };
  };

  proto.resetTournamentData = function() {
    this._ensureInitialized();
    var config = MountainRacer.TournamentConfig.getTicketConfig();
    this._dm._data.tournament = {
      tickets: config.initialTickets,
      lastTicketRegen: Date.now(),
      lastFreeTicketDay: null,
      registrations: {},
      activeTournament: null,
      tournamentHistory: {},
      scheduleState: {
        lastDailyGenerated: null,
        lastWeeklyGenerated: null,
        generatedTournaments: []
      },
      stats: {
        totalParticipations: 0,
        totalWins: 0,
        bestRank: null,
        totalCoinsEarned: 0,
        totalTicketsSpent: 0
      }
    };
    this._dm._saveData();
    this._dm._emit('tournamentDataReset', {});
    return { success: true };
  };

  // ========================================================================
  // 汇总 & 便捷
  // ========================================================================

  proto.getTournamentSummary = function() {
    this._ensureInitialized();
    this.generateScheduledTournaments();

    var available = this.getAvailableTournaments();
    var activeRegs = this.getActiveRegistrations();
    var claimable = this.getClaimableRewards();
    var ticketInfo = this.getTicketRegenInfo();
    var stats = this.getPlayerStats();

    return {
      availableTournaments: available,
      activeRegistrations: activeRegs,
      claimableRewards: claimable,
      tickets: ticketInfo,
      stats: stats,
      hasClaimable: claimable.length > 0,
      activeCount: activeRegs.length
    };
  };

  proto.getTournamentIconState = function() {
    var summary = this.getTournamentSummary();
    return {
      hasClaimable: summary.hasClaimable,
      claimableCount: summary.claimableRewards.length,
      activeCount: summary.activeCount,
      availableCount: summary.availableTournaments.length
    };
  };

  // ========================================================================
  // 内部辅助
  // ========================================================================

  proto._saveTournamentInstance = function(tournament) {
    var stored = this._dm.getData('tournament.instances', {});
    stored[tournament.id] = tournament;
    this._dm.setData('tournament.instances', stored);
  };

  proto.createAndStoreTournament = function(typeId, startAt) {
    this._ensureInitialized();
    var typeConfig = MountainRacer.TournamentConfig.getTournamentType(typeId);
    if (!typeConfig) return { success: false, reason: 'invalid_type' };

    var tournament = this._createTournamentInstance(typeConfig, startAt || Date.now());
    this._saveTournamentInstance(tournament);

    this._dm._emit('tournamentCreated', { tournament: tournament });

    return { success: true, tournament: tournament };
  };

  window.MountainRacer = MountainRacer;
})();
