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
    this.scoreImprovements = data.scoreImprovements || null;
    this.performanceGrade = data.performanceGrade || null;
    this.runHistory = data.runHistory || [];
    this.previousBestStats = data.previousBestStats || null;
    this.activeTab = 'summary';
    this.highScoreAnimationPlayed = false;
    this.tabElements = [];
  };

  proto.create = function() {
    var width = this.scale.width;
    var height = this.scale.height;

    this.createBackground(width, height);
    this.createResultPanel(width, height);

    if (this.win && this.detailedStats) {
      this.createHighScoreCelebration(width, height);
      this.createTabs(width, height);
      this.createSummaryTab(width, height);
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
    var panelH = this.win && this.detailedStats ? 780 : 430;

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

    if (this.win && this.performanceGrade) {
      this.createPerformanceGrade(width, height, panelH);
    }

    var isNewRecord = this.win && this.score >= this.highScore && this.score > 0;
    if (isNewRecord) {
      var record = this.add.text(width / 2, height / 2 - panelH / 2 + 220, '✨ 新纪录! ✨', {
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

  proto.createPerformanceGrade = function(width, height, panelH) {
    var grade = this.performanceGrade;
    var gradeY = height / 2 - panelH / 2 + 180;

    var gradeContainer = this.add.container(width / 2, gradeY);

    var gradeBg = this.add.graphics();
    gradeBg.fillGradientStyle(0xfff8e1, 0xfff8e1, 0xffecb3, 0xffecb3);
    gradeBg.fillRoundedRect(-60, -30, 120, 60, 12);
    gradeBg.lineStyle(3, Phaser.Display.Color.HexStringToColor(grade.color).color, 1);
    gradeBg.strokeRoundedRect(-60, -30, 120, 60, 12);
    gradeContainer.add(gradeBg);

    var gradeText = this.add.text(0, 0, grade.label, {
      fontSize: '32px',
      fontWeight: 'bold',
      color: grade.color
    }).setOrigin(0.5);
    gradeContainer.add(gradeText);

    var starsY = 35;
    for (var i = 0; i < 5; i++) {
      var star = this.add.text(-32 + i * 16, starsY, i < grade.stars ? '⭐' : '☆', {
        fontSize: '14px'
      }).setOrigin(0.5);
      gradeContainer.add(star);
    }

    var descText = this.add.text(width / 2, gradeY + 55, grade.desc, {
      fontSize: '13px',
      color: '#666666',
      fontStyle: 'italic'
    }).setOrigin(0.5);
  };

  proto.createHighScoreCelebration = function(width, height) {
    if (!this.scoreImprovements || !this.scoreImprovements.isNewBest) return;
    if (this.highScoreAnimationPlayed) return;
    this.highScoreAnimationPlayed = true;

    var isNewRecord = this.score >= this.highScore && this.score > 0;

    if (isNewRecord) {
      for (var i = 0; i < 20; i++) {
        this.createConfetti(
          Phaser.Math.Between(0, width),
          Phaser.Math.Between(-200, -50),
          Phaser.Math.Between(0, 360)
        );
      }

      var burst = this.add.text(width / 2, 200, '🎉 高分突破! 🎉', {
        fontSize: '28px',
        fontWeight: 'bold',
        color: '#ffd700',
        stroke: '#ff6b35',
        strokeThickness: 4
      }).setOrigin(0.5).setDepth(100).setAlpha(0);

      this.tweens.add({
        targets: burst,
        alpha: 1,
        scale: { from: 0.5, to: 1.2 },
        duration: 600,
        ease: 'Back.out',
        onComplete: function() {
          this.tweens.add({
            targets: burst,
            scale: 1,
            duration: 400,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: 2,
            onComplete: function() {
              this.tweens.add({
                targets: burst,
                y: 240,
                alpha: 0.7,
                duration: 1000,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1
              });
            }.bind(this)
          });
        }.bind(this)
      });
    }

    if (this.scoreImprovements.newRecords && this.scoreImprovements.newRecords.length > 0) {
      var records = this.scoreImprovements.newRecords;
      var recordText = '刷新记录: ' + records.join(' · ');
      var notif = this.add.text(width / 2, height - 90, recordText, {
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#ffffff',
        stroke: '#ff6b35',
        strokeThickness: 3
      }).setOrigin(0.5).setDepth(100).setAlpha(0);

      this.tweens.add({
        targets: notif,
        alpha: 1,
        duration: 500,
        delay: 800,
        ease: 'Back.out',
        onComplete: function() {
          this.tweens.add({
            targets: notif,
            alpha: 0,
            delay: 4000,
            duration: 500,
            onComplete: function() { notif.destroy(); }
          });
        }.bind(this)
      });
    }
  };

  proto.createTabs = function(width, height) {
    var self = this;
    var panelW = 420;
    var tabY = height / 2 - 80;
    var tabW = panelW / 3 - 4;
    var startX = width / 2 - panelW / 2 + 15;

    var tabs = [
      { id: 'summary', label: '📊 概览' },
      { id: 'breakdown', label: '🔍 拆解' },
      { id: 'comparison', label: '📈 对比' }
    ];

    this.tabButtons = [];

    for (var i = 0; i < tabs.length; i++) {
      var tab = tabs[i];
      var tx = startX + i * (tabW + 3);
      var isSelected = this.activeTab === tab.id;

      var tabBtn = this.add.container(tx + tabW / 2, tabY);
      tabBtn.setSize(tabW, 32);
      tabBtn.setData('tabId', tab.id);

      var tabBg = this.add.graphics();
      tabBtn.bg = tabBg;
      this.updateTabBg(tabBtn, isSelected);

      var tabText = this.add.text(0, 0, tab.label, {
        fontSize: '13px',
        fontWeight: 'bold',
        color: isSelected ? '#ffffff' : '#666666'
      }).setOrigin(0.5);
      tabBtn.label = tabText;
      tabBtn.add([tabBg, tabText]);

      tabBtn.setInteractive(
        new Phaser.Geom.Rectangle(-tabW / 2, -16, tabW, 32),
        Phaser.Geom.Rectangle.Contains
      );

      (function(tabId) {
        tabBtn.on('pointerdown', function() {
          self.switchTab(tabId);
        });
      })(tab.id);

      this.tabButtons.push(tabBtn);
    }
  };

  proto.updateTabBg = function(tabBtn, isSelected) {
    var tabW = tabBtn.width || 130;
    tabBtn.bg.clear();
    if (isSelected) {
      tabBtn.bg.fillStyle(0xff6b35, 1);
      tabBtn.bg.fillRoundedRect(-tabW / 2, -16, tabW, 32, 8);
    } else {
      tabBtn.bg.fillStyle(0xf0f0f0, 1);
      tabBtn.bg.fillRoundedRect(-tabW / 2, -16, tabW, 32, 8);
      tabBtn.bg.lineStyle(1, 0xdddddd, 1);
      tabBtn.bg.strokeRoundedRect(-tabW / 2, -16, tabW, 32, 8);
    }
  };

  proto.switchTab = function(tabId) {
    if (this.activeTab === tabId) return;
    this.activeTab = tabId;

    for (var i = 0; i < this.tabButtons.length; i++) {
      var isSelected = this.tabButtons[i].getData('tabId') === tabId;
      this.updateTabBg(this.tabButtons[i], isSelected);
      this.tabButtons[i].label.setColor(isSelected ? '#ffffff' : '#666666');
    }

    this.clearTabElements();

    var width = this.scale.width;
    var height = this.scale.height;

    switch (tabId) {
      case 'summary':
        this.createSummaryTab(width, height);
        break;
      case 'breakdown':
        this.createBreakdownTab(width, height);
        break;
      case 'comparison':
        this.createComparisonTab(width, height);
        break;
    }
  };

  proto.clearTabElements = function() {
    if (this.tabElements) {
      for (var i = 0; i < this.tabElements.length; i++) {
        if (this.tabElements[i] && this.tabElements[i].destroy) {
          this.tabElements[i].destroy();
        }
      }
    }
    this.tabElements = [];
  };

  proto.addTabElement = function(el) {
    this.tabElements.push(el);
    return el;
  };

  proto.createSummaryTab = function(width, height) {
    this.createDetailedStats(width, height);
  };

  proto.createBreakdownTab = function(width, height) {
    var dimensions = this.performanceGrade ? this.performanceGrade.scoreBreakdown : [];
    if (dimensions.length === 0) {
      var label = this.add.text(width / 2, height / 2 + 20, '暂无拆解数据', {
        fontSize: '16px',
        color: '#999999'
      }).setOrigin(0.5);
      this.addTabElement(label);
      return;
    }

    var panelW = 420;
    var startY = height / 2 - 50;

    var header = this.add.text(width / 2 - panelW / 2 + 20, startY, '🎯 成绩维度拆解', {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#333333'
    }).setOrigin(0, 0.5);
    this.addTabElement(header);

    var radarCX = width / 2;
    var radarCY = startY + 130;
    var radarR = 80;

    this.addTabElement(this.createRadarBackground(radarCX, radarCY, radarR, dimensions.length));

    this.createRadarData(radarCX, radarCY, radarR, dimensions);

    for (var di = 0; di < dimensions.length; di++) {
      var dim = dimensions[di];
      var angle = (Math.PI * 2 * di / dimensions.length) - Math.PI / 2;
      var labelX = radarCX + Math.cos(angle) * (radarR + 25);
      var labelY = radarCY + Math.sin(angle) * (radarR + 25);

      var dimLabel = this.add.text(labelX, labelY, dim.icon + ' ' + dim.label, {
        fontSize: '11px',
        fontWeight: 'bold',
        color: dim.color
      }).setOrigin(0.5);
      this.addTabElement(dimLabel);
    }

    var detailY = radarCY + radarR + 50;

    for (var dj = 0; dj < dimensions.length; dj++) {
      var d = dimensions[dj];
      var rowY = detailY + dj * 36;
      var rowBg = this.add.graphics();
      rowBg.fillStyle(0xf8f8f8, 1);
      rowBg.fillRoundedRect(width / 2 - panelW / 2 + 15, rowY - 10, panelW - 30, 30, 6);
      this.addTabElement(rowBg);

      var dimIcon = this.add.text(width / 2 - panelW / 2 + 28, rowY + 4, d.icon, {
        fontSize: '14px'
      }).setOrigin(0, 0.5);
      this.addTabElement(dimIcon);

      var dimName = this.add.text(width / 2 - panelW / 2 + 50, rowY + 4, d.label, {
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#333333'
      }).setOrigin(0, 0.5);
      this.addTabElement(dimName);

      var dimDesc = this.add.text(width / 2 - panelW / 2 + 50, rowY + 18, d.description, {
        fontSize: '9px',
        color: '#999999'
      }).setOrigin(0, 0.5);
      this.addTabElement(dimDesc);

      var barX = width / 2 + 30;
      var barMaxW = panelW / 2 - 40;
      var barBgGfx = this.add.graphics();
      barBgGfx.fillStyle(0xe8e8e8, 1);
      barBgGfx.fillRoundedRect(barX, rowY - 2, barMaxW, 10, 5);
      this.addTabElement(barBgGfx);

      var pct = Math.min(1, d.score / 100);
      var fillW = Math.max(4, barMaxW * pct);
      var fillColor = Phaser.Display.Color.HexStringToColor(d.color).color;
      var barFill = this.add.graphics();
      barFill.fillStyle(fillColor, 0.85);
      barFill.fillRoundedRect(barX, rowY - 2, fillW, 10, 5);
      this.addTabElement(barFill);

      var scoreLabel = this.add.text(barX + barMaxW + 5, rowY + 3, d.score + '/100', {
        fontSize: '10px',
        fontWeight: 'bold',
        color: d.color
      }).setOrigin(0, 0.5);
      this.addTabElement(scoreLabel);
    }
  };

  proto.createRadarBackground = function(cx, cy, r, sides) {
    var gfx = this.add.graphics();
    gfx.setDepth(10);

    for (var ring = 1; ring <= 4; ring++) {
      var rr = r * ring / 4;
      gfx.lineStyle(1, 0xdddddd, 0.5);
      gfx.beginPath();
      for (var i = 0; i <= sides; i++) {
        var angle = (Math.PI * 2 * i / sides) - Math.PI / 2;
        var px = cx + Math.cos(angle) * rr;
        var py = cy + Math.sin(angle) * rr;
        if (i === 0) gfx.moveTo(px, py);
        else gfx.lineTo(px, py);
      }
      gfx.strokePath();
    }

    for (var j = 0; j < sides; j++) {
      var a = (Math.PI * 2 * j / sides) - Math.PI / 2;
      gfx.lineStyle(1, 0xdddddd, 0.3);
      gfx.beginPath();
      gfx.moveTo(cx, cy);
      gfx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      gfx.strokePath();
    }

    this.addTabElement(gfx);
    return gfx;
  };

  proto.createRadarData = function(cx, cy, r, dimensions) {
    var gfx = this.add.graphics();
    gfx.setDepth(11);
    gfx.fillStyle(0xff6b35, 0.25);
    gfx.lineStyle(2, 0xff6b35, 0.8);

    gfx.beginPath();
    for (var i = 0; i <= dimensions.length; i++) {
      var idx = i % dimensions.length;
      var angle = (Math.PI * 2 * idx / dimensions.length) - Math.PI / 2;
      var pct = Math.min(1, dimensions[idx].score / 100);
      var px = cx + Math.cos(angle) * r * pct;
      var py = cy + Math.sin(angle) * r * pct;
      if (i === 0) gfx.moveTo(px, py);
      else gfx.lineTo(px, py);
    }
    gfx.fillPath();
    gfx.strokePath();

    for (var j = 0; j < dimensions.length; j++) {
      var a2 = (Math.PI * 2 * j / dimensions.length) - Math.PI / 2;
      var p = Math.min(1, dimensions[j].score / 100);
      var dotX = cx + Math.cos(a2) * r * p;
      var dotY = cy + Math.sin(a2) * r * p;
      gfx.fillStyle(0xff6b35, 1);
      gfx.fillCircle(dotX, dotY, 4);
      gfx.fillStyle(0xffffff, 1);
      gfx.fillCircle(dotX, dotY, 2);
    }

    this.addTabElement(gfx);
  };

  proto.createComparisonTab = function(width, height) {
    var panelW = 420;
    var startY = height / 2 - 50;

    var header = this.add.text(width / 2 - panelW / 2 + 20, startY, '📈 重跑对比', {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#333333'
    }).setOrigin(0, 0.5);
    this.addTabElement(header);

    if (this.scoreImprovements && this.scoreImprovements.improvements && this.scoreImprovements.improvements.length > 0) {
      var impY = startY + 35;
      var impHeader = this.add.text(width / 2 - panelW / 2 + 20, impY, '🏆 与上次最佳对比', {
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#ff6b35'
      }).setOrigin(0, 0.5);
      this.addTabElement(impHeader);

      var improvements = this.scoreImprovements.improvements;
      for (var i = 0; i < improvements.length; i++) {
        var imp = improvements[i];
        var iy = impY + 30 + i * 42;

        var impBg = this.add.graphics();
        impBg.fillStyle(imp.major ? 0xfff8e1 : 0xf5f5f5, 1);
        impBg.fillRoundedRect(width / 2 - panelW / 2 + 15, iy - 10, panelW - 30, 36, 8);
        if (imp.major) {
          impBg.lineStyle(1, 0xffd700, 1);
          impBg.strokeRoundedRect(width / 2 - panelW / 2 + 15, iy - 10, panelW - 30, 36, 8);
        }
        this.addTabElement(impBg);

        var impIcon = this.add.text(width / 2 - panelW / 2 + 30, iy + 8, imp.icon, {
          fontSize: '16px'
        }).setOrigin(0, 0.5);
        this.addTabElement(impIcon);

        var impLabel = this.add.text(width / 2 - panelW / 2 + 55, iy + 2, imp.label, {
          fontSize: '13px',
          fontWeight: 'bold',
          color: '#333333'
        }).setOrigin(0, 0.5);
        this.addTabElement(impLabel);

        var prevLabel = this.add.text(width / 2 - panelW / 2 + 55, iy + 17, '上次: ' + imp.previous, {
          fontSize: '9px',
          color: '#999999'
        }).setOrigin(0, 0.5);
        this.addTabElement(prevLabel);

        if (imp.isBoolean) {
          var boolVal = this.add.text(width / 2 + panelW / 2 - 25, iy + 8, imp.current, {
            fontSize: '16px'
          }).setOrigin(1, 0.5);
          this.addTabElement(boolVal);
        } else {
          var diffText = '+' + imp.diff;
          if (imp.faster) diffText = '快 ' + imp.diff.toFixed(1) + 's';
          var diffColor = imp.faster ? '#4caf50' : '#ff6b35';
          var diffLabel = this.add.text(width / 2 + panelW / 2 - 60, iy + 3, diffText, {
            fontSize: '12px',
            fontWeight: 'bold',
            color: diffColor
          }).setOrigin(1, 0.5);
          this.addTabElement(diffLabel);

          var pctLabel = this.add.text(width / 2 + panelW / 2 - 25, iy + 3, '↑' + imp.percent + '%', {
            fontSize: '10px',
            color: diffColor
          }).setOrigin(1, 0.5);
          this.addTabElement(pctLabel);

          var curVal = this.add.text(width / 2 + panelW / 2 - 25, iy + 17, '当前: ' + imp.current, {
            fontSize: '9px',
            color: '#666666'
          }).setOrigin(1, 0.5);
          this.addTabElement(curVal);
        }
      }
    } else if (this.previousBestStats) {
      var noImpr = this.add.text(width / 2, startY + 60, '本次暂无提升项，继续努力！', {
        fontSize: '14px',
        color: '#999999'
      }).setOrigin(0.5);
      this.addTabElement(noImpr);
    } else {
      var firstRun = this.add.text(width / 2, startY + 60, '首次通关！下次将显示对比数据', {
        fontSize: '14px',
        color: '#ff6b35'
      }).setOrigin(0.5);
      this.addTabElement(firstRun);
    }

    if (this.runHistory && this.runHistory.length > 1) {
      var historyY = startY + 300;
      var histHeader = this.add.text(width / 2 - panelW / 2 + 20, historyY, '📋 历史记录 (最近' + Math.min(this.runHistory.length, 5) + '次)', {
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#666666'
      }).setOrigin(0, 0.5);
      this.addTabElement(histHeader);

      var displayCount = Math.min(this.runHistory.length, 5);
      for (var h = 0; h < displayCount; h++) {
        var run = this.runHistory[h];
        var hy = historyY + 25 + h * 22;

        var runBg = this.add.graphics();
        runBg.fillStyle(h === 0 ? 0xfff3e0 : 0xf8f8f8, 1);
        runBg.fillRoundedRect(width / 2 - panelW / 2 + 15, hy - 8, panelW - 30, 18, 4);
        this.addTabElement(runBg);

        var runIdx = this.add.text(width / 2 - panelW / 2 + 25, hy, '#' + (h + 1), {
          fontSize: '10px',
          fontWeight: 'bold',
          color: h === 0 ? '#ff6b35' : '#999999'
        }).setOrigin(0, 0.5);
        this.addTabElement(runIdx);

        var runScore = this.add.text(width / 2 - panelW / 2 + 55, hy, run.score + '分', {
          fontSize: '10px',
          fontWeight: 'bold',
          color: h === 0 ? '#ff6b35' : '#333333'
        }).setOrigin(0, 0.5);
        this.addTabElement(runScore);

        var runTime = this.add.text(width / 2 + 20, hy, run.win ? '✅' : '❌', {
          fontSize: '10px'
        }).setOrigin(0, 0.5);
        this.addTabElement(runTime);

        var runDist = this.add.text(width / 2 + 60, hy, run.distance + 'm', {
          fontSize: '10px',
          color: '#888888'
        }).setOrigin(0, 0.5);
        this.addTabElement(runDist);

        var runCombo = this.add.text(width / 2 + panelW / 2 - 25, hy, '🔥x' + run.maxCombo, {
          fontSize: '10px',
          color: '#ff5722'
        }).setOrigin(1, 0.5);
        this.addTabElement(runCombo);
      }
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
    var config = MountainRacer.LEVEL_CONFIGS[this.level] || { name: 'Level ' + this.level };
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
      { label: '汇合奖励', value: bonus.mergeBonus || 0, color: '#8bc34a' },
      { label: '连击奖励', value: bonus.comboBonus || 0, color: '#ff5722' }
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
    var comboInfo = stats.comboInfo || {};
    var extraStats = [
      { label: '最高时速', value: (stats.maxSpeed || 0) + ' km/h', icon: '🚗' },
      { label: '最大连击', value: (comboInfo.maxCombo || 0) + ' 次', icon: '🔥' },
      { label: '行驶距离', value: Math.floor(stats.distance || 0) + ' m', icon: '📏' },
      { label: '连续过障', value: (comboInfo.totalObstaclePasses || 0) + ' 次', icon: '🎯' }
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

    if (comboInfo.maxCombo > 0) {
      var comboSectionY = extraStatsY + 65;
      if (stats.branches && Object.keys(stats.branches).length > 1) {
        comboSectionY = extraStatsY + 65 + (Object.keys(stats.branches).length + 1) * 18 + 20;
      }

      this.add.text(width / 2 - panelW / 2 + 15, comboSectionY, '🔥 连击系统明细', {
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#ff5722'
      }).setOrigin(0, 0.5);

      var comboItems = [
        { label: '最高连击', value: comboInfo.maxCombo + ' 次', icon: '🔥' },
        { label: '连击总分', value: '+' + comboInfo.comboBonusTotal, icon: '⭐' },
        { label: '连续过障', value: comboInfo.totalObstaclePasses + ' 次', icon: '🎯' },
        { label: '无伤路段', value: comboInfo.damageFreeSegments + ' 段', icon: '🛡️' }
      ];

      for (var ci = 0; ci < comboItems.length; ci++) {
        var cItem = comboItems[ci];
        var cx = width / 2 - panelW / 2 + 15 + ci * (panelW / 4);

        var cBg = this.add.graphics();
        cBg.fillStyle(0xfff3e0, 1);
        cBg.fillRoundedRect(cx, comboSectionY + 18, panelW / 4 - 5, 40, 6);
        cBg.lineStyle(1, 0xff5722, 0.3);
        cBg.strokeRoundedRect(cx, comboSectionY + 18, panelW / 4 - 5, 40, 6);

        this.add.text(cx + (panelW / 4 - 5) / 2, comboSectionY + 26, cItem.icon, {
          fontSize: '14px'
        }).setOrigin(0.5);

        this.add.text(cx + (panelW / 4 - 5) / 2, comboSectionY + 44, cItem.value, {
          fontSize: '10px',
          fontWeight: 'bold',
          color: '#ff5722'
        }).setOrigin(0.5);
      }

      if (comboInfo.comboHistory && comboInfo.comboHistory.length > 0) {
        var historyY = comboSectionY + 68;
        this.add.text(width / 2 - panelW / 2 + 15, historyY, '📋 近期连击', {
          fontSize: '11px',
          color: '#999999'
        }).setOrigin(0, 0.5);

        var reasonLabels = {
          'airTime': '🦘 腾空',
          'obstaclePass': '🎯 过障',
          'damageFree': '🛡️ 无伤'
        };

        var displayCount = Math.min(comboInfo.comboHistory.length, 5);
        for (var hi = 0; hi < displayCount; hi++) {
          var histEntry = comboInfo.comboHistory[comboInfo.comboHistory.length - displayCount + hi];
          var hy = historyY + 18 + hi * 16;
          var reasonLabel = reasonLabels[histEntry.reason] || histEntry.reason;

          this.add.text(width / 2 - panelW / 2 + 25, hy, reasonLabel, {
            fontSize: '10px',
            color: '#888888'
          }).setOrigin(0, 0.5);

          this.add.text(width / 2 - panelW / 2 + 100, hy,
            'x' + histEntry.comboCount + ' → +' + histEntry.points, {
            fontSize: '10px',
            fontWeight: 'bold',
            color: '#ff9800'
          }).setOrigin(0, 0.5);

          this.add.text(width / 2 + panelW / 2 - 25, hy,
            Math.floor(histEntry.distance) + 'm', {
            fontSize: '10px',
            color: '#bbbbbb'
          }).setOrigin(1, 0.5);
        }
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
    if (weightBreakdown.comboWeight > 0) {
      weightItems.push({
        label: '连击加成',
        value: weightBreakdown.comboWeight,
        color: '#ff5722',
        icon: '🔥'
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
    var btnY = height / 2 + (this.win && this.detailedStats ? 310 : 160);
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
