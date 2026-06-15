(function() {
  var MountainRacer = window.MountainRacer || {};

  MountainRacer.UnlockManager = function(dataManager) {
    this._dm = dataManager;
  };

  var proto = MountainRacer.UnlockManager.prototype;

  proto._levelKey = function(level) {
    return 'level_' + (level || 1);
  };

  proto.getUnlockedLevels = function() {
    var levels = this._dm.getData('unlocks.levels', [1]);
    return Array.isArray(levels) ? levels.slice() : [1];
  };

  proto.isLevelUnlocked = function(level) {
    var levels = this.getUnlockedLevels();
    return levels.indexOf(parseInt(level, 10)) !== -1;
  };

  proto.unlockLevel = function(level) {
    var lvl = parseInt(level, 10);
    var levels = this.getUnlockedLevels();
    if (levels.indexOf(lvl) === -1) {
      levels.push(lvl);
      levels.sort(function(a, b) { return a - b; });
      this._dm.setData('unlocks.levels', levels);
      this._dm._emit('levelUnlocked', { level: lvl, allLevels: levels });
      return true;
    }
    return false;
  };

  proto.getUnlockedBranches = function(level) {
    var key = this._levelKey(level);
    var data = this._dm.getData('unlocks.branches.' + key, { unlockedBranches: ['main'], bestScores: {} });
    return {
      unlockedBranches: (data.unlockedBranches && data.unlockedBranches.length > 0) ?
        data.unlockedBranches.slice() : ['main'],
      bestScores: data.bestScores ? JSON.parse(JSON.stringify(data.bestScores)) : {}
    };
  };

  proto.isBranchUnlocked = function(level, branchId) {
    var data = this.getUnlockedBranches(level);
    return data.unlockedBranches.indexOf(branchId) !== -1;
  };

  proto.unlockBranch = function(level, branchId) {
    if (!branchId) return false;
    var key = this._levelKey(level);
    var data = this.getUnlockedBranches(level);
    if (data.unlockedBranches.indexOf(branchId) === -1) {
      data.unlockedBranches.push(branchId);
      this._dm.setData('unlocks.branches.' + key, data);
      this._dm._emit('branchUnlocked', { level: level, branchId: branchId, allBranches: data.unlockedBranches });
      return true;
    }
    return false;
  };

  proto.updateBranchBestScore = function(level, branchId, score) {
    if (!branchId) return false;
    var key = this._levelKey(level);
    var data = this.getUnlockedBranches(level);
    var currentBest = data.bestScores[branchId] || 0;
    if (score > currentBest) {
      data.bestScores[branchId] = score;
      this._dm.setData('unlocks.branches.' + key, data);
      return true;
    }
    return false;
  };

  proto.updateBranchesFromRun = function(level, branchDistances, totalScore) {
    if (!branchDistances) return;
    var key = this._levelKey(level);
    var data = this.getUnlockedBranches(level);
    var changed = false;
    var branchIds = Object.keys(branchDistances);
    for (var i = 0; i < branchIds.length; i++) {
      var bid = branchIds[i];
      if (data.unlockedBranches.indexOf(bid) === -1) {
        data.unlockedBranches.push(bid);
        changed = true;
      }
      if (!data.bestScores[bid] || totalScore > data.bestScores[bid]) {
        data.bestScores[bid] = totalScore;
        changed = true;
      }
    }
    if (changed) {
      this._dm.setData('unlocks.branches.' + key, data);
    }
  };

  proto.getUnlockedAchievements = function() {
    var achievements = this._dm.getData('unlocks.achievements', []);
    return Array.isArray(achievements) ? achievements.slice() : [];
  };

  proto.isAchievementUnlocked = function(achievementId) {
    var achievements = this.getUnlockedAchievements();
    return achievements.indexOf(achievementId) !== -1;
  };

  proto.unlockAchievement = function(achievementId) {
    if (!achievementId) return false;
    var achievements = this.getUnlockedAchievements();
    if (achievements.indexOf(achievementId) === -1) {
      achievements.push(achievementId);
      this._dm.setData('unlocks.achievements', achievements);
      this._dm._emit('achievementUnlocked', { achievementId: achievementId, allAchievements: achievements });
      return true;
    }
    return false;
  };

  proto.checkAndUnlockNextLevel = function(currentLevel, isComplete) {
    if (isComplete && currentLevel && currentLevel < 10) {
      return this.unlockLevel(currentLevel + 1);
    }
    return false;
  };

  proto.getUnlockProgress = function(totalLevels) {
    totalLevels = totalLevels || 3;
    var unlocked = this.getUnlockedLevels();
    var achievements = this.getUnlockedAchievements();
    return {
      levels: {
        unlocked: unlocked.length,
        total: totalLevels,
        percent: Math.floor((unlocked.length / totalLevels) * 100)
      },
      achievements: {
        unlocked: achievements.length,
        ids: achievements
      }
    };
  };

  proto.resetUnlocks = function(keepLevel1) {
    var baseLevels = keepLevel1 ? [1] : [];
    var updates = {
      'unlocks.levels': baseLevels,
      'unlocks.branches': {},
      'unlocks.achievements': [],
      'unlocks.cars': ['default'],
      'player.selectedCar': 'default'
    };
    this._dm.batchUpdate(updates);
    this._dm._emit('unlocksReset', { keepLevel1: !!keepLevel1 });
  };

  proto.getUnlockedCars = function() {
    var cars = this._dm.getData('unlocks.cars', ['default']);
    return Array.isArray(cars) ? cars.slice() : ['default'];
  };

  proto.isCarUnlocked = function(carId) {
    var cars = this.getUnlockedCars();
    return cars.indexOf(carId) !== -1;
  };

  proto.unlockCar = function(carId) {
    if (!carId) return false;
    var cars = this.getUnlockedCars();
    if (cars.indexOf(carId) === -1) {
      cars.push(carId);
      this._dm.setData('unlocks.cars', cars);
      this._dm._emit('carUnlocked', { carId: carId, allCars: cars });
      return true;
    }
    return false;
  };

  proto.getSelectedCar = function() {
    return this._dm.getData('player.selectedCar', 'default') || 'default';
  };

  proto.setSelectedCar = function(carId) {
    if (!carId) return false;
    var oldCar = this.getSelectedCar();
    if (oldCar === carId) return false;
    if (!this.isCarUnlocked(carId)) return false;
    this._dm.setData('player.selectedCar', carId);
    this._dm._emit('selectedCarChanged', { carId: carId, previousCar: oldCar });
    return true;
  };

  window.MountainRacer = MountainRacer;
})();
