(function() {
  var MountainRacer = window.MountainRacer || {};

  MountainRacer.PlayerProfileManager = function(dataManager) {
    this._dm = dataManager;
    this._initProfileData();
  };

  var proto = MountainRacer.PlayerProfileManager.prototype;

  proto._initProfileData = function() {
    var existing = this._dm.getData('playerProfile', null);
    if (!existing) {
      var defaultProfile = {
        playerInfo: {
          name: '车手',
          avatar: '🏎️',
          title: '新手车手',
          level: 1,
          totalXP: 0,
          createdAt: Date.now(),
          lastPlayed: Date.now()
        },
        careerStats: {
          totalRaces: 0,
          totalWins: 0,
          totalDistance: 0,
          totalPlayTime: 0,
          totalCoinsEarned: 0,
          totalScore: 0,
          perfectRuns: 0,
          currentWinStreak: 0,
          bestWinStreak: 0
        },
        speedRecords: {
          maxSpeed: 0,
          bestTimes: {},
          fastestLevel: null,
          fastestTime: Infinity
        },
        collisionStats: {
          totalCollisions: 0,
          collisionTypeBreakdown: {
            rock: 0,
            barrel: 0,
            crate: 0,
            sign: 0,
            dangerZone: 0,
            rollover: 0
          },
          damageTaken: 0,
          collisionsPerRace: 0,
          leastCollisionsInRace: Infinity,
          collisionFreeRaces: 0
        },
        performance: {
          avgScorePerRace: 0,
          avgHealthRemaining: 0,
          avgComboPerRace: 0,
          maxCombo: 0,
          avgBranchesExplored: 0,
          bestGrade: null,
          gradeDistribution: {
            S: 0,
            A: 0,
            B: 0,
            C: 0
          }
        },
        achievements: {
          unlocked: [],
          progress: {}
        },
        recentActivity: [],
        preferences: {
          showTutorials: true,
          autoStartNext: false,
          confirmRestart: true,
          preferredBranch: 'balanced',
          hudStyle: 'default',
          showReplay: true,
          difficulty: 'normal'
        },
        dimensionStats: {
          speed: { total: 0, count: 0, avg: 0, best: 0 },
          exploration: { total: 0, count: 0, avg: 0, best: 0 },
          skill: { total: 0, count: 0, avg: 0, best: 0 },
          risk: { total: 0, count: 0, avg: 0, best: 0 },
          survival: { total: 0, count: 0, avg: 0, best: 0 },
          collection: { total: 0, count: 0, avg: 0, best: 0 }
        }
      };
      this._dm.setData('playerProfile', defaultProfile);
    }
  };

  proto._getProfile = function() {
    return this._dm.getData('playerProfile', null);
  };

  proto._saveProfile = function(profile) {
    this._dm.setData('playerProfile', profile);
  };

  proto.getPlayerInfo = function() {
    var profile = this._getProfile();
    return profile ? profile.playerInfo : null;
  };

  proto.updatePlayerInfo = function(info) {
    var profile = this._getProfile();
    if (!profile) return false;
    profile.playerInfo = { ...profile.playerInfo, ...info };
    profile.playerInfo.lastPlayed = Date.now();
    this._saveProfile(profile);
    return true;
  };

  proto.getCareerStats = function() {
    var profile = this._getProfile();
    return profile ? profile.careerStats : null;
  };

  proto.recordRaceComplete = function(data) {
    var profile = this._getProfile();
    if (!profile) return false;

    var cs = profile.careerStats;
    var stats = data.stats || {};
    var won = data.won || false;
    var raceTime = data.raceTime || 0;

    cs.totalRaces++;
    cs.totalDistance += stats.distance || 0;
    cs.totalPlayTime += raceTime;
    cs.totalScore += stats.totalScore || 0;
    cs.totalCoinsEarned += data.coinsEarned || 0;

    if (won) {
      cs.totalWins++;
      cs.currentWinStreak++;
      if (cs.currentWinStreak > cs.bestWinStreak) {
        cs.bestWinStreak = cs.currentWinStreak;
      }
      if (stats.perfectRun) {
        cs.perfectRuns++;
      }
    } else {
      cs.currentWinStreak = 0;
    }

    if (stats.maxSpeed && stats.maxSpeed > profile.speedRecords.maxSpeed) {
      profile.speedRecords.maxSpeed = stats.maxSpeed;
    }

    var levelKey = 'level_' + (data.level || 1);
    var time = stats.time || 0;
    if (won && time > 0) {
      var currentBest = profile.speedRecords.bestTimes[levelKey] || Infinity;
      if (time < currentBest) {
        profile.speedRecords.bestTimes[levelKey] = time;
        if (time < profile.speedRecords.fastestTime) {
          profile.speedRecords.fastestTime = time;
          profile.speedRecords.fastestLevel = levelKey;
        }
      }
    }

    var collisions = data.collisions || 0;
    profile.collisionStats.totalCollisions += collisions;
    profile.collisionStats.damageTaken += stats.damageTaken || 0;
    profile.collisionStats.collisionsPerRace =
      Math.round((profile.collisionStats.totalCollisions / cs.totalRaces) * 10) / 10;

    if (collisions < profile.collisionStats.leastCollisionsInRace) {
      profile.collisionStats.leastCollisionsInRace = collisions;
    }
    if (collisions === 0 && won) {
      profile.collisionStats.collisionFreeRaces++;
    }

    var collisionBreakdown = data.collisionBreakdown || {};
    for (var type in collisionBreakdown) {
      if (profile.collisionStats.collisionTypeBreakdown.hasOwnProperty(type)) {
        profile.collisionStats.collisionTypeBreakdown[type] += collisionBreakdown[type] || 0;
      }
    }

    var perf = profile.performance;
    perf.avgScorePerRace = Math.round(cs.totalScore / cs.totalRaces);
    perf.avgHealthRemaining = Math.round(((perf.avgHealthRemaining * (cs.totalRaces - 1) + (stats.health || 0)) / cs.totalRaces) * 10) / 10;
    var maxCombo = (stats.comboInfo && stats.comboInfo.maxCombo) || 0;
    if (maxCombo > perf.maxCombo) {
      perf.maxCombo = maxCombo;
    }
    perf.avgComboPerRace = Math.round(((perf.avgComboPerRace * (cs.totalRaces - 1) + maxCombo) / cs.totalRaces) * 10) / 10;
    var branchesExplored = Object.keys(stats.branches || {}).length;
    perf.avgBranchesExplored = Math.round(((perf.avgBranchesExplored * (cs.totalRaces - 1) + branchesExplored) / cs.totalRaces) * 10) / 10;

    var grade = data.grade;
    if (grade) {
      perf.gradeDistribution[grade] = (perf.gradeDistribution[grade] || 0) + 1;
      var gradeOrder = { S: 4, A: 3, B: 2, C: 1 };
      if (!perf.bestGrade || gradeOrder[grade] > gradeOrder[perf.bestGrade]) {
        perf.bestGrade = grade;
      }
    }

    this._updateDimensionStats(profile, stats);

    profile.recentActivity.unshift({
      timestamp: Date.now(),
      level: data.level || 1,
      won: won,
      score: stats.totalScore || 0,
      time: time,
      grade: grade
    });
    if (profile.recentActivity.length > 20) {
      profile.recentActivity = profile.recentActivity.slice(0, 20);
    }

    profile.playerInfo.lastPlayed = Date.now();
    profile.playerInfo.totalXP += data.xpEarned || 10;
    profile.playerInfo.level = Math.floor(profile.playerInfo.totalXP / 500) + 1;
    this._updatePlayerTitle(profile);

    this._saveProfile(profile);
    return true;
  };

  proto._updateDimensionStats = function(profile, stats) {
    var dims = profile.dimensionStats;
    var breakdown = stats.bonusScores || {};
    var totalScore = Math.max(1, stats.totalScore || 1);

    var speedPct = (breakdown.distance || 0) / totalScore;
    var explorationPct = ((breakdown.branchBonus || 0) + (breakdown.explorationBonus || 0)) / totalScore;
    var skillPct = ((breakdown.comboBonus || 0) + (breakdown.styleBonus || 0)) / totalScore;
    var riskPct = (breakdown.riskBonus || 0) / totalScore;
    var survivalPct = (breakdown.healthBonus || 0) / totalScore;
    var collectionPct = (breakdown.collectibleBonus || 0) / totalScore;

    var speedScore = Math.min(100, Math.round((stats.maxSpeed || 0) / 2));
    var explorationScore = Math.min(100, Object.keys(stats.branches || {}).length * 25);
    var skillScore = Math.min(100, ((stats.comboInfo && stats.comboInfo.maxCombo) || 0) * 10);
    var riskScore = Math.min(100, ((stats.weightBreakdown || {}).avgRiskLevel || 1) * 30);
    var survivalScore = Math.round((stats.health || 0));
    var collectionScore = Math.min(100, Math.round((stats.collectibleValue || 0) / 5));

    var scores = {
      speed: speedScore,
      exploration: explorationScore,
      skill: skillScore,
      risk: riskScore,
      survival: survivalScore,
      collection: collectionScore
    };

    for (var dim in scores) {
      if (dims.hasOwnProperty(dim) && scores.hasOwnProperty(dim)) {
        var s = scores[dim];
        dims[dim].total += s;
        dims[dim].count++;
        dims[dim].avg = Math.round(dims[dim].total / dims[dim].count);
        if (s > dims[dim].best) {
          dims[dim].best = s;
        }
      }
    }
  };

  proto._updatePlayerTitle = function(profile) {
    var cs = profile.careerStats;
    var level = profile.playerInfo.level;
    var perf = profile.performance;

    var titles = [
      { minLevel: 1, title: '新手车手' },
      { minLevel: 5, title: '进阶车手' },
      { minLevel: 10, title: '熟练车手' },
      { minLevel: 20, title: '精英车手' },
      { minLevel: 35, title: '传奇车手' },
      { minLevel: 50, title: '车神' }
    ];

    for (var i = titles.length - 1; i >= 0; i--) {
      if (level >= titles[i].minLevel) {
        profile.playerInfo.title = titles[i].title;
        break;
      }
    }

    if (perf.bestGrade === 'S' && cs.totalWins >= 10) {
      profile.playerInfo.title = 'S级传奇';
    }
    if (cs.perfectRuns >= 5) {
      profile.playerInfo.title = '完美之王';
    }
    if (cs.bestWinStreak >= 10) {
      profile.playerInfo.title = '连胜达人';
    }
    if (profile.collisionStats.collisionFreeRaces >= 3) {
      profile.playerInfo.title = '防撞专家';
    }
  };

  proto.getSpeedRecords = function() {
    var profile = this._getProfile();
    return profile ? profile.speedRecords : null;
  };

  proto.getCollisionStats = function() {
    var profile = this._getProfile();
    return profile ? profile.collisionStats : null;
  };

  proto.getPerformanceStats = function() {
    var profile = this._getProfile();
    return profile ? profile.performance : null;
  };

  proto.getDimensionStats = function() {
    var profile = this._getProfile();
    return profile ? profile.dimensionStats : null;
  };

  proto.getRecentActivity = function(limit) {
    var profile = this._getProfile();
    if (!profile) return [];
    var activity = profile.recentActivity || [];
    if (limit && limit > 0) {
      return activity.slice(0, limit);
    }
    return activity;
  };

  proto.getPreferences = function() {
    var profile = this._getProfile();
    return profile ? profile.preferences : null;
  };

  proto.updatePreferences = function(prefs) {
    var profile = this._getProfile();
    if (!profile) return false;
    profile.preferences = { ...profile.preferences, ...prefs };
    this._saveProfile(profile);
    this._dm._emit('preferencesUpdated', profile.preferences);
    return true;
  };

  proto.getFullProfile = function() {
    return this._getProfile();
  };

  proto.getWinRate = function() {
    var cs = this.getCareerStats();
    if (!cs || cs.totalRaces === 0) return 0;
    return Math.round((cs.totalWins / cs.totalRaces) * 100);
  };

  proto.getLevelBestTime = function(level) {
    var records = this.getSpeedRecords();
    if (!records) return null;
    return records.bestTimes['level_' + level] || null;
  };

  proto.formatTime = function(seconds) {
    if (!seconds || seconds === Infinity) return '--:--.--';
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

  proto.resetProfile = function() {
    this._dm.setData('playerProfile', null);
    this._initProfileData();
    this._dm._emit('profileReset', {});
    return true;
  };

  proto.getProfileSummary = function() {
    var info = this.getPlayerInfo();
    var career = this.getCareerStats();
    if (!info || !career) return null;

    return {
      name: info.name,
      avatar: info.avatar,
      title: info.title,
      level: info.level,
      xp: info.totalXP,
      xpToNext: (info.level * 500) - info.totalXP,
      totalRaces: career.totalRaces,
      totalWins: career.totalWins,
      winRate: this.getWinRate(),
      bestGrade: this.getPerformanceStats().bestGrade,
      maxSpeed: this.getSpeedRecords().maxSpeed
    };
  };

  window.MountainRacer = MountainRacer;
})();
