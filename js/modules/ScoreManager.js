(function() {
  var MountainRacer = window.MountainRacer || {};

  MountainRacer.ScoreManager = function(scene, level) {
    this.scene = scene;
    this.level = level;
    this.score = 0;
    this.health = 100;
    this.maxHealth = 100;
    this.startTime = Date.now();
    this.lastDistanceX = 0;
    this.distance = 0;
    this.levelLength = 0;
    this.isComplete = false;
    this.isGameOver = false;
  };

  var proto = MountainRacer.ScoreManager.prototype;

  proto.setLevelLength = function(length) {
    this.levelLength = length;
  };

  proto.addDistanceScore = function(currentX) {
    var delta = Math.max(0, currentX - this.lastDistanceX);
    this.distance += delta;
    this.score += Math.floor(delta * 0.1);
    this.lastDistanceX = currentX;
  };

  proto.addBonusScore = function(points) {
    this.score += points;
  };

  proto.takeDamage = function(amount) {
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) {
      this.isGameOver = true;
    }
    return this.health <= 0;
  };

  proto.getHealthPercent = function() {
    return this.health / this.maxHealth;
  };

  proto.getProgress = function() {
    if (this.levelLength <= 0) return 0;
    return Math.min(1, this.distance / this.levelLength);
  };

  proto.getElapsedTime = function() {
    return (Date.now() - this.startTime) / 1000;
  };

  proto.formatTime = function(seconds) {
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

  proto.checkLevelComplete = function(currentX) {
    if (this.isComplete) return false;
    if (currentX >= this.levelLength - 200) {
      this.isComplete = true;
      var elapsed = this.getElapsedTime();
      var timeBonus = Math.floor(Math.max(0, 300 - elapsed) * 10);
      var healthBonus = Math.floor(this.health * 5);
      this.score += timeBonus + healthBonus;
      this.saveHighScore();
      return true;
    }
    return false;
  };

  proto.getScore = function() {
    return this.score;
  };

  proto.getHighScore = function() {
    try {
      var key = 'mountain_racer_highscore_' + this.level;
      var saved = localStorage.getItem(key);
      return saved ? parseInt(saved, 10) : 0;
    } catch (e) {
      return 0;
    }
  };

  proto.saveHighScore = function() {
    try {
      var key = 'mountain_racer_highscore_' + this.level;
      var current = this.getHighScore();
      if (this.score > current) {
        localStorage.setItem(key, this.score.toString());
      }

      var unlockKey = 'mountain_racer_unlocked';
      var unlocked = this.getUnlockedLevels();
      if (this.isComplete && this.level < 3) {
        unlocked.push(this.level + 1);
        var unique = [];
        for (var i = 0; i < unlocked.length; i++) {
          if (unique.indexOf(unlocked[i]) === -1) {
            unique.push(unlocked[i]);
          }
        }
        localStorage.setItem(unlockKey, JSON.stringify(unique));
      }
    } catch (e) {}
  };

  proto.getUnlockedLevels = function() {
    try {
      var key = 'mountain_racer_unlocked';
      var saved = localStorage.getItem(key);
      var arr = saved ? JSON.parse(saved) : [1];
      return Array.isArray(arr) ? arr : [1];
    } catch (e) {
      return [1];
    }
  };

  proto.destroy = function() {};

  window.MountainRacer = MountainRacer;
})();
