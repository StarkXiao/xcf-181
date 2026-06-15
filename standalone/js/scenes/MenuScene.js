(function() {
  var MountainRacer = window.MountainRacer || {};

  MountainRacer.MenuScene = function() {
    Phaser.Scene.call(this, { key: 'MenuScene' });
  };

  MountainRacer.MenuScene.prototype = Object.create(Phaser.Scene.prototype);
  MountainRacer.MenuScene.prototype.constructor = MountainRacer.MenuScene;

  var proto = MountainRacer.MenuScene.prototype;

  proto.create = function() {
    this.dataManager = MountainRacer.DataManager.getInstance();
    this.dataManager.init();
    this.highScoreMgr = this.dataManager.getHighScoreManager();
    this.unlockMgr = this.dataManager.getUnlockManager();
    this.garageMgr = this.dataManager.getGarageManager();
    this.seasonDM = this.dataManager.getSeasonDataManager();
    this.carGrowth = this.dataManager.getCarGrowthSystem();
    this.taskCenter = this.dataManager.getTaskCenterManager();
    this.tournamentMgr = this.dataManager.getTournamentManager();

    var width = this.scale.width;
    var height = this.scale.height;

    this.createBackground(width, height);
    this.createTitle(width, height);
    this.createTopBar(width, height);
    this.createSeasonProgress(width, height);
    this.createSeasonEntryButton(width, height);
    this.createTaskCenterButton(width, height);
    this.createTournamentButton(width, height);
    this.createInstructions(width, height);
    this.createControlsHint(width, height);
    this.createGarageButton(width, height);
  };

  proto.createBackground = function(width, height) {
    var skyGfx = this.add.graphics();
    skyGfx.fillGradientStyle(0x87ceeb, 0x87ceeb, 0xe0f6ff, 0xe0f6ff);
    skyGfx.fillRect(0, 0, width, height);

    var colors = [
      [0x6b8e23, 0x556b2f],
      [0x556b2f, 0x3e511f],
      [0x3e511f, 0x2d3e16],
      [0x2d3e16, 0x1e2b0e],
      [0x1e2b0e, 0x141d08]
    ];

    for (var i = 0; i < 5; i++) {
      var parallax = 0.2 + i * 0.1;
      var amp = 30 + i * 20;
      var baseY = 280 + i * 50;

      var gfx = this.add.graphics();
      var c1 = colors[i][0];
      var c2 = colors[i][1];
      gfx.fillGradientStyle(c1, c1, c2, c2);
      gfx.beginPath();
      gfx.moveTo(0, height);

      for (var x = 0; x <= width; x += 8) {
        var wx = x / parallax;
        var n = Math.sin(wx * 0.006 + i * 2) * 0.5 + Math.sin(wx * 0.015 + i * 5) * 0.3;
        var y = baseY + n * amp;
        gfx.lineTo(x, y);
      }

      gfx.lineTo(width, height);
      gfx.closePath();
      gfx.fillPath();
      gfx.setDepth(-10 + i);
    }

    for (var j = 0; j < 5; j++) {
      this.createCloud(
        Phaser.Math.Between(50, width - 50),
        Phaser.Math.Between(30, 140),
        0.4 + Math.random() * 0.5
      );
    }
  };

  proto.createCloud = function(x, y, scale) {
    var gfx = this.add.graphics();
    gfx.fillStyle(0xffffff, 0.85);
    var s = scale;
    gfx.fillCircle(0, 0, 25 * s);
    gfx.fillCircle(30 * s, -5 * s, 22 * s);
    gfx.fillCircle(52 * s, 0, 26 * s);
    gfx.fillCircle(20 * s, 8 * s, 18 * s);
    gfx.x = x;
    gfx.y = y;
    gfx.setDepth(-5);
  };

  proto.createTitle = function(width, height) {
    var titleY = 80;

    var titleShadow = this.add.text(width / 2 + 4, titleY + 4, '🏁 山地赛车', {
      fontSize: '56px',
      fontWeight: 'bold',
      color: '#000000',
      stroke: '#000000',
      strokeThickness: 0
    }).setOrigin(0.5).setAlpha(0.3);

    var title = this.add.text(width / 2, titleY, '🏁 山地赛车', {
      fontSize: '56px',
      fontWeight: 'bold',
      color: '#ffffff',
      stroke: '#1a5235',
      strokeThickness: 8
    }).setOrigin(0.5);

    this.tweens.add({
      targets: [title, titleShadow],
      y: titleY + 6,
      duration: 1500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });

    this.add.text(width / 2, 145, 'MOUNTAIN RACER', {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#ffffff',
      stroke: '#ff6b35',
      strokeThickness: 3,
      letterSpacing: 6
    }).setOrigin(0.5);
  };

  proto.createTopBar = function(width, height) {
    var coins = this.garageMgr.getCoins();
    var power = this.garageMgr.getCurrentPerformanceRating();

    var coinsContainer = this.add.container(width - 30, 50);
    var coinBg = this.add.graphics();
    coinBg.fillStyle(0xffd700, 0.25);
    coinBg.lineStyle(2, 0xffd700, 0.9);
    coinBg.fillRoundedRect(-130, -20, 130, 40, 10);
    coinBg.strokeRoundedRect(-130, -20, 130, 40, 10);
    this.coinsText = this.add.text(-8, 0, '💰 ' + coins, {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#ffd700'
    }).setOrigin(0, 0.5);
    coinsContainer.add([coinBg, this.coinsText]);

    var powerContainer = this.add.container(30, 50);
    var powerBg = this.add.graphics();
    powerBg.fillStyle(0x4a90d9, 0.25);
    powerBg.lineStyle(2, 0x4a90d9, 0.9);
    powerBg.fillRoundedRect(0, -20, 150, 40, 10);
    powerBg.strokeRoundedRect(0, -20, 150, 40, 10);
    this.powerText = this.add.text(75, 0, '⚡ 战力: ' + power, {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#4a90d9'
    }).setOrigin(0.5);
    powerContainer.add([powerBg, this.powerText]);
  };

  proto.createGarageButton = function(width, height) {
    var btnX = width / 2;
    var btnY = 540;
    var btnW = 200;
    var btnH = 50;

    var container = this.add.container(btnX, btnY);
    container.setSize(btnW, btnH);

    var gfx = this.add.graphics();
    gfx.fillStyle(0x4a90d9, 0.95);
    gfx.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 14);
    gfx.lineGradientStyle(3, 0x6ab0ff, 0x6ab0ff, 0x4a90d9, 0x4a90d9, 1);
    gfx.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 14);

    var txt = this.add.text(0, 0, '🔧 前往改装工坊', {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#ffffff',
      stroke: '#1a3a6a',
      strokeThickness: 3
    }).setOrigin(0.5);

    container.add([gfx, txt]);

    var self = this;
    container.setInteractive(
      new Phaser.Geom.Rectangle(-btnW / 2, -btnH / 2, btnW, btnH),
      Phaser.Geom.Rectangle.Contains
    );
    container.on('pointerover', function() {
      self.tweens.add({ targets: this, scale: 1.06, duration: 150, ease: 'Power2' });
    });
    container.on('pointerout', function() {
      self.tweens.add({ targets: this, scale: 1.0, duration: 150, ease: 'Power2' });
    });
    container.on('pointerdown', function() {
      self.tweens.add({
        targets: this,
        scale: 0.95,
        duration: 80,
        yoyo: true,
        onComplete: function() {
          self.scene.start('GarageScene');
        }
      });
    });

    this.garageButton = container;
  };

  proto.createTaskCenterButton = function(width, height) {
    var btnX = width - 80;
    var btnY = 445;
    var btnW = 120;
    var btnH = 80;

    var container = this.add.container(btnX, btnY);
    container.setSize(btnW, btnH);

    var taskState = this.taskCenter.getTaskCenterIconState();

    var gfx = this.add.graphics();
    gfx.fillStyle(0x9c27b0, 0.95);
    gfx.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 14);
    gfx.lineGradientStyle(3, 0xce93d8, 0xce93d8, 0x7b1fa2, 0x7b1fa2, 1);
    gfx.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 14);

    var icon = this.add.text(0, -12, '📋', {
      fontSize: '32px'
    }).setOrigin(0.5);

    var label = this.add.text(0, 18, '任务中心', {
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#ffffff',
      stroke: '#4a148c',
      strokeThickness: 2
    }).setOrigin(0.5);

    container.add([gfx, icon, label]);

    if (taskState.hasClaimable) {
      var badgeBg = this.add.graphics();
      badgeBg.fillStyle(0xe94560, 1);
      badgeBg.fillCircle(btnW / 2 - 10, -btnH / 2 + 10, 16);
      badgeBg.lineStyle(2, 0xffffff, 1);
      badgeBg.strokeCircle(btnW / 2 - 10, -btnH / 2 + 10, 16);
      container.add(badgeBg);

      var badgeText = this.add.text(btnW / 2 - 10, -btnH / 2 + 10, taskState.claimableCount > 99 ? '99+' : taskState.claimableCount, {
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5);
      container.add(badgeText);

      this.tweens.add({
        targets: [badgeBg, badgeText],
        scale: 1.1,
        duration: 600,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1
      });
    }

    var self = this;
    container.setInteractive(
      new Phaser.Geom.Rectangle(-btnW / 2, -btnH / 2, btnW, btnH),
      Phaser.Geom.Rectangle.Contains
    );
    container.on('pointerover', function() {
      self.tweens.add({ targets: this, scale: 1.08, duration: 150, ease: 'Power2' });
    });
    container.on('pointerout', function() {
      self.tweens.add({ targets: this, scale: 1.0, duration: 150, ease: 'Power2' });
    });
    container.on('pointerdown', function() {
      self.tweens.add({
        targets: this,
        scale: 0.95,
        duration: 80,
        yoyo: true,
        onComplete: function() {
          self.scene.start('TaskCenterScene');
        }
      });
    });

    this.taskCenterButton = container;
  };

  proto.createTournamentButton = function(width, height) {
    var btnX = 80;
    var btnY = 445;
    var btnW = 120;
    var btnH = 80;

    var container = this.add.container(btnX, btnY);
    container.setSize(btnW, btnH);

    var tournamentState = this.tournamentMgr.getTournamentIconState();

    var gfx = this.add.graphics();
    gfx.fillStyle(0x009688, 0.95);
    gfx.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 14);
    gfx.lineGradientStyle(3, 0x4db6ac, 0x4db6ac, 0x00796b, 0x00796b, 1);
    gfx.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 14);

    var icon = this.add.text(0, -12, '🏟️', {
      fontSize: '32px'
    }).setOrigin(0.5);

    var label = this.add.text(0, 18, '赛事大厅', {
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#ffffff',
      stroke: '#004d40',
      strokeThickness: 2
    }).setOrigin(0.5);

    container.add([gfx, icon, label]);

    if (tournamentState.hasClaimable) {
      var badgeBg = this.add.graphics();
      badgeBg.fillStyle(0xe94560, 1);
      badgeBg.fillCircle(btnW / 2 - 10, -btnH / 2 + 10, 16);
      badgeBg.lineStyle(2, 0xffffff, 1);
      badgeBg.strokeCircle(btnW / 2 - 10, -btnH / 2 + 10, 16);
      container.add(badgeBg);

      var badgeText = this.add.text(btnW / 2 - 10, -btnH / 2 + 10, tournamentState.claimableCount > 99 ? '99+' : tournamentState.claimableCount, {
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5);
      container.add(badgeText);

      this.tweens.add({
        targets: [badgeBg, badgeText],
        scale: 1.1,
        duration: 600,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1
      });
    } else if (tournamentState.activeCount > 0) {
      var activeBadge = this.add.graphics();
      activeBadge.fillStyle(0x4caf50, 1);
      activeBadge.fillCircle(btnW / 2 - 10, -btnH / 2 + 10, 14);
      activeBadge.lineStyle(2, 0xffffff, 1);
      activeBadge.strokeCircle(btnW / 2 - 10, -btnH / 2 + 10, 14);
      container.add(activeBadge);

      var activeText = this.add.text(btnW / 2 - 10, -btnH / 2 + 10, '' + tournamentState.activeCount, {
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5);
      container.add(activeText);
    }

    var self = this;
    container.setInteractive(
      new Phaser.Geom.Rectangle(-btnW / 2, -btnH / 2, btnW, btnH),
      Phaser.Geom.Rectangle.Contains
    );
    container.on('pointerover', function() {
      self.tweens.add({ targets: this, scale: 1.08, duration: 150, ease: 'Power2' });
    });
    container.on('pointerout', function() {
      self.tweens.add({ targets: this, scale: 1.0, duration: 150, ease: 'Power2' });
    });
    container.on('pointerdown', function() {
      self.tweens.add({
        targets: this,
        scale: 0.95,
        duration: 80,
        yoyo: true,
        onComplete: function() {
          self.scene.start('TournamentScene');
        }
      });
    });

    this.tournamentButton = container;
  };

  proto.createInstructions = function(width, height) {
    var panelY = 445;
    var panelWidth = 680;
    var panelHeight = 80;

    var gfx = this.add.graphics();
    gfx.fillStyle(0x000000, 0.45);
    gfx.fillRoundedRect(width / 2 - panelWidth / 2, panelY - panelHeight / 2, panelWidth, panelHeight, 12);

    gfx.lineStyle(2, 0xffffff, 0.3);
    gfx.strokeRoundedRect(width / 2 - panelWidth / 2, panelY - panelHeight / 2, panelWidth, panelHeight, 12);

    this.add.text(width / 2, panelY - 25, '🎮 操作说明', {
      fontSize: '15px',
      fontWeight: 'bold',
      color: '#ffd700'
    }).setOrigin(0.5);

    this.add.text(width / 2, panelY + 10,
      '加速: W / ↑ / 空格   减速: S / ↓   空中平衡: A/D 或 ←/→',
      {
        fontSize: '14px',
        color: '#ffffff'
      }).setOrigin(0.5);
  };

  proto.createControlsHint = function(width, height) {
    var hint = this.add.text(width / 2, height - 25, '点击「开启赛季生涯」进入章节地图  |  移动端自动显示虚拟按键', {
      fontSize: '13px',
      color: '#ffffff',
      alpha: 0.8
    }).setOrigin(0.5);

    this.tweens.add({
      targets: hint,
      alpha: { from: 0.4, to: 0.9 },
      duration: 1200,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
  };

  proto.createSeasonProgress = function(width, height) {
    var summary = this.seasonDM.getSeasonSummary();
    var growthStats = this.carGrowth.getGrowthStats();
    var barY = 200;
    var barWidth = 520;
    var barHeight = 28;

    var container = this.add.container(width / 2, barY);

    var seasonInfo = this.seasonDM.getCurrentSeason();
    var label = this.add.text(-barWidth / 2, -18, '🏁 ' + (seasonInfo ? seasonInfo.name : '赛季生涯'), {
      fontSize: '15px',
      fontWeight: 'bold',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0, 0.5);
    container.add(label);

    var stars = this.seasonDM.getTotalStars();
    var maxStars = summary.maxStars || 57;
    var starText = this.add.text(barWidth / 2, -18,
      '⭐ ' + stars + ' / ' + maxStars, {
        fontSize: '15px',
        fontWeight: 'bold',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(1, 0.5);
    container.add(starText);

    var bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.4);
    bg.fillRoundedRect(-barWidth / 2, 0, barWidth, barHeight, 14);
    container.add(bg);

    var levelProgress = this.seasonDM.getSeasonLevelProgress();
    var progressWidth = (levelProgress.percent / 100) * (barWidth - 8);
    var progress = this.add.graphics();
    progress.fillGradientStyle(0xff6b35, 0xe65100, 0xff6b35, 0xe65100);
    progress.fillRoundedRect(-barWidth / 2 + 4, 4, Math.max(4, progressWidth), barHeight - 8, 10);
    container.add(progress);

    var levelInfo = 'Lv.' + this.seasonDM.getSeasonLevel();
    var pctText = this.add.text(0, barHeight / 2,
      levelInfo + '  ' + levelProgress.percent + '%', {
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5, 0.5);
    container.add(pctText);

    var statY = barY + 45;
    var stats = [
      { icon: '📊', label: '章节', value: summary.completedChapters + '/' + summary.chapters.length, color: '#4a90d9' },
      { icon: '🚩', label: '节点', value: summary.completedNodes + '/' + summary.totalNodes, color: '#4caf50' },
      { icon: '⚡', label: '战力', value: Math.floor(growthStats.currentPerformance), color: '#ff9800' },
      { icon: '🏎️', label: '车辆', value: growthStats.unlockedCars, color: '#9c27b0' }
    ];
    var statGap = barWidth / stats.length;

    for (var i = 0; i < stats.length; i++) {
      var stat = stats[i];
      var sx = -barWidth / 2 + statGap * i + statGap / 2;
      var statBg = this.add.graphics();
      statBg.fillStyle(0x000000, 0.35);
      statBg.fillRoundedRect(sx - 55, statY - 18, 110, 36, 10);
      statBg.lineStyle(1.5, stat.color, 0.7);
      statBg.strokeRoundedRect(sx - 55, statY - 18, 110, 36, 10);
      container.add(statBg);

      var statText = this.add.text(sx, statY, stat.icon + ' ' + stat.label + ': ' + stat.value, {
        fontSize: '13px',
        fontWeight: 'bold',
        color: stat.color
      }).setOrigin(0.5);
      container.add(statText);
    }

    this.seasonProgressContainer = container;
  };

  proto.createSeasonEntryButton = function(width, height) {
    var btnX = width / 2;
    var btnY = 340;
    var btnW = 380;
    var btnH = 110;

    var container = this.add.container(btnX, btnY);
    container.setSize(btnW, btnH);

    var gfx = this.add.graphics();
    gfx.fillStyle(0xff6b35, 0.95);
    gfx.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 20);
    gfx.lineGradientStyle(5, 0xffb74d, 0xffb74d, 0xe65100, 0xe65100, 1);
    gfx.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 20);

    var accent = this.add.graphics();
    accent.fillGradientStyle(0xffffff, 0xffffff, 0xffe0b2, 0xffe0b2);
    accent.fillRoundedRect(-btnW / 2 + 20, -btnH / 2 + 15, 8, btnH - 30, 4);

    var title = this.add.text(-25, -25, '🏁 开启赛季生涯', {
      fontSize: '30px',
      fontWeight: 'bold',
      color: '#ffffff',
      stroke: '#b71c1c',
      strokeThickness: 4
    }).setOrigin(0, 0.5);

    var currentChapter = this.seasonDM.getCurrentChapter();
    var chapterName = currentChapter ? currentChapter.name : '选择章节';
    var nextNode = this.seasonDM.getNextRecommendedNode();
    var subtitleText = nextNode && nextNode.node 
      ? '下一站: ' + nextNode.chapter.name + ' · ' + nextNode.node.name
      : '当前章节: ' + chapterName;

    var subtitle = this.add.text(-25, 15, subtitleText, {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#fff3e0'
    }).setOrigin(0, 0.5);

    var arrow = this.add.text(btnW / 2 - 40, 0, '➜', {
      fontSize: '40px',
      color: '#ffffff'
    }).setOrigin(0.5);

    container.add([gfx, accent, title, subtitle, arrow]);

    var self = this;
    container.setInteractive(
      new Phaser.Geom.Rectangle(-btnW / 2, -btnH / 2, btnW, btnH),
      Phaser.Geom.Rectangle.Contains
    );

    container.on('pointerover', function() {
      self.tweens.add({
        targets: container,
        scale: 1.03,
        duration: 150,
        ease: 'Power2'
      });
      self.tweens.add({
        targets: arrow,
        x: btnW / 2 - 30,
        duration: 150,
        ease: 'Power2'
      });
    });

    container.on('pointerout', function() {
      self.tweens.add({
        targets: container,
        scale: 1.0,
        duration: 150,
        ease: 'Power2'
      });
      self.tweens.add({
        targets: arrow,
        x: btnW / 2 - 40,
        duration: 150,
        ease: 'Power2'
      });
    });

    container.on('pointerdown', function() {
      self.tweens.add({
        targets: container,
        scale: 0.97,
        duration: 80,
        yoyo: true,
        onComplete: function() {
          self.scene.start('ChapterMapScene');
        }
      });
    });

    this.tweens.add({
      targets: arrow,
      x: btnW / 2 - 35,
      duration: 1000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });

    this.seasonEntryButton = container;
  };

  proto.isLevelUnlocked = function(level) {
    return this.unlockMgr.isLevelUnlocked(level);
  };

  proto.getHighScore = function(level) {
    return this.highScoreMgr.getHighScore(level);
  };

  window.MountainRacer = MountainRacer;
})();
