(function() {
  var MountainRacer = window.MountainRacer || {};

  var CACHE_TTL = 60000;

  MountainRacer.MultiplayerLeaderboard = function(multiplayerManager, dataManager) {
    this._mp = multiplayerManager;
    this._dm = dataManager;
    this._cache = {};
    this._listeners = {};
    this._myBestTimes = {};
    this._loadLocalBestTimes();
  };

  var proto = MountainRacer.MultiplayerLeaderboard.prototype;

  proto._loadLocalBestTimes = function() {
    try {
      var saved = localStorage.getItem('mp_leaderboard_my_best');
      if (saved) {
        this._myBestTimes = JSON.parse(saved);
      }
    } catch (e) {
      this._myBestTimes = {};
    }
  };

  proto._saveLocalBestTimes = function() {
    try {
      localStorage.setItem('mp_leaderboard_my_best', JSON.stringify(this._myBestTimes));
    } catch (e) {
    }
  };

  proto.getLeaderboard = function(track, limit) {
    var self = this;
    limit = limit || 20;

    var cacheKey = 'track_' + (track || 'all') + '_' + limit;
    var cached = this._cache[cacheKey];

    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      this._emit('leaderboardLoaded', { track: track, entries: cached.entries });
      return cached.entries;
    }

    if (this._mp && this._mp.isConnected()) {
      this._mp.getLeaderboard(track, limit);
    }

    return null;
  };

  proto.getMyBestTime = function(track) {
    return this._myBestTimes[track] || null;
  };

  proto.setMyBestTime = function(track, time) {
    var current = this._myBestTimes[track];
    if (!current || time < current) {
      this._myBestTimes[track] = time;
      this._saveLocalBestTimes();
      this._emit('myBestUpdated', { track: track, time: time, previous: current });
      return true;
    }
    return false;
  };

  proto.getMyRank = function(track) {
    var myTime = this.getMyBestTime(track);
    if (!myTime) return null;

    var cacheKey = 'track_' + (track || 'all') + '_20';
    var cached = this._cache[cacheKey];
    if (!cached || !cached.entries) return null;

    var rank = 1;
    for (var i = 0; i < cached.entries.length; i++) {
      if (cached.entries[i].time < myTime) {
        rank++;
      }
    }
    return rank;
  };

  proto.getStats = function() {
    var totalRaces = 0;
    var totalWins = 0;
    var bestRank = null;

    try {
      var saved = localStorage.getItem('mp_race_stats');
      if (saved) {
        var stats = JSON.parse(saved);
        totalRaces = stats.totalRaces || 0;
        totalWins = stats.totalWins || 0;
        bestRank = stats.bestRank || null;
      }
    } catch (e) {
    }

    return {
      totalRaces: totalRaces,
      totalWins: totalWins,
      winRate: totalRaces > 0 ? Math.floor((totalWins / totalRaces) * 100) : 0,
      bestRank: bestRank
    };
  };

  proto.recordRaceResult = function(track, rank, time) {
    var stats = this.getStats();
    stats.totalRaces++;
    if (rank === 1) {
      stats.totalWins++;
    }
    if (!stats.bestRank || rank < stats.bestRank) {
      stats.bestRank = rank;
    }

    try {
      localStorage.setItem('mp_race_stats', JSON.stringify(stats));
    } catch (e) {
    }

    this.setMyBestTime(track, time);

    this._emit('statsUpdated', stats);
    return stats;
  };

  proto.formatTime = function(ms) {
    if (!ms && ms !== 0) return '--:--.---';
    var totalSec = ms / 1000;
    var minutes = Math.floor(totalSec / 60);
    var seconds = Math.floor(totalSec % 60);
    var milliseconds = Math.floor(ms % 1000);
    return minutes.toString().padStart(2, '0') + ':' +
           seconds.toString().padStart(2, '0') + '.' +
           milliseconds.toString().padStart(3, '0');
  };

  proto._handleLeaderboardData = function(data) {
    var cacheKey = 'track_' + (data.track || 'all') + '_20';
    this._cache[cacheKey] = {
      entries: data.entries,
      timestamp: Date.now()
    };
    this._emit('leaderboardLoaded', data);
  };

  proto.on = function(event, callback) {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(callback);
  };

  proto.off = function(event, callback) {
    if (!this._listeners[event]) return;
    var index = this._listeners[event].indexOf(callback);
    if (index > -1) {
      this._listeners[event].splice(index, 1);
    }
  };

  proto._emit = function(event, data) {
    if (!this._listeners[event]) return;
    var listeners = this._listeners[event].slice();
    for (var i = 0; i < listeners.length; i++) {
      try {
        listeners[i](data);
      } catch (e) {
        console.error('[Leaderboard] Event listener error:', e);
      }
    }
  };

  proto.clearCache = function() {
    this._cache = {};
  };

  window.MountainRacer = MountainRacer;
})();
