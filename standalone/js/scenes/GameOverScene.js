(function() {
  var MountainRacer = window.MountainRacer || {};

  MountainRacer.GameOverScene = function() {
    Phaser.Scene.call(this, { key: 'GameOverScene' });
  };

  MountainRacer.GameOverScene.prototype = Object.create(Phaser.Scene.prototype);
  MountainRacer.GameOverScene.prototype.constructor = MountainRacer.GameOverScene;

  var proto = MountainRacer.GameOverScene.prototype;

  proto.init = function(data) {
    this.level = data.level || 1;
    this.win = data.win || false;
    this.message = data.message || '';
    this.score = data.score || 0;
    this.time = data.time || '00:00.00';
    this.health = data.health || 0;
    this.highScore = data.highScore || 0;
    this.detailedStats = data.detailedStats || null;
    this.currentBranch = data.currentBranch || 'main';
  };

  proto.create = function() {
    var width = this.scale.width;
    var height = this.scale.height;

    this.createBackground(width, height);
    this.createResultPanel(width, height);

    if (this.win && this.detailedStats) {
      this.createDetailedStats(width, height);
    } else {
      this.createStats(width, height);
    }

    this.createButtons(width, height);
  };

  proto.createBackground = function(width, height) {
    var skyGfx = this.add.graphics();
    if (this.win) {
      skyGfx.fillGradientStyle(0x1a5235, 0x1a5235, 0x2e7d32, 0x2e7d32);
    } else {
      skyGfx.fillGradientStyle(0x2c1810, 0x2c1810, 0x4a2c2a, 0x4a2c2a);
    }
    skyGfx.fillRect(0, 0, width, height);

    for (var i = 0; i < 12; i++) {
      this.createConfetti(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(-100, -20),
        Phaser.Math.Between(0, 360)
      );
    }
  };

  proto.createConfetti = function(x, y, angle) {
    var colors = [0xff6b35, 0xffd700, 0x4caf50, 0x2196f3, 0xe91e63, 0x9c27b0];
    var color = Phaser.Utils.Array.GetRandom(colors);
    var size = 6 + Math.random() * 6;

    var gfx = this.add.graphics();
    gfx.fillStyle(color, 1);
    gfx.fillRect(-size / 2, -size / 2, size, size * 0.6);
    gfx.x = x;
    gfx.y = y;
    gfx.rotation = Phaser.Math.DegToRad(angle);
    gfx.setDepth(5);

    var duration = 2500 + Math.random() * 2000;
    this.tweens.add({
      targets: gfx,
      y: 650,
      x: x + Phaser.Math.Between(-80, 80),
      rotation: Phaser.Math.DegToRad(angle + Phaser.Math.Between(-720, 720)),
      duration: duration,
      ease: 'Linear',
      onComplete: function() { gfx.destroy(); }
    });
  };

  proto.createResultPanel = function(width, height) {
    var panelW = 420;
    var panelH = this.win && this.detailedStats ? 600 : 430;

    var shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.4);
    shadow.fillRoundedRect(width / 2 - panelW / 2 + 6, height / 2 - panelH / 2 + 6, panelW, panelH, 20);

    var panel = this.add.graphics();
    panel.fillStyle(0xffffff, 0.98);
    panel.fillRoundedRect(width / 2 - panelW / 2, height / 2 - panelH / 2, panelW, panelH, 20);

    var borderColor = this.win ? 0xffd700 : 0xf44336;
    panel.lineStyle(5, borderColor, 1);
    panel.strokeRoundedRect(width / 2 - panelW / 2, height / 2 - panelH / 2, panelW, panelH, 20);

    var resultIcon = this.win ? '🏆' : '💥';
    this.add.text(width / 2, height / 2 - panelH / 2 + 55, resultIcon, {
      fontSize: '52px'
    }).setOrigin(0.5);

    var resultTitle = this.win ? '🎉 通关成功!' : '💥 挑战失败';
    this.add.text(width / 2, height / 2 - panelH / 2 + 105, resultTitle, {
      fontSize: '30px',
      fontWeight: 'bold',
      color: this.win ? '#2e7d32' : '#c62828'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - panelH / 2 + 140, this.message, {
      fontSize: '15px',
      color: '#666666'
    }).setOrigin(0.5);

    var isNewRecord = this.win && this.score >= this.highScore && this.score > 0;
    if (isNewRecord) {
      var record = this.add.text(width / 2, height / 2 - panelH / 2 + 165, '✨ 新纪录! ✨', {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#ff6b35'
      }).setOrigin(0.5);

      this.tweens.add({
        targets: record,
        scale: { from: 1, to: 1.1 },
        duration: 500,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1
      });
    }
  };

  proto.getBranchConfig = function(branchId) {
    var config = MountainRacer.LEVEL_CONFIGS[this.level];
    if (!config || !config.branches) return null;
    for (var i = 0; i < config.branches.length; i++) {
      if (config.branches[i].id === branchId) return config.branches[i];
    }
    return null;
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

  proto.createStats = function(width, height) {
    var config = MountainRacer.LEVEL_CONFIGS[this.level];
    var statsStartY = height / 2 - 25;
    var statWidth = 340;
    var labelWidth = 100;
    var valueX = width / 2 - statWidth / 2 + labelWidth + 20;

    var stats = [
      { label: '关卡', value: 'Level ' + this.level + ' - ' + config.name, color: '#1a5235' },
      { label: '得分', value: this.score.toString(), color: '#ff6b35' },
      { label: '用时', value: this.time, color: '#2196f3' },
      { label: '剩余生命', value: this.health + '%', color: this.health > 50 ? '#4caf50' : this.health > 25 ? '#ff9800' : '#f44336' },
      { label: '最高分', value: this.highScore.toString(), color: '#ffd700' }
    ];

    for (var i = 0; i < stats.length; i++) {
      var stat = stats[i];
      var y = statsStartY + i * 32;

      var bg = this.add.graphics();
      bg.fillStyle(0xf5f5f5, 1);
      bg.fillRoundedRect(width / 2 - statWidth / 2, y - 12, statWidth, 26, 6);

      this.add.text(width / 2 - statWidth / 2 + 15, y, stat.label, {
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#666666'
      }).setOrigin(0, 0.5);

      this.add.text(valueX, y, stat.value, {
        fontSize: '16px',
        fontWeight: 'bold',
        color: stat.color
      }).setOrigin(0, 0.5);
    }
  };

  proto.createDetailedStats = function(width, height) {
    var stats = this.detailedStats;
    var panelW = 420;
    var startY = height / 2 - 180;

    var branchCfg = this.getBranchConfig(this.currentBranch);
    var branchName = branchCfg ? branchCfg.name : '主路';
    var branchIcon = branchCfg ? this.getBranchIcon(branchCfg.type) : '🛤️';

    var headerY = startY + 10;
    this.add.text(width / 2 - panelW / 2 + 15, headerY,
      branchIcon + ' 最终路线: ' + branchName, {
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#333333'
      }).setOrigin(0, 0.5);

    var rewardMult = branchCfg ? branchCfg.rewardMultiplier : 1.0;
    this.add.text(width / 2 + panelW / 2 - 15, headerY,
      '奖励倍率 x' + rewardMult.toFixed(1), {
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#ff9800'
      }).setOrigin(1, 0.5);

    var weightBreakdown = stats.weightBreakdown || {};
    if (weightBreakdown.finalMultiplier && weightBreakdown.finalMultiplier > 1.01) {
      var multiplierY = headerY + 28;
      this.add.text(width / 2 - panelW / 2 + 15, multiplierY,
        '✨ 结算加成: x' + weightBreakdown.finalMultiplier.toFixed(2), {
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#ff6b35'
        }).setOrigin(0, 0.5);

      this.createWeightVisualization(width, multiplierY + 25, panelW, weightBreakdown);
    }

    var scoreBreakdownY = headerY + 100;
    if (weightBreakdown.finalMultiplier <= 1.01) {
      scoreBreakdownY = headerY + 35;
    }

    this.add.text(width / 2 - panelW / 2 + 15, scoreBreakdownY, '📊 得分明细', {
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#666666'
    }).setOrigin(0, 0.5);

    var bonus = stats.bonusScores || {};
    var breakdownItems = [
      { label: '基础距离分', value: bonus.distance || 0, color: '#4caf50' },
      { label: '时间奖励', value: bonus.timeBonus || 0, color: '#2196f3' },
      { label: '生命奖励', value: bonus.healthBonus || 0, color: '#e91e63' },
      { label: '路线奖励', value: bonus.branchBonus || 0, color: '#9c27b0' },
      { label: '风格奖励', value: bonus.styleBonus || 0, color: '#ff9800' },
      { label: '风险奖励', value: bonus.riskBonus || 0, color: '#f44336' },
      { label: '探索奖励', value: bonus.explorationBonus || 0, color: '#00bcd4' },
      { label: '汇合奖励', value: bonus.mergeBonus || 0, color: '#8bc34a' }
    ];

    var hasPerfect = bonus.perfectBonus > 0 || bonus.hiddenBonus > 0;
    if (hasPerfect) {
      if (bonus.perfectBonus > 0) {
        breakdownItems.push({ label: '完美奖励', value: bonus.perfectBonus || 0, color: '#ffd700' });
      }
      if (bonus.hiddenBonus > 0) {
        breakdownItems.push({ label: '隐藏奖励', value: bonus.hiddenBonus || 0, color: '#9c27b0' });
      }
    }

    var visibleItems = breakdownItems.filter(function(item) { return item.value > 0; });
    if (visibleItems.length === 0) visibleItems = breakdownItems.slice(0, 5);

    for (var i = 0; i < visibleItems.length; i++) {
      var item = visibleItems[i];
      var y = scoreBreakdownY + 28 + i * 20;

      var barBg = this.add.graphics();
      barBg.fillStyle(0xf0f0f0, 1);
      barBg.fillRoundedRect(width / 2 - panelW / 2 + 15, y - 7, panelW - 30, 16, 4);

      var ratio = this.score > 0 ? item.value / this.score : 0;
      var barWidth = Math.max(4, (panelW - 30) * ratio);
      var bar = this.add.graphics();
      bar.fillStyle(item.color, 0.8);
      bar.fillRoundedRect(width / 2 - panelW / 2 + 15, y - 7, barWidth, 16, 4);

      this.add.text(width / 2 - panelW / 2 + 22, y, item.label, {
        fontSize: '10px',
        fontWeight: 'bold',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0, 0.5);

      this.add.text(width / 2 + panelW / 2 - 22, y, '+' + item.value, {
        fontSize: '10px',
        fontWeight: 'bold',
        color: '#333333'
      }).setOrigin(1, 0.5);
    }

    var totalY = scoreBreakdownY + 28 + visibleItems.length * 20 + 10;
    var totalLine = this.add.graphics();
    totalLine.lineStyle(2, 0xdddddd, 1);
    totalLine.beginPath();
    totalLine.moveTo(width / 2 - panelW / 2 + 15, totalY);
    totalLine.lineTo(width / 2 + panelW / 2 - 15, totalY);
    totalLine.strokePath();

    this.add.text(width / 2 - panelW / 2 + 15, totalY + 18, '总分', {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#333333'
    }).setOrigin(0, 0.5);

    this.add.text(width / 2 + panelW / 2 - 15, totalY + 18, this.score.toString(), {
      fontSize: '26px',
      fontWeight: 'bold',
      color: '#ff6b35'
    }).setOrigin(1, 0.5);

    var extraStatsY = totalY + 45;
    var extraStats = [
      { label: '最高时速', value: (stats.maxSpeed || 0) + ' km/h', icon: '🚗' },
      { label: '跳跃连击', value: (stats.jumpCombo || 0) + ' 次', icon: '🦘' },
      { label: '行驶距离', value: Math.floor(stats.distance || 0) + ' m', icon: '📏' },
      { label: '汇合次数', value: (stats.mergeCount || 0) + ' 次', icon: '🔄' }
    ];

    for (var j = 0; j < extraStats.length; j++) {
      var es = extraStats[j];
      var ex = width / 2 - panelW / 2 + 15 + j * (panelW / 4);

      var statBg = this.add.graphics();
      statBg.fillStyle(0xf8f8f8, 1);
      statBg.fillRoundedRect(ex, extraStatsY, panelW / 4 - 5, 48, 6);

      this.add.text(ex + (panelW / 4 - 5) / 2, extraStatsY + 14, es.icon, {
        fontSize: '16px'
      }).setOrigin(0.5);

      this.add.text(ex + (panelW / 4 - 5) / 2, extraStatsY + 34, es.value, {
        fontSize: '10px',
        fontWeight: 'bold',
        color: '#333333'
      }).setOrigin(0.5);
    }

    if (stats.branches && Object.keys(stats.branches).length > 1) {
      var branchesY = extraStatsY + 65;
      this.add.text(width / 2 - panelW / 2 + 15, branchesY, '🗺️ 路线探索进度', {
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#666666'
      }).setOrigin(0, 0.5);

      var totalBranches = weightBreakdown.totalBranches || Object.keys(stats.branches).length;
      var exploredCount = weightBreakdown.uniqueBranches || Object.keys(stats.branches).length;
      var progressRatio = exploredCount / totalBranches;

      var progBg = this.add.graphics();
      progBg.fillStyle(0xf0f0f0, 1);
      progBg.fillRoundedRect(width / 2 - panelW / 2 + 15, branchesY + 18, panelW - 30, 12, 6);

      var progWidth = (panelW - 30) * progressRatio;
      var progBar = this.add.graphics();
      progBar.fillGradientStyle(0x4caf50, 0x8bc34a, 0x4caf50, 0x8bc34a);
      progBar.fillRoundedRect(width / 2 - panelW / 2 + 15, branchesY + 18, progWidth, 12, 6);

      this.add.text(width / 2, branchesY + 24,
        exploredCount + ' / ' + totalBranches + ' 条路线 (' + Math.floor(progressRatio * 100) + '%)', {
          fontSize: '10px',
          fontWeight: 'bold',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 2
        }).setOrigin(0.5, 0.5);

      var branchIds = Object.keys(stats.branches);
      for (var k = 0; k < branchIds.length; k++) {
        var bid = branchIds[k];
        var bcfg = this.getBranchConfig(bid);
        var bdist = Math.floor(stats.branches[bid] || 0);
        var bname = bcfg ? bcfg.name : bid;
        var bcolor = bcfg ? bcfg.color : 0x888888;
        var bisHidden = bcfg ? bcfg.hidden : false;

        var by = branchesY + 42 + k * 18;
        var dot = this.add.graphics();
        dot.fillStyle(bcolor, 1);
        dot.fillCircle(width / 2 - panelW / 2 + 20, by, 5);

        var displayName = bname + (bisHidden ? ' ✨' : '');
        this.add.text(width / 2 - panelW / 2 + 32, by, displayName + ': ' + bdist + 'm', {
          fontSize: '10px',
          color: '#555555',
          fontWeight: bisHidden ? 'bold' : 'normal'
        }).setOrigin(0, 0.5);
      }
    }
  };

  proto.createWeightVisualization = function(width, startY, panelW, weightBreakdown) {
    var weightItems = [];

    if (weightBreakdown.riskWeight > 0) {
      weightItems.push({
        label: '风险加成',
        value: weightBreakdown.riskWeight,
        color: '#f44336',
        icon: '⚠️'
      });
    }
    if (weightBreakdown.explorationWeight > 0) {
      weightItems.push({
        label: '探索加成',
        value: weightBreakdown.explorationWeight,
        color: '#00bcd4',
        icon: '🗺️'
      });
    }
    if (weightBreakdown.perfectWeight > 0) {
      weightItems.push({
        label: '完美加成',
        value: weightBreakdown.perfectWeight,
        color: '#ffd700',
        icon: '💯'
      });
    }
    if (weightBreakdown.branchWeight > 0) {
      weightItems.push({
        label: '多路线加成',
        value: weightBreakdown.branchWeight,
        color: '#9c27b0',
        icon: '🔀'
      });
    }
    if (weightBreakdown.mergeWeight > 0) {
      weightItems.push({
        label: '汇合加成',
        value: weightBreakdown.mergeWeight,
        color: '#8bc34a',
        icon: '🔄'
      });
    }
    if (weightBreakdown.hiddenWeight > 0) {
      weightItems.push({
        label: '隐藏路线加成',
        value: weightBreakdown.hiddenWeight,
        color: '#e91e63',
        icon: '✨'
      });
    }

    if (weightItems.length === 0) return;

    var container = this.add.graphics();
    container.fillStyle(0xfafafa, 1);
    container.fillRoundedRect(width / 2 - panelW / 2 + 15, startY, panelW - 30, 22 + weightItems.length * 16, 8);
    container.lineStyle(1, 0xe0e0e0, 1);
    container.strokeRoundedRect(width / 2 - panelW / 2 + 15, startY, panelW - 30, 22 + weightItems.length * 16, 8);

    var maxValue = Math.max.apply(null, weightItems.map(function(w) { return w.value; }));
    var barMaxWidth = panelW - 120;

    for (var i = 0; i < weightItems.length; i++) {
      var item = weightItems[i];
      var y = startY + 12 + i * 16;

      this.add.text(width / 2 - panelW / 2 + 25, y, item.icon, {
        fontSize: '12px'
      }).setOrigin(0, 0.5);

      this.add.text(width / 2 - panelW / 2 + 45, y, item.label, {
        fontSize: '10px',
        color: '#666666',
        fontWeight: 'bold'
      }).setOrigin(0, 0.5);

      var ratio = maxValue > 0 ? item.value / maxValue : 0;
      var barWidth = Math.max(4, barMaxWidth * ratio);
      var barX = width / 2 - panelW / 2 + 110;

      var barBg = this.add.graphics();
      barBg.fillStyle(0xf0f0f0, 1);
      barBg.fillRoundedRect(barX, y - 5, barMaxWidth, 10, 5);

      var bar = this.add.graphics();
      var colorNum = Phaser.Display.Color.HexStringToColor(item.color).color;
      bar.fillStyle(colorNum, 0.85);
      bar.fillRoundedRect(barX, y - 5, barWidth, 10, 5);

      this.add.text(barX + barMaxWidth + 5, y, '+' + (item.value * 100).toFixed(0) + '%', {
        fontSize: '10px',
        fontWeight: 'bold',
        color: item.color
      }).setOrigin(0, 0.5);
    }
  };

  proto.createButtons = function(width, height) {
    var btnW = 160;
    var btnH = 48;
    var btnY = height / 2 + (this.win && this.detailedStats ? 260 : 160);
    var gap = 20;
    var totalW = btnW * 3 + gap * 2;
    var startX = width / 2 - totalW / 2 + btnW / 2;
    var self = this;

    var createBtn = function(x, label, color, onClick) {
      var container = self.add.container(x, btnY);
      container.setSize(btnW, btnH);

      var bg = self.add.graphics();
      bg.fillStyle(color, 1);
      bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 12);
      bg.lineStyle(2, 0xffffff, 0.5);
      bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 12);

      var text = self.add.text(0, 0, label, {
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5);

      container.add([bg, text]);
      container.setInteractive(
        new Phaser.Geom.Rectangle(-btnW / 2, -btnH / 2, btnW, btnH),
        Phaser.Geom.Rectangle.Contains
      );

      container.on('pointerover', function() {
        self.tweens.add({
          targets: container,
          scale: 1.04,
          duration: 100
        });
      });

      container.on('pointerout', function() {
        self.tweens.add({
          targets: container,
          scale: 1,
          duration: 100
        });
      });

      container.on('pointerdown', function() {
        self.tweens.add({
          targets: container,
          scale: 0.95,
          duration: 80,
          yoyo: true,
          onComplete: onClick
        });
      });

      return container;
    };

    createBtn(startX, '🏠 菜单', 0x9e9e9e, function() {
      self.scene.start('MenuScene');
    });

    createBtn(startX + btnW + gap, '🔄 重玩', 0x2196f3, function() {
      self.scene.start('GameScene', { level: self.level });
    });

    if (this.win && this.level < 3) {
      createBtn(startX + (btnW + gap) * 2, '➡ 下一关', 0x4caf50, function() {
        self.scene.start('GameScene', { level: self.level + 1 });
      });
    } else {
      createBtn(startX + (btnW + gap) * 2, this.win ? '🌟 通关' : '🎯 重试', 0xff6b35, function() {
        self.scene.start('GameScene', { level: self.level });
      });
    }
  };

  window.MountainRacer = MountainRacer;
})();
