export class ScoreManager {
  constructor(scene, level) {
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
  }

  setLevelLength(length) {
    this.levelLength = length;
  }

  addDistanceScore(currentX) {
    const delta = Math.max(0, currentX - this.lastDistanceX);
    this.distance += delta;
    this.score += Math.floor(delta * 0.1);
    this.lastDistanceX = currentX;
  }

  addBonusScore(points) {
    this.score += points;
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) {
      this.isGameOver = true;
    }
    return this.health <= 0;
  }

  getHealthPercent() {
    return this.health / this.maxHealth;
  }

  getProgress() {
    if (this.levelLength <= 0) return 0;
    return Math.min(1, this.distance / this.levelLength);
  }

  getElapsedTime() {
    return (Date.now() - this.startTime) / 1000;
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }

  checkLevelComplete(currentX) {
    if (this.isComplete) return false;
    if (currentX >= this.levelLength - 200) {
      this.isComplete = true;
      const elapsed = this.getElapsedTime();
      const timeBonus = Math.floor(Math.max(0, 300 - elapsed) * 10);
      const healthBonus = Math.floor(this.health * 5);
      this.score += timeBonus + healthBonus;
      this.saveHighScore();
      return true;
    }
    return false;
  }

  getScore() {
    return this.score;
  }

  getHighScore() {
    try {
      const key = `mountain_racer_highscore_${this.level}`;
      const saved = localStorage.getItem(key);
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  }

  saveHighScore() {
    try {
      const key = `mountain_racer_highscore_${this.level}`;
      const current = this.getHighScore();
      if (this.score > current) {
        localStorage.setItem(key, this.score.toString());
      }

      const unlockKey = 'mountain_racer_unlocked';
      const unlocked = this.getUnlockedLevels();
      if (this.isComplete && this.level < 3) {
        unlocked.push(this.level + 1);
        const unique = [...new Set(unlocked)];
        localStorage.setItem(unlockKey, JSON.stringify(unique));
      }
    } catch {}
  }

  getUnlockedLevels() {
    try {
      const key = 'mountain_racer_unlocked';
      const saved = localStorage.getItem(key);
      const arr = saved ? JSON.parse(saved) : [1];
      return Array.isArray(arr) ? arr : [1];
    } catch {
      return [1];
    }
  }

  destroy() {}
}
