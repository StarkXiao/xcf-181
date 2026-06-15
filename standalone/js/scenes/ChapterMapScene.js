(function() {
  var MountainRacer = window.MountainRacer || {};

  MountainRacer.ChapterMapScene = function() {
    Phaser.Scene.call(this, { key: 'ChapterMapScene' });
  };

  MountainRacer.ChapterMapScene.prototype = Object.create(Phaser.Scene.prototype);
  MountainRacer.ChapterMapScene.prototype.constructor = MountainRacer.ChapterMapScene;

  var proto = MountainRacer.ChapterMapScene.prototype;

  proto.init = function(data) {
    this.selectedChapter = (data && data.chapterId) || null;
    this.dataManager = MountainRacer.DataManager.getInstance();
    this.dataManager.init();
    this.seasonDM = this.dataManager.getSeasonDataManager();
    this.rewardSystem = this.dataManager.getRewardSystem();
    this.carGrowth = this.dataManager.getCarGrowthSystem();
    this.garageMgr = this.dataManager.getGarageManager();
    this.nodeElements = [];
    this.lineElements = [];
    this.chapterTabs = [];
  };

  proto.create = function() {
    var width = this.scale.width;
    var height = this.scale.height;

    this.createBackground(width, height);
    this.createTopBar(width, height);
    this.createChapterTabs(width, height);
    this.createMapArea(width, height);
    this.createLegend(width, height);

    if (!this.selectedChapter) {
      var currentChapter = this.seasonDM.getCurrentChapter();
      this.selectedChapter = currentChapter ? currentChapter.id : 'chapter_1';
    }

    this.renderChapterMap(this.selectedChapter);
  };

  proto.createBackground = function(width, height) {
    var skyGfx = this.add.graphics();
    skyGfx.fillGradientStyle(0x1a237e, 0x1a237e, 0x0d47a1, 0x0d47a1);
    skyGfx.fillRect(0, 0, width, height);

    for (var i = 0; i < 30; i++) {
      var star = this.add.text(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height * 0.4),
        '✦',
        {
          fontSize: Phaser.Math.Between(8, 16) + 'px',
          color: '#ffffff',
          alpha: 0.3 + Math.random() * 0.5
        }
      ).setOrigin(0.5);
      this.tweens.add({
        targets: star,
        alpha: { from: 0.2, to: 0.8 },
        duration: 1500 + Math.random() * 2000,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 2000
      });
    }

    var mountainColors = [
      [0x1b5e20, 0x2e7d32],
      [0x2e7d32, 0x388e3c],
      [0x388e3c, 0x43a047]
    ];

    for (var m = 0; m < 3; m++) {
      var mGfx = this.add.graphics();
      var c1 = mountainColors[m][0];
      var c2 = mountainColors[m][1];
      mGfx.fillGradientStyle(c1, c1, c2, c2);
      mGfx.beginPath();
      mGfx.moveTo(0, height);
      var baseY = height - 80 - m * 60;
      for (var x = 0; x <= width; x += 10) {
        var y = baseY + Math.sin(x * 0.008 + m * 2) * 25 + Math.sin(x * 0.015 + m) * 15;
        mGfx.lineTo(x, y);
      }
      mGfx.lineTo(width, height);
      mGfx.closePath();
      mGfx.fillPath();
      mGfx.setDepth(-10 + m);
    }

    var roadGfx = this.add.graphics();
    roadGfx.lineStyle(80, 0x757575, 0.4);
    roadGfx.beginPath();
    roadGfx.moveTo(0, height - 50);
    for (var rx = 0; rx <= width; rx += 20) {
      var ry = height - 50 + Math.sin(rx * 0.01) * 10;
      roadGfx.lineTo(rx, ry);
    }
    roadGfx.strokePath();
  };

  proto.createTopBar = function(width, height) {
    var barGfx = this.add.graphics();
    barGfx.fillStyle(0x000000, 0.6);
    barGfx.fillRect(0, 0, width, 70);
    barGfx.setDepth(100);

    var backBtn = this.add.container(50, 35);
    backBtn.setSize(80, 40);
    var backBg = this.add.graphics();
    backBg.fillStyle(0x4a90d9, 0.9);
    backBg.fillRoundedRect(-40, -20, 80, 40, 10);
    var backText = this.add.text(0, 0, '← 返回', {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    backBtn.add([backBg, backText]);
    backBtn.setInteractive(
      new Phaser.Geom.Rectangle(-40, -20, 80, 40),
      Phaser.Geom.Rectangle.Contains
    );
    backBtn.setDepth(101);

    var self = this;
    backBtn.on('pointerover', function() {
      self.tweens.add({ targets: backBtn, scale: 1.05, duration: 150 });
    });
    backBtn.on('pointerout', function() {
      self.tweens.add({ targets: backBtn, scale: 1.0, duration: 150 });
    });
    backBtn.on('pointerdown', function() {
      self.tweens.add({
        targets: backBtn,
        scale: 0.95,
        duration: 80,
        yoyo: true,
        onComplete: function() {
          self.scene.start('MenuScene');
        }
      });
    });

    var seasonInfo = this.seasonDM.getCurrentSeason();
    var title = this.add.text(width / 2, 20, '🏆 ' + (seasonInfo ? seasonInfo.name : '赛季生涯'), {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(101);

    var level = this.seasonDM.getSeasonLevel();
    var xp = this.seasonDM.getSeasonXP();
    var stars = this.seasonDM.getTotalStars();
    var coins = this.garageMgr.getCoins();
    var power = this.garageMgr.getCurrentPerformanceRating();

    var stats = [
      { icon: '⭐', value: stars, color: '#ffd700' },
      { icon: '💰', value: coins, color: '#ffd700' },
      { icon: '⚡', value: Math.floor(power), color: '#4a90d9' },
      { icon: '🏅', value: 'Lv.' + level, color: '#ff9800' }
    ];
    var statGap = 90;
    var startX = width - 50 - (stats.length - 1) * statGap;

    for (var s = 0; s < stats.length; s++) {
      var stat = stats[s];
      var sx = startX + s * statGap;
      var statBg = this.add.graphics();
      statBg.fillStyle(0x000000, 0.4);
      statBg.fillRoundedRect(sx - 40, 45, 80, 22, 8);
      statBg.setDepth(100);
      this.add.text(sx, 56, stat.icon + ' ' + stat.value, {
        fontSize: '14px',
        fontWeight: 'bold',
        color: stat.color
      }).setOrigin(0.5).setDepth(101);
    }
  };

  proto.createChapterTabs = function(width, height) {
    var seasonInfo = this.seasonDM.getCurrentSeason();
    var chapterIds = seasonInfo ? seasonInfo.chapters : ['chapter_1', 'chapter_2', 'chapter_3'];
    var tabY = 100;
    var tabWidth = 200;
    var tabHeight = 50;
    var gap = 15;
    var totalWidth = tabWidth * chapterIds.length + gap * (chapterIds.length - 1);
    var startX = width / 2 - totalWidth / 2 + tabWidth / 2;

    this.chapterTabs = [];

    for (var i = 0; i < chapterIds.length; i++) {
      var chId = chapterIds[i];
      var chapter = MountainRacer.SeasonConfig.getChapter(chId);
      if (!chapter) continue;

      var unlocked = this.seasonDM.isChapterUnlocked(chId);
      var isComplete = this.seasonDM.isChapterComplete(chId);
      var x = startX + i * (tabWidth + gap);

      var container = this.add.container(x, tabY);
      container.setSize(tabWidth, tabHeight);

      var gfx = this.add.graphics();
      var isSelected = chId === this.selectedChapter;
      var bgColor = isSelected ? 0xff6b35 : (unlocked ? 0x2e7d32 : 0x616161);
      var alpha = unlocked ? 0.95 : 0.6;
      gfx.fillStyle(bgColor, alpha);
      gfx.fillRoundedRect(-tabWidth / 2, -tabHeight / 2, tabWidth, tabHeight, 12);

      if (isSelected) {
        gfx.lineStyle(3, 0xffd700, 1);
        gfx.strokeRoundedRect(-tabWidth / 2, -tabHeight / 2, tabWidth, tabHeight, 12);
      }

      var chStars = this.seasonDM.getChapterStars(chId);
      var statusIcon = isComplete ? '✅' : (unlocked ? '🔓' : '🔒');
      var label = statusIcon + ' 第' + (i + 1) + '章 · ' + chapter.name;

      var text = this.add.text(0, 0, label, {
        fontSize: '15px',
        fontWeight: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5);

      if (unlocked) {
        var starLabel = this.add.text(0, 20, '⭐ ' + chStars.earned + '/' + chStars.total, {
          fontSize: '11px',
          color: '#ffd700'
        }).setOrigin(0.5);
        container.add([gfx, text, starLabel]);
      } else {
        var lockHint = this.add.text(0, 20, '需 ' + chapter.unlockStars + '⭐解锁', {
          fontSize: '11px',
          color: '#bdbdbd'
        }).setOrigin(0.5);
        container.add([gfx, text, lockHint]);
      }

      if (unlocked) {
        var self = this;
        container.setInteractive(
          new Phaser.Geom.Rectangle(-tabWidth / 2, -tabHeight / 2, tabWidth, tabHeight),
          Phaser.Geom.Rectangle.Contains
        );
        container.on('pointerover', function() {
          if (this.chapterId !== self.selectedChapter) {
            self.tweens.add({ targets: this, scale: 1.03, duration: 150 });
          }
        });
        container.on('pointerout', function() {
          self.tweens.add({ targets: this, scale: 1.0, duration: 150 });
        });
        container.on('pointerdown', (function(id) {
          return function() {
            self.tweens.add({
              targets: this,
              scale: 0.97,
              duration: 80,
              yoyo: true,
              onComplete: function() {
                self.switchChapter(id);
              }
            });
          };
        })(chId));
        container.chapterId = chId;
      }

      container.setDepth(50);
      this.chapterTabs.push(container);
    }
  };

  proto.switchChapter = function(chapterId) {
    if (chapterId === this.selectedChapter) return;
    this.selectedChapter = chapterId;
    this.seasonDM.setCurrentChapter(chapterId);

    for (var i = 0; i < this.chapterTabs.length; i++) {
      var tab = this.chapterTabs[i];
      if (tab.chapterId === chapterId) {
        this.tweens.add({ targets: tab, scale: 1.05, duration: 200 });
      } else {
        this.tweens.add({ targets: tab, scale: 1.0, duration: 200 });
      }
    }

    this.clearMap();
    this.renderChapterMap(chapterId);
  };

  proto.createMapArea = function(width, height) {
    this.mapArea = this.add.container(0, 160);
    this.mapArea.setSize(width, height - 200);
  };

  proto.clearMap = function() {
    for (var i = 0; i < this.nodeElements.length; i++) {
      this.nodeElements[i].destroy();
    }
    for (var j = 0; j < this.lineElements.length; j++) {
      this.lineElements[j].destroy();
    }
    this.nodeElements = [];
    this.lineElements = [];
  };

  proto.renderChapterMap = function(chapterId) {
    var width = this.scale.width;
    var chapter = MountainRacer.SeasonConfig.getChapter(chapterId);
    if (!chapter || !chapter.nodes) return;

    var chapterInfo = this.add.text(width / 2, 180, chapter.name, {
      fontSize: '22px',
      fontWeight: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(40);

    var chapterDesc = this.add.text(width / 2, 205, chapter.description, {
      fontSize: '13px',
      color: '#b0bec5',
      align: 'center',
      wordWrap: { width: 600 }
    }).setOrigin(0.5).setDepth(40);

    var growthHints = this.carGrowth.getChapterUnlockHints(chapterId);
    if (growthHints && growthHints.requirements && growthHints.requirements.length > 0) {
      var hintText = growthHints.requirements.map(function(r) { return r.text; }).join('  ');
      this.add.text(width / 2, 230, '📋 ' + hintText, {
        fontSize: '12px',
        color: growthHints.canEnter ? '#4caf50' : '#ff9800',
        align: 'center',
        wordWrap: { width: 600 }
      }).setOrigin(0.5).setDepth(40);
    }

    var mapAreaY = 260;
    var mapHeight = 280;

    var linesGfx = this.add.graphics();
    linesGfx.setDepth(10);

    var nodeMap = {};
    for (var n = 0; n < chapter.nodes.length; n++) {
      var node = chapter.nodes[n];
      nodeMap[node.id] = node;
    }

    for (var n2 = 0; n2 < chapter.nodes.length; n2++) {
      var node2 = chapter.nodes[n2];
      if (node2.nextNodes && node2.nextNodes.length > 0) {
        var fromX = 40 + node2.position.x * 0.9 * (width - 80) / 100;
        var fromY = mapAreaY + node2.position.y * mapHeight / 100;
        for (var nn = 0; nn < node2.nextNodes.length; nn++) {
          var nextNodeId = node2.nextNodes[nn];
          var nextNode = nodeMap[nextNodeId];
          if (nextNode) {
            var toX = 40 + nextNode.position.x * 0.9 * (width - 80) / 100;
            var toY = mapAreaY + nextNode.position.y * mapHeight / 100;

            var progress = this.seasonDM.getNodeProgress(chapterId, node2.id);
            var isComplete = !!(progress && progress.isComplete);
            var nextProgress = this.seasonDM.getNodeProgress(chapterId, nextNodeId);
            var nextUnlocked = this.seasonDM.isNodeUnlocked(chapterId, nextNodeId);

            var lineColor = isComplete && nextUnlocked ? 0x4caf50 : 0x616161;
            var lineAlpha = isComplete ? 0.8 : 0.4;
            linesGfx.lineStyle(4, lineColor, lineAlpha);
            linesGfx.beginPath();
            linesGfx.moveTo(fromX, fromY);
            var midX = (fromX + toX) / 2;
            var midY = (fromY + toY) / 2 - 15;
            linesGfx.lineTo(midX, midY);
            linesGfx.lineTo(toX, toY);
            linesGfx.strokePath();
          }
        }
      }
    }

    this.lineElements.push(linesGfx);

    for (var n3 = 0; n3 < chapter.nodes.length; n3++) {
      var node3 = chapter.nodes[n3];
      this.createNodeElement(chapterId, node3, mapAreaY, mapHeight, width);
    }
  };

  proto.createNodeElement = function(chapterId, node, mapAreaY, mapHeight, width) {
    var x = 40 + node.position.x * 0.9 * (width - 80) / 100;
    var y = mapAreaY + node.position.y * mapHeight / 100;

    var container = this.add.container(x, y);
    container.setSize(70, 70);

    var progress = this.seasonDM.getNodeProgress(chapterId, node.id);
    var isComplete = !!(progress && progress.isComplete);
    var isUnlocked = this.seasonDM.isNodeUnlocked(chapterId, node.id);
    var stars = progress ? (progress.stars || 0) : 0;

    var gfx = this.add.graphics();
    var nodeSize = 56;

    var typeColors = {
      race: { main: 0x2196f3, accent: 0x1565c0 },
      event: { main: 0x9c27b0, accent: 0x6a1b9a },
      boss: { main: 0xf44336, accent: 0xb71c1c }
    };

    var colors = typeColors[node.type] || typeColors.race;

    if (isComplete) {
      gfx.fillStyle(colors.main, 0.9);
    } else if (isUnlocked) {
      gfx.fillStyle(colors.main, 0.85);
    } else {
      gfx.fillStyle(0x424242, 0.6);
    }

    if (node.type === 'boss') {
      gfx.fillRoundedRect(-nodeSize / 2, -nodeSize / 2, nodeSize, nodeSize, 8);
      gfx.lineStyle(3, isComplete ? 0xffd700 : (isUnlocked ? 0xff6b35 : 0x757575), 1);
      gfx.strokeRoundedRect(-nodeSize / 2, -nodeSize / 2, nodeSize, nodeSize, 8);
    } else {
      gfx.fillCircle(0, 0, nodeSize / 2);
      gfx.lineStyle(3, isComplete ? 0xffd700 : (isUnlocked ? 0x4fc3f7 : 0x757575), 1);
      gfx.strokeCircle(0, 0, nodeSize / 2);
    }

    var typeIcons = {
      race: '🏎️',
      event: '🎯',
      boss: '👑'
    };
    var icon = typeIcons[node.type] || '🏁';
    var iconText = this.add.text(0, -5, icon, {
      fontSize: '24px'
    }).setOrigin(0.5);

    var nameText = this.add.text(0, 42, node.name, {
      fontSize: '12px',
      fontWeight: 'bold',
      color: isUnlocked ? '#ffffff' : '#9e9e9e',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    if (isComplete) {
      var starDisplay = '';
      for (var s = 0; s < 3; s++) {
        starDisplay += s < stars ? '⭐' : '☆';
      }
      var starText = this.add.text(0, 22, starDisplay, {
        fontSize: '14px'
      }).setOrigin(0.5);
      container.add([gfx, iconText, nameText, starText]);
    } else if (!isUnlocked) {
      var lockIcon = this.add.text(0, 22, '🔒', {
        fontSize: '16px'
      }).setOrigin(0.5);
      container.add([gfx, iconText, nameText, lockIcon]);
    } else {
      var diffText = this.add.text(0, 22, '难度 ' + '⭐'.repeat(Math.min(5, node.difficulty || 1)), {
        fontSize: '11px',
        color: '#ffd700'
      }).setOrigin(0.5);
      container.add([gfx, iconText, nameText, diffText]);
    }

    if (isUnlocked) {
      var self = this;
      container.setInteractive(
        new Phaser.Geom.Rectangle(-nodeSize / 2 - 5, -nodeSize / 2 - 5, nodeSize + 10, nodeSize + 10),
        Phaser.Geom.Rectangle.Contains
      );
      container.on('pointerover', function() {
        self.tweens.add({ targets: this, scale: 1.15, duration: 150, ease: 'Back.easeOut' });
        this.showNodeTooltip(chapterId, node, this.x, this.y);
      });
      container.on('pointerout', function() {
        self.tweens.add({ targets: this, scale: 1.0, duration: 150 });
        self.hideNodeTooltip();
      });
      container.on('pointerdown', (function(chId, nId) {
        return function() {
          self.tweens.add({
            targets: this,
            scale: 0.9,
            duration: 80,
            yoyo: true,
            onComplete: function() {
              self.enterNode(chId, nId);
            }
          });
        };
      })(chapterId, node.id));

      if (!isComplete) {
        this.tweens.add({
          targets: container,
          scale: { from: 1.0, to: 1.08 },
          duration: 1000,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1,
          delay: Math.random() * 500
        });
      }
    }

    container.setDepth(20);
    this.nodeElements.push(container);
  };

  proto.showNodeTooltip = function(chapterId, node, x, y) {
    this.hideNodeTooltip();

    var width = this.scale.width;
    var tooltipX = x;
    var tooltipY = y - 110;
    if (tooltipX < 120) tooltipX = 120;
    if (tooltipX > width - 120) tooltipX = width - 120;
    if (tooltipY < 170) tooltipY = y + 80;

    var tooltip = this.add.container(tooltipX, tooltipY);
    tooltip.setDepth(200);

    var rewards = node.rewards || { coins: 0, parts: [], stars: 3, seasonXP: 0 };
    var eventInfo = node.eventType ? MountainRacer.SeasonConfig.getEventType(node.eventType) : null;

    var lines = [];
    lines.push({ text: node.name, style: { fontSize: '16px', fontWeight: 'bold', color: '#ffd700' } });
    lines.push({ text: node.description, style: { fontSize: '12px', color: '#ffffff', wordWrap: { width: 220 } } });
    if (eventInfo) {
      lines.push({ text: '🎯 模式: ' + eventInfo.name, style: { fontSize: '12px', color: '#e1bee7' } });
      lines.push({ text: eventInfo.description, style: { fontSize: '11px', color: '#b39ddb', wordWrap: { width: 220 } } });
    } else if (node.type === 'boss') {
      lines.push({ text: '👑 BOSS战', style: { fontSize: '12px', color: '#ffcdd2' } });
    } else {
      lines.push({ text: '🏎️ 常规竞速', style: { fontSize: '12px', color: '#bbdefb' } });
    }

    var rewardText = '奖励: ';
    if (rewards.coins) rewardText += '💰' + rewards.coins + ' ';
    if (rewards.seasonXP) rewardText += '🏅' + rewards.seasonXP + 'XP ';
    rewardText += '⭐' + (rewards.stars || 3);
    if (rewards.parts && rewards.parts.length > 0) rewardText += ' +🔧部件';
    lines.push({ text: rewardText, style: { fontSize: '12px', color: '#c8e6c9' } });

    if (node.unlockRequirement) {
      var reqText = '解锁条件: ';
      if (node.unlockRequirement.type === 'node_clear') {
        var prevNode = MountainRacer.SeasonConfig.getNode(chapterId, node.unlockRequirement.nodeId);
        reqText += '通关' + (prevNode ? prevNode.name : '前置关卡');
        if (node.unlockRequirement.minStars) reqText += ' +' + node.unlockRequirement.minStars + '⭐';
      } else if (node.unlockRequirement.type === 'any_node_clear') {
        reqText += '通关任意前置节点';
      }
      lines.push({ text: reqText, style: { fontSize: '11px', color: '#ffe0b2' } });
    }

    var totalH = lines.length * 18 + 20;
    var gfx = this.add.graphics();
    gfx.fillStyle(0x1a1a2e, 0.98);
    gfx.fillRoundedRect(-125, -totalH / 2, 250, totalH, 10);
    gfx.lineStyle(2, 0xff6b35, 0.8);
    gfx.strokeRoundedRect(-125, -totalH / 2, 250, totalH, 10);
    tooltip.add(gfx);

    var currentY = -totalH / 2 + 12;
    for (var l = 0; l < lines.length; l++) {
      var line = lines[l];
      var t = this.add.text(0, currentY, line.text, line.style).setOrigin(0.5, 0);
      tooltip.add(t);
      currentY += line.style.fontSize ? (parseInt(line.style.fontSize) + 4) : 18;
    }

    this.nodeTooltip = tooltip;
  };

  proto.hideNodeTooltip = function() {
    if (this.nodeTooltip) {
      this.nodeTooltip.destroy();
      this.nodeTooltip = null;
    }
  };

  proto.enterNode = function(chapterId, nodeId) {
    var initResult = this.rewardSystem.initializeSeasonRace(chapterId, nodeId);
    if (!initResult.success) {
      this.showEnterDenied(initResult);
      return;
    }

    var node = MountainRacer.SeasonConfig.getNode(chapterId, nodeId);
    var level = node && node.level ? node.level : 1;

    var self = this;
    this.cameras.main.fade(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', function() {
      self.scene.start('GameScene', {
        level: level,
        seasonMode: true,
        chapterId: chapterId,
        nodeId: nodeId,
        nodeType: node ? node.type : 'race',
        branchConfig: node ? node.branchConfig : null,
        bossConfig: node ? node.bossConfig : null
      });
    });
  };

  proto.showEnterDenied = function(result) {
    var width = this.scale.width;
    var height = this.scale.height;
    var msg = '';
    if (result.reason === 'insufficient_power') {
      msg = '⚡ 战力不足\n当前: ' + Math.floor(result.current) + ' / 需要: ' + result.required;
    } else if (result.reason === 'node_locked') {
      msg = '🔒 节点未解锁\n请先完成前置关卡';
    } else if (result.reason === 'invalid_node') {
      msg = '❌ 无效的关卡节点';
    } else {
      msg = '❌ 无法进入\n' + (result.reason || '未知错误');
    }

    var overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(3000);

    var panel = this.add.container(width / 2, height / 2);
    panel.setDepth(3001);

    var panelBg = this.add.graphics();
    panelBg.fillStyle(0x2a2a4a, 0.98);
    panelBg.fillRoundedRect(-180, -100, 360, 200, 16);
    panelBg.lineStyle(3, 0xf44336, 0.9);
    panelBg.strokeRoundedRect(-180, -100, 360, 200, 16);

    var title = this.add.text(0, -50, '⛔ 无法进入', {
      fontSize: '26px',
      fontWeight: 'bold',
      color: '#f44336',
      align: 'center'
    }).setOrigin(0.5);

    var msgText = this.add.text(0, 0, msg, {
      fontSize: '18px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 320 }
    }).setOrigin(0.5);

    var self = this;
    var showGarage = result.reason === 'insufficient_power';
    var btnLabel = showGarage ? '🔧 前往升级' : '知道了';
    var btnGfx = this.add.graphics();
    btnGfx.fillStyle(showGarage ? 0x4caf50 : 0x4a90d9, 0.95);
    btnGfx.fillRoundedRect(-80, 50, 160, 40, 10);
    var btnText = this.add.text(0, 70, btnLabel, {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    var btnContainer = this.add.container(0, 0);
    btnContainer.add([btnGfx, btnText]);
    btnContainer.setSize(160, 40);
    btnContainer.setInteractive(
      new Phaser.Geom.Rectangle(-80, 50, 160, 40),
      Phaser.Geom.Rectangle.Contains
    );

    panel.add([panelBg, title, msgText, btnContainer]);

    btnContainer.on('pointerdown', function() {
      self.tweens.add({
        targets: [overlay, panel],
        alpha: 0,
        duration: 200,
        onComplete: function() {
          overlay.destroy();
          panel.destroy();
          if (showGarage) {
            self.scene.start('GarageScene');
          }
        }
      });
    });
    btnContainer.on('pointerover', function() { btnGfx.clear(); btnGfx.fillStyle(showGarage ? 0x66bb6a : 0x6ab0ff, 0.95); btnGfx.fillRoundedRect(-80, 50, 160, 40, 10); });
    btnContainer.on('pointerout', function() { btnGfx.clear(); btnGfx.fillStyle(showGarage ? 0x4caf50 : 0x4a90d9, 0.95); btnGfx.fillRoundedRect(-80, 50, 160, 40, 10); });

    this.tweens.add({
      targets: [overlay, panel],
      alpha: { from: 0, to: 1 },
      duration: 200
    });
    this.tweens.add({
      targets: panel,
      scale: { from: 0.8, to: 1 },
      duration: 250,
      ease: 'Back.easeOut'
    });
  };

  proto.createLegend = function(width, height) {
    var legendY = 560;
    var legend = this.add.container(width / 2, legendY);

    var bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.4);
    bg.fillRoundedRect(-280, -25, 560, 50, 10);
    legend.add(bg);

    var items = [
      { icon: '🏎️', color: '#2196f3', label: '竞速' },
      { icon: '🎯', color: '#9c27b0', label: '事件' },
      { icon: '👑', color: '#f44336', label: 'BOSS' },
      { icon: '⭐', color: '#ffd700', label: '已通关' },
      { icon: '🔒', color: '#9e9e9e', label: '未解锁' }
    ];

    var gap = 110;
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var ix = -220 + i * gap;
      this.add.circle(ix, 0, 8, Phaser.Display.Color.HexStringToColor(item.color).color).setAlpha(0.8);
      this.add.text(ix + 12, 0, item.icon + ' ' + item.label, {
        fontSize: '13px',
        color: '#ffffff'
      }).setOrigin(0, 0.5);
    }
  };

  window.MountainRacer = MountainRacer;
})();
