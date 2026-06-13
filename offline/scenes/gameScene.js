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
    this.dangerZones = new MountainRacer.DangerZones(this, this.terrain, this.terrain.config);
    this.collectibles = new MountainRacer.Collectibles(this, this.terrain, this.terrain.config);

    this.createHUD(width, height);
    this.createPauseButton(width);
    this.createBranchMinimap(width, height);

    this.cameras.main.setBounds(0, 0, this.terrain.config.length + 200, 600);
    this.cameras.main.startFollow(this.carPhysics.car, true, 0.1, 0.1, -100, 100);

    this.isPaused = false;
    this.gameOver = false;
    this.damageCooldown = 0;
    this.rampCooldown = 0;

    this.branchSelectOpen = false;
    this.lastBranchPoint = -1;

    this.loadUnlockedBranches();
  };

  proto.loadUnlockedBranches = function() {
    var unlocked = this.scoreManager.getUnlockedBranches();
    for (var i = 0; i < unlocked.length; i++) {
      this.terrain.unlockHiddenBranch(unlocked[i]);
    }
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

    this.branchText = this.add.text(20, 34, '🛤️ 主路', {
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#4caf50'
    }).setScrollFactor(0).setDepth(501);

    this.scoreText = this.add.text(width / 2 - 60, 12, '🏆 分数: 0', {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#ffd700'
    }).setScrollFactor(0).setDepth(501);

    this.multiplierText = this.add.text(width / 2 - 60, 34, '✨ 倍率: x1.0', {
      fontSize: '13px',
      fontWeight: 'bold',
      color: '#ff9800'
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

    var healthX = width / 2 + 80;
    this.add.text(healthX, 8, '❤️ 生命', {
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setScrollFactor(0).setDepth(501);

    var healthBg = this.add.graphics();
    healthBg.fillStyle(0x333333, 0.8);
    healthBg.fillRoundedRect(healthX, 26, 120, 18, 6);
    healthBg.setScrollFactor(0);
    healthBg.setDepth(500);

    this.healthBar = this.add.graphics();
    this.healthBar.setScrollFactor(0);
    this.healthBar.setDepth(501);

    var progBg = this.add.graphics();
    progBg.fillStyle(0x333333, 0.7);
    progBg.fillRoundedRect(20, height - 28, width - 40, 14, 7);
    progBg.setScrollFactor(0);
    progBg.setDepth(500);

    this.progressBar = this.add.graphics();
    this.progressBar.setScrollFactor(0);
    this.progressBar.setDepth(501);

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

  proto.createBranchMinimap = function(width, height) {
    var minimapW = 200;
    var minimapH = 40;
    var minimapX = width / 2 - minimapW / 2;
    var minimapY = height - 75;

    this.minimapContainer = this.add.container(minimapX, minimapY);
    this.minimapContainer.setScrollFactor(0);
    this.minimapContainer.setDepth(502);
    this.minimapContainer.setSize(minimapW, minimapH);

    var bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.6);
    bg.fillRoundedRect(0, 0, minimapW, minimapH, 6);
    this.minimapContainer.add(bg);

    var config = this.terrain.config;
    var totalLength = config.length;
    var scaleX = (minimapW - 10) / totalLength;

    var branches = config.branches || [];
    var branchPointConfigs = config.branchPoints || [];

    this.minimapBranchLines = this.add.graphics();
    this.minimapBranchLines.setScrollFactor(0);
    this.minimapBranchLines.setDepth(503);

    for (var b = 0; b < branches.length; b++) {
      var branch = branches[b];
      if (branch.hidden && !this.terrain.hiddenUnlocked[branch.id]) continue;

      var color = branch.color || 0x888888;
      var yOffset = branch.id === 'main' ? 22 : (12 + branches.indexOf(branch) * 6);
      if (branch.type === 'shortcut') yOffset = 8;
      else if (branch.type === 'risky') yOffset = 14;
      else if (branch.type === 'mountain' || branch.type === 'canyon') yOffset = 28;
      else if (branch.type === 'skyroad') yOffset = 6;

      this.minimapBranchLines.lineStyle(3, color, 0.8);
      this.minimapBranchLines.beginPath();

      var segs = this.terrain.segments || [];
      var started = false;
      for (var s = 0; s < segs.length; s++) {
        var seg = segs[s];
        if (seg.branches.indexOf(branch.id) === -1) continue;
        var sx = 5 + seg.startX * scaleX;
        var ex = 5 + seg.endX * scaleX;
        if (!started) {
          this.minimapBranchLines.moveTo(sx, yOffset);
          started = true;
        }
        this.minimapBranchLines.lineTo(ex, yOffset);
      }
      this.minimapBranchLines.strokePath();
    }

    for (var bp = 0; bp < branchPointConfigs.length; bp++) {
      var bpc = branchPointConfigs[bp];
      var bpx = 5 + bpc.x * scaleX;

      if (bpc.type === 'split') {
        this.minimapBranchLines.fillStyle(0xff9800, 1);
        this.minimapBranchLines.fillCircle(bpx, 22, 4);
      } else if (bpc.type === 'merge') {
        this.minimapBranchLines.fillStyle(0x4caf50, 1);
        this.minimapBranchLines.fillCircle(bpx, 22, 4);
      }
    }

    this.minimapContainer.add(this.minimapBranchLines);

    this.minimapPlayerDot = this.add.graphics();
    this.minimapPlayerDot.setScrollFactor(0);
    this.minimapPlayerDot.setDepth(504);
    this.minimapPlayerDot.fillStyle(0xff0000, 1);
    this.minimapPlayerDot.fillCircle(0, 0, 5);
    this.minimapPlayerDot.fillStyle(0xffffff, 0.8);
    this.minimapPlayerDot.fillCircle(0, 0, 3);
  };

  proto.updateMinimap = function(carX) {
    if (!this.minimapPlayerDot) return;

    var config = this.terrain.config;
    var totalLength = config.length;
    var minimapW = 200;
    var scaleX = (minimapW - 10) / totalLength;

    var dotX = this.minimapContainer.x + 5 + carX * scaleX;
    var dotY = this.minimapContainer.y + 22;

    this.minimapPlayerDot.x = dotX;
    this.minimapPlayerDot.y = dotY;
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
    this.scoreManager.updateStats(this.carPhysics);

    this.checkBranchPoint(carX);
    this.checkHiddenUnlocks();
    this.checkAutoMerge(carX);

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
        this.scoreManager.addBonusScore(50, 'styleBonus');
        this.rampCooldown = 500;
        this.showFloatingText(this.carPhysics.car.x, this.carPhysics.car.y - 60, '+50 起跳!', 0xffd700);
      }
    }

    var dangerResult = this.dangerZones.update(carX, this.carPhysics, delta, Date.now());
    if (dangerResult.damage > 0) {
      var deadDanger = this.scoreManager.takeDamage(dangerResult.damage);
      this.damageCooldown = 500;
      this.screenShake(4, 150);
      if (dangerResult.message) {
        this.showFloatingText(carX, this.carPhysics.car.y - 80, dangerResult.message, 0xf44336);
      }
      if (deadDanger) {
        this.gameOver = true;
        this.scoreManager.saveHighScore();
        this.showGameOver(false, '生命值耗尽');
        return;
      }
    }
    if (dangerResult.slowdown < 1) {
      this.carPhysics.slowDown(dangerResult.slowdown);
    }

    var collectResult = this.collectibles.checkCollisions(carBounds, this.carPhysics);
    if (collectResult) {
      var earned = this.scoreManager.addCollectibleScore(collectResult.value, collectResult.type);
      var collectLabel = collectResult.type === 'gem' ? '+' + earned + ' 宝石!' : '+' + earned + ' 金币!';
      var collectColor = collectResult.type === 'gem' ? 0xe91e63 : 0xffd700;
      this.showFloatingText(carX, this.carPhysics.car.y - 60, collectLabel, collectColor);
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

  proto.checkBranchPoint = function(carX) {
    var bpInfo = this.terrain.isAtBranchPoint(carX, 100);

    if (bpInfo.atPoint && !this.branchSelectOpen && this.lastBranchPoint !== bpInfo.point.x) {
      this.showBranchSelect(bpInfo);
      this.lastBranchPoint = bpInfo.point.x;
    }
  };

  proto.showBranchSelect = function(bpInfo) {
    var self = this;
    this.branchSelectOpen = true;
    var width = this.scale.width;
    var height = this.scale.height;

    this.branchSelectOverlay = this.add.graphics();
    this.branchSelectOverlay.fillStyle(0x000000, 0.5);
    this.branchSelectOverlay.fillRect(0, 0, width, height);
    this.branchSelectOverlay.setScrollFactor(0);
    this.branchSelectOverlay.setDepth(1500);

    var panelW = 500;
    var panelH = 300;
    var branches = bpInfo.visibleBranches;

    this.branchSelectPanel = this.add.graphics();
    this.branchSelectPanel.fillStyle(0xffffff, 0.98);
    this.branchSelectPanel.fillRoundedRect(width / 2 - panelW / 2, height / 2 - panelH / 2, panelW, panelH, 20);
    this.branchSelectPanel.lineStyle(4, 0xff9800, 1);
    this.branchSelectPanel.strokeRoundedRect(width / 2 - panelW / 2, height / 2 - panelH / 2, panelW, panelH, 20);
    this.branchSelectPanel.setScrollFactor(0);
    this.branchSelectPanel.setDepth(1501);

    this.branchSelectTitle = this.add.text(width / 2, height / 2 - panelH / 2 + 35, '🔀 选择路线', {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#333333'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1502);

    this.branchSelectSubtitle = this.add.text(width / 2, height / 2 - panelH / 2 + 65, '不同路线有不同的风险和奖励', {
      fontSize: '14px',
      color: '#666666'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1502);

    var btnW = 140;
    var btnH = 160;
    var gap = 20;
    var totalW = btnW * branches.length + gap * (branches.length - 1);
    var startX = width / 2 - totalW / 2 + btnW / 2;
    var btnY = height / 2 + 20;

    this.branchButtons = [];

    for (var i = 0; i < branches.length; i++) {
      var branchId = branches[i];
      var branchCfg = this.terrain.getBranchConfig(branchId);
      var x = startX + i * (btnW + gap);

      var btn = this.createBranchButton(x, btnY, btnW, btnH, branchCfg);
      (function(id, config) {
        btn.setInteractive(
          new Phaser.Geom.Rectangle(-btnW / 2, -btnH / 2, btnW, btnH),
          Phaser.Geom.Rectangle.Contains
        );
        btn.on('pointerover', function() { btn.setScale(1.05); });
        btn.on('pointerout', function() { btn.setScale(1); });
        btn.on('pointerdown', function() {
          btn.setScale(0.95);
          setTimeout(function() {
            self.selectBranch(id, config);
          }, 100);
        });
      })(branchId, branchCfg);

      this.branchButtons.push(btn);
    }

    this.input.keyboard.once('keydown-SPACE', function() {
      if (self.branchSelectOpen && branches.length > 0) {
        self.selectBranch(branches[0], self.terrain.getBranchConfig(branches[0]));
      }
    });
  };

  proto.createBranchButton = function(x, y, w, h, config) {
    var container = this.add.container(x, y);
    container.setSize(w, h);
    container.setScrollFactor(0);
    container.setDepth(1502);

    var gfx = this.add.graphics();
    var color = config.color || 0x888888;

    gfx.fillStyle(0xfafafa, 1);
    gfx.fillRoundedRect(-w / 2, -h / 2, w, h, 12);

    gfx.lineStyle(3, color, 1);
    gfx.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);

    var iconY = -h / 2 + 35;
    var riskStars = '';
    for (var i = 0; i < (config.riskLevel || 1); i++) {
      riskStars += '⚠️';
    }

    var iconText = this.add.text(0, iconY - 10, this.getBranchIcon(config.type), {
      fontSize: '32px'
    }).setOrigin(0.5);

    var nameText = this.add.text(0, iconY + 25, config.name, {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#333333'
    }).setOrigin(0.5);

    var riskText = this.add.text(0, iconY + 50, '风险: ' + riskStars, {
      fontSize: '12px',
      color: '#ff5722'
    }).setOrigin(0.5);

    var rewardText = this.add.text(0, iconY + 70, '奖励: x' + config.rewardMultiplier.toFixed(1), {
      fontSize: '13px',
      fontWeight: 'bold',
      color: '#4caf50'
    }).setOrigin(0.5);

    var descText = this.add.text(0, iconY + 95, config.description || '', {
      fontSize: '11px',
      color: '#888888'
    }).setOrigin(0.5);

    container.add([gfx, iconText, nameText, riskText, rewardText, descText]);

    return container;
  };

  proto.getBranchIcon = function(type) {
    var icons = {
      'main': '🛤️',
      'risky': '🏔️',
      'shortcut': '⚡',
      'mountain': '⛰️',
      'canyon': '🏜️',
      'skyroad': '☁️'
    };
    return icons[type] || '🛤️';
  };

  proto.selectBranch = function(branchId, config) {
    if (!this.branchSelectOpen) return;

    this.terrain.switchBranch(branchId);
    this.scoreManager.setCurrentBranch(branchId, this.carPhysics.car.x);

    var colorHex = '#' + config.color.toString(16).padStart(6, '0');
    this.branchText.setText('🛤️ ' + config.name);
    this.branchText.setColor(colorHex);

    this.showFloatingText(this.carPhysics.car.x, this.carPhysics.car.y - 80,
      '进入 ' + config.name + '!', config.color);

    this.obstacles.regenerateForBranch(branchId);
    this.dangerZones.setCurrentBranch(branchId);
    this.collectibles.regenerateForBranch(branchId);

    var branchHeight = this.terrain.getHeightAtBranch(this.carPhysics.car.x, branchId);
    this.carPhysics.car.y = branchHeight - 60;
    this.carPhysics.vy = 0;

    this.closeBranchSelect();
  };

  proto.closeBranchSelect = function() {
    this.branchSelectOpen = false;

    if (this.branchSelectOverlay) {
      this.branchSelectOverlay.destroy();
      this.branchSelectOverlay = null;
    }
    if (this.branchSelectPanel) {
      this.branchSelectPanel.destroy();
      this.branchSelectPanel = null;
    }
    if (this.branchSelectTitle) {
      this.branchSelectTitle.destroy();
      this.branchSelectTitle = null;
    }
    if (this.branchSelectSubtitle) {
      this.branchSelectSubtitle.destroy();
      this.branchSelectSubtitle = null;
    }
    if (this.branchButtons) {
      for (var i = 0; i < this.branchButtons.length; i++) {
        this.branchButtons[i].destroy();
      }
      this.branchButtons = null;
    }
  };

  proto.checkAutoMerge = function(carX) {
    if (this.terrain.currentBranch === 'main') return;
    if (this.branchSelectOpen) return;

    var mergeInfo = this.terrain.shouldAutoMerge(carX);
    if (!mergeInfo) return;

    var oldBranch = this.terrain.performMerge(mergeInfo.mergeX);
    this.scoreManager.setCurrentBranch('main', carX);

    this.obstacles.regenerateForBranch('main');
    this.dangerZones.setCurrentBranch('main');
    this.collectibles.regenerateForBranch('main');

    var oldBranchCfg = this.terrain.getBranchConfig(oldBranch);
    var branchName = oldBranchCfg ? oldBranchCfg.name : oldBranch;

    this.branchText.setText('🛤️ 主路');
    this.branchText.setColor('#4caf50');

    this.scoreManager.addBonusScore(200, 'mergeBonus');
    this.showFloatingText(carX, this.carPhysics.car.y - 80,
      '🔄 ' + branchName + ' 汇合主路! +200', 0x4caf50);
  };

  proto.checkHiddenUnlocks = function() {
    var branches = this.terrain.config.branches || [];
    var stats = {
      speed: this.carPhysics.getSpeed(),
      airTime: this.scoreManager.airTime,
      jumpCombo: this.scoreManager.jumpCombo,
      perfectRun: this.scoreManager.perfectRun
    };

    for (var i = 0; i < branches.length; i++) {
      var branch = branches[i];
      if (!branch.hidden) continue;
      if (this.terrain.hiddenUnlocked[branch.id]) continue;

      if (this.terrain.checkHiddenUnlock(branch.unlockCondition, stats)) {
        this.terrain.unlockHiddenBranch(branch.id);
        this.showFloatingText(this.carPhysics.car.x, this.carPhysics.car.y - 100,
          '🔓 发现隐藏路线: ' + branch.name + '!', 0x9c27b0);
        this.showHiddenUnlockNotification(branch);
      }
    }
  };

  proto.showHiddenUnlockNotification = function(branch) {
    var width = this.scale.width;
    var height = this.scale.height;

    var notif = this.add.text(width / 2, 100, '✨ 发现隐藏路线: ' + branch.name + ' ✨', {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#ffffff',
      stroke: '#9c27b0',
      strokeThickness: 4
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1000);

    this.tweens.add({
      targets: notif,
      y: 140,
      alpha: { from: 0, to: 1 },
      duration: 500,
      ease: 'Back.out',
      onComplete: function() {
        this.scene.tweens.add({
          targets: notif,
          alpha: 0,
          delay: 2000,
          duration: 500,
          onComplete: function() {
            notif.destroy();
          }
        });
      }.bind(this)
    });
  };

  proto.updateHUD = function() {
    var score = this.scoreManager.getScore();
    var speed = Math.round(this.carPhysics.getSpeed() * 0.6);
    var time = this.scoreManager.getElapsedTime();
    var health = this.scoreManager.getHealthPercent();
    var progress = this.scoreManager.getProgress();
    var width = this.scale.width;
    var height = this.scale.height;

    var branchCfg = this.terrain.getBranchConfig(this.terrain.currentBranch);
    var multiplier = branchCfg ? branchCfg.rewardMultiplier : 1.0;

    this.scoreText.setText('🏆 分数: ' + score);
    this.speedText.setText('🚗 ' + speed + ' km/h');
    this.timeText.setText('⏱ ' + this.scoreManager.formatTime(time));
    this.multiplierText.setText('✨ 倍率: x' + multiplier.toFixed(1));

    this.healthBar.clear();
    var healthX = width / 2 + 80;
    var hW = Math.max(0, 120 * health);
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

    this.updateMinimap(this.carPhysics.car.x);
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
    var detailedStats = this.scoreManager.getDetailedStats();

    this.time.delayedCall(600, function() {
      self.scene.start('GameOverScene', {
        level: self.level,
        win: win,
        message: message,
        score: self.scoreManager.getScore(),
        time: self.scoreManager.formatTime(self.scoreManager.getElapsedTime()),
        health: Math.floor(self.scoreManager.getHealthPercent() * 100),
        highScore: self.scoreManager.getHighScore(),
        detailedStats: detailedStats,
        currentBranch: self.terrain.currentBranch
      });
    });
  };

  proto.cleanup = function() {
    if (this.terrain) {
      this.terrain.destroy();
      this.terrain = null;
    }
    if (this.carPhysics) {
      this.carPhysics.destroy();
      this.carPhysics = null;
    }
    if (this.obstacles) {
      this.obstacles.destroy();
      this.obstacles = null;
    }
    if (this.dangerZones) {
      this.dangerZones.destroy();
      this.dangerZones = null;
    }
    if (this.collectibles) {
      this.collectibles.destroy();
      this.collectibles = null;
    }
    if (this.inputManager) {
      this.inputManager.destroy();
      this.inputManager = null;
    }
    if (this.scoreManager) {
      this.scoreManager.destroy();
      this.scoreManager = null;
    }
    if (this.minimapContainer) {
      this.minimapContainer.destroy();
      this.minimapContainer = null;
    }
    this.closeBranchSelect();
  };

  window.MountainRacer = MountainRacer;
})();
