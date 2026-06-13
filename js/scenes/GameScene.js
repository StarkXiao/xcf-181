(function() {
  var MountainRacer = window.MountainRacer || {};

  MountainRacer.GameScene = function() {
    Phaser.Scene.call(this, { key: 'GameScene' });
  };

  MountainRacer.GameScene.prototype = Object.create(Phaser.Scene.prototype);
  MountainRacer.GameScene.prototype.constructor = MountainRacer.GameScene;

  var proto = MountainRacer.GameScene.prototype;

  proto.init = function(data) {
    this.level = data.level || 1;
  };

  proto.create = function() {
    var width = this.scale.width;
    var height = this.scale.height;

    this.terrain = new MountainRacer.Terrain(this, this.level);
    this.terrain.render();

    this.scoreManager = new MountainRacer.ScoreManager(this, this.level);
    this.scoreManager.setLevelLength(this.terrain.config.length);

    this.inputManager = new MountainRacer.InputManager(this);
    this.inputManager.setup();

    var startX = 80;
    var startY = this.terrain.getHeight(startX) - 60;
    this.carPhysics = new MountainRacer.CarPhysics(this);
    this.carPhysics.create(startX, startY);

    this.obstacles = new MountainRacer.Obstacles(this, this.terrain, this.terrain.config);

    this.createHUD(width, height);
    this.createPauseButton(width);

    this.cameras.main.setBounds(0, 0, this.terrain.config.length + 200, 600);
    this.cameras.main.startFollow(this.carPhysics.car, true, 0.1, 0.1, -100, 100);

    this.isPaused = false;
    this.gameOver = false;
    this.damageCooldown = 0;
    this.rampCooldown = 0;
  };

  proto.createHUD = function(width, height) {
    var topPanel = this.add.graphics();
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

    var healthX = width / 2 - 100;
    this.add.text(healthX, 8, '❤️ 生命', {
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setScrollFactor(0).setDepth(501);

    var healthBg = this.add.graphics();
    healthBg.fillStyle(0x333333, 0.8);
    healthBg.fillRoundedRect(healthX, 26, 200, 18, 6);
    healthBg.setScrollFactor(0).setDepth(500);

    this.healthBar = this.add.graphics();
    this.healthBar.setScrollFactor(0).setDepth(501);

    var progBg = this.add.graphics();
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

    this.add.text(35, height - 45, '🚩起点', {
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#4caf50'
    }).setScrollFactor(0).setDepth(501);

    this.add.text(width - 65, height - 45, '🏁终点', {
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#f44336'
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(501);
  };

  proto.createPauseButton = function(width) {
    var container = this.add.container(width - 40, 88);
    container.setScrollFactor(0);
    container.setDepth(502);
    container.setSize(40, 40);

    var gfx = this.add.graphics();
    gfx.fillStyle(0x000000, 0.5);
    gfx.fillRoundedRect(-20, -20, 40, 40, 10);
    gfx.lineStyle(2, 0xffffff, 0.6);
    gfx.strokeRoundedRect(-20, -20, 40, 40, 10);

    var icon = this.add.text(0, 0, '⏸', {
      fontSize: '22px',
      color: '#ffffff'
    }).setOrigin(0.5);

    container.add([gfx, icon]);

    var self = this;
    container.setInteractive(
      new Phaser.Geom.Rectangle(-20, -20, 40, 40),
      Phaser.Geom.Rectangle.Contains
    );

    container.on('pointerdown', function() {
      self.togglePause();
    });
  };

  proto.togglePause = function() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.showPauseMenu();
    } else {
      this.hidePauseMenu();
    }
  };

  proto.showPauseMenu = function() {
    var width = this.scale.width;
    var height = this.scale.height;
    var self = this;

    this.pauseOverlay = this.add.graphics();
    this.pauseOverlay.fillStyle(0x000000, 0.7);
    this.pauseOverlay.fillRect(0, 0, width, height);
    this.pauseOverlay.setScrollFactor(0);
    this.pauseOverlay.setDepth(2000);

    var panelW = 280;
    var panelH = 240;

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

    var createBtn = function(label, y, color, onClick) {
      var btn = self.add.container(width / 2, y);
      btn.setSize(200, 44);
      btn.setScrollFactor(0);
      btn.setDepth(2002);

      var bg = self.add.graphics();
      bg.fillStyle(color, 1);
      bg.fillRoundedRect(-100, -22, 200, 44, 10);
      bg.lineStyle(2, 0xffffff, 0.5);
      bg.strokeRoundedRect(-100, -22, 200, 44, 10);

      var text = self.add.text(0, 0, label, {
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
  };

  proto.hidePauseMenu = function() {
    if (this.pauseOverlay) this.pauseOverlay.destroy();
    if (this.pausePanel) this.pausePanel.destroy();
    if (this.pauseTitle) this.pauseTitle.destroy();
    if (this.resumeBtn) this.resumeBtn.destroy();
    if (this.restartBtn) this.restartBtn.destroy();
    if (this.menuBtn) this.menuBtn.destroy();
  };

  proto.update = function(time, delta) {
    if (this.isPaused || this.gameOver) return;

    var input = this.inputManager.getState();
    var result = this.carPhysics.update(delta, this.terrain, input);

    if (result === 'fell') {
      this.gameOver = true;
      this.scoreManager.isGameOver = true;
      this.scoreManager.saveHighScore();
      this.showGameOver(false, '赛车坠落山谷');
      return;
    }

    var carX = this.carPhysics.car.x;
    this.scoreManager.addDistanceScore(carX);

    var carBounds = this.carPhysics.getBounds();
    var collision = this.obstacles.checkCollisions(carBounds, this.carPhysics);

    if (collision && this.damageCooldown <= 0 && this.rampCooldown <= 0) {
      if (collision.type === 'rock') {
        this.carPhysics.applyDamage();
        this.carPhysics.slowDown(collision.slowdown);
        var dead = this.scoreManager.takeDamage(collision.damage);
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
  };

  proto.updateHUD = function() {
    var score = this.scoreManager.getScore();
    var speed = Math.round(this.carPhysics.getSpeed() * 0.6);
    var time = this.scoreManager.getElapsedTime();
    var health = this.scoreManager.getHealthPercent();
    var progress = this.scoreManager.getProgress();
    var width = this.scale.width;
    var height = this.scale.height;

    this.scoreText.setText('🏆 分数: ' + score);
    this.speedText.setText('🚗 ' + speed + ' km/h');
    this.timeText.setText('⏱ ' + this.scoreManager.formatTime(time));

    this.healthBar.clear();
    var healthX = width / 2 - 100;
    var hW = Math.max(0, 200 * health);
    var healthColor = health > 0.5 ? 0x4caf50 : health > 0.25 ? 0xff9800 : 0xf44336;
    this.healthBar.fillStyle(healthColor, 1);
    this.healthBar.fillRoundedRect(healthX, 26, hW, 18, 6);
    if (hW > 8) {
      this.healthBar.fillStyle(0xffffff, 0.25);
      this.healthBar.fillRoundedRect(healthX + 2, 28, Math.max(0, hW - 4), 5, 3);
    }

    this.progressBar.clear();
    var pW = Math.max(0, (width - 40) * progress);
    this.progressBar.fillGradientStyle(0x4caf50, 0x8bc34a, 0x4caf50, 0x8bc34a, 1);
    this.progressBar.fillRoundedRect(20, height - 28, pW, 14, 7);
    this.progressText.setText(Math.floor(progress * 100) + '%');
  };

  proto.screenShake = function(intensity, duration) {
    this.cameras.main.shake(duration, intensity / 1000);
  };

  proto.showFloatingText = function(x, y, text, color) {
    var hexColor = '#' + color.toString(16).padStart(6, '0');
    var t = this.add.text(x, y, text, {
      fontSize: '18px',
      fontWeight: 'bold',
      color: hexColor,
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
  };

  proto.showGameOver = function(win, message) {
    var self = this;
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
  };

  proto.cleanup = function() {
    if (this.terrain) this.terrain = null;
    if (this.carPhysics) this.carPhysics.destroy();
    if (this.obstacles) this.obstacles.destroy();
    if (this.inputManager) this.inputManager.destroy();
    if (this.scoreManager) this.scoreManager.destroy();
  };

  window.MountainRacer = MountainRacer;
})();
