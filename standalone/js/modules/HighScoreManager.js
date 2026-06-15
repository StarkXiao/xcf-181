(function() {
  var MountainRacer = window.MountainRacer || {};

  MountainRacer.HighScoreManager = function(dataManager) {
    this._dm = dataManager;
  };

  var proto = MountainRacer.HighScoreManager.prototype;

  proto._levelKey = function(level) {
    return 'level_' + (level || 1);
  };

  proto.getHighScore = function(level) {
    var key = this._levelKey(level);
    return this._dm.getData('highScores.' + key, 0) || 0;
  };

  proto.setHighScore = function(level, score) {
    var key = this._levelKey(level);
    var current = this.getHighScore(level);
    if (score > current) {
      this._dm.setData('highScores.' + key, score);
      this._dm._emit('highScoreUpdated', { level: level, score: score, previous: current, isNewRecord: true });
      return true;
    }
    return false;
  };

  proto.isNewHighScore = function(level, score) {
    return score > this.getHighScore(level);
  };

  proto.getStarRating = function(level) {
    var key = this._levelKey(level);
    return this._dm.getData('gameRecords.starRatings.' + key, { stars: 0, totalStars: 3 });
  };

  proto.setStarRating = function(level, starData) {
    if (!starData || typeof starData.stars === 'undefined') return false;
    var key = this._levelKey(level);
    var current = this.getStarRating(level);
    if (starData.stars > (current.stars || 0)) {
      var saveData = {
        stars: starData.stars,
        totalStars: starData.totalStars || 3,
        timestamp: Date.now(),
        score: starData.score || 0,
        time: starData.time || 0,
        health: starData.health || 0,
        breakdown: starData.breakdown || {}
      };
      this._dm.setData('gameRecords.starRatings.' + key, saveData);
      this._dm._emit('starRatingUpdated', { level: level, stars: starData.stars, previous: current.stars || 0 });
      return true;
    }
    return false;
  };

  proto.getBestStats = function(level) {
    var key = this._levelKey(level);
    return this._dm.getData('gameRecords.bestStats.' + key, null);
  };

  proto.setBestStats = function(level, stats) {
    if (!stats) return false;
    var key = this._levelKey(level);
    var current = this.getBestStats(level);
    if (!current || (stats.totalScore || 0) > (current.totalScore || 0)) {
      this._dm.setData('gameRecords.bestStats.' + key, stats);
      this._dm._emit('bestStatsUpdated', { level: level, stats: stats, previous: current });
      return true;
    }
    return false;
  };

  proto.getRunHistory = function(level, limit) {
    var key = this._levelKey(level);
    var history = this._dm.getData('gameRecords.runHistory.' + key, []);
    if (limit && limit > 0) {
      return history.slice(0, limit);
    }
    return history;
  };

  proto.addRunRecord = function(level, record) {
    if (!record) return false;
    var key = this._levelKey(level);
    var history = this._dm.getData('gameRecords.runHistory.' + key, []);
    record.timestamp = record.timestamp || Date.now();
    history.unshift(record);
    if (history.length > 10) history = history.slice(0, 10);
    this._dm.setData('gameRecords.runHistory.' + key, history);
    this._dm._emit('runHistoryUpdated', { level: level, record: record, total: history.length });
    return true;
  };

  proto.clearRunHistory = function(level) {
    var key = this._levelKey(level);
    this._dm.setData('gameRecords.runHistory.' + key, []);
  };

  proto.getChapterStarSummary = function(totalLevels) {
    totalLevels = totalLevels || 3;
    var result = {
      totalStars: 0,
      maxStars: totalLevels * 3,
      levelStars: {},
      completionPercent: 0
    };
    for (var lvl = 1; lvl <= totalLevels; lvl++) {
      var saved = this.getStarRating(lvl);
      result.levelStars[lvl] = saved.stars || 0;
      result.totalStars += saved.stars || 0;
    }
    result.completionPercent = result.maxStars > 0 ?
      Math.floor((result.totalStars / result.maxStars) * 100) : 0;
    return result;
  };

  proto.getAllHighScores = function(totalLevels) {
    totalLevels = totalLevels || 3;
    var result = {};
    for (var lvl = 1; lvl <= totalLevels; lvl++) {
      result[lvl] = this.getHighScore(lvl);
    }
    return result;
  };

  proto.getScoreBreakdown = function(level) {
    var best = this.getBestStats(level);
    if (!best) return null;
    return {
      totalScore: best.totalScore || 0,
      bonusScores: best.bonusScores || {},
      weightBreakdown: best.weightBreakdown || {},
      time: best.time || 0,
      distance: best.distance || 0,
      perfectRun: !!best.perfectRun
    };
  };

  proto.resetLevelData = function(level) {
    var key = this._levelKey(level);
    var updates = {};
    updates['highScores.' + key] = 0;
    updates['gameRecords.starRatings.' + key] = { stars: 0, totalStars: 3 };
    updates['gameRecords.bestStats.' + key] = null;
    updates['gameRecords.runHistory.' + key] = [];
    this._dm.batchUpdate(updates);
  };

  window.MountainRacer = MountainRacer;
})();
