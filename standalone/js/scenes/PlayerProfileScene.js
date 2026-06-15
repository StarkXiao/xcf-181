(function() {
  var MountainRacer = window.MountainRacer || {};

  MountainRacer.PlayerProfileScene = function() {
    Phaser.Scene.call(this, { key: 'PlayerProfileScene' });
  };

  MountainRacer.PlayerProfileScene.prototype = Object.create(Phaser.Scene.prototype);
  MountainRacer.PlayerProfileScene.prototype.constructor = MountainRacer.PlayerProfileScene;

  var proto = MountainRacer.PlayerProfileScene.prototype;

  proto.init = function(data) {
    this.dataManager = MountainRacer.DataManager.getInstance();
    this.dataManager.init();
    this.profileMgr = this.dataManager.getPlayerProfileManager();
    this.activeTab = 'overview';
    this.tabContentElements = [];
  };

  proto.create = function() {
    var width = this.scale.width;
    var height = this.scale.height;

    this.createBackground(width, height);
    this.createHeader(width, height);
    this.createTabs(width, height);
    this.showTab('overview');
    this.createBackButton(width, height);
  };

  proto.createBackground = function(width, height) {
    var bg = this.add.graphics();
    bg.fillGradientStyle(0x1a237e, 0x1a237e, 0x0d47a1, 0x0d47a1);
    bg.fillRect(0, 0, width, height);

    for (var i = 0; i < 20; i++) {
      var star = this.add.graphics();
      star.fillStyle(0xffffff, 0.5 + Math.random() * 0.5);
      star.fillCircle(0, 0, 1 + Math.random() * 2);
      star.x = Math.random() * width;
      star.y = Math.random() * height;
    }
  };

  proto.createHeader = function(width, height) {
    var profile = this.profileMgr.getProfileSummary();
    if (!profile) return;

    var headerY = 60;
    var container = this.add.container(width / 2, headerY);

    var bg = this.add.graphics();
    bg.fillStyle(0xffffff, 0.1);
    bg.fillRoundedRect(-width / 2 + 20, -45, width - 40, 90, 16);
    bg.lineStyle(2, 0xffffff, 0.2);
    bg.strokeRoundedRect(-width / 2 + 20, -45, width - 40, 90, 16);
    container.add(bg);

    var avatarBg = this.add.graphics();
    avatarBg.fillStyle(0xffd700, 0.3);
    avatarBg.fillCircle(-width / 2 + 65, 0, 35);
    avatarBg.lineStyle(3, 0xffd700, 0.8);
    avatarBg.strokeCircle(-width / 2 + 65, 0, 35);
    container.add(avatarBg);

    var avatarText = this.add.text(-width / 2 + 65, 0, profile.avatar, {
      fontSize: '36px'
    }).setOrigin(0.5);
    container.add(avatarText);

    var nameText = this.add.text(-width / 2 + 115, -18, profile.name, {
      fontSize: '22px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0, 0.5);
    container.add(nameText);

    var titleText = this.add.text(-width / 2 + 115, 8, '🎖️ ' + profile.title, {
      fontSize: '14px',
      color: '#ffd700'
    }).setOrigin(0, 0.5);
    container.add(titleText);

    var levelBg = this.add.graphics();
    levelBg.fillStyle(0x4a90d9, 0.8);
    levelBg.fillRoundedRect(width / 2 - 180, -25, 80, 28, 14);
    container.add(levelBg);

    var levelText = this.add.text(width / 2 - 140, -11, 'Lv.' + profile.level, {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    container.add(levelText);

    var xpBarBg = this.add.graphics();
    xpBarBg.fillStyle(0x000000, 0.3);
    xpBarBg.fillRoundedRect(width / 2 - 180, 10, 160, 12, 6);
    container.add(xpBarBg);

    var xpProgress = profile.xp % 500;
    var xpPercent = (xpProgress / 500);
    var xpBarFill = this.add.graphics();
    xpBarFill.fillStyle(0x4caf50, 0.9);
    xpBarFill.fillRoundedRect(width / 2 - 178, 12, Math.max(4, xpPercent * 156), 8, 4);
    container.add(xpBarFill);

    var xpText = this.add.text(width / 2 - 100, 16, xpProgress + '/500 XP', {
      fontSize: '10px',
      color: '#ffffff'
    }).setOrigin(0.5);
    container.add(xpText);

    var winRateBg = this.add.graphics();
    winRateBg.fillStyle(0x4caf50, 0.8);
    winRateBg.fillRoundedRect(width / 2 - 90, -25, 70, 28, 14);
    container.add(winRateBg);

    var winRateText = this.add.text(width / 2 - 55, -11, profile.winRate + '% 胜率', {
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    container.add(winRateText);

    var speedBg = this.add.graphics();
    speedBg.fillStyle(0xff9800, 0.8);
    speedBg.fillRoundedRect(width / 2 - 15, -25, 85, 28, 14);
    container.add(speedBg);

    var speedText = this.add.text(width / 2 + 27, -11, '🚀 ' + profile.maxSpeed + ' km/h', {
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    container.add(speedText);
  };

  proto.createTabs = function(width, height) {
    var self = this;
    var tabY = 140;
    var tabWidth = 95;
    var tabHeight = 36;
    var tabGap = 8;
    var tabs = [
      { id: 'overview', label: '📊 总览', color: 0x4caf50 },
      { id: 'records', label: '🏆 战绩', color: 0xffd700 },
      { id: 'collision', label: '💥 碰撞', color: 0xf44336 },
      { id: 'dimensions', label: '📈 数据', color: 0x9c27b0 },
      { id: 'settings', label: '⚙️ 设置', color: 0x2196f3 }
    ];

    var totalTabW = tabs.length * tabWidth + (tabs.length - 1) * tabGap;
    var startX = width / 2 - totalTabW / 2 + tabWidth / 2;

    this.tabButtons = [];

    for (var i = 0; i < tabs.length; i++) {
      var tab = tabs[i];
      var tx = startX + i * (tabWidth + tabGap);

      var container = this.add.container(tx, tabY);
      container.setSize(tabWidth, tabHeight);
      container.tabId = tab.id;

      var tabBg = this.add.graphics();
      container.bg = tabBg;

      var updateVisual = function(selected, bg, label) {
        bg.clear();
        if (selected) {
          bg.fillStyle(0xffffff, 0.95);
          bg.fillRoundedRect(-tabWidth / 2, -tabHeight / 2, tabWidth, tabHeight, 10);
          bg.lineStyle(3, tab.color, 1);
          bg.strokeRoundedRect(-tabWidth / 2, -tabHeight / 2, tabWidth, tabHeight, 10);
          if (label) label.setColor('#333333');
        } else {
          bg.fillStyle(0xffffff, 0.15);
          bg.fillRoundedRect(-tabWidth / 2, -tabHeight / 2, tabWidth, tabHeight, 10);
          bg.lineStyle(2, 0xffffff, 0.3);
          bg.strokeRoundedRect(-tabWidth / 2, -tabHeight / 2, tabWidth, tabHeight, 10);
          if (label) label.setColor('#ffffff');
        }
      };

      var label = this.add.text(0, 0, tab.label, {
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5);
      container.label = label;

      updateVisual(tab.id === this.activeTab, tabBg, label);
      container.add(tabBg);
      container.add(label);

      container.setInteractive(
        new Phaser.Geom.Rectangle(-tabWidth / 2, -tabHeight / 2, tabWidth, tabHeight),
        Phaser.Geom.Rectangle.Contains
      );

      (function(tabId, containerRef, tabBg, tabLbl) {
        containerRef.on('pointerdown', function() {
          self.showTab(tabId);
        });

        containerRef.updateTabVisual = function(selected) {
          updateVisual(selected, tabBg, tabLbl);
        };
      })(tab.id, container, tabBg, label);

      this.tabButtons.push(container);
    }
  };

  proto.showTab = function(tabId) {
    this.activeTab = tabId;

    if (this.tabButtons) {
      for (var i = 0; i < this.tabButtons.length; i++) {
        var isSelected = this.tabButtons[i].tabId === tabId;
        this.tabButtons[i].updateTabVisual(isSelected);
      }
    }

    this.clearTabContent();

    switch (tabId) {
      case 'overview':
        this.createOverviewTab(this.scale.width, this.scale.height);
        break;
      case 'records':
        this.createRecordsTab(this.scale.width, this.scale.height);
        break;
      case 'collision':
        this.createCollisionTab(this.scale.width, this.scale.height);
        break;
      case 'dimensions':
        this.createDimensionsTab(this.scale.width, this.scale.height);
        break;
      case 'settings':
        this.createSettingsTab(this.scale.width, this.scale.height);
        break;
    }
  };

  proto.clearTabContent = function() {
    for (var i = 0; i < this.tabContentElements.length; i++) {
      var el = this.tabContentElements[i];
      if (el && el.destroy) el.destroy();
    }
    this.tabContentElements = [];
  };

  proto.addTabElement = function(el) {
    this.tabContentElements.push(el);
    return el;
  };

  proto.createOverviewTab = function(width, height) {
    var contentY = 195;
    var leftX = width / 2 - 180;
    var panelW = 360;

    var headerBg = this.add.graphics();
    headerBg.fillStyle(0xffffff, 0.1);
    headerBg.fillRoundedRect(leftX, contentY, panelW, 36, 12);
    this.addTabElement(headerBg);

    var headerText = this.add.text(width / 2, contentY + 18, '📊 生涯总览', {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.addTabElement(headerText);

    var career = this.profileMgr.getCareerStats();
    if (!career) return;

    var stats = [
      { icon: '🏁', label: '总场次', value: career.totalRaces, color: '#4a90d9' },
      { icon: '🏆', label: '胜利场次', value: career.totalWins, color: '#4caf50' },
      { icon: '📏', label: '总里程', value: (career.totalDistance / 1000).toFixed(1) + ' km', color: '#9c27b0' },
      { icon: '⏱', label: '游戏时长', value: this.formatPlayTime(career.totalPlayTime), color: '#ff9800' },
      { icon: '💰', label: '总金币', value: career.totalCoinsEarned, color: '#ffd700' },
      { icon: '💯', label: '完美通关', value: career.perfectRuns, color: '#e91e63' },
      { icon: '🔥', label: '当前连胜', value: career.currentWinStreak, color: '#ff5722' },
      { icon: '👑', label: '最长连胜', value: career.bestWinStreak, color: '#ff6b35' }
    ];

    var statStartY = contentY + 50;
    var statRowH = 50;
    var statGap = 8;

    for (var i = 0; i < stats.length; i++) {
      var stat = stats[i];
      var row = Math.floor(i / 2);
      var col = i % 2;
      var sx = leftX + col * (panelW / 2 + 4);
      var sy = statStartY + row * (statRowH + statGap);

      var statBg = this.add.graphics();
      statBg.fillStyle(0xffffff, 0.08);
      statBg.fillRoundedRect(sx, sy, panelW / 2 - 4, statRowH, 10);
      statBg.lineStyle(1.5, this.hexToColor(stat.color), 0.5);
      statBg.strokeRoundedRect(sx, sy, panelW / 2 - 4, statRowH, 10);
      this.addTabElement(statBg);

      var iconT = this.add.text(sx + 15, sy + 15, stat.icon, {
        fontSize: '20px'
      }).setOrigin(0, 0.5);
      this.addTabElement(iconT);

      var valT = this.add.text(sx + 50, sy + 15, stat.value.toString(), {
        fontSize: '18px',
        fontWeight: 'bold',
        color: stat.color
      }).setOrigin(0, 0.5);
      this.addTabElement(valT);

      var lblT = this.add.text(sx + 15, sy + 35, stat.label, {
        fontSize: '11px',
        color: '#aaaaaa'
      }).setOrigin(0, 0.5);
      this.addTabElement(lblT);
    }

    var perf = this.profileMgr.getPerformanceStats();
    if (perf) {
      var perfY = statStartY + Math.ceil(stats.length / 2) * (statRowH + statGap) + 20;

      var perfHeaderBg = this.add.graphics();
      perfHeaderBg.fillStyle(0xffffff, 0.1);
      perfHeaderBg.fillRoundedRect(leftX, perfY, panelW, 32, 10);
      this.addTabElement(perfHeaderBg);

      var perfHeaderT = this.add.text(width / 2, perfY + 16, '📈 平均表现', {
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5);
      this.addTabElement(perfHeaderT);

      var avgStats = [
        { icon: '🏆', label: '场均得分', value: perf.avgScorePerRace, color: '#ffd700' },
        { icon: '❤️', label: '场均剩余生命', value: perf.avgHealthRemaining + '%', color: '#e91e63' },
        { icon: '🔥', label: '场均最高连击', value: perf.avgComboPerRace, color: '#ff5722' },
        { icon: '🗺️', label: '场均探索路线', value: perf.avgBranchesExplored + ' 条', color: '#9c27b0' }
      ];

      for (var j = 0; j < avgStats.length; j++) {
        var aStat = avgStats[j];
        var aRow = Math.floor(j / 2);
        var aCol = j % 2;
        var ax = leftX + aCol * (panelW / 2 + 4);
        var ay = perfY + 42 + aRow * 42;

        var aStatBg = this.add.graphics();
        aStatBg.fillStyle(0xffffff, 0.05);
        aStatBg.fillRoundedRect(ax, ay, panelW / 2 - 4, 36, 8);
        this.addTabElement(aStatBg);

        var aIconT = this.add.text(ax + 12, ay + 18, aStat.icon + ' ' + aStat.label, {
          fontSize: '11px',
          color: '#cccccc'
        }).setOrigin(0, 0.5);
        this.addTabElement(aIconT);

        var aValT = this.add.text(ax + panelW / 2 - 16, ay + 18, aStat.value.toString(), {
          fontSize: '14px',
          fontWeight: 'bold',
          color: aStat.color
        }).setOrigin(1, 0.5);
        this.addTabElement(aValT);
      }
    }
  };

  proto.createRecordsTab = function(width, height) {
    var contentY = 195;
    var leftX = width / 2 - 180;
    var panelW = 360;

    var headerBg = this.add.graphics();
    headerBg.fillStyle(0xffffff, 0.1);
    headerBg.fillRoundedRect(leftX, contentY, panelW, 36, 12);
    this.addTabElement(headerBg);

    var headerText = this.add.text(width / 2, contentY + 18, '🏆 历史战绩与最快记录', {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.addTabElement(headerText);

    var speedRecords = this.profileMgr.getSpeedRecords();
    if (speedRecords) {
      var maxSpeedY = contentY + 50;
      var maxSpeedBg = this.add.graphics();
      maxSpeedBg.fillStyle(0xffd700, 0.15);
      maxSpeedBg.fillRoundedRect(leftX, maxSpeedY, panelW, 56, 12);
      maxSpeedBg.lineStyle(2, 0xffd700, 0.6);
      maxSpeedBg.strokeRoundedRect(leftX, maxSpeedY, panelW, 56, 12);
      this.addTabElement(maxSpeedBg);

      var maxSpeedIcon = this.add.text(leftX + 20, maxSpeedY + 28, '🚀', {
        fontSize: '32px'
      }).setOrigin(0, 0.5);
      this.addTabElement(maxSpeedIcon);

      var maxSpeedLbl = this.add.text(leftX + 60, maxSpeedY + 15, '最高时速', {
        fontSize: '12px',
        color: '#aaaaaa'
      }).setOrigin(0, 0.5);
      this.addTabElement(maxSpeedLbl);

      var maxSpeedVal = this.add.text(leftX + 60, maxSpeedY + 35, speedRecords.maxSpeed + ' km/h', {
        fontSize: '22px',
        fontWeight: 'bold',
        color: '#ffd700'
      }).setOrigin(0, 0.5);
      this.addTabElement(maxSpeedVal);

      if (speedRecords.fastestLevel && speedRecords.fastestTime !== Infinity) {
        var fastLvl = speedRecords.fastestLevel.replace('level_', '');
        var fastLbl = this.add.text(width / 2 + 80, maxSpeedY + 15, '最快通关', {
          fontSize: '11px',
          color: '#aaaaaa',
          align: 'center'
        }).setOrigin(0.5);
        this.addTabElement(fastLbl);

        var fastVal = this.add.text(width / 2 + 80, maxSpeedY + 35,
          'L' + fastLvl + ' ' + this.profileMgr.formatTime(speedRecords.fastestTime), {
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#4caf50',
            align: 'center'
          }).setOrigin(0.5);
        this.addTabElement(fastVal);
      }
    }

    var levelTimesY = contentY + 120;
    var timesHeaderBg = this.add.graphics();
    timesHeaderBg.fillStyle(0xffffff, 0.08);
    timesHeaderBg.fillRoundedRect(leftX, levelTimesY, panelW, 30, 8);
    this.addTabElement(timesHeaderBg);

    var timesHeaderT = this.add.text(width / 2, levelTimesY + 15, '⏱ 各关卡最快记录', {
      fontSize: '13px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.addTabElement(timesHeaderT);

    var config = MountainRacer.LEVEL_CONFIGS || {};
    var levelCount = Math.max(3, Object.keys(config).length);

    for (var lvl = 1; lvl <= levelCount; lvl++) {
      var ly = levelTimesY + 38 + (lvl - 1) * 40;
      var levelConfig = config[lvl] || { name: '关卡 ' + lvl };

      var lvlBg = this.add.graphics();
      lvlBg.fillStyle(0xffffff, 0.05);
      lvlBg.fillRoundedRect(leftX, ly, panelW, 34, 8);
      this.addTabElement(lvlBg);

      var lvlNumBg = this.add.graphics();
      lvlNumBg.fillStyle(0x4a90d9, 0.8);
      lvlNumBg.fillRoundedRect(leftX + 8, ly + 5, 30, 24, 6);
      this.addTabElement(lvlNumBg);

      var lvlNumT = this.add.text(leftX + 23, ly + 17, lvl.toString(), {
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5);
      this.addTabElement(lvlNumT);

      var lvlNameT = this.add.text(leftX + 48, ly + 17, levelConfig.name, {
        fontSize: '12px',
        color: '#cccccc'
      }).setOrigin(0, 0.5);
      this.addTabElement(lvlNameT);

      var bestTime = this.profileMgr.getLevelBestTime(lvl);
      var timeT = this.add.text(leftX + panelW - 15, ly + 17,
        bestTime ? this.profileMgr.formatTime(bestTime) : '--:--.--', {
          fontSize: '14px',
          fontWeight: 'bold',
          color: bestTime ? '#4caf50' : '#666666'
        }).setOrigin(1, 0.5);
      this.addTabElement(timeT);

      if (bestTime) {
        var crownT = this.add.text(leftX + panelW - 100, ly + 17, '👑', {
          fontSize: '14px'
        }).setOrigin(1, 0.5);
        this.addTabElement(crownT);
      }
    }

    var recentY = levelTimesY + 38 + levelCount * 40 + 15;
    var recentHeaderBg = this.add.graphics();
    recentHeaderBg.fillStyle(0xffffff, 0.08);
    recentHeaderBg.fillRoundedRect(leftX, recentY, panelW, 30, 8);
    this.addTabElement(recentHeaderBg);

    var recentHeaderT = this.add.text(width / 2, recentY + 15, '📋 最近活动记录', {
      fontSize: '13px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.addTabElement(recentHeaderT);

    var recentActivity = this.profileMgr.getRecentActivity(5);
    if (recentActivity.length === 0) {
      var noActivityT = this.add.text(width / 2, recentY + 55, '暂无活动记录', {
        fontSize: '13px',
        color: '#888888',
        fontStyle: 'italic'
      }).setOrigin(0.5);
      this.addTabElement(noActivityT);
    } else {
      for (var a = 0; a < recentActivity.length; a++) {
        var activity = recentActivity[a];
        var ay = recentY + 38 + a * 36;

        var actBg = this.add.graphics();
        actBg.fillStyle(a % 2 === 0 ? 0xffffff : 0xffffff, a % 2 === 0 ? 0.05 : 0.03);
        actBg.fillRoundedRect(leftX, ay, panelW, 30, 6);
        this.addTabElement(actBg);

        var resultIcon = activity.won ? '✅' : '❌';
        var actIconT = this.add.text(leftX + 15, ay + 15, resultIcon, {
          fontSize: '16px'
        }).setOrigin(0, 0.5);
        this.addTabElement(actIconT);

        var actLvlT = this.add.text(leftX + 40, ay + 15, '关卡 ' + activity.level, {
          fontSize: '12px',
          color: '#cccccc'
        }).setOrigin(0, 0.5);
        this.addTabElement(actLvlT);

        var actScoreT = this.add.text(leftX + 110, ay + 15, activity.score + ' 分', {
          fontSize: '12px',
          fontWeight: 'bold',
          color: '#ffd700'
        }).setOrigin(0, 0.5);
        this.addTabElement(actScoreT);

        if (activity.grade) {
          var gradeColors = { S: '#ffd700', A: '#ff6b35', B: '#4caf50', C: '#2196f3' };
          var actGradeT = this.add.text(leftX + 190, ay + 15, activity.grade + '级', {
            fontSize: '11px',
            fontWeight: 'bold',
            color: gradeColors[activity.grade] || '#ffffff'
          }).setOrigin(0, 0.5);
          this.addTabElement(actGradeT);
        }

        var actTimeT = this.add.text(leftX + panelW - 15, ay + 15,
          this.profileMgr.formatTime(activity.time), {
            fontSize: '11px',
            color: '#888888'
          }).setOrigin(1, 0.5);
        this.addTabElement(actTimeT);
      }
    }
  };

  proto.createCollisionTab = function(width, height) {
    var contentY = 195;
    var leftX = width / 2 - 180;
    var panelW = 360;

    var headerBg = this.add.graphics();
    headerBg.fillStyle(0xffffff, 0.1);
    headerBg.fillRoundedRect(leftX, contentY, panelW, 36, 12);
    this.addTabElement(headerBg);

    var headerText = this.add.text(width / 2, contentY + 18, '💥 碰撞统计分析', {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.addTabElement(headerText);

    var collision = this.profileMgr.getCollisionStats();
    if (!collision) return;

    var summaryStartY = contentY + 50;
    var summaryStats = [
      { icon: '💥', label: '总碰撞次数', value: collision.totalCollisions, color: '#f44336' },
      { icon: '❤️', label: '累计受伤', value: collision.damageTaken, color: '#e91e63' },
      { icon: '📊', label: '场均碰撞', value: collision.collisionsPerRace, color: '#ff9800' },
      { icon: '🛡️', label: '单场最少', value: collision.leastCollisionsInRace === Infinity ? 0 : collision.leastCollisionsInRace, color: '#4caf50' },
      { icon: '✨', label: '零碰撞场次', value: collision.collisionFreeRaces, color: '#00bcd4' }
    ];

    for (var s = 0; s < summaryStats.length; s++) {
      var stat = summaryStats[s];
      var sy = summaryStartY + s * 42;

      var statBg = this.add.graphics();
      statBg.fillStyle(0xffffff, 0.06);
      statBg.fillRoundedRect(leftX, sy, panelW, 36, 10);
      this.addTabElement(statBg);

      var iconT = this.add.text(leftX + 15, sy + 18, stat.icon, {
        fontSize: '18px'
      }).setOrigin(0, 0.5);
      this.addTabElement(iconT);

      var labelT = this.add.text(leftX + 45, sy + 18, stat.label, {
        fontSize: '12px',
        color: '#cccccc'
      }).setOrigin(0, 0.5);
      this.addTabElement(labelT);

      var valT = this.add.text(leftX + panelW - 20, sy + 18, stat.value.toString(), {
        fontSize: '16px',
        fontWeight: 'bold',
        color: stat.color
      }).setOrigin(1, 0.5);
      this.addTabElement(valT);
    }

    var breakdownY = summaryStartY + summaryStats.length * 42 + 15;
    var breakdownHeaderBg = this.add.graphics();
    breakdownHeaderBg.fillStyle(0xffffff, 0.08);
    breakdownHeaderBg.fillRoundedRect(leftX, breakdownY, panelW, 30, 8);
    this.addTabElement(breakdownHeaderBg);

    var breakdownHeaderT = this.add.text(width / 2, breakdownY + 15, '📊 碰撞类型分布', {
      fontSize: '13px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.addTabElement(breakdownHeaderT);

    var typeIcons = {
      rock: { icon: '🪨', label: '撞石', color: '#8d6e63' },
      barrel: { icon: '🛢️', label: '油桶', color: '#ff9800' },
      crate: { icon: '📦', label: '木箱', color: '#795548' },
      sign: { icon: '🪧', label: '路牌', color: '#2196f3' },
      dangerZone: { icon: '⚠️', label: '危险区', color: '#f44336' },
      rollover: { icon: '🔄', label: '翻车', color: '#9c27b0' }
    };

    var breakdown = collision.collisionTypeBreakdown;
    var types = Object.keys(breakdown);
    var totalForPct = collision.totalCollisions || 1;

    var chartY = breakdownY + 38;
    var chartH = types.length * 32;

    var chartBg = this.add.graphics();
    chartBg.fillStyle(0xffffff, 0.03);
    chartBg.fillRoundedRect(leftX, chartY, panelW, chartH + 10, 8);
    this.addTabElement(chartBg);

    for (var t = 0; t < types.length; t++) {
      var type = types[t];
      var typeInfo = typeIcons[type] || { icon: '❓', label: type, color: '#888888' };
      var count = breakdown[type] || 0;
      var pct = Math.round((count / totalForPct) * 100);
      var ty = chartY + 8 + t * 32;

      var typeIconT = this.add.text(leftX + 12, ty + 12, typeInfo.icon, {
        fontSize: '14px'
      }).setOrigin(0, 0.5);
      this.addTabElement(typeIconT);

      var typeLblT = this.add.text(leftX + 35, ty + 12, typeInfo.label, {
        fontSize: '11px',
        color: '#cccccc'
      }).setOrigin(0, 0.5);
      this.addTabElement(typeLblT);

      var barBg = this.add.graphics();
      barBg.fillStyle(0x000000, 0.2);
      barBg.fillRoundedRect(leftX + 90, ty + 4, 180, 16, 4);
      this.addTabElement(barBg);

      if (count > 0) {
        var barFill = this.add.graphics();
        barFill.fillStyle(this.hexToColor(typeInfo.color), 0.8);
        barFill.fillRoundedRect(leftX + 90, ty + 4, Math.max(4, (pct / 100) * 180), 16, 4);
        this.addTabElement(barFill);
      }

      var countT = this.add.text(leftX + 275, ty + 12, count + ' 次', {
        fontSize: '11px',
        fontWeight: 'bold',
        color: typeInfo.color
      }).setOrigin(0, 0.5);
      this.addTabElement(countT);

      var pctT = this.add.text(leftX + panelW - 15, ty + 12, pct + '%', {
        fontSize: '10px',
        color: '#888888'
      }).setOrigin(1, 0.5);
      this.addTabElement(pctT);
    }

    var perf = this.profileMgr.getPerformanceStats();
    if (perf) {
      var gradeY = chartY + chartH + 20;
      var gradeHeaderBg = this.add.graphics();
      gradeHeaderBg.fillStyle(0xffffff, 0.08);
      gradeHeaderBg.fillRoundedRect(leftX, gradeY, panelW, 30, 8);
      this.addTabElement(gradeHeaderBg);

      var gradeHeaderT = this.add.text(width / 2, gradeY + 15, '📈 评级分布', {
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5);
      this.addTabElement(gradeHeaderT);

      var grades = ['S', 'A', 'B', 'C'];
      var gradeColors = { S: '#ffd700', A: '#ff6b35', B: '#4caf50', C: '#2196f3' };
      var gradeLabels = { S: 'S 级 (传奇)', A: 'A 级 (优秀)', B: 'B 级 (良好)', C: 'C 级 (普通)' };
      var totalGrades = 0;
      for (var g = 0; g < grades.length; g++) {
        totalGrades += perf.gradeDistribution[grades[g]] || 0;
      }

      for (var gIdx = 0; gIdx < grades.length; gIdx++) {
        var grade = grades[gIdx];
        var gradeCount = perf.gradeDistribution[grade] || 0;
        var gradePct = totalGrades > 0 ? Math.round((gradeCount / totalGrades) * 100) : 0;
        var gy = gradeY + 38 + gIdx * 36;

        var gBg = this.add.graphics();
        gBg.fillStyle(0xffffff, 0.05);
        gBg.fillRoundedRect(leftX, gy, panelW, 30, 8);
        this.addTabElement(gBg);

        var gLblT = this.add.text(leftX + 15, gy + 15, gradeLabels[grade], {
          fontSize: '11px',
          color: '#cccccc'
        }).setOrigin(0, 0.5);
        this.addTabElement(gLblT);

        var gBarBg = this.add.graphics();
        gBarBg.fillStyle(0x000000, 0.2);
        gBarBg.fillRoundedRect(leftX + 130, gy + 5, 140, 20, 5);
        this.addTabElement(gBarBg);

        if (gradeCount > 0) {
          var gBarFill = this.add.graphics();
          gBarFill.fillStyle(this.hexToColor(gradeColors[grade]), 0.85);
          gBarFill.fillRoundedRect(leftX + 130, gy + 5, Math.max(4, (gradePct / 100) * 140), 20, 5);
          this.addTabElement(gBarFill);
        }

        var gCountT = this.add.text(leftX + 275, gy + 15, gradeCount + ' 次', {
          fontSize: '11px',
          fontWeight: 'bold',
          color: gradeColors[grade]
        }).setOrigin(0, 0.5);
        this.addTabElement(gCountT);

        var gPctT = this.add.text(leftX + panelW - 15, gy + 15, gradePct + '%', {
          fontSize: '10px',
          color: '#888888'
        }).setOrigin(1, 0.5);
        this.addTabElement(gPctT);
      }

      if (perf.bestGrade) {
        var bestY = gradeY + 38 + grades.length * 36 + 15;
        var bestBg = this.add.graphics();
        bestBg.fillStyle(0xffd700, 0.15);
        bestBg.fillRoundedRect(leftX, bestY, panelW, 44, 12);
        bestBg.lineStyle(2, 0xffd700, 0.6);
        bestBg.strokeRoundedRect(leftX, bestY, panelW, 44, 12);
        this.addTabElement(bestBg);

        var bestLblT = this.add.text(leftX + 20, bestY + 22, '🏆 历史最高评级', {
          fontSize: '14px',
          color: '#cccccc'
        }).setOrigin(0, 0.5);
        this.addTabElement(bestLblT);

        var bestValT = this.add.text(leftX + panelW - 30, bestY + 22, perf.bestGrade + ' 级', {
          fontSize: '24px',
          fontWeight: 'bold',
          color: gradeColors[perf.bestGrade] || '#ffffff'
        }).setOrigin(1, 0.5);
        this.addTabElement(bestValT);
      }
    }
  };

  proto.createDimensionsTab = function(width, height) {
    var contentY = 195;
    var leftX = width / 2 - 180;
    var panelW = 360;

    var headerBg = this.add.graphics();
    headerBg.fillStyle(0xffffff, 0.1);
    headerBg.fillRoundedRect(leftX, contentY, panelW, 36, 12);
    this.addTabElement(headerBg);

    var headerText = this.add.text(width / 2, contentY + 18, '📈 六维能力雷达图', {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.addTabElement(headerText);

    var dims = this.profileMgr.getDimensionStats();
    if (!dims) return;

    var radarCenterX = width / 2;
    var radarCenterY = contentY + 160;
    var radarRadius = 100;

    var radarBg = this.add.graphics();
    radarBg.fillStyle(0xffffff, 0.05);
    radarBg.fillRoundedRect(leftX, contentY + 50, panelW, 240, 12);
    this.addTabElement(radarBg);

    var dimList = [
      { id: 'speed', label: '速度', icon: '🚗', color: 0x2196f3, colorStr: '#2196f3' },
      { id: 'exploration', label: '探索', icon: '🗺️', color: 0x9c27b0, colorStr: '#9c27b0' },
      { id: 'skill', label: '技巧', icon: '🔥', color: 0xff5722, colorStr: '#ff5722' },
      { id: 'risk', label: '冒险', icon: '⚠️', color: 0xf44336, colorStr: '#f44336' },
      { id: 'survival', label: '生存', icon: '❤️', color: 0xe91e63, colorStr: '#e91e63' },
      { id: 'collection', label: '收集', icon: '💎', color: 0x00bcd4, colorStr: '#00bcd4' }
    ];

    for (var r = 1; r <= 4; r++) {
      var ringGfx = this.add.graphics();
      ringGfx.lineStyle(1, 0xffffff, 0.1);
      ringGfx.beginPath();
      for (var a = 0; a <= 6; a++) {
        var angle = (a / 6) * Math.PI * 2 - Math.PI / 2;
        var rx = radarCenterX + Math.cos(angle) * (radarRadius * r / 4);
        var ry = radarCenterY + Math.sin(angle) * (radarRadius * r / 4);
        if (a === 0) ringGfx.moveTo(rx, ry);
        else ringGfx.lineTo(rx, ry);
      }
      ringGfx.closePath();
      ringGfx.strokePath();
      this.addTabElement(ringGfx);
    }

    for (var axis = 0; axis < 6; axis++) {
      var axisAngle = (axis / 6) * Math.PI * 2 - Math.PI / 2;
      var axisGfx = this.add.graphics();
      axisGfx.lineStyle(1, 0xffffff, 0.15);
      axisGfx.beginPath();
      axisGfx.moveTo(radarCenterX, radarCenterY);
      axisGfx.lineTo(
        radarCenterX + Math.cos(axisAngle) * radarRadius,
        radarCenterY + Math.sin(axisAngle) * radarRadius
      );
      axisGfx.strokePath();
      this.addTabElement(axisGfx);
    }

    var radarFill = this.add.graphics();
    radarFill.beginPath();
    for (var d = 0; d < dimList.length; d++) {
      var dimData = dims[dimList[d].id] || { avg: 0 };
      var value = Math.min(100, Math.max(0, dimData.avg || 0));
      var dimAngle = (d / dimList.length) * Math.PI * 2 - Math.PI / 2;
      var dimRadius = (value / 100) * radarRadius;
      var dx = radarCenterX + Math.cos(dimAngle) * dimRadius;
      var dy = radarCenterY + Math.sin(dimAngle) * dimRadius;
      if (d === 0) radarFill.moveTo(dx, dy);
      else radarFill.lineTo(dx, dy);
    }
    radarFill.closePath();
    radarFill.fillStyle(0x9c27b0, 0.3);
    radarFill.fillPath();
    radarFill.lineStyle(2, 0xce93d8, 0.8);
    radarFill.strokePath();
    this.addTabElement(radarFill);

    for (var dIdx = 0; dIdx < dimList.length; dIdx++) {
      var dim = dimList[dIdx];
      var dData = dims[dim.id] || { avg: 0, best: 0 };
      var dAngle = (dIdx / dimList.length) * Math.PI * 2 - Math.PI / 2;
      var labelRadius = radarRadius + 25;
      var lx = radarCenterX + Math.cos(dAngle) * labelRadius;
      var ly = radarCenterY + Math.sin(dAngle) * labelRadius;

      var dimIconT = this.add.text(lx, ly - 8, dim.icon, {
        fontSize: '16px'
      }).setOrigin(0.5);
      this.addTabElement(dimIconT);

      var dimLblT = this.add.text(lx, ly + 8, dim.label + ' ' + dData.avg, {
        fontSize: '10px',
        fontWeight: 'bold',
        color: dim.colorStr
      }).setOrigin(0.5);
      this.addTabElement(dimLblT);
    }

    var statsStartY = contentY + 310;
    var statsHeaderBg = this.add.graphics();
    statsHeaderBg.fillStyle(0xffffff, 0.08);
    statsHeaderBg.fillRoundedRect(leftX, statsStartY, panelW, 30, 8);
    this.addTabElement(statsHeaderBg);

    var statsHeaderT = this.add.text(width / 2, statsStartY + 15, '📊 详细数据', {
      fontSize: '13px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.addTabElement(statsHeaderT);

    for (var sd = 0; sd < dimList.length; sd++) {
      var sDim = dimList[sd];
      var sData = dims[sDim.id] || { avg: 0, best: 0, count: 0 };
      var sy = statsStartY + 38 + sd * 34;

      var sBg = this.add.graphics();
      sBg.fillStyle(sd % 2 === 0 ? 0xffffff : 0xffffff, sd % 2 === 0 ? 0.05 : 0.03);
      sBg.fillRoundedRect(leftX, sy, panelW, 30, 8);
      this.addTabElement(sBg);

      var sIconT = this.add.text(leftX + 12, sy + 15, sDim.icon, {
        fontSize: '14px'
      }).setOrigin(0, 0.5);
      this.addTabElement(sIconT);

      var sLblT = this.add.text(leftX + 35, sy + 15, sDim.label, {
        fontSize: '12px',
        color: '#cccccc'
      }).setOrigin(0, 0.5);
      this.addTabElement(sLblT);

      var sBarBg = this.add.graphics();
      sBarBg.fillStyle(0x000000, 0.2);
      sBarBg.fillRoundedRect(leftX + 80, sy + 5, 150, 20, 5);
      this.addTabElement(sBarBg);

      var sAvg = sData.avg || 0;
      var sBarFill = this.add.graphics();
      sBarFill.fillStyle(sDim.color, 0.8);
      sBarFill.fillRoundedRect(leftX + 80, sy + 5, Math.max(4, (sAvg / 100) * 150), 20, 5);
      this.addTabElement(sBarFill);

      var sAvgT = this.add.text(leftX + 235, sy + 15, '平均 ' + sAvg, {
        fontSize: '11px',
        fontWeight: 'bold',
        color: sDim.colorStr
      }).setOrigin(0, 0.5);
      this.addTabElement(sAvgT);

      var sBestT = this.add.text(leftX + panelW - 15, sy + 15, '最高 ' + (sData.best || 0), {
        fontSize: '10px',
        color: '#aaaaaa'
      }).setOrigin(1, 0.5);
      this.addTabElement(sBestT);
    }
  };

  proto.createSettingsTab = function(width, height) {
    var self = this;
    var contentY = 195;
    var leftX = width / 2 - 180;
    var panelW = 360;

    var headerBg = this.add.graphics();
    headerBg.fillStyle(0xffffff, 0.1);
    headerBg.fillRoundedRect(leftX, contentY, panelW, 36, 12);
    this.addTabElement(headerBg);

    var headerText = this.add.text(width / 2, contentY + 18, '⚙️ 偏好设置', {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.addTabElement(headerText);

    var prefs = this.profileMgr.getPreferences();
    if (!prefs) return;
    this.tempPrefs = { ...prefs };

    var settings = [
      { id: 'showTutorials', label: '游戏教程', icon: '📚', type: 'toggle' },
      { id: 'autoStartNext', label: '自动开始下一关', icon: '▶️', type: 'toggle' },
      { id: 'confirmRestart', label: '重开确认', icon: '🔄', type: 'toggle' },
      { id: 'showReplay', label: '显示复盘分析', icon: '🔍', type: 'toggle' }
    ];

    this.settingToggles = {};

    for (var i = 0; i < settings.length; i++) {
      var setting = settings[i];
      var sy = contentY + 50 + i * 48;

      var sBg = this.add.graphics();
      sBg.fillStyle(0xffffff, 0.05);
      sBg.fillRoundedRect(leftX, sy, panelW, 40, 10);
      this.addTabElement(sBg);

      var sIconT = this.add.text(leftX + 15, sy + 20, setting.icon, {
        fontSize: '18px'
      }).setOrigin(0, 0.5);
      this.addTabElement(sIconT);

      var sLblT = this.add.text(leftX + 45, sy + 20, setting.label, {
        fontSize: '13px',
        color: '#ffffff'
      }).setOrigin(0, 0.5);
      this.addTabElement(sLblT);

      var toggle = this.createToggle(
        leftX + panelW - 50,
        sy + 20,
        this.tempPrefs[setting.id],
        (function(settingId) {
          return function(value) {
            self.tempPrefs[settingId] = value;
          };
        })(setting.id)
      );
      toggle.setDepth(10);
      this.settingToggles[setting.id] = toggle;
      this.addTabElement(toggle);
    }

    var diffY = contentY + 50 + settings.length * 48 + 15;
    var diffHeaderBg = this.add.graphics();
    diffHeaderBg.fillStyle(0xffffff, 0.08);
    diffHeaderBg.fillRoundedRect(leftX, diffY, panelW, 30, 8);
    this.addTabElement(diffHeaderBg);

    var diffHeaderT = this.add.text(width / 2, diffY + 15, '🎮 游戏偏好', {
      fontSize: '13px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.addTabElement(diffHeaderT);

    var branchLabelY = diffY + 45;
    var branchLbl = this.add.text(leftX + 15, branchLabelY, '🗺️ 偏好路线类型', {
      fontSize: '12px',
      color: '#cccccc'
    }).setOrigin(0, 0.5);
    this.addTabElement(branchLbl);

    var branchOptions = [
      { id: 'balanced', label: '均衡', icon: '⚖️' },
      { id: 'speed', label: '速度', icon: '🚀' },
      { id: 'exploration', label: '探索', icon: '🗺️' },
      { id: 'risk', label: '冒险', icon: '🔥' }
    ];

    this.branchButtons = [];
    var branchY = diffY + 75;
    var branchW = 80;
    var branchGap = 8;
    var branchStartX = width / 2 - (branchOptions.length * branchW + (branchOptions.length - 1) * branchGap) / 2 + branchW / 2;

    for (var b = 0; b < branchOptions.length; b++) {
      var branch = branchOptions[b];
      var bx = branchStartX + b * (branchW + branchGap);
      var isSelected = this.tempPrefs.preferredBranch === branch.id;

      var btn = this.createOptionButton(bx, branchY, branchW, branch, isSelected,
        (function(branchId) {
          return function() {
            self.tempPrefs.preferredBranch = branchId;
            self.updateBranchButtons();
          };
        })(branch.id)
      );
      this.branchButtons.push({ btn: btn, id: branch.id });
      this.addTabElement(btn);
    }

    var diffLabelY = branchY + 45;
    var diffLbl = this.add.text(leftX + 15, diffLabelY, '⚡ 默认难度', {
      fontSize: '12px',
      color: '#cccccc'
    }).setOrigin(0, 0.5);
    this.addTabElement(diffLbl);

    var difficultyOptions = [
      { id: 'easy', label: '简单', icon: '🟢', color: 0x4caf50 },
      { id: 'normal', label: '普通', icon: '🟡', color: 0xff9800 },
      { id: 'hard', label: '困难', icon: '🔴', color: 0xf44336 }
    ];

    this.difficultyButtons = [];
    var diffBtnY = diffLabelY + 30;
    var diffW = 100;
    var diffGap = 10;
    var diffStartX = width / 2 - (difficultyOptions.length * diffW + (difficultyOptions.length - 1) * diffGap) / 2 + diffW / 2;

    for (var d = 0; d < difficultyOptions.length; d++) {
      var diffOpt = difficultyOptions[d];
      var dx = diffStartX + d * (diffW + diffGap);
      var isDiffSelected = this.tempPrefs.difficulty === diffOpt.id;

      var diffBtn = this.createOptionButton(dx, diffBtnY, diffW, diffOpt, isDiffSelected,
        (function(diffId) {
          return function() {
            self.tempPrefs.difficulty = diffId;
            self.updateDifficultyButtons();
          };
        })(diffOpt.id)
      );
      this.difficultyButtons.push({ btn: diffBtn, id: diffOpt.id });
      this.addTabElement(diffBtn);
    }

    var btnY = diffBtnY + 60;
    var btnW = 150;
    var btnGap = 20;

    var cancelBtn = this.createSettingsButton(
      width / 2 - btnW / 2 - btnGap / 2,
      btnY,
      btnW,
      '取消',
      0x9e9e9e,
      function() {
        self.scene.start('MenuScene');
      }
    );
    this.addTabElement(cancelBtn);

    var saveBtn = this.createSettingsButton(
      width / 2 + btnW / 2 + btnGap / 2,
      btnY,
      btnW,
      '保存设置',
      0x4caf50,
      function() {
        self.savePreferences();
        self.showFloatingText(width / 2, btnY - 30, '✅ 设置已保存', 0x4caf50);
        setTimeout(function() {
          self.scene.start('MenuScene');
        }, 800);
      }
    );
    this.addTabElement(saveBtn);

    var resetY = btnY + 60;
    var resetBtn = this.createSettingsButton(
      width / 2,
      resetY,
      200,
      '🗑️ 重置档案数据',
      0xf44336,
      function() {
        if (confirm('确定要重置所有档案数据吗？此操作不可撤销！')) {
          self.profileMgr.resetProfile();
          self.showFloatingText(width / 2, resetY - 30, '✅ 档案已重置', 0x4caf50);
          setTimeout(function() {
            self.scene.restart();
          }, 800);
        }
      }
    );
    this.addTabElement(resetBtn);
  };

  proto.createToggle = function(x, y, initialValue, onChange) {
    var container = this.add.container(x, y);
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

  proto.createOptionButton = function(x, y, width, option, isSelected, onClick) {
    var container = this.add.container(x, y);
    container.setSize(width, 36);
    container.optionId = option.id;

    var bg = this.add.graphics();
    container.bg = bg;

    var color = option.color || 0x4a90d9;
    var updateVisual = function(selected) {
      bg.clear();
      if (selected) {
        bg.fillStyle(color, 0.9);
        bg.fillRoundedRect(-width / 2, -18, width, 36, 10);
        bg.lineStyle(2, 0xffffff, 0.6);
        bg.strokeRoundedRect(-width / 2, -18, width, 36, 10);
      } else {
        bg.fillStyle(0xffffff, 0.1);
        bg.fillRoundedRect(-width / 2, -18, width, 36, 10);
        bg.lineStyle(2, 0xffffff, 0.3);
        bg.strokeRoundedRect(-width / 2, -18, width, 36, 10);
      }
    };

    updateVisual(isSelected);
    container.add(bg);

    var icon = this.add.text(-width / 2 + 15, 0, option.icon, {
      fontSize: '14px'
    }).setOrigin(0, 0.5);
    container.add(icon);

    var label = this.add.text(0, 0, option.label, {
      fontSize: '12px',
      fontWeight: 'bold',
      color: isSelected ? '#ffffff' : '#cccccc'
    }).setOrigin(0.5);
    container.label = label;
    container.add(label);

    container.setInteractive(
      new Phaser.Geom.Rectangle(-width / 2, -18, width, 36),
      Phaser.Geom.Rectangle.Contains
    );

    container.on('pointerdown', function() {
      onClick();
    });

    container.updateSelection = function(selected) {
      updateVisual(selected);
      label.setColor(selected ? '#ffffff' : '#cccccc');
    };

    return container;
  };

  proto.updateBranchButtons = function() {
    if (!this.branchButtons) return;
    for (var i = 0; i < this.branchButtons.length; i++) {
      var item = this.branchButtons[i];
      var isSelected = this.tempPrefs.preferredBranch === item.id;
      item.btn.updateSelection(isSelected);
    }
  };

  proto.updateDifficultyButtons = function() {
    if (!this.difficultyButtons) return;
    for (var i = 0; i < this.difficultyButtons.length; i++) {
      var item = this.difficultyButtons[i];
      var isSelected = this.tempPrefs.difficulty === item.id;
      item.btn.updateSelection(isSelected);
    }
  };

  proto.createSettingsButton = function(x, y, width, label, color, onClick) {
    var container = this.add.container(x, y);
    container.setSize(width, 44);

    var bg = this.add.graphics();
    bg.fillStyle(color, 0.9);
    bg.fillRoundedRect(-width / 2, -22, width, 44, 12);
    bg.lineStyle(2, 0xffffff, 0.5);
    bg.strokeRoundedRect(-width / 2, -22, width, 44, 12);
    container.add(bg);

    var text = this.add.text(0, 0, label, {
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    container.add(text);

    container.setInteractive(
      new Phaser.Geom.Rectangle(-width / 2, -22, width, 44),
      Phaser.Geom.Rectangle.Contains
    );

    var self = this;
    container.on('pointerover', function() { container.setScale(1.04); });
    container.on('pointerout', function() { container.setScale(1); });
    container.on('pointerdown', function() {
      container.setScale(0.96);
      setTimeout(function() {
        container.setScale(1);
        onClick();
      }, 80);
    });

    return container;
  };

  proto.savePreferences = function() {
    this.profileMgr.updatePreferences(this.tempPrefs);
  };

  proto.createBackButton = function(width, height) {
    var self = this;
    var btnX = 40;
    var btnY = 40;

    var container = this.add.container(btnX, btnY);
    container.setSize(44, 44);

    var bg = this.add.graphics();
    bg.fillStyle(0xffffff, 0.15);
    bg.fillRoundedRect(-22, -22, 44, 44, 12);
    bg.lineStyle(2, 0xffffff, 0.4);
    bg.strokeRoundedRect(-22, -22, 44, 44, 12);
    container.add(bg);

    var icon = this.add.text(0, 0, '←', {
      fontSize: '22px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    container.add(icon);

    container.setInteractive(
      new Phaser.Geom.Rectangle(-22, -22, 44, 44),
      Phaser.Geom.Rectangle.Contains
    );

    container.on('pointerover', function() {
      container.setScale(1.1);
    });
    container.on('pointerout', function() {
      container.setScale(1);
    });
    container.on('pointerdown', function() {
      container.setScale(0.9);
      setTimeout(function() {
        container.setScale(1);
        self.scene.start('MenuScene');
      }, 100);
    });
  };

  proto.showFloatingText = function(x, y, text, color) {
    var t = this.add.text(x, y, text, {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    var g = this.add.graphics();
    g.fillStyle(color || 0x4caf50, 0.9);
    g.fillRoundedRect(x - t.width / 2 - 12, y - t.height / 2 - 6, t.width + 24, t.height + 12, 8);
    g.setDepth(t.depth - 1);

    this.tweens.add({
      targets: [t, g],
      y: y - 30,
      alpha: 0,
      duration: 1200,
      ease: 'Power2.out',
      onComplete: function() {
        t.destroy();
        g.destroy();
      }
    });
  };

  proto.formatPlayTime = function(seconds) {
    if (!seconds || seconds === Infinity) return '0分钟';
    var hours = Math.floor(seconds / 3600);
    var minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return hours + '小时' + minutes + '分钟';
    }
    return minutes + '分钟';
  };

  proto.hexToColor = function(hex) {
    if (!hex) return 0xffffff;
    hex = hex.replace('#', '');
    return parseInt(hex, 16);
  };

  window.MountainRacer = MountainRacer;
})();