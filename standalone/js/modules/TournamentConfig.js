(function() {
  var MountainRacer = window.MountainRacer || {};

  var TOURNAMENT_TYPES = {
    daily_sprint: {
      id: 'daily_sprint',
      name: '每日冲刺赛',
      description: '每日限时冲刺，与时间赛跑！',
      icon: '⚡',
      category: 'daily',
      ticketCost: 1,
      maxParticipants: 0,
      duration: { hours: 24 },
      phases: [
        { id: 'registration', name: '报名阶段', duration: { hours: 2 } },
        { id: 'qualifying', name: '资格赛', duration: { hours: 6 }, attempts: 3 },
        { id: 'finals', name: '决赛', duration: { hours: 14 }, attempts: 1 },
        { id: 'rewards', name: '奖励结算', duration: { hours: 2 } }
      ],
      conditions: {
        minLevel: 1,
        minPower: 0,
        requiredTickets: 1,
        cooldownHours: 0,
        maxDailyEntries: 3
      },
      scoring: {
        type: 'best_time',
        tiebreak: 'earliest_submission',
        qualifyingAdvance: 10,
        rankingBuckets: [
          { rank: 1, label: '冠军', percent: 1 },
          { rank: 2, label: '亚军', percent: 5 },
          { rank: 3, label: '季军', percent: 10 },
          { rank: 4, label: '优胜', percent: 30 },
          { rank: 5, label: '参与', percent: 100 }
        ]
      },
      rewardTiers: {
        1: { coins: 2000, seasonXP: 300, parts: ['engine_racing_unlock'], title: 'daily_sprint_champion' },
        2: { coins: 1200, seasonXP: 200, parts: ['tires_sport_upgrade'], title: null },
        3: { coins: 800, seasonXP: 150, parts: [], title: null },
        4: { coins: 400, seasonXP: 80, parts: [], title: null },
        5: { coins: 100, seasonXP: 30, parts: [], title: null }
      }
    },
    weekly_championship: {
      id: 'weekly_championship',
      name: '周冠军赛',
      description: '每周巅峰对决，最强车手之争！',
      icon: '🏆',
      category: 'weekly',
      ticketCost: 3,
      maxParticipants: 100,
      duration: { days: 7 },
      phases: [
        { id: 'registration', name: '报名阶段', duration: { days: 1 } },
        { id: 'group_stage', name: '小组赛', duration: { days: 2 }, attempts: 5, groupsOf: 10 },
        { id: 'elimination', name: '淘汰赛', duration: { days: 2 }, attempts: 3, advancePerGroup: 3 },
        { id: 'grand_final', name: '总决赛', duration: { days: 1 }, attempts: 1 },
        { id: 'rewards', name: '奖励结算', duration: { days: 1 } }
      ],
      conditions: {
        minLevel: 5,
        minPower: 80,
        requiredTickets: 3,
        cooldownHours: 0,
        maxDailyEntries: 1,
        requiredAchievements: []
      },
      scoring: {
        type: 'cumulative_score',
        tiebreak: 'highest_single_run',
        qualifyingAdvance: 30,
        rankingBuckets: [
          { rank: 1, label: '总冠军', percent: 1 },
          { rank: 2, label: '亚军', percent: 3 },
          { rank: 3, label: '四强', percent: 5 },
          { rank: 4, label: '八强', percent: 10 },
          { rank: 5, label: '十六强', percent: 20 },
          { rank: 6, label: '参赛', percent: 100 }
        ]
      },
      rewardTiers: {
        1: { coins: 10000, seasonXP: 1000, parts: ['engine_racing_unlock', 'body_racing_unlock'], cars: ['car_sport'], title: 'weekly_champion' },
        2: { coins: 6000, seasonXP: 600, parts: ['engine_racing_unlock'], cars: [], title: null },
        3: { coins: 3000, seasonXP: 400, parts: ['suspension_racing_unlock'], cars: [], title: null },
        4: { coins: 1500, seasonXP: 200, parts: [], cars: [], title: null },
        5: { coins: 800, seasonXP: 100, parts: [], cars: [], title: null },
        6: { coins: 200, seasonXP: 40, parts: [], cars: [], title: null }
      }
    },
    limited_event: {
      id: 'limited_event',
      name: '限时挑战赛',
      description: '限时开启的特别赛事，奖励独特！',
      icon: '🎯',
      category: 'special',
      ticketCost: 2,
      maxParticipants: 50,
      duration: { days: 3 },
      phases: [
        { id: 'registration', name: '报名阶段', duration: { hours: 12 } },
        { id: 'challenge', name: '挑战阶段', duration: { days: 2 }, attempts: 5 },
        { id: 'rewards', name: '奖励结算', duration: { hours: 12 } }
      ],
      conditions: {
        minLevel: 3,
        minPower: 40,
        requiredTickets: 2,
        cooldownHours: 0,
        maxDailyEntries: 2,
        specialConditions: []
      },
      scoring: {
        type: 'best_score',
        tiebreak: 'fewest_attempts',
        qualifyingAdvance: 0,
        rankingBuckets: [
          { rank: 1, label: '传奇', percent: 2 },
          { rank: 2, label: '精英', percent: 10 },
          { rank: 3, label: '优秀', percent: 30 },
          { rank: 4, label: '参与', percent: 100 }
        ]
      },
      rewardTiers: {
        1: { coins: 5000, seasonXP: 500, parts: ['body_racing_unlock'], cars: [], title: 'limited_legend' },
        2: { coins: 2500, seasonXP: 250, parts: ['brakes_sport_upgrade'], cars: [], title: null },
        3: { coins: 1000, seasonXP: 120, parts: [], cars: [], title: null },
        4: { coins: 300, seasonXP: 50, parts: [], cars: [], title: null }
      }
    },
    boss_blitz: {
      id: 'boss_blitz',
      name: 'Boss 连战赛',
      description: '连续挑战Boss，看看你能走多远！',
      icon: '👹',
      category: 'special',
      ticketCost: 2,
      maxParticipants: 0,
      duration: { days: 2 },
      phases: [
        { id: 'registration', name: '报名阶段', duration: { hours: 6 } },
        { id: 'blitz', name: '连战阶段', duration: { days: 1 }, attempts: 1, rounds: 5 },
        { id: 'rewards', name: '奖励结算', duration: { hours: 6 } }
      ],
      conditions: {
        minLevel: 5,
        minPower: 120,
        requiredTickets: 2,
        cooldownHours: 48,
        maxDailyEntries: 1,
        requiredChaptersComplete: 2
      },
      scoring: {
        type: 'boss_rounds_cleared',
        tiebreak: 'fastest_clear',
        qualifyingAdvance: 0,
        rankingBuckets: [
          { rank: 1, label: '征服者', percent: 1 },
          { rank: 2, label: '挑战者', percent: 5 },
          { rank: 3, label: '勇士', percent: 15 },
          { rank: 4, label: '冒险者', percent: 40 },
          { rank: 5, label: '参与者', percent: 100 }
        ]
      },
      rewardTiers: {
        1: { coins: 8000, seasonXP: 800, parts: ['nitro_racing_unlock'], cars: [], title: 'boss_conqueror' },
        2: { coins: 4000, seasonXP: 400, parts: ['suspension_racing_upgrade'], cars: [], title: null },
        3: { coins: 2000, seasonXP: 200, parts: ['engine_sport_upgrade'], cars: [], title: null },
        4: { coins: 800, seasonXP: 80, parts: [], cars: [], title: null },
        5: { coins: 200, seasonXP: 30, parts: [], cars: [], title: null }
      }
    }
  };

  var TICKET_CONFIG = {
    initialTickets: 5,
    maxTickets: 10,
    regenerateMinutes: 180,
    dailyFreeTickets: 2,
    coinCostPerTicket: 200,
    vipBonusTickets: 1
  };

  var SCHEDULE_TEMPLATES = {
    daily: {
      generateTime: 0,
      activeHours: [0, 24],
      resetAtMidnight: true
    },
    weekly: {
      startDay: 1,
      startTime: 10,
      endDay: 7,
      endTime: 22
    },
    special: {
      announcementAdvanceHours: 24,
      gracePeriodMinutes: 30
    }
  };

  MountainRacer.TournamentConfig = {
    getTournamentType: function(typeId) {
      return TOURNAMENT_TYPES[typeId] || null;
    },

    getAllTournamentTypes: function() {
      return TOURNAMENT_TYPES;
    },

    getTournamentTypesByCategory: function(category) {
      var result = [];
      var keys = Object.keys(TOURNAMENT_TYPES);
      for (var i = 0; i < keys.length; i++) {
        if (TOURNAMENT_TYPES[keys[i]].category === category) {
          result.push(TOURNAMENT_TYPES[keys[i]]);
        }
      }
      return result;
    },

    getTicketConfig: function() {
      return TICKET_CONFIG;
    },

    getScheduleTemplate: function(category) {
      return SCHEDULE_TEMPLATES[category] || SCHEDULE_TEMPLATES.daily;
    },

    getPhaseConfig: function(typeId, phaseId) {
      var type = TOURNAMENT_TYPES[typeId];
      if (!type || !type.phases) return null;
      for (var i = 0; i < type.phases.length; i++) {
        if (type.phases[i].id === phaseId) return type.phases[i];
      }
      return null;
    },

    getRewardForRank: function(typeId, rank) {
      var type = TOURNAMENT_TYPES[typeId];
      if (!type || !type.rewardTiers) return null;
      return type.rewardTiers[rank] || null;
    },

    getRankBucket: function(typeId, percentile) {
      var type = TOURNAMENT_TYPES[typeId];
      if (!type || !type.scoring || !type.scoring.rankingBuckets) return null;
      var buckets = type.scoring.rankingBuckets;
      for (var i = 0; i < buckets.length; i++) {
        if (percentile <= buckets[i].percent) {
          return buckets[i];
        }
      }
      return buckets[buckets.length - 1] || null;
    },

    generateTournamentId: function(typeId) {
      var now = new Date();
      var dateStr = now.getFullYear() + '' +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0');
      var rand = Math.floor(Math.random() * 9000) + 1000;
      return 't_' + typeId + '_' + dateStr + '_' + rand;
    },

    calculateTournamentEnd: function(typeId, startAt) {
      var type = TOURNAMENT_TYPES[typeId];
      if (!type) return null;
      var dur = type.duration;
      var ms = startAt;
      if (dur.hours) ms += dur.hours * 3600000;
      if (dur.days) ms += dur.days * 86400000;
      return ms;
    },

    calculatePhaseEnd: function(phase, startAt) {
      var ms = startAt;
      if (phase.duration.hours) ms += phase.duration.hours * 3600000;
      if (phase.duration.days) ms += phase.duration.days * 86400000;
      if (phase.duration.minutes) ms += phase.duration.minutes * 60000;
      return ms;
    }
  };

  window.MountainRacer = MountainRacer;
})();
