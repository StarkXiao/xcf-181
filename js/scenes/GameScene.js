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
    this.dataManager = MountainRacer.DataManager.getInstance();
    this.dataManager.init();
    this.unlockMgr = this.dataManager.getUnlockManager();
  };

  proto.create = function() {
    var width = this.scale.width;
    var height = this.scale.height;

    this.terrain = new MountainRacer.Terrain(this, this.level);
    this.terrain.render();

    this.scoreManager = new MountainRacer.ScoreManager(this, this.level);
    this.scoreManager.setLevelLength(this.terrain.config.length);
    this.scoreManager.loadPreviousBest();

    this.inputManager = new MountainRacer.InputManager(this);
    this.inputManager.setup();

    var startX = 80;
    var startY = this.terrain.getHeight(startX) - 60;
    var selectedCar = this.unlockMgr.getSelectedCar();
    this.carPhysics = new MountainRacer.CarPhysics(this, selectedCar);
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
    this.rolloverDamageApplied = false;
    this.rolloverCorrectionTextShown = false;
    this.rolloverWarningShown = false;
    this.rolloverCooldownHintShown = false;

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
    this.lastObstacleCheckX = 0;
    this.comboTextCooldown = 0;

    this.lastBreakthroughShown = null;

    this.autoLoadSceneLayout();

    this.loadUnlockedBranches();
  };

  proto.autoLoadSceneLayout = function() {
    var sceneType = this.terrain.config.sceneType;
    if (!sceneType) return;

    var lm = this.inputManager.layoutManager;
    if (!lm || !lm.hasScenePreset || !lm.hasScenePreset(sceneType)) return;

    var loaded = lm.loadScenePreset(sceneType);
    if (loaded) {
      this.inputManager.rebuildTouchControls();
    }
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

    this.comboText = this.add.text(width / 2 - 60, 50, '', {
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#ff9800'
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

    var panelW = 320;
    var panelH = 340;

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

    var createBtn = function(label, y, color, onClick, width, icon) {
      var btnWidth = width || 240;
      var btn = self.add.container(width / 2, y);
      btn.setSize(btnWidth, 44);
      btn.setScrollFactor(0);
      btn.setDepth(2002);

      var bg = self.add.graphics();
      bg.fillStyle(color, 1);
      bg.fillRoundedRect(-btnWidth / 2, -22, btnWidth, 44, 10);
      bg.lineStyle(2, 0xffffff, 0.5);
      bg.strokeRoundedRect(-btnWidth / 2, -22, btnWidth, 44, 10);

      var displayLabel = icon ? icon + ' ' + label : label;
      var text = self.add.text(0, 0, displayLabel, {
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5);

      btn.add([bg, text]);
      btn.setInteractive(
        new Phaser.Geom.Rectangle(-btnWidth / 2, -22, btnWidth, 44),
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

    var btnY = height / 2 - 60;
    var gap = 50;

    this.resumeBtn = createBtn('继续游戏', btnY, 0x4caf50, function() {
      self.togglePause();
    }, 240, '▶');

    this.settingsBtn = createBtn('游戏设置', btnY + gap, 0x9c27b0, function() {
      self.showSettingsPanel();
    }, 240, '⚙️');

    this.restartBtn = createBtn('重新开始', btnY + gap * 2, 0x2196f3, function() {
      self.cleanup();
      self.scene.restart({ level: self.level });
    }, 240, '🔄');

    this.layoutBtn = createBtn('按键布局', btnY + gap * 3, 0x2196f3, function() {
      self.showButtonLayoutEditor();
    }, 240, '🎮');

    this.menuBtn = createBtn('返回菜单', btnY + gap * 4, 0x9e9e9e, function() {
      self.cleanup();
      self.scene.start('MenuScene');
    }, 240, '🏠');
  };

  proto.showSettingsPanel = function() {
    var width = this.scale.width;
    var height = this.scale.height;
    var self = this;

    if (this.pauseOverlay) this.pauseOverlay.setDepth(2500);

    var gameSettings = this.scoreManager.getGameSettings();
    var midSettings = this.scoreManager.getMidGameSettings();
    this.tempSettings = { ...gameSettings };
    this.tempMidSettings = { ...midSettings };

    var panelW = 360;
    var panelH = 540;

    this.settingsPanel = this.add.graphics();
    this.settingsPanel.fillStyle(0xffffff, 0.98);
    this.settingsPanel.fillRoundedRect(width / 2 - panelW / 2, height / 2 - panelH / 2, panelW, panelH, 20);
    this.settingsPanel.lineStyle(4, 0x9c27b0, 1);
    this.settingsPanel.strokeRoundedRect(width / 2 - panelW / 2, height / 2 - panelH / 2, panelW, panelH, 20);
    this.settingsPanel.setScrollFactor(0);
    this.settingsPanel.setDepth(2501);

    this.settingsTitle = this.add.text(width / 2, height / 2 - panelH / 2 + 30, '⚙️ 赛中设置', {
      fontSize: '22px',
      fontWeight: 'bold',
      color: '#333333'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2502);

    var allSettingItems = [
      { id: 'soundEnabled', label: '音效', icon: '🔊', type: 'toggle', category: 'general' },
      { id: 'musicEnabled', label: '音乐', icon: '🎵', type: 'toggle', category: 'general' },
      { id: 'showHints', label: '游戏提示', icon: '💡', type: 'toggle', category: 'general' },
      { id: 'particleEffects', label: '粒子效果', icon: '✨', type: 'toggle', category: 'general' },
      { id: 'sfxEnabled', label: '赛中音效', icon: '🔔', type: 'toggle', category: 'midgame' },
      { id: 'cameraShake', label: '镜头震动', icon: '📳', type: 'toggle', category: 'midgame' },
      { id: 'showFPS', label: '显示帧率', icon: '📊', type: 'toggle', category: 'midgame' }
    ];

    this.settingsSectionLabels = [];

    var generalLabel = this.add.text(width / 2 - panelW / 2 + 20, height / 2 - panelH / 2 + 60, '🎮 通用设置', {
      fontSize: '13px',
      fontWeight: 'bold',
      color: '#9c27b0'
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(2503);
    this.settingsSectionLabels.push(generalLabel);

    var startY = height / 2 - panelH / 2 + 82;
    var itemGap = 38;
    this.settingToggles = {};
    this.settingsItemBgs = [];

    var generalCount = 0;
    for (var gi = 0; gi < allSettingItems.length; gi++) {
      if (allSettingItems[gi].category === 'general') generalCount++;
    }

    for (var i = 0; i < allSettingItems.length; i++) {
      var item = allSettingItems[i];

      if (item.category === 'midgame' && i === generalCount) {
        startY += 8;
        var midLabel = this.add.text(width / 2 - panelW / 2 + 20, startY, '🏎️ 赛中设置', {
          fontSize: '13px',
          fontWeight: 'bold',
          color: '#ff6b35'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(2503);
        this.settingsSectionLabels.push(midLabel);
        startY += 22;
      }

      var y = startY + (item.category === 'midgame' ? (i - generalCount) * itemGap : i * itemGap);
      if (item.category === 'midgame') {
        y = startY + (i - generalCount) * itemGap;
      }

      var bg = this.add.graphics();
      bg.fillStyle(0xf5f5f5, 1);
      bg.fillRoundedRect(width / 2 - panelW / 2 + 20, y - 16, panelW - 40, 34, 8);
      bg.setScrollFactor(0);
      bg.setDepth(2502);
      this.settingsItemBgs.push(bg);

      var iconText = this.add.text(width / 2 - panelW / 2 + 35, y, item.icon, {
        fontSize: '18px'
      }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(2503);

      var labelText = this.add.text(width / 2 - panelW / 2 + 65, y, item.label, {
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#333333'
      }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(2503);

      var initialValue;
      if (item.category === 'midgame') {
        initialValue = this.tempMidSettings[item.id];
      } else {
        initialValue = this.tempSettings[item.id];
      }

      var toggleContainer = this.createToggle(
        width / 2 + panelW / 2 - 50,
        y,
        initialValue,
        (function(itemId, category) {
          return function(value) {
            if (category === 'midgame') {
              self.tempMidSettings[itemId] = value;
              self.scoreManager.applyMidGameSettings(self.tempMidSettings);
              self.applyMidGameSettings(self.tempMidSettings);
            } else {
              self.tempSettings[itemId] = value;
            }
          };
        })(item.id, item.category)
      );
      toggleContainer.setDepth(2503);
      this.settingToggles[item.id] = toggleContainer;
    }

    var lastSettingY = startY + (allSettingItems.length - generalCount) * itemGap + 15;

    this.add.text(width / 2 - panelW / 2 + 20, lastSettingY, '🎮 控制方式', {
      fontSize: '13px',
      fontWeight: 'bold',
      color: '#2196f3'
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(2503);

    var controlModes = [
      { id: 'touch', label: '触屏', icon: '👆' },
      { id: 'keyboard', label: '键盘', icon: '⌨️' },
      { id: 'auto', label: '自动', icon: '🤖' }
    ];

    var controlY = lastSettingY + 30;
    this.controlButtons = [];
    for (var c = 0; c < controlModes.length; c++) {
      var mode = controlModes[c];
      var cx = width / 2 - 100 + c * 100;
      var isSelected = this.tempSettings.controlMode === mode.id;

      var ctrlBtn = this.createControlButton(cx, controlY, mode, isSelected,
        (function(modeId) {
          return function() {
            self.tempSettings.controlMode = modeId;
            self.updateControlButtons();
          };
        })(mode.id)
      );
      ctrlBtn.setDepth(2503);
      this.controlButtons.push({ btn: ctrlBtn, id: mode.id });
    }

    var difficultyY = controlY + 35;
    this.add.text(width / 2 - panelW / 2 + 20, difficultyY, '⚡ 难度调节', {
      fontSize: '13px',
      fontWeight: 'bold',
      color: '#ff6b35'
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(2503);

    var difficulties = [
      { id: 'easy', label: '简单', icon: '🟢', color: 0x4caf50 },
      { id: 'normal', label: '普通', icon: '🟡', color: 0xff9800 },
      { id: 'hard', label: '困难', icon: '🔴', color: 0xf44336 }
    ];

    var diffY = difficultyY + 30;
    this.difficultyButtons = [];
    for (var d = 0; d < difficulties.length; d++) {
      var diff = difficulties[d];
      var dx = width / 2 - 100 + d * 100;
      var isDiffSelected = this.tempMidSettings.difficulty === diff.id;

      var diffBtn = this.createDifficultyButton(dx, diffY, diff, isDiffSelected,
        (function(diffId) {
          return function() {
            self.tempMidSettings.difficulty = diffId;
            self.scoreManager.applyMidGameSettings({ difficulty: diffId });
            self.updateDifficultyButtons();
          };
        })(diff.id)
      );
      diffBtn.setDepth(2503);
      this.difficultyButtons.push({ btn: diffBtn, id: diff.id });
    }

    var btnY = height / 2 + panelH / 2 - 40;
    var btnW = 140;
    var btnGap = 20;

    var cancelBtn = this.createSettingsButton(
      width / 2 - btnW / 2 - btnGap / 2,
      btnY,
      btnW,
      '取消',
      0x9e9e9e,
      function() {
        self.hideSettingsPanel();
      }
    );
    cancelBtn.setDepth(2503);

    var saveBtn = this.createSettingsButton(
      width / 2 + btnW / 2 + btnGap / 2,
      btnY,
      btnW,
      '保存',
      0x4caf50,
      function() {
        self.saveGameSettings();
        self.scoreManager.applyMidGameSettings(self.tempMidSettings);
        self.applyMidGameSettings(self.tempMidSettings);
        self.hideSettingsPanel();
      }
    );
    saveBtn.setDepth(2503);
  };

  proto.createToggle = function(x, y, initialValue, onChange) {
    var container = this.add.container(x, y);
    container.setScrollFactor(0);
    container.setSize(60, 30);

    var bg = this.add.graphics();
    container.bg = bg;
    container.value = initialValue;
    container.onChange = onChange;

    var updateVisual = function() {
      bg.clear();
      if (container.value) {
        bg.fillStyle(0x4caf50, 1);
        bg.fillRoundedRect(-30, -15, 60, 30, 15);
        bg.fillStyle(0xffffff, 1);
        bg.fillCircle(10, 0, 11);
      } else {
        bg.fillStyle(0xcccccc, 1);
        bg.fillRoundedRect(-30, -15, 60, 30, 15);
        bg.fillStyle(0xffffff, 1);
        bg.fillCircle(-10, 0, 11);
      }
    };

    updateVisual();
    container.add(bg);

    container.setInteractive(
      new Phaser.Geom.Rectangle(-30, -15, 60, 30),
      Phaser.Geom.Rectangle.Contains
    );

    var self = this;
    container.on('pointerdown', function() {
      container.value = !container.value;
      updateVisual();
      if (container.onChange) {
        container.onChange(container.value);
      }
    });

    return container;
  };

  proto.createControlButton = function(x, y, mode, isSelected, onClick) {
    var container = this.add.container(x, y);
    container.setScrollFactor(0);
    container.setSize(80, 40);
    container.modeId = mode.id;

    var bg = this.add.graphics();
    container.bg = bg;

    var updateVisual = function(selected) {
      bg.clear();
      if (selected) {
        bg.fillStyle(0x9c27b0, 1);
        bg.fillRoundedRect(-40, -20, 80, 40, 8);
        bg.lineStyle(2, 0xffffff, 0.5);
        bg.strokeRoundedRect(-40, -20, 80, 40, 8);
      } else {
        bg.fillStyle(0xf0f0f0, 1);
        bg.fillRoundedRect(-40, -20, 80, 40, 8);
        bg.lineStyle(2, 0xcccccc, 1);
        bg.strokeRoundedRect(-40, -20, 80, 40, 8);
      }
    };

    updateVisual(isSelected);
    container.add(bg);

    var icon = this.add.text(0, -5, mode.icon, {
      fontSize: '16px'
    }).setOrigin(0.5);
    container.add(icon);

    var label = this.add.text(0, 10, mode.label, {
      fontSize: '11px',
      fontWeight: 'bold',
      color: isSelected ? '#ffffff' : '#666666'
    }).setOrigin(0.5);
    container.label = label;
    container.add(label);

    container.setInteractive(
      new Phaser.Geom.Rectangle(-40, -20, 80, 40),
      Phaser.Geom.Rectangle.Contains
    );

    container.on('pointerdown', function() {
      onClick();
    });

    container.updateSelection = function(selected) {
      updateVisual(selected);
      label.setColor(selected ? '#ffffff' : '#666666');
    };

    return container;
  };

  proto.updateControlButtons = function() {
    if (!this.controlButtons) return;
    for (var i = 0; i < this.controlButtons.length; i++) {
      var item = this.controlButtons[i];
      var isSelected = this.tempSettings.controlMode === item.id;
      item.btn.updateSelection(isSelected);
    }
  };

  proto.createDifficultyButton = function(x, y, diff, isSelected, onClick) {
    var container = this.add.container(x, y);
    container.setScrollFactor(0);
    container.setSize(80, 36);
    container.diffId = diff.id;

    var bg = this.add.graphics();
    container.bg = bg;

    var updateVisual = function(selected) {
      bg.clear();
      if (selected) {
        bg.fillStyle(diff.color, 1);
        bg.fillRoundedRect(-40, -18, 80, 36, 8);
        bg.lineStyle(2, 0xffffff, 0.5);
        bg.strokeRoundedRect(-40, -18, 80, 36, 8);
      } else {
        bg.fillStyle(0xf0f0f0, 1);
        bg.fillRoundedRect(-40, -18, 80, 36, 8);
        bg.lineStyle(2, 0xcccccc, 1);
        bg.strokeRoundedRect(-40, -18, 80, 36, 8);
      }
    };

    updateVisual(isSelected);
    container.add(bg);

    var icon = this.add.text(0, -5, diff.icon, {
      fontSize: '14px'
    }).setOrigin(0.5);
    container.add(icon);

    var label = this.add.text(0, 8, diff.label, {
      fontSize: '11px',
      fontWeight: 'bold',
      color: isSelected ? '#ffffff' : '#666666'
    }).setOrigin(0.5);
    container.label = label;
    container.add(label);

    container.setInteractive(
      new Phaser.Geom.Rectangle(-40, -18, 80, 36),
      Phaser.Geom.Rectangle.Contains
    );

    container.on('pointerdown', function() {
      onClick();
    });

    container.updateSelection = function(selected) {
      updateVisual(selected);
      label.setColor(selected ? '#ffffff' : '#666666');
    };

    return container;
  };

  proto.updateDifficultyButtons = function() {
    if (!this.difficultyButtons) return;
    for (var i = 0; i < this.difficultyButtons.length; i++) {
      var item = this.difficultyButtons[i];
      var isSelected = this.tempMidSettings.difficulty === item.id;
      item.btn.updateSelection(isSelected);
    }
  };

  proto.applyMidGameSettings = function(settings) {
    if (settings.cameraShake === false) {
      this.cameras.main.shake(0, 0);
    }
    if (settings.showFPS && !this.fpsText) {
      this.fpsText = this.add.text(10, this.scale.height - 15, '', {
        fontSize: '12px',
        color: '#00ff00',
        fontFamily: 'monospace'
      }).setScrollFactor(0).setDepth(600);
    } else if (!settings.showFPS && this.fpsText) {
      this.fpsText.destroy();
      this.fpsText = null;
    }
  };

  proto.createSettingsButton = function(x, y, width, label, color, onClick) {
    var container = this.add.container(x, y);
    container.setScrollFactor(0);
    container.setSize(width, 44);

    var bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-width / 2, -22, width, 44, 10);
    bg.lineStyle(2, 0xffffff, 0.5);
    bg.strokeRoundedRect(-width / 2, -22, width, 44, 10);
    container.add(bg);

    var text = this.add.text(0, 0, label, {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    container.add(text);

    container.setInteractive(
      new Phaser.Geom.Rectangle(-width / 2, -22, width, 44),
      Phaser.Geom.Rectangle.Contains
    );

    container.on('pointerover', function() { container.setScale(1.04); });
    container.on('pointerout', function() { container.setScale(1); });
    container.on('pointerdown', function() {
      container.setScale(0.96);
      setTimeout(onClick, 80);
    });

    return container;
  };

  proto.saveGameSettings = function() {
    if (this.scoreManager && this.tempSettings) {
      this.scoreManager.saveGameSettings(this.tempSettings);
      this.applySettings(this.tempSettings);
    }
  };

  proto.applySettings = function(settings) {
    if (settings.particleEffects === false) {
      this.tweens.killAll();
    }
  };

  proto.showButtonLayoutEditor = function() {
    var width = this.scale.width;
    var height = this.scale.height;
    var self = this;

    this.layoutEditorOpen = true;
    this.layoutEditorElements = [];
    this.selectedButtonAction = null;

    if (this.pauseOverlay) this.pauseOverlay.setDepth(2500);
    if (this.pausePanel) this.pausePanel.setDepth(2500);

    var panelW = 380;
    var panelH = 620;
    var panelX = width / 2 - panelW / 2;
    var panelY = height / 2 - panelH / 2;

    var editorBg = this.add.graphics();
    editorBg.fillStyle(0x1a1a2e, 0.98);
    editorBg.fillRoundedRect(panelX, panelY, panelW, panelH, 20);
    editorBg.lineStyle(3, 0x2196f3, 1);
    editorBg.strokeRoundedRect(panelX, panelY, panelW, panelH, 20);
    editorBg.setScrollFactor(0);
    editorBg.setDepth(3000);
    this.layoutEditorElements.push(editorBg);

    var title = this.add.text(width / 2, panelY + 28, '🎮 按键布局编辑', {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(3001);
    this.layoutEditorElements.push(title);

    var closeBtn = this.createLayoutCloseButton(panelX + panelW - 30, panelY + 28, function() {
      self.hideButtonLayoutEditor();
    });
    closeBtn.setDepth(3001);
    this.layoutEditorElements.push(closeBtn);

    var lm = this.inputManager.layoutManager;
    if (!lm) return;
    var layout = lm.getLayout();
    var activePreset = lm.getActivePresetName();

    var curY = panelY + 55;

    var editHint = this.add.text(width / 2, curY, '开启编辑模式，拖拽按钮调整位置', {
      fontSize: '12px',
      color: '#aaaaaa'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(3001);
    this.layoutEditorElements.push(editHint);
    curY += 22;

    var editBtn = this.createLayoutToggleButton(width / 2, curY, '✏️ 编辑模式', this.inputManager.editMode, function(value) {
      self.inputManager.setEditMode(value);
    });
    editBtn.setDepth(3001);
    this.layoutEditorElements.push(editBtn);
    this.layoutEditToggle = editBtn;
    curY += 40;

    var globalLabel = this.add.text(panelX + 20, curY, '🌐 全局设置', {
      fontSize: '13px',
      fontWeight: 'bold',
      color: '#4fc3f7'
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(3001);
    this.layoutEditorElements.push(globalLabel);
    curY += 20;

    var scaleLabel = this.add.text(panelX + 20, curY, '📏 缩放', {
      fontSize: '12px',
      color: '#cccccc'
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(3001);
    this.layoutEditorElements.push(scaleLabel);

    var firstAction = lm.getAllButtonActions()[0];
    var currentScale = layout[firstAction] ? layout[firstAction].scale : 1.0;
    var scaleValueText = this.add.text(panelX + panelW - 20, curY, currentScale.toFixed(1) + 'x', {
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(3001);
    this.layoutEditorElements.push(scaleValueText);
    curY += 16;

    var scaleSlider = this.createSlider(
      panelX + 20, curY, panelW - 40, currentScale, 0.5, 2.0,
      function(value) {
        scaleValueText.setText(value.toFixed(1) + 'x');
        self.inputManager.applyAllButtonScale(value);
        if (self.perBtnScaleSlider && self.selectedButtonAction) {
          var cfg = lm.getButtonConfig(self.selectedButtonAction);
          if (cfg) {
            self.perBtnScaleSlider.updateValue(cfg.scale);
            self.perBtnScaleValue.setText(cfg.scale.toFixed(1) + 'x');
          }
        }
      }
    );
    scaleSlider.setDepth(3001);
    this.layoutEditorElements.push(scaleSlider);
    curY += 26;

    var opacityLabel = this.add.text(panelX + 20, curY, '👁️ 透明度', {
      fontSize: '12px',
      color: '#cccccc'
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(3001);
    this.layoutEditorElements.push(opacityLabel);

    var currentOpacity = layout[firstAction] ? layout[firstAction].opacity : 0.5;
    var opacityValueText = this.add.text(panelX + panelW - 20, curY, Math.round(currentOpacity * 100) + '%', {
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(3001);
    this.layoutEditorElements.push(opacityValueText);
    curY += 16;

    var opacitySlider = this.createSlider(
      panelX + 20, curY, panelW - 40, currentOpacity, 0.1, 1.0,
      function(value) {
        opacityValueText.setText(Math.round(value * 100) + '%');
        self.inputManager.applyAllButtonOpacity(value);
        if (self.perBtnOpacitySlider && self.selectedButtonAction) {
          var cfg2 = lm.getButtonConfig(self.selectedButtonAction);
          if (cfg2) {
            self.perBtnOpacitySlider.updateValue(cfg2.opacity);
            self.perBtnOpacityValue.setText(Math.round(cfg2.opacity * 100) + '%');
          }
        }
      }
    );
    opacitySlider.setDepth(3001);
    this.layoutEditorElements.push(opacitySlider);
    curY += 32;

    var perBtnLabel = this.add.text(panelX + 20, curY, '🎯 单个按键设置', {
      fontSize: '13px',
      fontWeight: 'bold',
      color: '#ff9800'
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(3001);
    this.layoutEditorElements.push(perBtnLabel);
    curY += 20;

    var btnSelectLabel = this.add.text(panelX + 20, curY, '选择按键:', {
      fontSize: '12px',
      color: '#cccccc'
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(3001);
    this.layoutEditorElements.push(btnSelectLabel);
    curY += 22;

    var allActions = lm.getAllButtonActions();
    this.perBtnSelectButtons = [];
    var perBtnSelStartX = panelX + 20;
    var perBtnSelWidth = (panelW - 40 - (allActions.length - 1) * 6) / allActions.length;

    var perBtnScaleSlider = null;
    var perBtnScaleValue = null;
    var perBtnOpacitySlider = null;
    var perBtnOpacityValue = null;

    for (var ai = 0; ai < allActions.length; ai++) {
      (function(actionIdx) {
        var action = allActions[actionIdx];
        var meta = lm.getButtonMeta(action);
        var bx = perBtnSelStartX + actionIdx * (perBtnSelWidth + 6) + perBtnSelWidth / 2;
        var isSel = self.selectedButtonAction === action;

        var selBtn = self.createPerBtnSelectButton(bx, curY, perBtnSelWidth, meta, action, isSel, function(act) {
          self.selectedButtonAction = act;
          for (var k = 0; k < self.perBtnSelectButtons.length; k++) {
            self.perBtnSelectButtons[k].updateSelected(self.perBtnSelectButtons[k].action === act);
          }
          var btnCfg = lm.getButtonConfig(act);
          if (btnCfg && perBtnScaleSlider && perBtnScaleValue && perBtnOpacitySlider && perBtnOpacityValue) {
            perBtnScaleSlider.updateValue(btnCfg.scale);
            perBtnScaleValue.setText(btnCfg.scale.toFixed(1) + 'x');
            perBtnOpacitySlider.updateValue(btnCfg.opacity);
            perBtnOpacityValue.setText(Math.round(btnCfg.opacity * 100) + '%');
          }
        });
        selBtn.setDepth(3001);
        self.layoutEditorElements.push(selBtn);
        self.perBtnSelectButtons.push(selBtn);
      })(ai);
    }

    if (allActions.length > 0) {
      this.selectedButtonAction = allActions[0];
    }
    curY += 30;

    var selCfg = this.selectedButtonAction ? lm.getButtonConfig(this.selectedButtonAction) : null;

    var pScaleLabel = this.add.text(panelX + 20, curY, '📏 按键缩放', {
      fontSize: '12px',
      color: '#cccccc'
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(3001);
    this.layoutEditorElements.push(pScaleLabel);

    perBtnScaleValue = this.add.text(panelX + panelW - 20, curY, (selCfg ? selCfg.scale : 1.0).toFixed(1) + 'x', {
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(3001);
    this.layoutEditorElements.push(perBtnScaleValue);
    this.perBtnScaleValue = perBtnScaleValue;
    curY += 16;

    perBtnScaleSlider = this.createSlider(
      panelX + 20, curY, panelW - 40, selCfg ? selCfg.scale : 1.0, 0.5, 2.0,
      function(value) {
        perBtnScaleValue.setText(value.toFixed(1) + 'x');
        if (self.selectedButtonAction) {
          self.inputManager.applyButtonScale(self.selectedButtonAction, value);
        }
      }
    );
    perBtnScaleSlider.setDepth(3001);
    this.layoutEditorElements.push(perBtnScaleSlider);
    this.perBtnScaleSlider = perBtnScaleSlider;
    curY += 26;

    var pOpLabel = this.add.text(panelX + 20, curY, '👁️ 按键透明度', {
      fontSize: '12px',
      color: '#cccccc'
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(3001);
    this.layoutEditorElements.push(pOpLabel);

    perBtnOpacityValue = this.add.text(panelX + panelW - 20, curY, Math.round((selCfg ? selCfg.opacity : 0.5) * 100) + '%', {
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(3001);
    this.layoutEditorElements.push(perBtnOpacityValue);
    this.perBtnOpacityValue = perBtnOpacityValue;
    curY += 16;

    perBtnOpacitySlider = this.createSlider(
      panelX + 20, curY, panelW - 40, selCfg ? selCfg.opacity : 0.5, 0.1, 1.0,
      function(value) {
        perBtnOpacityValue.setText(Math.round(value * 100) + '%');
        if (self.selectedButtonAction) {
          self.inputManager.applyButtonOpacity(self.selectedButtonAction, value);
        }
      }
    );
    perBtnOpacitySlider.setDepth(3001);
    this.layoutEditorElements.push(perBtnOpacitySlider);
    this.perBtnOpacitySlider = perBtnOpacitySlider;
    curY += 30;

    var presetLabel = this.add.text(panelX + 20, curY, '📂 预设方案', {
      fontSize: '13px',
      fontWeight: 'bold',
      color: '#4fc3f7'
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(3001);
    this.layoutEditorElements.push(presetLabel);
    curY += 20;

    var presets = lm.getPresetList();
    var presetBtnWidth = Math.min(72, (panelW - 40 - 3 * 6) / 4);
    var maxCols = 4;
    var presetStartX = width / 2 - (Math.min(presets.length, maxCols) * (presetBtnWidth + 6)) / 2 + presetBtnWidth / 2;

    this.layoutPresetButtons = [];
    for (var pi = 0; pi < presets.length; pi++) {
      (function(index) {
        var preset = presets[index];
        var col = index % maxCols;
        var row = Math.floor(index / maxCols);
        var px = presetStartX + col * (presetBtnWidth + 6);
        var py = curY + row * 34;
        var isActive = preset.isActive;

        var btn = self.createPresetButton(px, py, presetBtnWidth, preset, isActive, function(presetName) {
          self.inputManager.applyPreset(presetName);
          self.updatePresetButtons(presetName);
          var newLayout = lm.getLayout();
          var newFirst = lm.getAllButtonActions()[0];
          if (newLayout[newFirst]) {
            scaleSlider.updateValue(newLayout[newFirst].scale);
            scaleValueText.setText(newLayout[newFirst].scale.toFixed(1) + 'x');
            opacitySlider.updateValue(newLayout[newFirst].opacity);
            opacityValueText.setText(Math.round(newLayout[newFirst].opacity * 100) + '%');
            if (self.selectedButtonAction && newLayout[self.selectedButtonAction]) {
              perBtnScaleSlider.updateValue(newLayout[self.selectedButtonAction].scale);
              perBtnScaleValue.setText(newLayout[self.selectedButtonAction].scale.toFixed(1) + 'x');
              perBtnOpacitySlider.updateValue(newLayout[self.selectedButtonAction].opacity);
              perBtnOpacityValue.setText(Math.round(newLayout[self.selectedButtonAction].opacity * 100) + '%');
            }
          }
        });
        btn.setDepth(3001);
        self.layoutEditorElements.push(btn);
        self.layoutPresetButtons.push({ btn: btn, name: preset.name });
      })(pi);
    }

    var presetRows = Math.ceil(presets.length / maxCols);
    curY += presetRows * 34 + 10;

    var sceneLabel = this.add.text(panelX + 20, curY, '🏷️ 场景方案', {
      fontSize: '13px',
      fontWeight: 'bold',
      color: '#4fc3f7'
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(3001);
    this.layoutEditorElements.push(sceneLabel);
    curY += 20;

    var sceneTypes = [
      { id: 'racing', label: '🏎️ 竞速' },
      { id: 'exploration', label: '🗺️ 探索' }
    ];

    this.sceneButtons = [];
    for (var si = 0; si < sceneTypes.length; si++) {
      (function(idx) {
        var st = sceneTypes[idx];
        var baseX = panelX + 20 + idx * 170;

        var saveSceneBtn = self.createSceneActionButton(baseX, curY, 78, st.label + '保存', 0x4caf50, function(sceneType) {
          lm.saveScenePreset(sceneType);
          self.showFloatingText(self.cameras.main.midPoint.x, self.cameras.main.midPoint.y - 50, '✅ 已保存到' + st.label + '场景', 0x4caf50);
        }, st.id);
        saveSceneBtn.setDepth(3001);
        self.layoutEditorElements.push(saveSceneBtn);
        self.sceneButtons.push(saveSceneBtn);

        var loadSceneBtn = self.createSceneActionButton(baseX + 84, curY, 78, st.label + '加载', 0x2196f3, function(sceneType) {
          var loaded = lm.loadScenePreset(sceneType);
          if (loaded) {
            self.inputManager.rebuildTouchControls();
            var newLayout2 = lm.getLayout();
            var newFirst2 = lm.getAllButtonActions()[0];
            if (newLayout2[newFirst2]) {
              scaleSlider.updateValue(newLayout2[newFirst2].scale);
              scaleValueText.setText(newLayout2[newFirst2].scale.toFixed(1) + 'x');
              opacitySlider.updateValue(newLayout2[newFirst2].opacity);
              opacityValueText.setText(Math.round(newLayout2[newFirst2].opacity * 100) + '%');
              if (self.selectedButtonAction && newLayout2[self.selectedButtonAction]) {
                perBtnScaleSlider.updateValue(newLayout2[self.selectedButtonAction].scale);
                perBtnScaleValue.setText(newLayout2[self.selectedButtonAction].scale.toFixed(1) + 'x');
                perBtnOpacitySlider.updateValue(newLayout2[self.selectedButtonAction].opacity);
                perBtnOpacityValue.setText(Math.round(newLayout2[self.selectedButtonAction].opacity * 100) + '%');
              }
            }
            self.updatePresetButtons(lm.getActivePresetName());
            self.showFloatingText(self.cameras.main.midPoint.x, self.cameras.main.midPoint.y - 50, '✅ 已加载' + st.label + '方案', 0x2196f3);
          } else {
            self.showFloatingText(self.cameras.main.midPoint.x, self.cameras.main.midPoint.y - 50, '⚠️ 该场景暂无保存方案', 0xff9800);
          }
        }, st.id);
        loadSceneBtn.setDepth(3001);
        self.layoutEditorElements.push(loadSceneBtn);
        self.sceneButtons.push(loadSceneBtn);
      })(si);
    }
    curY += 36;

    var deleteBtn = this.createSettingsButton(
      panelX + 25,
      panelY + panelH - 45,
      100,
      '🗑️ 删除',
      0xf44336,
      function() {
        var curPreset = lm.getActivePresetName();
        if (curPreset === '默认') {
          self.showFloatingText(self.cameras.main.midPoint.x, self.cameras.main.midPoint.y - 50, '⚠️ 不能删除默认方案', 0xff9800);
          return;
        }
        if (confirm('确定要删除方案 "' + curPreset + '" 吗？')) {
          lm.deletePreset(curPreset);
          self.inputManager.rebuildTouchControls();
          self.hideButtonLayoutEditor();
          self.showButtonLayoutEditor();
        }
      }
    );
    deleteBtn.setDepth(3001);
    this.layoutEditorElements.push(deleteBtn);

    var resetBtn = this.createSettingsButton(
      panelX + panelW / 2,
      panelY + panelH - 45,
      100,
      '↩️ 重置',
      0xff9800,
      function() {
        if (confirm('确定要重置为默认布局吗？')) {
          lm.resetToDefault();
          self.inputManager.rebuildTouchControls();
          var resetLayout = lm.getLayout();
          var resetFirst = lm.getAllButtonActions()[0];
          if (resetLayout[resetFirst]) {
            scaleSlider.updateValue(resetLayout[resetFirst].scale);
            scaleValueText.setText(resetLayout[resetFirst].scale.toFixed(1) + 'x');
            opacitySlider.updateValue(resetLayout[resetFirst].opacity);
            opacityValueText.setText(Math.round(resetLayout[resetFirst].opacity * 100) + '%');
            if (self.selectedButtonAction && resetLayout[self.selectedButtonAction]) {
              perBtnScaleSlider.updateValue(resetLayout[self.selectedButtonAction].scale);
              perBtnScaleValue.setText(resetLayout[self.selectedButtonAction].scale.toFixed(1) + 'x');
              perBtnOpacitySlider.updateValue(resetLayout[self.selectedButtonAction].opacity);
              perBtnOpacityValue.setText(Math.round(resetLayout[self.selectedButtonAction].opacity * 100) + '%');
            }
          }
        }
      }
    );
    resetBtn.setDepth(3001);
    this.layoutEditorElements.push(resetBtn);

    var saveNewBtn = this.createSettingsButton(
      panelX + panelW - 25,
      panelY + panelH - 45,
      100,
      '💾 保存',
      0x4caf50,
      function() {
        self.showSavePresetDialog();
      }
    );
    saveNewBtn.setDepth(3001);
    this.layoutEditorElements.push(saveNewBtn);
  };

  proto.createLayoutToggleButton = function(x, y, label, initialValue, onChange) {
    var container = this.add.container(x, y);
    container.setScrollFactor(0);
    container.setSize(260, 30);

    var bg = this.add.graphics();
    var value = initialValue;

    var updateVisual = function() {
      bg.clear();
      bg.fillStyle(value ? 0x4caf50 : 0x555555, 1);
      bg.fillRoundedRect(-130, -15, 260, 30, 8);
      if (value) {
        bg.lineStyle(2, 0x81c784, 0.8);
      } else {
        bg.lineStyle(2, 0x777777, 0.5);
      }
      bg.strokeRoundedRect(-130, -15, 260, 30, 8);
    };

    updateVisual();
    container.add(bg);

    var text = this.add.text(0, 0, label + (value ? ' ✅' : ' ⬜'), {
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    container.add(text);

    container.setInteractive(
      new Phaser.Geom.Rectangle(-130, -15, 260, 30),
      Phaser.Geom.Rectangle.Contains
    );

    container.on('pointerdown', function() {
      value = !value;
      updateVisual();
      text.setText(label + (value ? ' ✅' : ' ⬜'));
      if (onChange) onChange(value);
    });

    container.updateValue = function(newValue) {
      value = newValue;
      updateVisual();
      text.setText(label + (value ? ' ✅' : ' ⬜'));
    };

    return container;
  };

  proto.createSlider = function(x, y, width, initialValue, minVal, maxVal, onChange) {
    var container = this.add.container(x, y);
    container.setScrollFactor(0);
    container.setSize(width, 20);

    var trackBg = this.add.graphics();
    trackBg.fillStyle(0x333333, 1);
    trackBg.fillRoundedRect(0, 6, width, 8, 4);
    container.add(trackBg);

    var trackFill = this.add.graphics();
    container.add(trackFill);

    var handle = this.add.graphics();
    container.add(handle);

    var self = this;
    var value = initialValue;
    var dragging = false;

    var updateSliderVisual = function() {
      var ratio = (value - minVal) / (maxVal - minVal);
      var fillW = Math.max(4, ratio * width);
      trackFill.clear();
      trackFill.fillStyle(0x2196f3, 1);
      trackFill.fillRoundedRect(0, 6, fillW, 8, 4);

      handle.clear();
      handle.fillStyle(0xffffff, 1);
      handle.fillCircle(fillW, 10, 8);
      handle.lineStyle(2, 0x2196f3, 1);
      handle.strokeCircle(fillW, 10, 8);
    };

    updateSliderVisual();

    container.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, width, 20),
      Phaser.Geom.Rectangle.Contains
    );

    var handlePointer = function(pointerX) {
      var localX = pointerX - x;
      var ratio = Math.max(0, Math.min(1, localX / width));
      value = minVal + ratio * (maxVal - minVal);
      value = Math.round(value * 100) / 100;
      updateSliderVisual();
      if (onChange) onChange(value);
    };

    container.on('pointerdown', function(pointer) {
      dragging = true;
      handlePointer(pointer.x);
    });

    self.input.on('pointermove', function(pointer) {
      if (dragging) {
        handlePointer(pointer.x);
      }
    });

    self.input.on('pointerup', function() {
      dragging = false;
    });

    container.updateValue = function(newValue) {
      value = Math.max(minVal, Math.min(maxVal, newValue));
      updateSliderVisual();
    };

    return container;
  };

  proto.createPresetButton = function(x, y, btnWidth, preset, isActive, onClick) {
    var container = this.add.container(x, y);
    container.setScrollFactor(0);
    container.setSize(btnWidth, 32);

    var bg = this.add.graphics();
    var updateVisual = function(active) {
      bg.clear();
      if (active) {
        bg.fillStyle(0x2196f3, 1);
      } else {
        bg.fillStyle(0x333333, 1);
      }
      bg.fillRoundedRect(-btnWidth / 2, -16, btnWidth, 32, 6);
      bg.lineStyle(1, active ? 0x64b5f6 : 0x555555, 1);
      bg.strokeRoundedRect(-btnWidth / 2, -16, btnWidth, 32, 6);
    };

    updateVisual(isActive);
    container.add(bg);

    var label = this.add.text(0, 0, preset.icon + ' ' + preset.name, {
      fontSize: '11px',
      fontWeight: 'bold',
      color: isActive ? '#ffffff' : '#cccccc'
    }).setOrigin(0.5);
    container.add(label);

    container.setInteractive(
      new Phaser.Geom.Rectangle(-btnWidth / 2, -16, btnWidth, 32),
      Phaser.Geom.Rectangle.Contains
    );

    container.on('pointerdown', function() {
      onClick(preset.name);
    });

    container.setActiveState = function(active) {
      updateVisual(active);
      label.setColor(active ? '#ffffff' : '#cccccc');
    };

    return container;
  };

  proto.createLayoutCloseButton = function(x, y, onClick) {
    var container = this.add.container(x, y);
    container.setScrollFactor(0);
    container.setSize(32, 32);

    var bg = this.add.graphics();
    bg.fillStyle(0x333333, 0.8);
    bg.fillCircle(0, 0, 14);
    bg.lineStyle(2, 0x666666, 0.8);
    bg.strokeCircle(0, 0, 14);
    container.add(bg);

    var label = this.add.text(0, 0, '✕', {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    container.add(label);

    container.setInteractive(
      new Phaser.Geom.Circle(0, 0, 14),
      Phaser.Geom.Circle.Contains
    );

    container.on('pointerover', function() { bg.fillStyle(0xf44336, 0.9); bg.clear(); bg.fillCircle(0, 0, 14); bg.lineStyle(2, 0xff6b6b, 0.9); bg.strokeCircle(0, 0, 14); });
    container.on('pointerout', function() { bg.fillStyle(0x333333, 0.8); bg.clear(); bg.fillCircle(0, 0, 14); bg.lineStyle(2, 0x666666, 0.8); bg.strokeCircle(0, 0, 14); });
    container.on('pointerdown', function() {
      container.setScale(0.9);
      setTimeout(function() {
        container.setScale(1);
        onClick();
      }, 80);
    });

    return container;
  };

  proto.createPerBtnSelectButton = function(x, y, btnWidth, meta, action, isSelected, onClick) {
    var container = this.add.container(x, y);
    container.setScrollFactor(0);
    container.setSize(btnWidth, 32);
    container.action = action;

    var bg = this.add.graphics();
    var updateVisual = function(selected) {
      bg.clear();
      if (selected) {
        bg.fillStyle(meta ? meta.color : 0x2196f3, 1);
        bg.fillRoundedRect(-btnWidth / 2, -16, btnWidth, 32, 8);
        bg.lineStyle(2, 0xffffff, 0.6);
        bg.strokeRoundedRect(-btnWidth / 2, -16, btnWidth, 32, 8);
      } else {
        bg.fillStyle(0x333333, 1);
        bg.fillRoundedRect(-btnWidth / 2, -16, btnWidth, 32, 8);
        bg.lineStyle(1, (meta ? meta.color : 0x555555), 0.6);
        bg.strokeRoundedRect(-btnWidth / 2, -16, btnWidth, 32, 8);
      }
    };
    updateVisual(isSelected);
    container.add(bg);

    var icon = this.add.text(0, 0, meta ? meta.label : '?', {
      fontSize: '16px',
      fontWeight: 'bold',
      color: isSelected ? '#ffffff' : '#cccccc'
    }).setOrigin(0.5);
    container.add(icon);

    container.setInteractive(
      new Phaser.Geom.Rectangle(-btnWidth / 2, -16, btnWidth, 32),
      Phaser.Geom.Rectangle.Contains
    );

    container.on('pointerdown', function() {
      onClick(action);
    });

    container.updateSelected = function(selected) {
      updateVisual(selected);
      icon.setColor(selected ? '#ffffff' : '#cccccc');
    };

    return container;
  };

  proto.createSceneActionButton = function(x, y, btnWidth, labelText, color, onClick, sceneType) {
    var container = this.add.container(x + btnWidth / 2, y + 14);
    container.setScrollFactor(0);
    container.setSize(btnWidth, 28);

    var bg = this.add.graphics();
    bg.fillStyle(color, 0.9);
    bg.fillRoundedRect(-btnWidth / 2, -14, btnWidth, 28, 6);
    bg.lineStyle(1, 0xffffff, 0.3);
    bg.strokeRoundedRect(-btnWidth / 2, -14, btnWidth, 28, 6);
    container.add(bg);

    var label = this.add.text(0, 0, labelText, {
      fontSize: '11px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    container.add(label);

    container.setInteractive(
      new Phaser.Geom.Rectangle(-btnWidth / 2, -14, btnWidth, 28),
      Phaser.Geom.Rectangle.Contains
    );

    container.on('pointerover', function() { container.setScale(1.04); });
    container.on('pointerout', function() { container.setScale(1); });
    container.on('pointerdown', function() {
      container.setScale(0.96);
      setTimeout(function() {
        container.setScale(1);
        onClick(sceneType);
      }, 80);
    });

    return container;
  };

  proto.createScenePresetButton = function(x, y, btnWidth, sceneType, onClick) {
    var container = this.add.container(x + btnWidth / 2, y + 12);
    container.setScrollFactor(0);
    container.setSize(btnWidth, 28);

    var bg = this.add.graphics();
    bg.fillStyle(0xff9800, 0.8);
    bg.fillRoundedRect(-btnWidth / 2, -14, btnWidth, 28, 6);
    bg.lineStyle(1, 0xffb74d, 0.8);
    bg.strokeRoundedRect(-btnWidth / 2, -14, btnWidth, 28, 6);
    container.add(bg);

    var label = this.add.text(0, 0, sceneType.label, {
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    container.add(label);

    container.setInteractive(
      new Phaser.Geom.Rectangle(-btnWidth / 2, -14, btnWidth, 28),
      Phaser.Geom.Rectangle.Contains
    );

    container.on('pointerdown', function() {
      onClick(sceneType.id);
    });

    return container;
  };

  proto.updatePresetButtons = function(activeName) {
    if (!this.layoutPresetButtons) return;
    for (var i = 0; i < this.layoutPresetButtons.length; i++) {
      var item = this.layoutPresetButtons[i];
      item.btn.setActiveState(item.name === activeName);
    }
  };

  proto.showSavePresetDialog = function() {
    var width = this.scale.width;
    var height = this.scale.height;
    var self = this;

    if (this.saveDialogElements) {
      this.destroySaveDialog();
    }
    this.saveDialogElements = [];

    var dialogBg = this.add.graphics();
    dialogBg.fillStyle(0x0d1b2a, 0.95);
    dialogBg.fillRoundedRect(width / 2 - 170, height / 2 - 120, 340, 240, 16);
    dialogBg.lineStyle(2, 0xffd700, 1);
    dialogBg.strokeRoundedRect(width / 2 - 170, height / 2 - 120, 340, 240, 16);
    dialogBg.setScrollFactor(0);
    dialogBg.setDepth(3100);
    this.saveDialogElements.push(dialogBg);

    var title = this.add.text(width / 2, height / 2 - 95, '💾 保存方案', {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#ffd700'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(3101);
    this.saveDialogElements.push(title);

    var nameLabel = this.add.text(width / 2 - 150, height / 2 - 65, '方案名称:', {
      fontSize: '12px',
      color: '#aaaaaa'
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(3101);
    this.saveDialogElements.push(nameLabel);

    var inputBg = this.add.graphics();
    inputBg.fillStyle(0x1a1a2e, 1);
    inputBg.fillRoundedRect(width / 2 - 150, height / 2 - 45, 300, 40, 8);
    inputBg.lineStyle(1, 0x4fc3f7, 0.8);
    inputBg.strokeRoundedRect(width / 2 - 150, height / 2 - 45, 300, 40, 8);
    inputBg.setScrollFactor(0);
    inputBg.setDepth(3101);
    this.saveDialogElements.push(inputBg);

    var presetName = '我的方案';
    var inputText = this.add.text(width / 2 - 140, height / 2 - 25, presetName, {
      fontSize: '16px',
      color: '#ffffff'
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(3102);
    this.saveDialogElements.push(inputText);

    var cursor = this.add.text(width / 2 - 140 + inputText.width, height / 2 - 25, '|', {
      fontSize: '18px',
      color: '#4fc3f7'
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(3102);
    this.saveDialogElements.push(cursor);

    this.tweens.add({
      targets: cursor,
      alpha: { from: 1, to: 0 },
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    var lm = this.inputManager.layoutManager;

    var sceneLabel = this.add.text(width / 2 - 150, height / 2 + 5, '适用场景:', {
      fontSize: '12px',
      color: '#aaaaaa'
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(3101);
    this.saveDialogElements.push(sceneLabel);

    var sceneOptions = [
      { id: 'all', label: '🎮 全部' },
      { id: 'racing', label: '🏎️ 竞速' },
      { id: 'exploration', label: '🗺️ 探索' }
    ];
    var selectedScene = 'all';
    this.saveSceneBtns = [];

    for (var oi = 0; oi < sceneOptions.length; oi++) {
      (function(idx) {
        var opt = sceneOptions[idx];
        var ox = width / 2 - 130 + idx * 95;
        var oy = height / 2 + 35;
        var isSelected = opt.id === selectedScene;

        var sceneOptBtn = self.add.container(ox, oy);
        sceneOptBtn.setScrollFactor(0);
        sceneOptBtn.setSize(85, 28);

        var optBg = self.add.graphics();
        var updateOptVisual = function(selected) {
          optBg.clear();
          optBg.fillStyle(selected ? 0xff9800 : 0x333333, 1);
          optBg.fillRoundedRect(-42, -14, 85, 28, 6);
        };
        updateOptVisual(isSelected);
        sceneOptBtn.add(optBg);

        var optLabel = self.add.text(0, 0, opt.label, {
          fontSize: '12px',
          fontWeight: 'bold',
          color: isSelected ? '#ffffff' : '#cccccc'
        }).setOrigin(0.5);
        sceneOptBtn.add(optLabel);

        sceneOptBtn.setInteractive(
          new Phaser.Geom.Rectangle(-42, -14, 85, 28),
          Phaser.Geom.Rectangle.Contains
        );

        sceneOptBtn.on('pointerdown', function() {
          selectedScene = opt.id;
          for (var j = 0; j < self.saveSceneBtns.length; j++) {
            self.saveSceneBtns[j].updateSelected(sceneOptions[j].id === selectedScene);
          }
        });

        sceneOptBtn.setDepth(3102);
        self.saveDialogElements.push(sceneOptBtn);

        sceneOptBtn.updateSelected = function(selected) {
          updateOptVisual(selected);
          optLabel.setColor(selected ? '#ffffff' : '#cccccc');
        };

        self.saveSceneBtns.push(sceneOptBtn);
      })(oi);
    }

    var confirmBtn = this.createSettingsButton(
      width / 2 - 80,
      height / 2 + 85,
      130,
      '✅ 保存',
      0x4caf50,
      function() {
        var trimmedName = presetName.trim();
        if (trimmedName !== '') {
          var icon = selectedScene === 'racing' ? '🏎️' : selectedScene === 'exploration' ? '🗺️' : '🎮';
          lm.saveCurrentAsPreset(trimmedName, icon, selectedScene);
          self.inputManager.setEditMode(false);
          self.destroySaveDialog();
          self.hideButtonLayoutEditor();
          self.showButtonLayoutEditor();
        }
      }
    );
    confirmBtn.setDepth(3102);
    this.saveDialogElements.push(confirmBtn);

    var cancelBtn = this.createSettingsButton(
      width / 2 + 80,
      height / 2 + 85,
      130,
      '❌ 取消',
      0x666666,
      function() {
        self.destroySaveDialog();
      }
    );
    cancelBtn.setDepth(3102);
    this.saveDialogElements.push(cancelBtn);

    var updateCursorPos = function() {
      cursor.x = width / 2 - 140 + inputText.width;
    };

    if (!this._savePresetKeyHandler) {
      this._savePresetKeyHandler = function(event) {
        if (!self.saveDialogElements) return;
        if (event.key === 'Backspace') {
          event.preventDefault();
          if (presetName.length > 0) {
            presetName = presetName.slice(0, -1);
            inputText.setText(presetName);
            updateCursorPos();
          }
        } else if (event.key === 'Enter') {
          event.preventDefault();
          confirmBtn.emit('pointerdown');
        } else if (event.key === 'Escape') {
          event.preventDefault();
          cancelBtn.emit('pointerdown');
        } else if (event.key.length === 1 && presetName.length < 20) {
          if (/[a-zA-Z0-9\u4e00-\u9fa5 _\-]/.test(event.key)) {
            presetName += event.key;
            inputText.setText(presetName);
            updateCursorPos();
          }
        }
      };
    }
    this.input.keyboard.on('keydown', this._savePresetKeyHandler, this);
  };

  proto.destroySaveDialog = function() {
    if (this._savePresetKeyHandler) {
      this.input.keyboard.off('keydown', this._savePresetKeyHandler, this);
    }
    if (this.saveDialogElements) {
      for (var i = 0; i < this.saveDialogElements.length; i++) {
        this.saveDialogElements[i].destroy();
      }
      this.saveDialogElements = null;
    }
    if (this.saveSceneBtns) {
      for (var j = 0; j < this.saveSceneBtns.length; j++) {
        this.saveSceneBtns[j].destroy();
      }
      this.saveSceneBtns = null;
    }
  };

  proto.hideButtonLayoutEditor = function() {
    this.inputManager.setEditMode(false);
    this.layoutEditorOpen = false;
    this.selectedButtonAction = null;
    this.perBtnScaleSlider = null;
    this.perBtnScaleValue = null;
    this.perBtnOpacitySlider = null;
    this.perBtnOpacityValue = null;

    if (this.saveDialogElements) {
      this.destroySaveDialog();
    }

    if (this.layoutEditorElements) {
      for (var i = 0; i < this.layoutEditorElements.length; i++) {
        this.layoutEditorElements[i].destroy();
      }
      this.layoutEditorElements = null;
    }

    this.layoutPresetButtons = null;
    this.sceneButtons = null;
    this.layoutEditToggle = null;
    this.perBtnSelectButtons = null;

    if (this.pauseOverlay) this.pauseOverlay.setDepth(2000);
    if (this.pausePanel) this.pausePanel.setDepth(2001);
  };

  proto.hideSettingsPanel = function() {
    if (this.pauseOverlay) this.pauseOverlay.setDepth(2000);

    if (this.settingsPanel) this.settingsPanel.destroy();
    if (this.settingsTitle) this.settingsTitle.destroy();

    for (var key in this.settingToggles) {
      if (this.settingToggles[key]) {
        this.settingToggles[key].destroy();
      }
    }
    this.settingToggles = {};

    if (this.settingsItemBgs) {
      for (var b = 0; b < this.settingsItemBgs.length; b++) {
        this.settingsItemBgs[b].destroy();
      }
      this.settingsItemBgs = null;
    }

    if (this.settingsSectionLabels) {
      for (var s = 0; s < this.settingsSectionLabels.length; s++) {
        this.settingsSectionLabels[s].destroy();
      }
      this.settingsSectionLabels = null;
    }

    if (this.controlButtons) {
      for (var i = 0; i < this.controlButtons.length; i++) {
        this.controlButtons[i].btn.destroy();
      }
      this.controlButtons = null;
    }

    if (this.difficultyButtons) {
      for (var di = 0; di < this.difficultyButtons.length; di++) {
        this.difficultyButtons[di].btn.destroy();
      }
      this.difficultyButtons = null;
    }

    this.tempSettings = null;
    this.tempMidSettings = null;
  };

  proto.hidePauseMenu = function() {
    if (this.settingsPanel) this.hideSettingsPanel();
    if (this.layoutEditorOpen) this.hideButtonLayoutEditor();
    if (this.pauseOverlay) this.pauseOverlay.destroy();
    if (this.pausePanel) this.pausePanel.destroy();
    if (this.pauseTitle) this.pauseTitle.destroy();
    if (this.resumeBtn) this.resumeBtn.destroy();
    if (this.settingsBtn) this.settingsBtn.destroy();
    if (this.restartBtn) this.restartBtn.destroy();
    if (this.layoutBtn) this.layoutBtn.destroy();
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
    var prevComboCount = this.scoreManager.comboCount;
    this.scoreManager.addDistanceScore(carX);
    this.scoreManager.updateStats(this.carPhysics);
    this.scoreManager.updateCombo(delta);
    this.comboTextCooldown = Math.max(0, this.comboTextCooldown - delta);

    if (this.scoreManager.comboCount > prevComboCount && this.scoreManager.comboCount > 1) {
      var lastHistory = this.scoreManager.comboHistory[this.scoreManager.comboHistory.length - 1];
      if (lastHistory && lastHistory.reason === 'airTime' && this.comboTextCooldown <= 0) {
        this.showFloatingText(carX, this.carPhysics.car.y - 60,
          '🦘 x' + this.scoreManager.comboCount + ' 腾空连击!', 0x00e5ff);
        this.comboTextCooldown = 400;
      } else if (lastHistory && lastHistory.reason === 'damageFree' && this.comboTextCooldown <= 0) {
        this.showFloatingText(carX, this.carPhysics.car.y - 60,
          '🛡️ x' + this.scoreManager.comboCount + ' 无伤连击!', 0x4caf50);
        this.comboTextCooldown = 400;
      }
    }

    this.checkObstaclePass(carX);
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

        if (this.scoreManager.comboBreakReason === 'damage') {
          this.showFloatingText(carX, this.carPhysics.car.y - 100, '💥 连击中断!', 0xf44336);
        }

        if (dead) {
          this.gameOver = true;
          this.scoreManager.saveHighScore();
          this.showGameOver(false, '赛车损毁');
          return;
        }
      } else if (collision.type === 'mud') {
        this.carPhysics.slowDown(collision.slowdown);
        var mudPoints = this.scoreManager.registerObstaclePass();
        if (mudPoints > 0 && this.comboTextCooldown <= 0) {
          this.showFloatingText(carX, this.carPhysics.car.y - 60, '🔥 x' + this.scoreManager.comboCount + ' 连击!', 0xff9800);
          this.comboTextCooldown = 300;
        }
      } else if (collision.type === 'ramp' && collision.boost) {
        this.carPhysics.vy = Math.min(this.carPhysics.vy, -450);
        this.carPhysics.vx *= 1.15;
        this.scoreManager.addBonusScore(50, 'styleBonus');
        this.rampCooldown = 500;
        this.showFloatingText(this.carPhysics.car.x, this.carPhysics.car.y - 60, '+50 起跳!', 0xffd700);
      } else if (collision.destructible) {
        var destResult = this.scoreManager.registerDestructibleDestroyed(
          collision.type,
          collision.scoreReward
        );

        this.carPhysics.slowDown(collision.slowdown);

        var shakeIntensity = 4;
        var shakeDuration = 150;
        var damageAmount = collision.damage || 0;
        var destLabel = '';
        var destColor = 0x4caf50;

        if (collision.type === 'crate') {
          destLabel = '📦 木箱';
          destColor = 0x8b5a2b;
        } else if (collision.type === 'barrel') {
          destLabel = '🛢️ 油桶爆炸';
          destColor = 0xff6600;
          shakeIntensity = 10;
          shakeDuration = 350;
          damageAmount = collision.damage || 25;
        } else if (collision.type === 'sign') {
          destLabel = '🪧 路牌';
          destColor = 0xffd700;
        }

        if (damageAmount > 0) {
          this.carPhysics.applyDamage();
          var destDead = this.scoreManager.takeDamage(damageAmount);
          this.damageCooldown = collision.type === 'barrel' ? 1000 : 600;
          this.screenShake(shakeIntensity, shakeDuration);

          if (this.scoreManager.comboBreakReason === 'damage' && collision.type !== 'sign') {
            this.showFloatingText(carX, this.carPhysics.car.y - 100, '💥 连击中断!', 0xf44336);
          }

          if (destDead) {
            this.gameOver = true;
            this.scoreManager.saveHighScore();
            this.showGameOver(false, collision.type === 'barrel' ? '油桶爆炸损毁' : '赛车损毁');
            return;
          }
        } else {
          this.damageCooldown = 300;
          this.screenShake(shakeIntensity, shakeDuration);
        }

        if (this.comboTextCooldown <= 0) {
          var destDisplay = destLabel + ' +' + destResult.totalPoints;
          if (destResult.bonusPoints > 0) {
            destDisplay += ' (连锁+' + destResult.bonusPoints + ')';
          }
          if (destResult.destructibleCombo >= 3) {
            destDisplay += ' x' + destResult.destructibleCombo + '连破!';
          }
          this.showFloatingText(carX, this.carPhysics.car.y - 70, destDisplay, destColor);
          this.comboTextCooldown = collision.type === 'barrel' ? 500 : 300;
        }
      }
    }

    var dangerResult = this.dangerZones.update(carX, this.carPhysics, delta, Date.now());
    if (dangerResult.damage > 0) {
      var deadDanger = this.scoreManager.takeDamage(dangerResult.damage);
      this.damageCooldown = 500;
      this.screenShake(4, 150);
      if (this.scoreManager.comboBreakReason === 'damage') {
        this.showFloatingText(carX, this.carPhysics.car.y - 100, '💥 连击中断!', 0xf44336);
      }
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

    this.scoreManager.updateRolloverCooldown(delta);
    this.checkRollover(carX, delta);
    this.updateRolloverCooldownHUD(delta);

    this.checkSpecialEvents(carX, delta);

    if (this.activeSpeedBoost && Date.now() > this.speedBoostEndTime) {
      this.activeSpeedBoost = null;
    }

    if (Math.random() < 0.02) {
      this.checkAchievements();
    }

    var breakthrough = this.scoreManager.highScoreBreakthrough;
    if (breakthrough && breakthrough !== this.lastBreakthroughShown) {
      this.lastBreakthroughShown = breakthrough;
      this.showBreakthroughNotification(breakthrough);
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

  proto.checkObstaclePass = function(carX) {
    if (carX - this.lastObstacleCheckX < 30) return;

    var carBounds = this.carPhysics.getBounds();
    var nearMissRange = 40;
    var passed = false;
    var obstacles = this.obstacles.obstacles || [];

    for (var i = 0; i < obstacles.length; i++) {
      var obs = obstacles[i];
      if (obs.getData('hit')) continue;
      var hitbox = obs.getData('hitbox');
      if (!hitbox) continue;

      var hb = hitbox.getBounds();
      if (carX > hb.x + hb.width && carX < hb.x + hb.width + nearMissRange) {
        var distY = Math.abs(carBounds.centerY - hb.centerY);
        if (distY < hb.height + 30) {
          passed = true;
          break;
        }
      }
    }

    if (passed) {
      this.scoreManager.registerObstaclePass();
      if (this.comboTextCooldown <= 0) {
        var comboInfo = this.scoreManager.getComboInfo();
        this.showFloatingText(carX, this.carPhysics.car.y - 60,
          '🔥 x' + comboInfo.comboCount + ' 连击!', 0xff9800);
        this.comboTextCooldown = 400;
      }
    }

    this.lastObstacleCheckX = carX;
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
    this.unlockMgr.unlockAchievement(achievement.id);
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

  proto.showBreakthroughNotification = function(breakthrough) {
    var width = this.scale.width;
    var height = this.scale.height;
    var self = this;

    var container = this.add.container(width / 2, height / 2 - 120);
    container.setScrollFactor(0);
    container.setDepth(2000);

    var bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.85);
    bg.fillRoundedRect(-180, -50, 360, 100, 15);
    bg.lineStyle(3, 0xffd700, 1);
    bg.strokeRoundedRect(-180, -50, 360, 100, 15);
    container.add(bg);

    var icon = this.add.text(0, -25, breakthrough.threshold >= 1.0 ? '🏆' : '🔥', {
      fontSize: '28px'
    }).setOrigin(0.5);
    container.add(icon);

    var title = this.add.text(0, 5, breakthrough.label, {
      fontSize: '22px',
      fontWeight: 'bold',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    container.add(title);

    var detail = this.add.text(0, 30, '已达最高分 ' + breakthrough.percentage + '%!', {
      fontSize: '13px',
      color: '#ffffff'
    }).setOrigin(0.5);
    container.add(detail);

    container.setAlpha(0);
    container.setScale(0.5);

    this.tweens.add({
      targets: container,
      alpha: 1,
      scale: 1,
      duration: 400,
      ease: 'Back.out',
      onComplete: function() {
        self.tweens.add({
          targets: container,
          y: height / 2 - 160,
          alpha: 0,
          delay: 2500,
          duration: 500,
          ease: 'Back.in',
          onComplete: function() {
            container.destroy();
          }
        });
      }
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

    var comboInfo = this.scoreManager.getComboInfo();
    if (comboInfo.comboCount > 0) {
      var comboLabel = '🔥 x' + comboInfo.comboCount;
      if (comboInfo.comboMultiplier > 1.0) {
        comboLabel += ' (x' + comboInfo.comboMultiplier.toFixed(1) + ')';
      }
      this.comboText.setText(comboLabel);
      this.comboText.setColor('#ff9800');
      this.comboText.setAlpha(1);
    } else {
      this.comboText.setAlpha(0);
    }

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

  proto.checkRollover = function(carX, delta) {
    if (this.gameOver) return;

    var rolloverState = this.carPhysics.getRolloverState();
    var scoreCooldown = this.scoreManager.getRolloverCooldownRemaining();
    var bothOnCooldown = rolloverState.onCooldown && scoreCooldown > 0;

    if (rolloverState.damagePending) {
      if (scoreCooldown <= 0) {
        var result = this.scoreManager.takeRolloverDamage();
        if (result.applied) {
          this.rolloverDamageApplied = true;
          this.carPhysics.consumeRolloverDamage();
          this.carPhysics.applyDamage();
          this.screenShake(8, 300);
          this.showFloatingText(carX, this.carPhysics.car.y - 100,
            '🔄 翻车! -' + result.damage + ' HP', 0xf44336);

          if (this.scoreManager.comboBreakReason === 'damage') {
            this.showFloatingText(carX, this.carPhysics.car.y - 140, '💥 连击中断!', 0xf44336);
          }

          if (result.dead) {
            this.gameOver = true;
            this.scoreManager.saveHighScore();
            this.showGameOver(false, '翻车损毁');
            return;
          }
        }
      } else if (!this.rolloverCooldownHintShown) {
        this.showFloatingText(carX, this.carPhysics.car.y - 120,
          '⏳ 翻车保护冷却中 (' + scoreCooldown.toFixed(1) + 's)', 0xffc107);
        this.rolloverCooldownHintShown = true;
      }
    }

    if (rolloverState.isRollover && !rolloverState.isCorrecting && !bothOnCooldown) {
      if (!this.rolloverWarningShown) {
        this.showRolloverWarning();
        this.rolloverWarningShown = true;
      }
    } else {
      if (this.rolloverWarningShown) {
        this.hideRolloverWarning();
      }
    }

    if (rolloverState.isCorrecting && !this.rolloverCorrectionTextShown) {
      this.showFloatingText(carX, this.carPhysics.car.y - 80,
        '↩️ 自动扶正中...', 0xff9800);
      this.rolloverCorrectionTextShown = true;
    }

    if (!rolloverState.isCorrecting) {
      this.rolloverCorrectionTextShown = false;
    }

    if (!rolloverState.damagePending && !rolloverState.isRollover && !rolloverState.isCorrecting) {
      this.rolloverDamageApplied = false;
      this.rolloverCooldownHintShown = false;
    }
  };

  proto.updateRolloverCooldownHUD = function(delta) {
    if (this.gameOver) return;
    var rolloverState = this.carPhysics.getRolloverState();
    var scoreCooldown = this.scoreManager.getRolloverCooldownRemaining();
    var cooldownRemaining = Math.max(rolloverState.cooldownRemaining, scoreCooldown);
    var showCooldown = cooldownRemaining > 0 && !rolloverState.isRollover && !rolloverState.isCorrecting;

    if (showCooldown) {
      if (!this.rolloverCooldownHUD) {
        var width = this.scale.width;
        this.rolloverCooldownHUD = this.add.graphics();
        this.rolloverCooldownHUD.setScrollFactor(0);
        this.rolloverCooldownHUD.setDepth(799);
        this.rolloverCooldownHUDText = this.add.text(width / 2, 122, '', {
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#ffc107'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(800);
      }

      var w = this.scale.width;
      var barW = 180;
      var barH = 8;
      var barX = w / 2 - barW / 2;
      var barY = 100;
      var progress = 1 - cooldownRemaining /
        Math.max(this.carPhysics.rolloverCooldownDuration, this.scoreManager.rolloverDamageCooldownDuration);

      this.rolloverCooldownHUD.clear();
      this.rolloverCooldownHUD.fillStyle(0x000000, 0.6);
      this.rolloverCooldownHUD.fillRoundedRect(barX - 4, barY - 4, barW + 8, barH + 28, 6);
      this.rolloverCooldownHUD.fillStyle(0x333333, 1);
      this.rolloverCooldownHUD.fillRoundedRect(barX, barY, barW, barH, 4);
      this.rolloverCooldownHUD.fillStyle(0xffc107, 1);
      this.rolloverCooldownHUD.fillRoundedRect(barX, barY, barW * Math.max(0, Math.min(1, progress)), barH, 4);

      this.rolloverCooldownHUDText.setText(
        '🛡️ 翻车保护冷却中 ' + cooldownRemaining.toFixed(1) + 's'
      );
      this.rolloverCooldownHUDText.setAlpha(1);
      if (this.rolloverCooldownHUD) this.rolloverCooldownHUD.setAlpha(1);
    } else {
      if (this.rolloverCooldownHUD) {
        this.rolloverCooldownHUD.clear();
        this.rolloverCooldownHUD.setAlpha(0);
      }
      if (this.rolloverCooldownHUDText) {
        this.rolloverCooldownHUDText.setAlpha(0);
      }
    }
  };

  proto.showRolloverWarning = function() {
    var width = this.scale.width;

    if (this.rolloverWarningGfx) this.hideRolloverWarning();

    this.rolloverWarningGfx = this.add.graphics();
    this.rolloverWarningGfx.setScrollFactor(0);
    this.rolloverWarningGfx.setDepth(800);
    this.rolloverWarningGfx.fillStyle(0xff5722, 0.9);
    this.rolloverWarningGfx.fillRoundedRect(width / 2 - 110, 75, 220, 32, 8);

    this.rolloverWarningText = this.add.text(width / 2, 91, '⚠️ 车辆翻覆!', {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(801);

    this.tweens.add({
      targets: this.rolloverWarningGfx,
      alpha: { from: 1, to: 0.5 },
      duration: 300,
      yoyo: true,
      repeat: -1
    });
  };

  proto.hideRolloverWarning = function() {
    this.rolloverWarningShown = false;
    if (this.rolloverWarningGfx) {
      this.tweens.killTweensOf(this.rolloverWarningGfx);
      this.rolloverWarningGfx.destroy();
      this.rolloverWarningGfx = null;
    }
    if (this.rolloverWarningText) {
      this.rolloverWarningText.destroy();
      this.rolloverWarningText = null;
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
    var scoreImprovements = this.scoreManager.calculateScoreImprovements();
    var performanceGrade = this.scoreManager.getPerformanceGrade();
    var runHistory = this.scoreManager.getRunHistory();
    var previousBest = this.scoreManager.previousBestStats;
    var replayComparison = this.scoreManager.getReplayComparisonData();
    var starRating = win ? this.scoreManager.getStarRating() : null;

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
        currentBranch: self.terrain.currentBranch,
        scoreImprovements: scoreImprovements,
        performanceGrade: performanceGrade,
        runHistory: runHistory,
        previousBestStats: previousBest,
        replayComparison: replayComparison,
        starRating: starRating
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
    this.hideRolloverWarning();
    if (this.rolloverCooldownHUD) {
      this.rolloverCooldownHUD.destroy();
      this.rolloverCooldownHUD = null;
    }
    if (this.rolloverCooldownHUDText) {
      this.rolloverCooldownHUDText.destroy();
      this.rolloverCooldownHUDText = null;
    }
    this.closeBranchSelect();
  };

  window.MountainRacer = MountainRacer;
})();
