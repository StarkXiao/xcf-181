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
    this.dangerWarningActive = false;
    this.dangerWarningShown = false;
    this.mergeWarningShown = false;
    this.unlockedAchievements = [];
    this.hiddenProgress = {};
    this.activeSpeedBoost = null;
    this.triggeredEvents = {};
    this.speedBoostEndTime = 0;

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

    this.checkSpecialEvents(carX, delta);

    if (this.activeSpeedBoost && Date.now() > this.speedBoostEndTime) {
      this.activeSpeedBoost = null;
    }

    if (Math.random() < 0.02) {
      this.checkAchievements();
    }

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
    this.selectedBranchIndex = 0;
    var width = this.scale.width;
    var height = this.scale.height;
    var branches = bpInfo.visibleBranches;

    this.branchSelectOverlay = this.add.graphics();
    this.branchSelectOverlay.fillStyle(0x000000, 0.5);
    this.branchSelectOverlay.fillRect(0, 0, width, height);
    this.branchSelectOverlay.setScrollFactor(0);
    this.branchSelectOverlay.setDepth(1500);

    var panelW = Math.min(600, width - 40);
    var panelH = 420;

    this.branchSelectPanel = this.add.graphics();
    this.branchSelectPanel.fillStyle(0xffffff, 0.98);
    this.branchSelectPanel.fillRoundedRect(width / 2 - panelW / 2, height / 2 - panelH / 2, panelW, panelH, 20);
    this.branchSelectPanel.lineStyle(4, 0xff9800, 1);
    this.branchSelectPanel.strokeRoundedRect(width / 2 - panelW / 2, height / 2 - panelH / 2, panelW, panelH, 20);
    this.branchSelectPanel.setScrollFactor(0);
    this.branchSelectPanel.setDepth(1501);

    var hintText = bpInfo.point.hint || '选择你的路线';
    this.branchSelectTitle = this.add.text(width / 2, height / 2 - panelH / 2 + 35, '🔀 ' + hintText, {
      fontSize: '26px',
      fontWeight: 'bold',
      color: '#333333'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1502);

    this.branchSelectSubtitle = this.add.text(width / 2, height / 2 - panelH / 2 + 65, '使用 ← → 选择路线，按 空格 或 点击 确认', {
      fontSize: '13px',
      color: '#888888'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1502);

    var btnW = Math.min(170, (panelW - 40 - (branches.length - 1) * 15) / branches.length);
    var btnH = 200;
    var gap = 15;
    var totalW = btnW * branches.length + gap * (branches.length - 1);
    var startX = width / 2 - totalW / 2 + btnW / 2;
    var btnY = height / 2 + 10;

    this.branchButtons = [];

    for (var i = 0; i < branches.length; i++) {
      var branchId = branches[i];
      var branchCfg = this.terrain.getBranchConfig(branchId);
      var x = startX + i * (btnW + gap);

      var btn = this.createBranchButtonEnhanced(x, btnY, btnW, btnH, branchCfg, i);
      (function(id, config, index) {
        btn.setInteractive(
          new Phaser.Geom.Rectangle(-btnW / 2, -btnH / 2, btnW, btnH),
          Phaser.Geom.Rectangle.Contains
        );
        btn.on('pointerover', function() {
          self.updateBranchSelection(index);
        });
        btn.on('pointerout', function() {});
        btn.on('pointerdown', function() {
          btn.setScale(0.95);
          setTimeout(function() {
            self.selectBranch(id, config);
          }, 100);
        });
      })(branchId, branchCfg, i);

      this.branchButtons.push(btn);
    }

    this.branchPreviewCard = this.createBranchPreviewCard(width / 2, height / 2 + panelH / 2 - 55, panelW - 40, branches[0]);
    this.updateBranchSelection(0);

    this.setupBranchKeyboardControls(branches);
  };

  proto.createBranchPreviewCard = function(x, y, width, branchId) {
    var container = this.add.container(x, y);
    container.setScrollFactor(0);
    container.setDepth(1502);
    container.setSize(width, 60);

    var bg = this.add.graphics();
    bg.fillStyle(0xf8f9fa, 1);
    bg.fillRoundedRect(-width / 2, -30, width, 60, 10);
    bg.lineStyle(2, 0xdee2e6, 1);
    bg.strokeRoundedRect(-width / 2, -30, width, 60, 10);
    container.add(bg);

    this.previewCardBg = bg;

    var branchCfg = this.terrain.getBranchConfig(branchId);
    this.previewTitle = this.add.text(-width / 2 + 15, -10, '📋 路线详情', {
      fontSize: '13px',
      fontWeight: 'bold',
      color: '#495057'
    }).setOrigin(0, 0.5);
    container.add(this.previewTitle);

    this.previewDetails = this.add.text(0, 10, '', {
      fontSize: '11px',
      color: '#6c757d'
    }).setOrigin(0.5, 0.5);
    container.add(this.previewDetails);

    return container;
  };

  proto.updateBranchSelection = function(index) {
    this.selectedBranchIndex = index;
    var branches = this.branchButtons;

    for (var i = 0; i < branches.length; i++) {
      if (i === index) {
        branches[i].setScale(1.05);
        var glow = branches[i].getData('glow');
        if (glow) glow.setAlpha(1);
      } else {
        branches[i].setScale(1);
        var glow = branches[i].getData('glow');
        if (glow) glow.setAlpha(0);
      }
    }

    var branchIds = [];
    for (var b = 0; b < branches.length; b++) {
      branchIds.push(branches[b].getData('branchId'));
    }

    this.updateBranchPreview(branchIds[index]);
  };

  proto.updateBranchPreview = function(branchId) {
    var branchCfg = this.terrain.getBranchConfig(branchId);
    if (!branchCfg) return;

    var colorHex = '#' + branchCfg.color.toString(16).padStart(6, '0');
    if (this.previewCardBg) {
      this.previewCardBg.clear();
      this.previewCardBg.fillStyle(0xf8f9fa, 1);
      var width = this.branchPreviewCard.width || 520;
      this.previewCardBg.fillRoundedRect(-width / 2, -30, width, 60, 10);
      this.previewCardBg.lineStyle(2, branchCfg.color, 1);
      this.previewCardBg.strokeRoundedRect(-width / 2, -30, width, 60, 10);
    }

    if (this.previewTitle) {
      this.previewTitle.setText(this.getBranchIcon(branchCfg.type) + ' ' + branchCfg.name);
      this.previewTitle.setColor(colorHex);
    }

    if (this.previewDetails && branchCfg.pros && branchCfg.cons) {
      var prosText = branchCfg.pros.slice(0, 2).map(function(p) { return '✓' + p; }).join(' ');
      var consText = branchCfg.cons.slice(0, 1).map(function(c) { return '✗' + c; }).join(' ');
      this.previewDetails.setText(prosText + '  |  ' + consText);
    }
  };

  proto.setupBranchKeyboardControls = function(branches) {
    var self = this;

    this.branchKeyHandler = function(event) {
      if (!self.branchSelectOpen) return;

      if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
        event.preventDefault();
        var newIndex = (self.selectedBranchIndex - 1 + branches.length) % branches.length;
        self.updateBranchSelection(newIndex);
      } else if (event.code === 'ArrowRight' || event.code === 'KeyD') {
        event.preventDefault();
        var newIndexR = (self.selectedBranchIndex + 1) % branches.length;
        self.updateBranchSelection(newIndexR);
      } else if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault();
        if (branches.length > 0) {
          var selectedId = branches[self.selectedBranchIndex];
          var config = self.terrain.getBranchConfig(selectedId);
          self.selectBranch(selectedId, config);
        }
      } else if (event.code === 'Digit1' || event.code === 'Digit2' || event.code === 'Digit3' || event.code === 'Digit4') {
        event.preventDefault();
        var num = parseInt(event.code.replace('Digit', '')) - 1;
        if (num < branches.length) {
          self.updateBranchSelection(num);
          setTimeout(function() {
            var selectedId = branches[num];
            var config = self.terrain.getBranchConfig(selectedId);
            self.selectBranch(selectedId, config);
          }, 100);
        }
      }
    };

    this.input.keyboard.on('keydown', this.branchKeyHandler, this);
  };

  proto.createBranchButtonEnhanced = function(x, y, w, h, config, index) {
    var container = this.add.container(x, y);
    container.setSize(w, h);
    container.setScrollFactor(0);
    container.setDepth(1502);
    container.setData('branchId', config.id);

    var glow = this.add.graphics();
    glow.fillStyle(config.color, 0.3);
    glow.fillRoundedRect(-w / 2 - 4, -h / 2 - 4, w + 8, h + 8, 14);
    glow.setAlpha(0);
    container.add(glow);
    container.setData('glow', glow);

    var gfx = this.add.graphics();
    var color = config.color || 0x888888;

    gfx.fillStyle(0xffffff, 1);
    gfx.fillRoundedRect(-w / 2, -h / 2, w, h, 12);

    gfx.lineStyle(3, color, 1);
    gfx.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);

    var keyNumber = this.add.text(-w / 2 + 12, -h / 2 + 18, (index + 1).toString(), {
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#' + color.toString(16).padStart(6, '0'),
      backgroundColor: '#f0f0f0'
    }).setOrigin(0.5, 0.5);

    var diffColors = {
      '简单': '#4caf50',
      '中等': '#ff9800',
      '困难': '#f44336',
      '极难': '#9c27b0',
      '传说': '#ff6b35'
    };
    var diffColor = diffColors[config.difficulty] || '#666666';
    var difficultyText = this.add.text(w / 2 - 12, -h / 2 + 18, config.difficulty || '', {
      fontSize: '11px',
      fontWeight: 'bold',
      color: diffColor
    }).setOrigin(1, 0.5);

    var iconY = -h / 2 + 55;
    var riskStars = '';
    for (var i = 0; i < (config.riskLevel || 1); i++) {
      riskStars += '⚠️';
    }

    var iconText = this.add.text(0, iconY - 10, this.getBranchIcon(config.type), {
      fontSize: '36px'
    }).setOrigin(0.5);

    var nameText = this.add.text(0, iconY + 30, config.name, {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#333333'
    }).setOrigin(0.5);

    var riskText = this.add.text(0, iconY + 52, '风险: ' + riskStars, {
      fontSize: '12px',
      color: '#ff5722'
    }).setOrigin(0.5);

    var rewardText = this.add.text(0, iconY + 72, '奖励: x' + config.rewardMultiplier.toFixed(1), {
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#4caf50'
    }).setOrigin(0.5);

    var timeText = this.add.text(0, iconY + 92, '⏱ ' + (config.estimatedTime || '??秒'), {
      fontSize: '11px',
      color: '#2196f3'
    }).setOrigin(0.5);

    var descText = this.add.text(0, iconY + 112, config.description || '', {
      fontSize: '10px',
      color: '#888888',
      wordWrap: { width: w - 20 }
    }).setOrigin(0.5);

    container.add([gfx, keyNumber, difficultyText, iconText, nameText, riskText, rewardText, timeText, descText]);

    return container;
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
    this.terrain.updateActivePath();
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

    if (this.branchKeyHandler) {
      this.input.keyboard.off('keydown', this.branchKeyHandler, this);
      this.branchKeyHandler = null;
    }

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
    if (this.branchPreviewCard) {
      this.branchPreviewCard.destroy();
      this.branchPreviewCard = null;
    }
    this.previewCardBg = null;
    this.previewTitle = null;
    this.previewDetails = null;
  };

  proto.checkAutoMerge = function(carX) {
    if (this.terrain.currentBranch === 'main') return;
    if (this.branchSelectOpen) return;

    var mergeInfo = this.terrain.shouldAutoMerge(carX);
    if (!mergeInfo) return;

    var oldBranch = this.terrain.performMerge(mergeInfo.mergeX);
    this.terrain.updateActivePath();
    this.scoreManager.setCurrentBranch('main', carX);
    this.scoreManager.mergeCount++;

    this.obstacles.regenerateForBranch('main');
    this.dangerZones.setCurrentBranch('main');
    this.collectibles.regenerateForBranch('main');

    var oldBranchCfg = this.terrain.getBranchConfig(oldBranch);
    var branchName = oldBranchCfg ? oldBranchCfg.name : oldBranch;

    this.branchText.setText('🛤️ 主路');
    this.branchText.setColor('#4caf50');

    var bonus = 200;
    if (mergeInfo.config && mergeInfo.config.bonus) {
      bonus = mergeInfo.config.bonus;
    }
    this.scoreManager.addBonusScore(bonus, 'mergeBonus');
    this.showFloatingText(carX, this.carPhysics.car.y - 80,
      '🔄 ' + branchName + ' 汇合主路! +' + bonus, 0x4caf50);

    this.checkAchievements();
  };

  proto.checkSpecialEvents = function(carX, delta) {
    var branchCfg = this.terrain.getBranchConfig(this.terrain.currentBranch);
    if (!branchCfg || !branchCfg.specialEvents) return;

    var branchKey = this.terrain.currentBranch;
    if (!this.triggeredEvents[branchKey]) {
      this.triggeredEvents[branchKey] = {};
    }

    for (var i = 0; i < branchCfg.specialEvents.length; i++) {
      var evt = branchCfg.specialEvents[i];
      var evtKey = evt.type + '_' + evt.x;

      if (this.triggeredEvents[branchKey][evtKey]) continue;

      var distToEvent = carX - evt.x;
      if (distToEvent < -30) continue;
      if (distToEvent > 50) continue;

      this.triggeredEvents[branchKey][evtKey] = true;
      this.handleSpecialEvent(evt, carX);
    }
  };

  proto.handleSpecialEvent = function(evt, carX) {
    var self = this;
    switch (evt.type) {
      case 'speedBoost':
        this.activeSpeedBoost = evt;
        this.speedBoostEndTime = Date.now() + (evt.duration || 3) * 1000;
        this.carPhysics.vx *= (evt.multiplier || 1.3);
        this.showFloatingText(carX, this.carPhysics.car.y - 80,
          '🚀 ' + (evt.name || '加速带') + '!', 0x00bcd4);
        this.createSpeedBoostEffect(carX);
        break;

      case 'riskBonus':
        if (evt.condition && evt.condition.type === 'noDamage') {
          var range = evt.condition.range || 500;
          if (this.scoreManager.damageTaken <= 0 && this.damageCooldown <= 0) {
            this.scoreManager.addBonusScore(evt.points || 100, 'riskBonus');
            this.showFloatingText(carX, this.carPhysics.car.y - 80,
              '🏆 ' + (evt.name || '险道奖励') + ': +' + (evt.points || 100), 0xff9800);
          }
        }
        break;

      case 'coinRain':
        this.scoreManager.addBonusScore(evt.points || 200, 'collectibleBonus');
        this.showFloatingText(carX, this.carPhysics.car.y - 80,
          '💰 ' + (evt.name || '金币雨') + ': +' + (evt.points || 200), 0xffd700);
        break;
    }
  };

  proto.createSpeedBoostEffect = function(x) {
    var y = this.carPhysics.car.y;
    for (var i = 0; i < 10; i++) {
      var px = x + Phaser.Math.Between(-30, 30);
      var py = y + Phaser.Math.Between(-10, 10);
      var spark = this.add.circle(px, py, 2 + Math.random() * 3, 0x00e5ff);
      spark.setDepth(16);
      this.tweens.add({
        targets: spark,
        x: spark.x - 100 - Math.random() * 100,
        alpha: 0,
        scale: 0.3,
        duration: 400 + Math.random() * 200,
        ease: 'Power2',
        onComplete: (function(s) { return function() { s.destroy(); }; })(spark)
      });
    }
  };

  proto.checkHiddenUnlocks = function() {
    var branches = this.terrain.config.branches || [];
    var stats = {
      speed: this.carPhysics.getSpeed(),
      airTime: this.scoreManager.airTime,
      jumpCombo: this.scoreManager.jumpCombo,
      perfectRun: this.scoreManager.perfectRun,
      currentX: this.carPhysics.car.x,
      branch: this.terrain.currentBranch
    };

    for (var i = 0; i < branches.length; i++) {
      var branch = branches[i];
      if (!branch.hidden) continue;
      if (this.terrain.hiddenUnlocked[branch.id]) continue;

      this.updateHiddenUnlockProgress(branch, stats);

      if (this.terrain.checkHiddenUnlock(branch.unlockCondition, stats)) {
        this.terrain.unlockHiddenBranch(branch.id);
        this.dangerZones.unlockBranch(branch.id);
        this.terrain.renderBranchIndicators();
        this.showFloatingText(this.carPhysics.car.x, this.carPhysics.car.y - 100,
          '🔓 发现隐藏路线: ' + branch.name + '!', 0x9c27b0);
        this.showHiddenUnlockNotification(branch);
        this.scoreManager.hiddenBranchesFound++;
        this.checkAchievements();
      }
    }
  };

  proto.updateHiddenUnlockProgress = function(branch, stats) {
    if (!branch.unlockCondition) return;
    if (!this.hiddenProgress) this.hiddenProgress = {};

    var condition = branch.unlockCondition;
    var progress = 0;
    var showHint = false;

    switch (condition.type) {
      case 'speed':
        progress = Math.min(1, stats.speed / condition.value);
        showHint = stats.speed > condition.value * 0.6;
        break;
      case 'airtime':
        progress = Math.min(1, stats.airTime / condition.value);
        showHint = stats.airTime > condition.value * 0.5;
        break;
      case 'combo':
        progress = Math.min(1, stats.jumpCombo / condition.value);
        showHint = stats.jumpCombo >= Math.floor(condition.value * 0.5);
        break;
      case 'perfectRun':
        progress = stats.perfectRun ? 1 : 0;
        showHint = stats.currentX > 2000 && stats.perfectRun;
        break;
    }

    if (showHint && !this.hiddenProgress[branch.id]) {
      this.showHiddenHint(branch);
      this.hiddenProgress[branch.id] = true;
    }
  };

  proto.showHiddenHint = function(branch) {
    var hint = branch.unlockHint || '🔍 附近有隐藏路线...';
    var width = this.scale.width;

    if (this.hiddenHintText) {
      this.hiddenHintText.destroy();
    }

    this.hiddenHintText = this.add.text(width / 2, 150, hint, {
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#ffffff',
      stroke: '#9c27b0',
      strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(900);

    var self = this;
    this.tweens.add({
      targets: this.hiddenHintText,
      alpha: { from: 0, to: 1 },
      duration: 500,
      ease: 'Back.out',
      onComplete: function() {
        self.tweens.add({
          targets: self.hiddenHintText,
          alpha: 0,
          delay: 3000,
          duration: 500,
          onComplete: function() {
            if (self.hiddenHintText) {
              self.hiddenHintText.destroy();
              self.hiddenHintText = null;
            }
          }
        });
      }
    });
  };

  proto.checkAchievements = function() {
    var achievements = this.terrain.config.achievements || [];
    var stats = this.scoreManager.getDetailedStats();
    var uniqueBranches = Object.keys(this.scoreManager.branchDistances).length;
    var unlockedHidden = Object.keys(this.terrain.hiddenUnlocked).filter(function(k) {
      return this.terrain.hiddenUnlocked[k];
    }.bind(this)).length;

    if (!this.unlockedAchievements) this.unlockedAchievements = [];

    for (var i = 0; i < achievements.length; i++) {
      var ach = achievements[i];
      if (this.unlockedAchievements.indexOf(ach.id) !== -1) continue;

      var unlocked = false;
      var cond = ach.condition;

      switch (cond.type) {
        case 'uniqueBranches':
          unlocked = uniqueBranches >= cond.value;
          break;
        case 'branchSpeed':
          if (stats.branches && stats.branches[cond.branch] !== undefined) {
            unlocked = this.carPhysics.getSpeed() >= cond.value;
          }
          break;
        case 'unlockHidden':
          unlocked = unlockedHidden >= cond.value;
          break;
        case 'totalAirTime':
          unlocked = this.scoreManager.airTime >= cond.value;
          break;
        case 'jumpCombo':
          unlocked = this.scoreManager.jumpCombo >= cond.value;
          break;
        case 'perfectRun':
          unlocked = this.scoreManager.perfectRun === cond.value;
          break;
      }

      if (unlocked) {
        this.unlockAchievement(ach);
      }
    }
  };

  proto.unlockAchievement = function(achievement) {
    this.unlockedAchievements.push(achievement.id);
    this.showAchievementNotification(achievement);
    this.scoreManager.addBonusScore(300, 'explorationBonus');

    try {
      var key = 'mountain_racer_achievements';
      var saved = localStorage.getItem(key);
      var data = saved ? JSON.parse(saved) : [];
      if (data.indexOf(achievement.id) === -1) {
        data.push(achievement.id);
        localStorage.setItem(key, JSON.stringify(data));
      }
    } catch (e) {}
  };

  proto.showAchievementNotification = function(achievement) {
    var width = this.scale.width;
    var height = this.scale.height;

    var container = this.add.container(width / 2, height / 2 - 100);
    container.setScrollFactor(0);
    container.setDepth(2000);

    var bg = this.add.graphics();
    bg.fillStyle(0xffffff, 0.98);
    bg.fillRoundedRect(-180, -40, 360, 80, 15);
    bg.lineStyle(3, 0xffd700, 1);
    bg.strokeRoundedRect(-180, -40, 360, 80, 15);
    container.add(bg);

    var icon = this.add.text(-140, 0, '🏆', { fontSize: '32px' }).setOrigin(0.5);
    container.add(icon);

    var title = this.add.text(-90, -12, '成就解锁!', {
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#ff6b35'
    }).setOrigin(0, 0.5);
    container.add(title);

    var name = this.add.text(-90, 12, achievement.name, {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#333333'
    }).setOrigin(0, 0.5);
    container.add(name);

    var desc = this.add.text(140, 0, achievement.description, {
      fontSize: '11px',
      color: '#888888'
    }).setOrigin(1, 0.5);
    container.add(desc);

    var self = this;
    this.tweens.add({
      targets: container,
      y: height / 2 - 150,
      alpha: { from: 0, to: 1 },
      duration: 600,
      ease: 'Back.out',
      onComplete: function() {
        self.tweens.add({
          targets: container,
          alpha: 0,
          delay: 3500,
          duration: 600,
          ease: 'Back.in',
          onComplete: function() {
            container.destroy();
          }
        });
      }
    });
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
        this.tweens.add({
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

    var riskText = '';
    if (branchCfg && branchCfg.riskLevel > 1) {
      for (var r = 0; r < branchCfg.riskLevel - 1; r++) {
        riskText += '⚠️';
      }
    }
    var multiplierDisplay = '✨ 倍率: x' + multiplier.toFixed(1);
    if (riskText) {
      multiplierDisplay += ' ' + riskText;
    }
    this.multiplierText.setText(multiplierDisplay);

    var uniqueBranches = Object.keys(this.scoreManager.branchDistances).length;
    var totalBranches = this.terrain.config.branches ? this.terrain.config.branches.length : 1;
    var visibleBranches = 0;
    var branches = this.terrain.config.branches || [];
    for (var vb = 0; vb < branches.length; vb++) {
      if (!branches[vb].hidden || this.terrain.hiddenUnlocked[branches[vb].id]) {
        visibleBranches++;
      }
    }

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

    var progressInfo = Math.floor(progress * 100) + '%';
    if (visibleBranches > 1) {
      progressInfo += '  🗺️ ' + uniqueBranches + '/' + visibleBranches;
    }
    this.progressText.setText(progressInfo);

    this.checkDangerWarning(this.carPhysics.car.x);
    this.checkUpcomingMerge(this.carPhysics.car.x);
    this.updateMinimap(this.carPhysics.car.x);
  };

  proto.checkDangerWarning = function(carX) {
    var dangerZone = this.terrain.isInDangerZone(carX + 200, this.terrain.currentBranch);
    if (dangerZone && !this.dangerWarningActive) {
      this.showDangerWarning(dangerZone);
    } else if (!dangerZone && this.dangerWarningActive) {
      this.hideDangerWarning();
    }

    var branchCfg = this.terrain.getBranchConfig(this.terrain.currentBranch);
    if (branchCfg && branchCfg.dangerZones) {
      for (var i = 0; i < branchCfg.dangerZones.length; i++) {
        var zone = branchCfg.dangerZones[i];
        if (zone.warningX && carX >= zone.warningX - 50 && carX <= zone.warningX + 50 && !this.dangerWarningShown) {
          var label = this.getDangerLabel(zone.type);
          this.showFloatingText(zone.warningX, this.carPhysics.car.y - 120, '⚠️ 前方 ' + label + '!', 0xf44336);
          this.dangerWarningShown = true;
        }
      }
    }
  };

  proto.getDangerLabel = function(type) {
    var labels = {
      'rockfall': '落石区',
      'slippery': '湿滑路面',
      'cliff': '悬崖路段',
      'mud': '泥泞区'
    };
    return labels[type] || '危险区';
  };

  proto.showDangerWarning = function(zone) {
    if (this.dangerWarningActive) return;
    this.dangerWarningActive = true;

    var width = this.scale.width;
    var label = this.getDangerLabel(zone.type);

    this.dangerWarningGfx = this.add.graphics();
    this.dangerWarningGfx.setScrollFactor(0);
    this.dangerWarningGfx.setDepth(800);
    this.dangerWarningGfx.fillStyle(0xf44336, 0.9);
    this.dangerWarningGfx.fillRoundedRect(width / 2 - 100, 75, 200, 32, 8);

    this.dangerWarningText = this.add.text(width / 2, 91, '⚠️ ' + label, {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(801);
  };

  proto.hideDangerWarning = function() {
    this.dangerWarningActive = false;
    this.dangerWarningShown = false;
    if (this.dangerWarningGfx) {
      this.dangerWarningGfx.destroy();
      this.dangerWarningGfx = null;
    }
    if (this.dangerWarningText) {
      this.dangerWarningText.destroy();
      this.dangerWarningText = null;
    }
  };

  proto.checkUpcomingMerge = function(carX) {
    if (this.terrain.currentBranch === 'main') return;

    var mergeInfo = this.terrain.getUpcomingMergePoint(carX);
    if (mergeInfo && !this.mergeWarningShown) {
      var distToMerge = mergeInfo.point - carX;
      if (distToMerge > 0 && distToMerge < 300) {
        var label = mergeInfo.isFinal ? '终点汇合' : '路线汇合';
        this.showFloatingText(carX + 150, this.carPhysics.car.y - 100,
          '🔄 前方 ' + label + '!', 0x4caf50);
        this.mergeWarningShown = true;
      }
    } else if (!mergeInfo) {
      this.mergeWarningShown = false;
    }
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
    if (this.minimapPlayerDot) {
      this.minimapPlayerDot.destroy();
      this.minimapPlayerDot = null;
    }
    if (this.hiddenHintText) {
      this.hiddenHintText.destroy();
      this.hiddenHintText = null;
    }
    this.hideDangerWarning();
    this.closeBranchSelect();
  };

  window.MountainRacer = MountainRacer;
})();
