(function(global) {
  'use strict';

  const Terrain = global.MountainRacer.Terrain;
  const CarPhysics = global.MountainRacer.CarPhysics;
  const Obstacles = global.MountainRacer.Obstacles;
  const ScoreManager = global.MountainRacer.ScoreManager;
  const InputManager = global.MountainRacer.InputManager;

  class GameScene extends Phaser.Scene {
    constructor() {
      super({ key: 'GameScene' });
    }

    init(data) {
      this.level = data.level || 1;
    }

    create() {
      const width = this.scale.width;
      const height = this.scale.height;

      this.terrain = new Terrain(this, this.level);
      this.terrain.render();

      this.scoreManager = new ScoreManager(this, this.level);
      this.scoreManager.setLevelLength(this.terrain.config.length);

      this.inputManager = new InputManager(this);
      this.inputManager.setup();

      const startX = 80;
      const startY = this.terrain.getHeight(startX) - 60;
      this.carPhysics = new CarPhysics(this);
      this.carPhysics.create(startX, startY);

      this.obstacles = new Obstacles(this, this.terrain, this.terrain.config);

      this.createHUD(width, height);
      this.createPauseButton(width);

      this.cameras.main.setBounds(0, 0, this.terrain.config.length + 200, 600);
      this.cameras.main.startFollow(this.carPhysics.car, true, 0.1, 0.1, -100, 100);

      this.isPaused = false;
      this.gameOver = false;
      this.damageCooldown = 0;
      this.rampCooldown = 0;
    }

    createHUD(width, height) {
      const topPanel = this.add.graphics();
      topPanel.fillStyle(0x000000, 0.4);
      topPanel.fillRect(0, 0, width, 56);
      topPanel.setScrollFactor(0);
      topPanel.setDepth(500);

      this.levelText = this.add.text(20, 12, '📍 ' + this.terrain.config.name, {
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#ffffff'
      }).setScrollFactor(0).setDepth(501);

      this.scoreText = this.add.text(20, 34, '🏆 分数: 0', {
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#ffd700'
      }).setScrollFactor(0).setDepth(501);

      this.speedText = this.add.text(width - 160, 12, '🚗 0 km/h', {
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#ffffff'
      }).setScrollFactor(0).setDepth(501);

      this.timeText = this.add.text(width - 160, 34, '⏱ 00:00.00', {
        fontSize: '15px',
        fontWeight: 'bold',
        color: '#00e5ff'
      }).setScrollFactor(0).setDepth(501);

      const healthX = width / 2 - 100;
      const healthText = this.add.text(healthX, 8, '❤️ 生命', {
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#ffffff'
      }).setScrollFactor(0).setDepth(501);

      const healthBg = this.add.graphics();
      healthBg.fillStyle(0x333333, 0.8);
      healthBg.fillRoundedRect(healthX, 26, 200, 18, 6);
      healthBg.setScrollFactor(0).setDepth(500);

      this.healthBar = this.add.graphics();
      this.healthBar.setScrollFactor(0).setDepth(501);

      const progBg = this.add.graphics();
      progBg.fillStyle(0x333333, 0.7);
      progBg.fillRoundedRect(20, height - 28, width - 40, 14, 7);
      progBg.setScrollFactor(0).setDepth(500);

      this.progressBar = this.add.graphics();
      this.progressBar.setScrollFactor(0).setDepth(501);

      this.progressText = this.add.text(width / 2, height - 21, '0%', {
        fontSize: '11px',
        fontWeight: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(501);

      const startMarker = this.add.text(35, height - 45, '🚩起点', {
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#4caf50'
      }).setScrollFactor(0).setDepth(501);

      const endMarker = this.add.text(width - 65, height - 45, '🏁终点', {
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#f44336'
      }).setOrigin(1, 0).setScrollFactor(0).setDepth(501);
    }

    createPauseButton(width) {
      const self = this;
      const container = this.add.container(width - 40, 88);
      container.setScrollFactor(0);
      container.setDepth(502);
      container.setSize(40, 40);

      const gfx = this.add.graphics();
      gfx.fillStyle(0x000000, 0.5);
      gfx.fillRoundedRect(-20, -20, 40, 40, 10);
      gfx.lineStyle(2, 0xffffff, 0.6);
      gfx.strokeRoundedRect(-20, -20, 40, 40, 10);

      const icon = this.add.text(0, 0, '⏸', {
        fontSize: '22px',
        color: '#ffffff'
      }).setOrigin(0.5);

      container.add([gfx, icon]);

      container.setInteractive(
        new Phaser.Geom.Rectangle(-20, -20, 40, 40),
        Phaser.Geom.Rectangle.Contains
      );

      container.on('pointerdown', function() {
        self.togglePause();
      });
    }

    togglePause() {
      this.isPaused = !this.isPaused;
      if (this.isPaused) {
        this.showPauseMenu();
      } else {
        this.hidePauseMenu();
      }
    }

    showPauseMenu() {
      const width = this.scale.width;
      const height = this.scale.height;
      const self = this;

      this.pauseOverlay = this.add.graphics();
      this.pauseOverlay.fillStyle(0x000000, 0.7);
      this.pauseOverlay.fillRect(0, 0, width, height);
      this.pauseOverlay.setScrollFactor(0);
      this.pauseOverlay.setDepth(2000);

      const panelW = 280;
      const panelH = 240;

      this.pausePanel = this.add.graphics();
      this.pausePanel.fillStyle(0xffffff, 0.98);
      this.pausePanel.fillRoundedRect(width / 2 - panelW / 2, height / 2 - panelH / 2, panelW, panelH, 16);
      this.pausePanel.lineStyle(3, 0xff6b35, 1);
      this.pausePanel.strokeRoundedRect(width / 2 - panelW / 2, height / 2 - panelH / 2, panelW, panelH, 16);
      this.pausePanel.setScrollFactor(0);
      this.pausePanel.setDepth(2001);

      this.pauseTitle = this.add.text(width / 2, height / 2 - panelH / 2 + 35, '⏸ 游戏暂停', {
        fontSize: '26px',
        fontWeight: 'bold',
        color: '#333333'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(2002);

      const createBtn = function(label, y, color, onClick) {
        const btn = self.add.container(width / 2, y);
        btn.setSize(200, 44);
        btn.setScrollFactor(0);
        btn.setDepth(2002);

        const bg = self.add.graphics();
        bg.fillStyle(color, 1);
        bg.fillRoundedRect(-100, -22, 200, 44, 10);
        bg.lineStyle(2, 0xffffff, 0.5);
        bg.strokeRoundedRect(-100, -22, 200, 44, 10);

        const text = self.add.text(0, 0, label, {
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#ffffff'
        }).setOrigin(0.5);

        btn.add([bg, text]);
        btn.setInteractive(
          new Phaser.Geom.Rectangle(-100, -22, 200, 44),
          Phaser.Geom.Rectangle.Contains
        );

        btn.on('pointerover', function() { btn.setScale(1.04); });
        btn.on('pointerout', function() { btn.setScale(1); });
        btn.on('pointerdown', function() {
          btn.setScale(0.96);
          setTimeout(function() { onClick(); }, 80);
        });

        return btn;
      };

      this.resumeBtn = createBtn('▶ 继续游戏', height / 2 - 20, 0x4caf50, function() {
        self.togglePause();
      });
      this.restartBtn = createBtn('🔄 重新开始', height / 2 + 35, 0x2196f3, function() {
        self.cleanup();
        self.scene.restart({ level: self.level });
      });
      this.menuBtn = createBtn('🏠 返回菜单', height / 2 + 90, 0x9e9e9e, function() {
        self.cleanup();
        self.scene.start('MenuScene');
      });
    }

    hidePauseMenu() {
      if (this.pauseOverlay) this.pauseOverlay.destroy();
      if (this.pausePanel) this.pausePanel.destroy();
      if (this.pauseTitle) this.pauseTitle.destroy();
      if (this.resumeBtn) this.resumeBtn.destroy();
      if (this.restartBtn) this.restartBtn.destroy();
      if (this.menuBtn) this.menuBtn.destroy();
    }

    update(time, delta) {
      if (this.isPaused || this.gameOver) return;

      const input = this.inputManager.getState();
      const result = this.carPhysics.update(delta, this.terrain, input);

      if (result === 'fell') {
        this.gameOver = true;
        this.scoreManager.isGameOver = true;
        this.scoreManager.saveHighScore();
        this.showGameOver(false, '赛车坠落山谷');
        return;
      }

      const carX = this.carPhysics.car.x;
      this.scoreManager.addDistanceScore(carX);

      const carBounds = this.carPhysics.getBounds();
      const collision = this.obstacles.checkCollisions(carBounds, this.carPhysics);

      if (collision && this.damageCooldown <= 0 && this.rampCooldown <= 0) {
        if (collision.type === 'rock') {
          this.carPhysics.applyDamage();
          this.carPhysics.slowDown(collision.slowdown);
          const dead = this.scoreManager.takeDamage(collision.damage);
          this.damageCooldown = 800;
          this.screenShake(6, 200);

          if (dead) {
            this.gameOver = true;
            this.scoreManager.saveHighScore();
            this.showGameOver(false, '赛车损毁');
            return;
          }
        } else if (collision.type === 'mud') {
          this.carPhysics.slowDown(collision.slowdown);
        } else if (collision.type === 'ramp' && collision.boost) {
          this.carPhysics.vy = Math.min(this.carPhysics.vy, -450);
          this.carPhysics.vx *= 1.15;
          this.scoreManager.addBonusScore(50);
          this.rampCooldown = 500;
          this.showFloatingText(this.carPhysics.car.x, this.carPhysics.car.y - 60, '+50 起跳!', 0xffd700);
        }
      }

      this.damageCooldown = Math.max(0, this.damageCooldown - delta);
      this.rampCooldown = Math.max(0, this.rampCooldown - delta);

      if (this.scoreManager.checkLevelComplete(carX)) {
        this.gameOver = true;
        this.showGameOver(true, '成功到达终点');
        return;
      }

      if (this.scoreManager.isGameOver) {
        this.gameOver = true;
        this.showGameOver(false, '生命值耗尽');
        return;
      }

      this.updateHUD();
    }

    updateHUD() {
      const width = this.scale.width;
      const height = this.scale.height;

      const score = this.scoreManager.getScore();
      const speed = Math.round(this.carPhysics.getSpeed() * 0.6);
      const time = this.scoreManager.getElapsedTime();
      const health = this.scoreManager.getHealthPercent();
      const progress = this.scoreManager.getProgress();

      this.scoreText.setText('🏆 分数: ' + score);
      this.speedText.setText('🚗 ' + speed + ' km/h');
      this.timeText.setText('⏱ ' + this.scoreManager.formatTime(time));

      this.healthBar.clear();
      const healthX = width / 2 - 100;
      const hW = Math.max(0, 200 * health);
      const healthColor = health > 0.5 ? 0x4caf50 : health > 0.25 ? 0xff9800 : 0xf44336;
      this.healthBar.fillStyle(healthColor, 1);
      this.healthBar.fillRoundedRect(healthX, 26, hW, 18, 6);
      if (hW > 8) {
        this.healthBar.fillStyle(0xffffff, 0.25);
        this.healthBar.fillRoundedRect(healthX + 2, 28, Math.max(0, hW - 4), 5, 3);
      }

      this.progressBar.clear();
      const pW = Math.max(0, (width - 40) * progress);
      this.progressBar.fillGradientStyle(0x4caf50, 0x8bc34a, 0x4caf50, 0x8bc34a, 1);
      this.progressBar.fillRoundedRect(20, height - 28, pW, 14, 7);
      this.progressText.setText(Math.floor(progress * 100) + '%');
    }

    screenShake(intensity, duration) {
      this.cameras.main.shake(duration, intensity / 1000);
    }

    showFloatingText(x, y, text, color) {
      const colorStr = '#' + color.toString(16).padStart(6, '0');
      const t = this.add.text(x, y, text, {
        fontSize: '18px',
        fontWeight: 'bold',
        color: colorStr,
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5).setDepth(1000);

      this.tweens.add({
        targets: t,
        y: y - 50,
        alpha: 0,
        duration: 800,
        ease: 'Power2',
        onComplete: function() { t.destroy(); }
      });
    }

    showGameOver(win, message) {
      const self = this;
      this.time.delayedCall(600, function() {
        self.scene.start('GameOverScene', {
          level: self.level,
          win: win,
          message: message,
          score: self.scoreManager.getScore(),
          time: self.scoreManager.formatTime(self.scoreManager.getElapsedTime()),
          health: Math.floor(self.scoreManager.getHealthPercent() * 100),
          highScore: self.scoreManager.getHighScore()
        });
      });
    }

    cleanup() {
      if (this.terrain) this.terrain = null;
      if (this.carPhysics) this.carPhysics.destroy();
      if (this.obstacles) this.obstacles.destroy();
      if (this.inputManager) this.inputManager.destroy();
      if (this.scoreManager) this.scoreManager.destroy();
    }
  }

  global.MountainRacer = global.MountainRacer || {};
  global.MountainRacer.GameScene = GameScene;

})(window);
