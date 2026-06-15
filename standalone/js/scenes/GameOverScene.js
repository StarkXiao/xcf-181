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
    this.replayComparison = data.replayComparison || null;
    this.starRating = data.starRating || null;
    this.replayAnalysis = data.replayAnalysis || null;
    this.activeTab = 'summary';
    this.highScoreAnimationPlayed = false;
    this.tabContentElements = [];
  };

  proto.create = function() {
    var width = this.scale.width;
    var height = this.scale.height;

    this.createBackground(width, height);
    this.createResultPanel(width, height);

    if (this.win && this.detailedStats) {
      this.createHighScoreCelebration(width, height);
      this.createTabs(width, height);
      this.showTab('summary');
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
    var needStarPanel = this.win && this.starRating;
    var panelH = needStarPanel ? 1060 : (this.win && this.detailedStats ? 860 : 430);

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

    if (this.win && this.starRating) {
      this.createStarRatingPanel(width, height, panelH);
    } else if (this.win && this.performanceGrade) {
      this.createPerformanceGrade(width, height, panelH);
    }

    if (this.win && this.detailedStats && this.detailedStats.highScoreBreakthrough) {
      this.createBreakthroughBanner(width, height, panelH);
    }

    var isNewRecord = this.win && this.score >= this.highScore && this.score > 0;
    if (isNewRecord) {
      var recordY = height / 2 - panelH / 2 + 220;
      if (this.detailedStats && this.detailedStats.highScoreBreakthrough) {
        recordY += 30;
      }
      var record = this.add.text(width / 2, recordY, '✨ 新纪录! ✨', {
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

  proto.createBreakthroughBanner = function(width, height, panelH) {
    var breakthrough = this.detailedStats.highScoreBreakthrough;
    if (!breakthrough) return;

    var bannerY = height / 2 - panelH / 2 + 220;
    var container = this.add.container(width / 2, bannerY);

    var bg = this.add.graphics();
    var bgColor = breakthrough.threshold >= 1.0 ? 0xffd700 : 0xff6b35;
    bg.fillStyle(bgColor, 0.15);
    bg.fillRoundedRect(-140, -18, 280, 36, 10);
    bg.lineStyle(2, bgColor, 1);
    bg.strokeRoundedRect(-140, -18, 280, 36, 10);
    container.add(bg);

    var icon = breakthrough.threshold >= 1.0 ? '🏆' : '🔥';
    var title = this.add.text(0, 0, icon + ' ' + breakthrough.label + ' (' + breakthrough.percentage + '%)', {
      fontSize: '15px',
      fontWeight: 'bold',
      color: breakthrough.threshold >= 1.0 ? '#ffd700' : '#ff6b35'
    }).setOrigin(0.5);
    container.add(title);

    container.setAlpha(0);
    this.tweens.add({
      targets: container,
      alpha: 1,
      duration: 600,
      delay: 800,
      ease: 'Back.out'
    });

    if (breakthrough.threshold >= 1.0) {
      this.createBreakthroughFireworks(width, height, bannerY);
    }
  };

  proto.createBreakthroughFireworks = function(width, height, centerY) {
    var self = this;
    var delay = 1200;

    for (var i = 0; i < 5; i++) {
      (function(index) {
        self.time.delayedCall(delay + index * 300, function() {
          var fx = Phaser.Math.Between(100, width - 100);
          var fy = Phaser.Math.Between(50, Math.floor(centerY - 40));
          self.createFireworkBurst(fx, fy);
        });
      })(i);
    }
  };

  proto.createFireworkBurst = function(x, y) {
    var colors = [0xffd700, 0xff6b35, 0xe91e63, 0x2196f3, 0x4caf50, 0x9c27b0];
    var particleCount = 8;

    for (var i = 0; i < particleCount; i++) {
      var angle = (i / particleCount) * Math.PI * 2;
      var speed = 30 + Math.random() * 40;
      var color = Phaser.Utils.Array.GetRandom(colors);
      var size = 3 + Math.random() * 3;

      var particle = this.add.graphics();
      particle.fillStyle(color, 1);
      particle.fillCircle(0, 0, size);
      particle.x = x;
      particle.y = y;
      particle.setDepth(100);

      var targetX = x + Math.cos(angle) * speed;
      var targetY = y + Math.sin(angle) * speed;

      this.tweens.add({
        targets: particle,
        x: targetX,
        y: targetY,
        alpha: 0,
        scale: 0.2,
        duration: 600 + Math.random() * 400,
        ease: 'Power2',
        onComplete: function() { particle.destroy(); }
      });
    }
  };

  proto.createStarRatingPanel = function(width, height, panelH) {
    var starRating = this.starRating;
    var baseY = height / 2 - panelH / 2 + 195;
    var stars = starRating.stars || 0;
    var maxStars = starRating.maxStars || 3;

    var starContainer = this.add.container(width / 2, baseY);

    var bigStarSize = 52;
    var starSpacing = 70;
    var totalWidth = (maxStars - 1) * starSpacing;
    var startX = -totalWidth / 2;

    this.bigStars = [];

    for (var i = 0; i < maxStars; i++) {
      var starIdx = i;
      var isAchieved = i < stars;

      var starBg = this.add.graphics();
      starBg.fillStyle(0xf8f9fa, 1);
      starBg.fillCircle(0, 0, 36);
      starBg.lineStyle(3, isAchieved ? 0xffd700 : 0xdddddd, 1);
      starBg.strokeCircle(0, 0, 36);
      starBg.x = startX + i * starSpacing;
      starContainer.add(starBg);

      var starChar = isAchieved ? '⭐' : '☆';
      var bigStar = this.add.text(0, 0, starChar, {
        fontSize: bigStarSize + 'px',
        color: isAchieved ? '#ffd700' : '#cccccc'
      }).setOrigin(0.5);
      bigStar.x = startX + i * starSpacing;
      bigStar.setAlpha(isAchieved ? 0 : 1);
      starContainer.add(bigStar);
      this.bigStars.push(bigStar);

      if (isAchieved) {
        (function(starRef, idx, achieved) {
          var delay = 400 + idx * 600;
          setTimeout(function() {
            starRef.setAlpha(1);
            if (achieved) {
              starRef.scene.tweens.add({
                targets: starRef,
                scale: { from: 0.3, to: 1.2 },
                duration: 500,
                ease: 'Back.out',
                onComplete: function() {
                  starRef.scene.tweens.add({
                    targets: starRef,
                    scale: { from: 1.2, to: 1 },
                    duration: 200,
                    ease: 'Sine.out'
                  });
                }
              });
            }
          }, delay);
        })(bigStar, starIdx, isAchieved);
      }
    }

    var resultLabel = '';
    var resultColor = '#cccccc';
    if (stars === 3) {
      resultLabel = '🌟 完美通关! 🌟';
      resultColor = '#ffd700';
    } else if (stars === 2) {
      resultLabel = '🎉 优秀表现!';
      resultColor = '#ff9800';
    } else if (stars === 1) {
      resultLabel = '✅ 成功通关';
      resultColor = '#4caf50';
    }

    var labelText = this.add.text(0, 55, resultLabel, {
      fontSize: '20px',
      fontWeight: 'bold',
      color: resultColor
    }).setOrigin(0.5);
    starContainer.add(labelText);

    this.createStarConditionsDetail(width, height, panelH, baseY + 100);
  };

  proto.createStarConditionsDetail = function(width, height, panelH, startY) {
    var starRating = this.starRating;
    var conditions = starRating.conditions || {};
    var breakdown = starRating.breakdown || {};
    var leftX = width / 2 - 180;
    var panelW = 360;

    var header = this.add.graphics();
    header.fillStyle(0xf8f9fa, 1);
    header.fillRoundedRect(leftX, startY - 20, panelW, 24, 8);
    header.lineStyle(1, 0xdee2e6, 1);
    header.strokeRoundedRect(leftX, startY - 20, panelW, 24, 8);

    var headerText = this.add.text(width / 2, startY - 8, '📋 星级达成条件', {
      fontSize: '13px',
      fontWeight: 'bold',
      color: '#495057'
    }).setOrigin(0.5);

    var conditionKeys = ['star1', 'star2', 'star3'];
    for (var i = 0; i < conditionKeys.length; i++) {
      var key = conditionKeys[i];
      var cond = conditions[key];
      if (!cond) continue;

      var rowY = startY + 12 + i * 52;

      var rowBg = this.add.graphics();
      rowBg.fillStyle(cond.achieved ? 0xe8f5e9 : 0xfafafa, 1);
      rowBg.fillRoundedRect(leftX, rowY - 18, panelW, 48, 8);
      rowBg.lineStyle(1, cond.achieved ? 0x4caf50 : 0xe0e0e0, 1);
      rowBg.strokeRoundedRect(leftX, rowY - 18, panelW, 48, 8);

      var iconText = this.add.text(leftX + 15, rowY, cond.icon || '⭐', {
        fontSize: '20px'
      }).setOrigin(0, 0.5);

      var starNum = this.add.text(leftX + 50, rowY - 10,
        (i + 1) + '★ ' + cond.label, {
          fontSize: '13px',
          fontWeight: 'bold',
          color: cond.achieved ? '#2e7d32' : '#666666'
        }).setOrigin(0, 0.5);

      var detailText = this.add.text(leftX + 50, rowY + 8, cond.detail, {
        fontSize: '10px',
        color: cond.achieved ? '#4caf50' : '#999999'
      }).setOrigin(0, 0.5);

      var statusChar = cond.achieved ? '✅' : '⭕';
      var statusText = this.add.text(leftX + panelW - 18, rowY, statusChar, {
        fontSize: '18px'
      }).setOrigin(1, 0.5);

      if (cond.actual && !cond.achieved) {
        var actualText = this.add.text(leftX + panelW - 18, rowY + 10, cond.actual, {
          fontSize: '9px',
          color: '#ff9800',
          fontStyle: 'italic'
        }).setOrigin(1, 0.5);
      }
    }

    var dimY = startY + 12 + 3 * 52 + 12;
    this.createStarDimensionBars(width, dimY, breakdown);
  };

  proto.createStarDimensionBars = function(width, startY, breakdown) {
    var panelW = 360;
    var leftX = width / 2 - 180;
    var barMaxWidth = 200;
    var barHeight = 14;

    var header = this.add.graphics();
    header.fillStyle(0xf0f4ff, 1);
    header.fillRoundedRect(leftX, startY, panelW, 22, 6);
    var headerText = this.add.text(width / 2, startY + 11, '📊 三维度达成度', {
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#2196f3'
    }).setOrigin(0.5);

    var timeData = breakdown.time || {};
    var healthData = breakdown.health || {};
    var hiddenData = breakdown.hidden || {};

    var timePct = Math.min(100,
      (timeData.threeStarTarget && timeData.value > 0) ?
      Math.max(0, Math.min(100, (timeData.threeStarTarget / Math.max(1, timeData.value)) * 100)) : 0);
    var healthPct = healthData.value || 0;
    var hiddenPct = hiddenData.totalBranches > 0 ?
      ((hiddenData.branchesVisited || 0) / hiddenData.totalBranches) * 100 : 0;

    var dimensions = [
      {
        icon: '⏱',
        label: '完成时间',
        pct: timePct,
        value: (timeData.value || 0) + 's',
        target: '目标≤' + (timeData.threeStarTarget || 0) + 's / ≤' + (timeData.twoStarTarget || 0) + 's',
        threeStar: timeData.threeStar,
        twoStar: timeData.twoStar,
        color: 0x2196f3,
        colorStr: '#2196f3'
      },
      {
        icon: '❤️',
        label: '剩余生命',
        pct: healthPct,
        value: (healthData.value || 0) + '%',
        target: '目标≥' + (healthData.threeStarTarget || 0) + '% / ≥' + (healthData.twoStarTarget || 0) + '%',
        threeStar: healthData.threeStar,
        twoStar: healthData.twoStar,
        color: 0xe91e63,
        colorStr: '#e91e63'
      },
      {
        icon: '🗺️',
        label: '隐藏目标',
        pct: hiddenPct,
        value: (hiddenData.branchesVisited || 0) + '/' + (hiddenData.totalBranches || 0) + ' 路线',
        target: hiddenData.totalHiddenBranches > 0 ?
          '探索所有' + (hiddenData.totalBranches || 0) + '条路线 (含' + hiddenData.totalHiddenBranches + '隐藏)' :
          '探索所有路线',
        threeStar: hiddenData.achieved,
        twoStar: hiddenData.branchesVisited > 1,
        color: 0x9c27b0,
        colorStr: '#9c27b0'
      }
    ];

    for (var d = 0; d < dimensions.length; d++) {
      var dim = dimensions[d];
      var y = startY + 35 + d * 46;

      var rowBg = this.add.graphics();
      rowBg.fillStyle(d % 2 === 0 ? 0xfafafa : 0xf8f9fa, 1);
      rowBg.fillRoundedRect(leftX, y - 14, panelW, 42, 6);

      var iconT = this.add.text(leftX + 10, y, dim.icon, {
        fontSize: '16px'
      }).setOrigin(0, 0.5);

      var labelT = this.add.text(leftX + 35, y - 8, dim.label, {
        fontSize: '11px',
        fontWeight: 'bold',
        color: '#333333'
      }).setOrigin(0, 0.5);

      var targetT = this.add.text(leftX + 35, y + 7, dim.target, {
        fontSize: '9px',
        color: '#999999'
      }).setOrigin(0, 0.5);

      var barX = leftX + 145;
      var barBg = this.add.graphics();
      barBg.fillStyle(0xe0e0e0, 0.6);
      barBg.fillRoundedRect(barX, y - 6, barMaxWidth, barHeight, 7);

      var fillW = Math.max(3, (dim.pct / 100) * barMaxWidth);
      var barFill = this.add.graphics();
      barFill.fillStyle(dim.color, 0.9);
      barFill.fillRoundedRect(barX, y - 6, fillW, barHeight, 7);

      var valueT = this.add.text(barX + barMaxWidth + 5, y, dim.value, {
        fontSize: '11px',
        fontWeight: 'bold',
        color: dim.colorStr
      }).setOrigin(0, 0.5);

      if (dim.threeStar) {
        var markT = this.add.text(barX + barMaxWidth - 5, y - 12, '★★★', {
          fontSize: '10px',
          color: '#ffd700'
        }).setOrigin(1, 0.5);
      } else if (dim.twoStar) {
        var mark2T = this.add.text(barX + barMaxWidth - 5, y - 12, '★★', {
          fontSize: '10px',
          color: '#ff9800'
        }).setOrigin(1, 0.5);
      }
    }
  };

  proto.createPerformanceGrade = function(width, height, panelH) {
    var grade = this.performanceGrade;
    var gradeY = height / 2 - panelH / 2 + 180;

    var gradeContainer = this.add.container(width / 2, gradeY);

    var gradeBg = this.add.graphics();
    gradeBg.fillGradientStyle(0xfff8e1, 0xfff8e1, 0xffecb3, 0xffecb3);
    gradeBg.fillRoundedRect(-60, -30, 120, 60, 12);
    gradeBg.lineStyle(3, grade.color, 1);
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

  proto.createHighScoreCelebration = function(width, height) {
    if (!this.win || this.score < this.highScore || this.highScoreAnimationPlayed) return;
    this.highScoreAnimationPlayed = true;

    var isNewRecord = this.score >= this.highScore && this.score > 0;
    if (!isNewRecord) return;

    for (var i = 0; i < 20; i++) {
      this.createConfetti(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(-200, -50),
        Phaser.Math.Between(0, 360)
      );
    }
  };

  proto.createTabs = function(width, height) {
    var self = this;
    var tabY = this.starRating ? (height / 2 + 105) : (height / 2 - 95);
    var tabWidth = 100;
    var tabHeight = 32;
    var tabGap = 6;
    var tabs = [
      { id: 'summary', label: '📊总览', color: 0x4caf50 },
      { id: 'replayReview', label: '🔍复盘', color: 0x9c27b0 },
      { id: 'replay', label: '🔄对比', color: 0x2196f3 },
      { id: 'breakdown', label: '📈拆解', color: 0xff6b35 }
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

      var bg = this.add.graphics();
      container.bg = bg;

      var updateVisual = function(selected, tabBg, tabLabel) {
        tabBg.clear();
        if (selected) {
          tabBg.fillStyle(0xffffff, 0.95);
          tabBg.fillRoundedRect(-tabWidth / 2, -tabHeight / 2, tabWidth, tabHeight, 8);
          tabBg.lineStyle(3, tab.color, 1);
          tabBg.strokeRoundedRect(-tabWidth / 2, -tabHeight / 2, tabWidth, tabHeight, 8);
          if (tabLabel) tabLabel.setColor('#333333');
        } else {
          tabBg.fillStyle(0xf0f0f0, 0.9);
          tabBg.fillRoundedRect(-tabWidth / 2, -tabHeight / 2, tabWidth, tabHeight, 8);
          tabBg.lineStyle(2, 0xcccccc, 1);
          tabBg.strokeRoundedRect(-tabWidth / 2, -tabHeight / 2, tabWidth, tabHeight, 8);
          if (tabLabel) tabLabel.setColor('#888888');
        }
      };

      var label = this.add.text(0, 0, tab.label, {
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#888888'
      }).setOrigin(0.5);
      container.label = label;

      updateVisual(tab.id === this.activeTab, bg, label);
      container.add(bg);
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
      })(tab.id, container, bg, label);

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
      case 'summary':
        this.createSummaryTab(this.scale.width, this.scale.height);
        break;
      case 'replayReview':
        this.createReplayReviewTab(this.scale.width, this.scale.height);
        break;
      case 'replay':
        this.createReplayComparisonTab(this.scale.width, this.scale.height);
        break;
      case 'breakdown':
        this.createBreakdownTab(this.scale.width, this.scale.height);
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

  proto.createSummaryTab = function(width, height) {
    this.createDetailedStats(width, height);
  };

  proto.createReplayReviewTab = function(width, height) {
    var panelW = 420;
    var contentY = height / 2 - 70;
    var leftX = width / 2 - panelW / 2 + 15;

    if (!this.replayAnalysis || !this.replayAnalysis.speedCurve || this.replayAnalysis.speedCurve.length === 0) {
      var noData = this.add.text(width / 2, contentY + 50, '📋 暂无复盘数据', {
        fontSize: '16px',
        color: '#999999',
        fontStyle: 'italic'
      }).setOrigin(0.5);
      this.addTabElement(noData);
      return;
    }

    var ra = this.replayAnalysis;

    var headerBg = this.add.graphics();
    headerBg.fillStyle(0xf3e5f5, 1);
    headerBg.fillRoundedRect(leftX, contentY, panelW - 30, 36, 8);
    this.addTabElement(headerBg);

    var headerText = this.add.text(width / 2, contentY + 18, '🔍 关卡复盘分析', {
      fontSize: '15px',
      fontWeight: 'bold',
      color: '#9c27b0'
    }).setOrigin(0.5);
    this.addTabElement(headerText);

    this.createSpeedCurveSection(width, contentY + 48, panelW, ra);
    this.createHitNodesSection(width, contentY + 48 + 160, panelW, ra);
    this.createMistakesSection(width, contentY + 48 + 260, panelW, ra);
    this.createBestSegmentSection(width, contentY + 48 + 370, panelW, ra);
  };

  proto.createSpeedCurveSection = function(width, startY, panelW, ra) {
    var leftX = width / 2 - panelW / 2 + 15;
    var chartW = panelW - 30;
    var chartH = 90;

    var sectionBg = this.add.graphics();
    sectionBg.fillStyle(0xfafafa, 1);
    sectionBg.fillRoundedRect(leftX, startY, chartW, 148, 8);
    sectionBg.lineStyle(1, 0xe0e0e0, 1);
    sectionBg.strokeRoundedRect(leftX, startY, chartW, 148, 8);
    this.addTabElement(sectionBg);

    var title = this.add.text(leftX + 10, startY + 10, '📈 速度曲线', {
      fontSize: '13px',
      fontWeight: 'bold',
      color: '#333333'
    }).setOrigin(0, 0.5);
    this.addTabElement(title);

    var ss = ra.speedStats;
    if (ss) {
      var statsText = this.add.text(leftX + chartW - 5, startY + 10,
        '最高 ' + ss.max + ' / 均速 ' + ss.avg + ' km/h', {
          fontSize: '10px',
          color: '#2196f3'
        }).setOrigin(1, 0.5);
      this.addTabElement(statsText);
    }

    var chartBg = this.add.graphics();
    chartBg.fillStyle(0xf5f5f5, 1);
    chartBg.fillRoundedRect(leftX + 10, startY + 28, chartW - 20, chartH, 4);
    chartBg.lineStyle(1, 0xe0e0e0, 1);
    chartBg.strokeRoundedRect(leftX + 10, startY + 28, chartW - 20, chartH, 4);
    this.addTabElement(chartBg);

    var samples = ra.speedCurve;
    if (samples.length < 2) return;

    var maxSpeed = 1;
    for (var i = 0; i < samples.length; i++) {
      if (samples[i].speed > maxSpeed) maxSpeed = samples[i].speed;
    }
    maxSpeed = Math.ceil(maxSpeed / 20) * 20;

    var drawAreaX = leftX + 10;
    var drawAreaW = chartW - 20;
    var drawAreaY = startY + 28;
    var drawAreaH = chartH;

    for (var g = 1; g <= 3; g++) {
      var gy = drawAreaY + drawAreaH - (g / 4) * drawAreaH;
      var gridLine = this.add.graphics();
      gridLine.lineStyle(1, 0xe0e0e0, 0.5);
      gridLine.beginPath();
      gridLine.moveTo(drawAreaX, gy);
      gridLine.lineTo(drawAreaX + drawAreaW, gy);
      gridLine.strokePath();
      this.addTabElement(gridLine);

      var gridLabel = this.add.text(drawAreaX - 2, gy, Math.round(maxSpeed * g / 4) + '', {
        fontSize: '8px',
        color: '#aaaaaa'
      }).setOrigin(1, 0.5);
      this.addTabElement(gridLabel);
    }

    var lineGfx = this.add.graphics();
    lineGfx.lineStyle(2, 0x2196f3, 0.9);
    lineGfx.beginPath();

    for (var s = 0; s < samples.length; s++) {
      var sample = samples[s];
      var px = drawAreaX + sample.pct * drawAreaW;
      var py = drawAreaY + drawAreaH - (sample.speed / maxSpeed) * drawAreaH;
      if (s === 0) lineGfx.moveTo(px, py);
      else lineGfx.lineTo(px, py);
    }
    lineGfx.strokePath();
    this.addTabElement(lineGfx);

    var fillGfx = this.add.graphics();
    fillGfx.fillStyle(0x2196f3, 0.08);
    fillGfx.beginPath();
    fillGfx.moveTo(drawAreaX, drawAreaY + drawAreaH);
    for (var f = 0; f < samples.length; f++) {
      var fSample = samples[f];
      var fpx = drawAreaX + fSample.pct * drawAreaW;
      var fpy = drawAreaY + drawAreaH - (fSample.speed / maxSpeed) * drawAreaH;
      fillGfx.lineTo(fpx, fpy);
    }
    fillGfx.lineTo(drawAreaX + drawAreaW, drawAreaY + drawAreaH);
    fillGfx.closePath();
    fillGfx.fillPath();
    this.addTabElement(fillGfx);

    var healthGfx = this.add.graphics();
    healthGfx.lineStyle(1.5, 0xe91e63, 0.5);
    healthGfx.beginPath();
    for (var h = 0; h < samples.length; h++) {
      var hSample = samples[h];
      var hpx = drawAreaX + hSample.pct * drawAreaW;
      var hpy = drawAreaY + drawAreaH - (hSample.health / 100) * drawAreaH;
      if (h === 0) healthGfx.moveTo(hpx, hpy);
      else healthGfx.lineTo(hpx, hpy);
    }
    healthGfx.strokePath();
    this.addTabElement(healthGfx);

    for (var n = 0; n < ra.hitNodes.length; n++) {
      var node = ra.hitNodes[n];
      var npx = drawAreaX + node.pct * drawAreaW;
      var npy = drawAreaY + drawAreaH - (node.health / 100) * drawAreaH;

      var hitMarker = this.add.graphics();
      hitMarker.fillStyle(0xf44336, 0.9);
      hitMarker.fillCircle(0, 0, 5);
      hitMarker.lineStyle(2, 0xff6b6b, 0.6);
      hitMarker.strokeCircle(0, 0, 7);
      hitMarker.x = npx;
      hitMarker.y = npy;
      this.addTabElement(hitMarker);
    }

    var legendY = startY + 28 + chartH + 5;
    var legendSpeed = this.add.text(leftX + 15, legendY, '— 速度', {
      fontSize: '9px',
      color: '#2196f3',
      fontWeight: 'bold'
    }).setOrigin(0, 0.5);
    this.addTabElement(legendSpeed);

    var legendHealth = this.add.text(leftX + 65, legendY, '— 生命', {
      fontSize: '9px',
      color: '#e91e63',
      fontWeight: 'bold'
    }).setOrigin(0, 0.5);
    this.addTabElement(legendHealth);

    var legendHit = this.add.text(leftX + 115, legendY, '● 受击', {
      fontSize: '9px',
      color: '#f44336',
      fontWeight: 'bold'
    }).setOrigin(0, 0.5);
    this.addTabElement(legendHit);

    var pctLabels = ['0%', '25%', '50%', '75%', '100%'];
    for (var p = 0; p < pctLabels.length; p++) {
      var ppx = drawAreaX + (p / (pctLabels.length - 1)) * drawAreaW;
      var pctLabel = this.add.text(ppx, drawAreaY + drawAreaH + 3, pctLabels[p], {
        fontSize: '8px',
        color: '#bbbbbb'
      }).setOrigin(0.5, 0);
      this.addTabElement(pctLabel);
    }

    if (ra.bestSegment) {
      var bs = ra.bestSegment;
      var highlightGfx = this.add.graphics();
      highlightGfx.fillStyle(0x4caf50, 0.12);
      var hlX = drawAreaX + bs.startPct * drawAreaW;
      var hlW = (bs.endPct - bs.startPct) * drawAreaW;
      highlightGfx.fillRoundedRect(hlX, drawAreaY, hlW, drawAreaH, 3);
      highlightGfx.lineStyle(2, 0x4caf50, 0.6);
      highlightGfx.beginPath();
      highlightGfx.moveTo(hlX, drawAreaY);
      highlightGfx.lineTo(hlX, drawAreaY + drawAreaH);
      highlightGfx.strokePath();
      highlightGfx.beginPath();
      highlightGfx.moveTo(hlX + hlW, drawAreaY);
      highlightGfx.lineTo(hlX + hlW, drawAreaY + drawAreaH);
      highlightGfx.strokePath();
      this.addTabElement(highlightGfx);

      var starIcon = this.add.text(hlX + hlW / 2, drawAreaY + 8, '⭐', {
        fontSize: '10px'
      }).setOrigin(0.5);
      this.addTabElement(starIcon);
    }
  };

  proto.createHitNodesSection = function(width, startY, panelW, ra) {
    var leftX = width / 2 - panelW / 2 + 15;
    var sectionW = panelW - 30;

    var hitNodes = ra.hitNodes || [];
    if (hitNodes.length === 0) {
      var noHit = this.add.text(leftX, startY + 10, '🛡️ 本局未受击 — 完美表现!', {
        fontSize: '12px',
        color: '#4caf50',
        fontWeight: 'bold'
      }).setOrigin(0, 0.5);
      this.addTabElement(noHit);
      return;
    }

    var title = this.add.text(leftX, startY + 10, '💥 受击节点 (' + hitNodes.length + '次)', {
      fontSize: '13px',
      fontWeight: 'bold',
      color: '#f44336'
    }).setOrigin(0, 0.5);
    this.addTabElement(title);

    var typeIcons = {
      'rock': '🪨',
      'barrel': '🛢️',
      'crate': '📦',
      'sign': '🪧',
      'dangerZone': '⚠️',
      'rollover': '🔄'
    };
    var typeLabels = {
      'rock': '撞石',
      'barrel': '油桶',
      'crate': '木箱',
      'sign': '路牌',
      'dangerZone': '危险区',
      'rollover': '翻车'
    };

    var displayCount = Math.min(hitNodes.length, 5);
    for (var i = 0; i < displayCount; i++) {
      var node = hitNodes[i];
      var y = startY + 32 + i * 22;

      var rowBg = this.add.graphics();
      rowBg.fillStyle(i % 2 === 0 ? 0xfef0f0 : 0xfafafa, 1);
      rowBg.fillRoundedRect(leftX, y - 9, sectionW, 20, 4);
      this.addTabElement(rowBg);

      var icon = typeIcons[node.type] || '💥';
      var iconT = this.add.text(leftX + 8, y, icon, {
        fontSize: '11px'
      }).setOrigin(0, 0.5);
      this.addTabElement(iconT);

      var label = (typeLabels[node.type] || node.type) + ' -' + node.damage;
      var labelT = this.add.text(leftX + 28, y, label, {
        fontSize: '11px',
        fontWeight: 'bold',
        color: '#f44336'
      }).setOrigin(0, 0.5);
      this.addTabElement(labelT);

      var distPct = Math.floor(node.pct * 100);
      var detail = '位置 ' + distPct + '% | 生命 ' + node.health + '%';
      if (node.combo > 0) detail += ' | 连击 x' + node.combo;
      var detailT = this.add.text(leftX + sectionW - 5, y, detail, {
        fontSize: '9px',
        color: '#999999'
      }).setOrigin(1, 0.5);
      this.addTabElement(detailT);
    }

    if (hitNodes.length > displayCount) {
      var moreT = this.add.text(leftX + 10, startY + 32 + displayCount * 22,
        '...还有 ' + (hitNodes.length - displayCount) + ' 次受击', {
          fontSize: '10px',
          color: '#bbbbbb',
          fontStyle: 'italic'
        }).setOrigin(0, 0.5);
      this.addTabElement(moreT);
    }
  };

  proto.createMistakesSection = function(width, startY, panelW, ra) {
    var leftX = width / 2 - panelW / 2 + 15;
    var sectionW = panelW - 30;

    var mistakes = ra.keyMistakes || [];
    if (mistakes.length === 0) {
      var noMistake = this.add.text(leftX, startY + 10, '✅ 未检测到关键失误 — 表现优秀!', {
        fontSize: '12px',
        color: '#4caf50',
        fontWeight: 'bold'
      }).setOrigin(0, 0.5);
      this.addTabElement(noMistake);
      return;
    }

    var title = this.add.text(leftX, startY + 10, '⚠️ 关键失误点 (' + mistakes.length + '处)', {
      fontSize: '13px',
      fontWeight: 'bold',
      color: '#ff9800'
    }).setOrigin(0, 0.5);
    this.addTabElement(title);

    var displayCount = Math.min(mistakes.length, 4);
    for (var i = 0; i < displayCount; i++) {
      var m = mistakes[i];
      var y = startY + 32 + i * 26;

      var severityColor = m.severity === 'major' ? 0xfef0f0 : 0xfff8e1;
      var borderColor = m.severity === 'major' ? 0xf44336 : 0xff9800;

      var rowBg = this.add.graphics();
      rowBg.fillStyle(severityColor, 1);
      rowBg.fillRoundedRect(leftX, y - 10, sectionW, 24, 4);
      rowBg.lineStyle(2, borderColor, 0.4);
      rowBg.strokeRoundedRect(leftX, y - 10, sectionW, 24, 4);
      this.addTabElement(rowBg);

      var sevIcon = m.severity === 'major' ? '🔴' : '🟡';
      var sevT = this.add.text(leftX + 8, y, sevIcon, {
        fontSize: '11px'
      }).setOrigin(0, 0.5);
      this.addTabElement(sevT);

      var mLabel = m.label + ' (位置' + Math.floor(m.pct * 100) + '%)';
      var mLabelT = this.add.text(leftX + 26, y - 3, mLabel, {
        fontSize: '11px',
        fontWeight: 'bold',
        color: borderColor === 0xf44336 ? '#c62828' : '#e65100'
      }).setOrigin(0, 0.5);
      this.addTabElement(mLabelT);

      var consequenceStr = m.consequences.join(', ');
      var conT = this.add.text(leftX + 26, y + 8, consequenceStr, {
        fontSize: '9px',
        color: '#999999'
      }).setOrigin(0, 0.5);
      this.addTabElement(conT);

      var dmgT = this.add.text(leftX + sectionW - 5, y, '-' + m.damage + ' HP', {
        fontSize: '10px',
        fontWeight: 'bold',
        color: '#f44336'
      }).setOrigin(1, 0.5);
      this.addTabElement(dmgT);
    }
  };

  proto.createBestSegmentSection = function(width, startY, panelW, ra) {
    var leftX = width / 2 - panelW / 2 + 15;
    var sectionW = panelW - 30;

    var bs = ra.bestSegment;
    if (!bs) {
      var noBest = this.add.text(leftX, startY + 10, '📏 数据不足，无法识别最佳路段', {
        fontSize: '12px',
        color: '#999999',
        fontStyle: 'italic'
      }).setOrigin(0, 0.5);
      this.addTabElement(noBest);
      return;
    }

    var sectionBg = this.add.graphics();
    sectionBg.fillStyle(0xe8f5e9, 1);
    sectionBg.fillRoundedRect(leftX, startY, sectionW, 80, 8);
    sectionBg.lineStyle(2, 0x4caf50, 0.6);
    sectionBg.strokeRoundedRect(leftX, startY, sectionW, 80, 8);
    this.addTabElement(sectionBg);

    var title = this.add.text(leftX + 10, startY + 12, '⭐ 最佳路段表现', {
      fontSize: '13px',
      fontWeight: 'bold',
      color: '#2e7d32'
    }).setOrigin(0, 0.5);
    this.addTabElement(title);

    var startPctStr = Math.floor(bs.startPct * 100) + '%';
    var endPctStr = Math.floor(bs.endPct * 100) + '%';
    var rangeT = this.add.text(leftX + 10, startY + 30,
      '📍 路段范围: ' + startPctStr + ' → ' + endPctStr + ' (' + (bs.endDistance - bs.startDistance) + 'm)', {
        fontSize: '11px',
        color: '#333333'
      }).setOrigin(0, 0.5);
    this.addTabElement(rangeT);

    var statsRow = [
      { icon: '🚗', label: '均速 ' + bs.avgSpeed + ' km/h', color: '#2196f3' },
      { icon: '❤️', label: bs.healthDelta >= 0 ? '无损' : '生命 ' + bs.healthDelta, color: bs.healthDelta >= 0 ? '#4caf50' : '#f44336' },
      { icon: '🛡️', label: bs.hadHit ? '有受击' : '无伤通过', color: bs.hadHit ? '#ff9800' : '#4caf50' }
    ];

    for (var i = 0; i < statsRow.length; i++) {
      var stat = statsRow[i];
      var sx = leftX + 10 + i * 130;

      var statIcon = this.add.text(sx, startY + 50, stat.icon, {
        fontSize: '14px'
      }).setOrigin(0, 0.5);
      this.addTabElement(statIcon);

      var statText = this.add.text(sx + 20, startY + 50, stat.label, {
        fontSize: '11px',
        fontWeight: 'bold',
        color: stat.color
      }).setOrigin(0, 0.5);
      this.addTabElement(statText);
    }

    if (!bs.hadHit && bs.healthDelta >= 0) {
      var perfectT = this.add.text(leftX + sectionW - 10, startY + 12, '💎 完美路段!', {
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#ffd700'
      }).setOrigin(1, 0.5);
      this.addTabElement(perfectT);
    }
  };

  proto.createReplayComparisonTab = function(width, height) {
    var panelW = 420;
    var contentY = height / 2 - 70;
    var leftX = width / 2 - panelW / 2 + 15;

    if (!this.replayComparison || !this.replayComparison.hasComparison) {
      var noData = this.add.text(width / 2, contentY + 50, '📋 暂无历史对比数据', {
        fontSize: '16px',
        color: '#999999',
        fontStyle: 'italic'
      }).setOrigin(0.5);
      this.addTabElement(noData);

      var hint = this.add.text(width / 2, contentY + 80, '完成更多关卡后可查看重跑对比', {
        fontSize: '12px',
        color: '#bbbbbb'
      }).setOrigin(0.5);
      this.addTabElement(hint);
      return;
    }

    var comparison = this.replayComparison;
    var diff = comparison.diff || {};

    var headerBg = this.add.graphics();
    headerBg.fillStyle(0xf0f4ff, 1);
    headerBg.fillRoundedRect(leftX, contentY, panelW - 30, 36, 8);
    this.addTabElement(headerBg);

    var headerText = this.add.text(width / 2, contentY + 18, '🔄 本次 vs 最佳成绩', {
      fontSize: '15px',
      fontWeight: 'bold',
      color: '#2196f3'
    }).setOrigin(0.5);
    this.addTabElement(headerText);

    var items = [
      { label: '总分', current: comparison.current.totalScore, previous: comparison.previous.totalScore, diff: diff.totalScore, icon: '🏆', unit: '', color: '#ff6b35', major: true },
      { label: '用时', current: comparison.current.time, previous: comparison.previous.time, diff: diff.time, icon: '⏱', unit: 's', color: '#2196f3', invertDir: true },
      { label: '最高时速', current: comparison.current.maxSpeed, previous: comparison.previous.maxSpeed, diff: diff.maxSpeed, icon: '🚗', unit: ' km/h', color: '#9c27b0' },
      { label: '行驶距离', current: comparison.current.distance, previous: comparison.previous.distance, diff: diff.distance, icon: '📏', unit: 'm', color: '#4caf50' },
      { label: '剩余生命', current: comparison.current.health, previous: comparison.previous.health, diff: diff.health, icon: '❤️', unit: '%', color: '#e91e63' },
      { label: '受伤量', current: comparison.current.damageTaken, previous: comparison.previous.damageTaken, diff: diff.damageTaken, icon: '💔', unit: '', color: '#f44336', invertDir: true },
      { label: '最大连击', current: (comparison.current.comboInfo || {}).maxCombo || 0, previous: (comparison.previous.comboInfo || {}).maxCombo || 0, diff: diff.maxCombo, icon: '🔥', unit: ' 次', color: '#ff5722' },
      { label: '连续过障', current: (comparison.current.comboInfo || {}).totalObstaclePasses || 0, previous: (comparison.previous.comboInfo || {}).totalObstaclePasses || 0, diff: diff.totalObstaclePasses, icon: '🎯', unit: ' 次', color: '#ff9800' },
      { label: '探索路线', current: Object.keys(comparison.current.branches || {}).length, previous: Object.keys(comparison.previous.branches || {}).length, diff: diff.branchesExplored, icon: '🗺️', unit: ' 条', color: '#00bcd4' }
    ];

    if (diff.perfectRun) {
      items.push({ label: '完美通关', current: '✅', previous: '❌', diff: null, icon: '💯', unit: '', color: '#ffd700', isBoolean: true });
    }

    var startY = contentY + 48;
    var rowHeight = 32;

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var y = startY + i * rowHeight;

      var rowBg = this.add.graphics();
      rowBg.fillStyle(i % 2 === 0 ? 0xfafafa : 0xf5f5f5, 1);
      rowBg.fillRoundedRect(leftX, y - 12, panelW - 30, rowHeight - 2, 4);
      this.addTabElement(rowBg);

      var iconT = this.add.text(leftX + 10, y, item.icon, {
        fontSize: '13px'
      }).setOrigin(0, 0.5);
      this.addTabElement(iconT);

      var labelT = this.add.text(leftX + 35, y, item.label, {
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#666666'
      }).setOrigin(0, 0.5);
      this.addTabElement(labelT);

      var prevX = width / 2 - 20;
      var currX = width / 2 + 55;
      var diffX = width / 2 + panelW / 2 - 25;

      var prevT = this.add.text(prevX, y, '' + (typeof item.previous === 'number' ? Math.floor(item.previous) : item.previous), {
        fontSize: '11px',
        color: '#999999'
      }).setOrigin(0, 0.5);
      this.addTabElement(prevT);

      var currT = this.add.text(currX, y, '' + (typeof item.current === 'number' ? Math.floor(item.current) : item.current), {
        fontSize: '11px',
        fontWeight: 'bold',
        color: '#333333'
      }).setOrigin(0, 0.5);
      this.addTabElement(currT);

      if (item.diff !== null && item.diff !== undefined && !item.isBoolean) {
        var isPositive = item.invertDir ? item.diff < 0 : item.diff > 0;
        var diffColor = isPositive ? '#4caf50' : (item.diff === 0 ? '#999999' : '#f44336');
        var diffSign = item.diff > 0 ? '+' : '';
        var diffT = this.add.text(diffX, y, diffSign + (typeof item.diff === 'number' ? Math.floor(item.diff) : item.diff) + item.unit, {
          fontSize: '11px',
          fontWeight: 'bold',
          color: diffColor
        }).setOrigin(1, 0.5);
        this.addTabElement(diffT);
      }
    }

    var colHeaderY = startY - 14;
    var prevColT = this.add.text(width / 2 - 20, colHeaderY, '上次', {
      fontSize: '10px',
      color: '#aaaaaa'
    }).setOrigin(0, 0.5);
    this.addTabElement(prevColT);

    var currColT = this.add.text(width / 2 + 55, colHeaderY, '本次', {
      fontSize: '10px',
      fontWeight: 'bold',
      color: '#555555'
    }).setOrigin(0, 0.5);
    this.addTabElement(currColT);

    var diffColT = this.add.text(width / 2 + panelW / 2 - 25, colHeaderY, '差异', {
      fontSize: '10px',
      fontWeight: 'bold',
      color: '#555555'
    }).setOrigin(1, 0.5);
    this.addTabElement(diffColT);

    if (comparison.segmentComparison && comparison.segmentComparison.length > 1) {
      var chartY = startY + items.length * rowHeight + 20;
      var chartLabel = this.add.text(leftX, chartY, '📊 路段得分走势', {
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#666666'
      }).setOrigin(0, 0.5);
      this.addTabElement(chartLabel);

      this.createSegmentChart(width, chartY + 20, panelW, comparison.segmentComparison);
    }
  };

  proto.createSegmentChart = function(width, startY, panelW, segments) {
    var leftX = width / 2 - panelW / 2 + 15;
    var chartW = panelW - 30;
    var chartH = 80;

    var chartBg = this.add.graphics();
    chartBg.fillStyle(0xfafafa, 1);
    chartBg.fillRoundedRect(leftX, startY, chartW, chartH, 6);
    chartBg.lineStyle(1, 0xe0e0e0, 1);
    chartBg.strokeRoundedRect(leftX, startY, chartW, chartH, 6);
    this.addTabElement(chartBg);

    var maxSegments = Math.min(segments.length, 20);
    var displaySegments = segments.slice(0, maxSegments);

    var maxScore = 0;
    for (var i = 0; i < displaySegments.length; i++) {
      if (displaySegments[i].current && displaySegments[i].current.score > maxScore) {
        maxScore = displaySegments[i].current.score;
      }
      if (displaySegments[i].previous && displaySegments[i].previous.score > maxScore) {
        maxScore = displaySegments[i].previous.score;
      }
    }
    if (maxScore === 0) maxScore = 1;

    var barW = Math.max(3, (chartW - 10) / maxSegments / 2 - 1);

    for (var j = 0; j < displaySegments.length; j++) {
      var seg = displaySegments[j];
      var bx = leftX + 5 + j * ((chartW - 10) / maxSegments);

      if (seg.current) {
        var curH = Math.max(2, (seg.current.score / maxScore) * (chartH - 10));
        var curBar = this.add.graphics();
        curBar.fillStyle(0x2196f3, 0.8);
        curBar.fillRect(bx, startY + chartH - 5 - curH, barW, curH);
        this.addTabElement(curBar);
      }

      if (seg.previous) {
        var prevH = Math.max(2, (seg.previous.score / maxScore) * (chartH - 10));
        var prevBar = this.add.graphics();
        prevBar.fillStyle(0xff9800, 0.5);
        prevBar.fillRect(bx + barW + 1, startY + chartH - 5 - prevH, barW, prevH);
        this.addTabElement(prevBar);
      }
    }

    var legendY = startY + chartH + 5;
    var legendCurrent = this.add.text(leftX + 10, legendY, '■ 本次', {
      fontSize: '10px',
      color: '#2196f3',
      fontWeight: 'bold'
    }).setOrigin(0, 0.5);
    this.addTabElement(legendCurrent);

    var legendPrev = this.add.text(leftX + 70, legendY, '■ 上次最佳', {
      fontSize: '10px',
      color: '#ff9800',
      fontWeight: 'bold'
    }).setOrigin(0, 0.5);
    this.addTabElement(legendPrev);
  };

  proto.createBreakdownTab = function(width, height) {
    var panelW = 420;
    var contentY = height / 2 - 70;
    var leftX = width / 2 - panelW / 2 + 15;

    var dimensions = this.performanceGrade ? this.performanceGrade.scoreBreakdown || [] : [];

    if (dimensions.length === 0) {
      var noData = this.add.text(width / 2, contentY + 50, '📋 暂无成绩拆解数据', {
        fontSize: '16px',
        color: '#999999',
        fontStyle: 'italic'
      }).setOrigin(0.5);
      this.addTabElement(noData);
      return;
    }

    var headerBg = this.add.graphics();
    headerBg.fillStyle(0xfff3e0, 1);
    headerBg.fillRoundedRect(leftX, contentY, panelW - 30, 36, 8);
    this.addTabElement(headerBg);

    var headerText = this.add.text(width / 2, contentY + 18, '📈 六维成绩拆解', {
      fontSize: '15px',
      fontWeight: 'bold',
      color: '#ff6b35'
    }).setOrigin(0.5);
    this.addTabElement(headerText);

    this.createRadarChart(width, contentY + 50, 160, dimensions);

    var listY = contentY + 50 + 170;
    var listHeader = this.add.text(leftX, listY, '📋 维度详情', {
      fontSize: '13px',
      fontWeight: 'bold',
      color: '#666666'
    }).setOrigin(0, 0.5);
    this.addTabElement(listHeader);

    for (var i = 0; i < dimensions.length; i++) {
      var dim = dimensions[i];
      var y = listY + 24 + i * 38;

      var dimBg = this.add.graphics();
      dimBg.fillStyle(0xf8f8f8, 1);
      dimBg.fillRoundedRect(leftX, y - 14, panelW - 30, 34, 6);
      this.addTabElement(dimBg);

      var dimIcon = this.add.text(leftX + 10, y, dim.icon, {
        fontSize: '15px'
      }).setOrigin(0, 0.5);
      this.addTabElement(dimIcon);

      var dimLabel = this.add.text(leftX + 35, y - 4, dim.label, {
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#333333'
      }).setOrigin(0, 0.5);
      this.addTabElement(dimLabel);

      var dimDesc = this.add.text(leftX + 35, y + 10, dim.description, {
        fontSize: '9px',
        color: '#999999'
      }).setOrigin(0, 0.5);
      this.addTabElement(dimDesc);

      var barBg = this.add.graphics();
      barBg.fillStyle(0xe0e0e0, 0.5);
      barBg.fillRoundedRect(width / 2 + 20, y - 6, 100, 12, 6);
      this.addTabElement(barBg);

      var barW = Math.max(4, dim.score);
      var bar = this.add.graphics();
      var barColor = Phaser.Display.Color.HexStringToColor(dim.color).color;
      bar.fillStyle(barColor, 0.85);
      bar.fillRoundedRect(width / 2 + 20, y - 6, barW, 12, 6);
      this.addTabElement(bar);

      var scoreT = this.add.text(width / 2 + panelW / 2 - 25, y, Math.min(100, Math.floor(dim.score)) + '', {
        fontSize: '12px',
        fontWeight: 'bold',
        color: dim.color
      }).setOrigin(1, 0.5);
      this.addTabElement(scoreT);
    }
  };

  proto.createRadarChart = function(width, centerY, radius, dimensions) {
    var cx = width / 2;
    var sides = dimensions.length;
    if (sides < 3) return;

    var angleStep = (Math.PI * 2) / sides;
    var startAngle = -Math.PI / 2;

    var webBg = this.add.graphics();
    webBg.lineStyle(1, 0xdddddd, 0.5);

    for (var ring = 1; ring <= 4; ring++) {
      var r = radius * (ring / 4);
      webBg.beginPath();
      for (var s = 0; s <= sides; s++) {
        var a = startAngle + s * angleStep;
        var px = cx + Math.cos(a) * r;
        var py = centerY + Math.sin(a) * r;
        if (s === 0) webBg.moveTo(px, py);
        else webBg.lineTo(px, py);
      }
      webBg.strokePath();
    }

    for (var ax = 0; ax < sides; ax++) {
      var angle = startAngle + ax * angleStep;
      webBg.beginPath();
      webBg.moveTo(cx, centerY);
      webBg.lineTo(cx + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
      webBg.strokePath();
    }
    this.addTabElement(webBg);

    var dataShape = this.add.graphics();
    var dimColor = Phaser.Display.Color.HexStringToColor(dimensions[0].color || '#2196f3').color;
    dataShape.fillStyle(dimColor, 0.2);
    dataShape.lineStyle(2, dimColor, 0.8);
    dataShape.beginPath();

    for (var d = 0; d <= sides; d++) {
      var idx = d % sides;
      var dim = dimensions[idx];
      var a = startAngle + idx * angleStep;
      var val = Math.min(100, dim.score) / 100;
      var px = cx + Math.cos(a) * radius * val;
      var py = centerY + Math.sin(a) * radius * val;
      if (d === 0) dataShape.moveTo(px, py);
      else dataShape.lineTo(px, py);
    }
    dataShape.closePath();
    dataShape.fillPath();
    dataShape.strokePath();
    this.addTabElement(dataShape);

    for (var l = 0; l < sides; l++) {
      var dim = dimensions[l];
      var labelAngle = startAngle + l * angleStep;
      var labelR = radius + 22;
      var lx = cx + Math.cos(labelAngle) * labelR;
      var ly = centerY + Math.sin(labelAngle) * labelR;

      var labelT = this.add.text(lx, ly, dim.icon + dim.label, {
        fontSize: '9px',
        fontWeight: 'bold',
        color: dim.color || '#666666'
      }).setOrigin(0.5);
      this.addTabElement(labelT);
    }

    for (var dot = 0; dot < sides; dot++) {
      var dim = dimensions[dot];
      var a = startAngle + dot * angleStep;
      var val = Math.min(100, dim.score) / 100;
      var px = cx + Math.cos(a) * radius * val;
      var py = centerY + Math.sin(a) * radius * val;

      var dotGfx = this.add.graphics();
      dotGfx.fillStyle(0xffffff, 1);
      dotGfx.fillCircle(0, 0, 5);
      var dotColor = Phaser.Display.Color.HexStringToColor(dim.color || '#2196f3').color;
      dotGfx.fillStyle(dotColor, 1);
      dotGfx.fillCircle(0, 0, 3);
      dotGfx.x = px;
      dotGfx.y = py;
      this.addTabElement(dotGfx);
    }
  };

  proto.createDetailedStats = function(width, height) {
    var stats = this.detailedStats;
    var panelW = 420;
    var startY = height / 2 - 70;

    var branchCfg = this.getBranchConfig(this.currentBranch);
    var branchName = branchCfg ? branchCfg.name : '主路';
    var branchIcon = branchCfg ? this.getBranchIcon(branchCfg.type) : '🛤️';

    var headerY = startY + 10;
    var headerText = this.add.text(width / 2 - panelW / 2 + 15, headerY,
      branchIcon + ' 最终路线: ' + branchName, {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#333333'
    }).setOrigin(0, 0.5);
    this.addTabElement(headerText);

    var rewardMult = branchCfg ? branchCfg.rewardMultiplier : 1.0;
    var rewardText = this.add.text(width / 2 + panelW / 2 - 15, headerY,
      '奖励倍率 x' + rewardMult.toFixed(1), {
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#ff9800'
    }).setOrigin(1, 0.5);
    this.addTabElement(rewardText);

    var weightBreakdown = stats.weightBreakdown || {};
    if (weightBreakdown.finalMultiplier && weightBreakdown.finalMultiplier > 1.01) {
      var multiplierY = headerY + 28;
      var multText = this.add.text(width / 2 - panelW / 2 + 15, multiplierY,
        '✨ 结算加成: x' + weightBreakdown.finalMultiplier.toFixed(2), {
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#ff6b35'
      }).setOrigin(0, 0.5);
      this.addTabElement(multText);

      this.createWeightVisualization(width, multiplierY + 25, panelW, weightBreakdown);
    }

    var scoreBreakdownY = headerY + 100;
    if (weightBreakdown.finalMultiplier <= 1.01) {
      scoreBreakdownY = headerY + 35;
    }

    var scoreLabel = this.add.text(width / 2 - panelW / 2 + 15, scoreBreakdownY, '📊 得分明细', {
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#666666'
    }).setOrigin(0, 0.5);
    this.addTabElement(scoreLabel);

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
      this.addTabElement(barBg);

      var ratio = this.score > 0 ? item.value / this.score : 0;
      var barWidth = Math.max(4, (panelW - 30) * ratio);
      var bar = this.add.graphics();
      bar.fillStyle(item.color, 0.8);
      bar.fillRoundedRect(width / 2 - panelW / 2 + 15, y - 7, barWidth, 16, 4);
      this.addTabElement(bar);

      var barLabel = this.add.text(width / 2 - panelW / 2 + 22, y, item.label, {
        fontSize: '10px',
        fontWeight: 'bold',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0, 0.5);
      this.addTabElement(barLabel);

      var barValue = this.add.text(width / 2 + panelW / 2 - 22, y, '+' + item.value, {
        fontSize: '10px',
        fontWeight: 'bold',
        color: '#333333'
      }).setOrigin(1, 0.5);
      this.addTabElement(barValue);
    }

    var totalY = scoreBreakdownY + 28 + visibleItems.length * 20 + 10;
    var totalLine = this.add.graphics();
    totalLine.lineStyle(2, 0xdddddd, 1);
    totalLine.beginPath();
    totalLine.moveTo(width / 2 - panelW / 2 + 15, totalY);
    totalLine.lineTo(width / 2 + panelW / 2 - 15, totalY);
    totalLine.strokePath();
    this.addTabElement(totalLine);

    var totalLabel = this.add.text(width / 2 - panelW / 2 + 15, totalY + 18, '总分', {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#333333'
    }).setOrigin(0, 0.5);
    this.addTabElement(totalLabel);

    var totalValue = this.add.text(width / 2 + panelW / 2 - 15, totalY + 18, this.score.toString(), {
      fontSize: '26px',
      fontWeight: 'bold',
      color: '#ff6b35'
    }).setOrigin(1, 0.5);
    this.addTabElement(totalValue);

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
      this.addTabElement(statBg);

      var statIcon = this.add.text(ex + (panelW / 4 - 5) / 2, extraStatsY + 14, es.icon, {
        fontSize: '16px'
      }).setOrigin(0.5);
      this.addTabElement(statIcon);

      var statValue = this.add.text(ex + (panelW / 4 - 5) / 2, extraStatsY + 34, es.value, {
        fontSize: '10px',
        fontWeight: 'bold',
        color: '#333333'
      }).setOrigin(0.5);
      this.addTabElement(statValue);
    }

    if (stats.branches && Object.keys(stats.branches).length > 1) {
      var branchesY = extraStatsY + 65;
      var branchLabel = this.add.text(width / 2 - panelW / 2 + 15, branchesY, '🗺️ 路线探索进度', {
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#666666'
      }).setOrigin(0, 0.5);
      this.addTabElement(branchLabel);

      var totalBranches = weightBreakdown.totalBranches || Object.keys(stats.branches).length;
      var exploredCount = weightBreakdown.uniqueBranches || Object.keys(stats.branches).length;
      var progressRatio = exploredCount / totalBranches;

      var progBg = this.add.graphics();
      progBg.fillStyle(0xf0f0f0, 1);
      progBg.fillRoundedRect(width / 2 - panelW / 2 + 15, branchesY + 18, panelW - 30, 12, 6);
      this.addTabElement(progBg);

      var progWidth = (panelW - 30) * progressRatio;
      var progBar = this.add.graphics();
      progBar.fillGradientStyle(0x4caf50, 0x8bc34a, 0x4caf50, 0x8bc34a);
      progBar.fillRoundedRect(width / 2 - panelW / 2 + 15, branchesY + 18, progWidth, 12, 6);
      this.addTabElement(progBar);

      var progText = this.add.text(width / 2, branchesY + 24,
        exploredCount + ' / ' + totalBranches + ' 条路线 (' + Math.floor(progressRatio * 100) + '%)', {
          fontSize: '10px',
          fontWeight: 'bold',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 2
        }).setOrigin(0.5, 0.5);
      this.addTabElement(progText);

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
        this.addTabElement(dot);

        var displayName = bname + (bisHidden ? ' ✨' : '');
        var branchDetail = this.add.text(width / 2 - panelW / 2 + 32, by, displayName + ': ' + bdist + 'm', {
          fontSize: '10px',
          color: '#555555',
          fontWeight: bisHidden ? 'bold' : 'normal'
        }).setOrigin(0, 0.5);
        this.addTabElement(branchDetail);
      }
    }

    if (comboInfo.maxCombo > 0) {
      var comboSectionY = extraStatsY + 65;
      if (stats.branches && Object.keys(stats.branches).length > 1) {
        comboSectionY = extraStatsY + 65 + (Object.keys(stats.branches).length + 1) * 18 + 20;
      }

      var comboLabel = this.add.text(width / 2 - panelW / 2 + 15, comboSectionY, '🔥 连击系统明细', {
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#ff5722'
      }).setOrigin(0, 0.5);
      this.addTabElement(comboLabel);

      var comboItems = [
        { label: '最高连击', value: comboInfo.maxCombo + ' 次', icon: '🔥' },
        { label: '连击总分', value: '+' + comboInfo.comboBonusTotal, icon: '⭐' },
        { label: '连续过障', value: comboInfo.totalObstaclePasses + ' 次', icon: '🎯' },
        { label: '无伤路段', value: comboInfo.damageFreeSegments + ' 段', icon: '🛡️' }
      ];

      for (var ci = 0; ci < comboItems.length; ci++) {
        var cItem = comboItems[ci];
        var ccx = width / 2 - panelW / 2 + 15 + ci * (panelW / 4);

        var cBg = this.add.graphics();
        cBg.fillStyle(0xfff3e0, 1);
        cBg.fillRoundedRect(ccx, comboSectionY + 18, panelW / 4 - 5, 40, 6);
        cBg.lineStyle(1, 0xff5722, 0.3);
        cBg.strokeRoundedRect(ccx, comboSectionY + 18, panelW / 4 - 5, 40, 6);
        this.addTabElement(cBg);

        var cIcon = this.add.text(ccx + (panelW / 4 - 5) / 2, comboSectionY + 26, cItem.icon, {
          fontSize: '14px'
        }).setOrigin(0.5);
        this.addTabElement(cIcon);

        var cValue = this.add.text(ccx + (panelW / 4 - 5) / 2, comboSectionY + 44, cItem.value, {
          fontSize: '10px',
          fontWeight: 'bold',
          color: '#ff5722'
        }).setOrigin(0.5);
        this.addTabElement(cValue);
      }

      if (comboInfo.comboHistory && comboInfo.comboHistory.length > 0) {
        var historyY = comboSectionY + 68;
        var historyLabel = this.add.text(width / 2 - panelW / 2 + 15, historyY, '📋 近期连击', {
          fontSize: '11px',
          color: '#999999'
        }).setOrigin(0, 0.5);
        this.addTabElement(historyLabel);

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

          var reasonText = this.add.text(width / 2 - panelW / 2 + 25, hy, reasonLabel, {
            fontSize: '10px',
            color: '#888888'
          }).setOrigin(0, 0.5);
          this.addTabElement(reasonText);

          var comboHistText = this.add.text(width / 2 - panelW / 2 + 100, hy,
            'x' + histEntry.comboCount + ' → +' + histEntry.points, {
            fontSize: '10px',
            fontWeight: 'bold',
            color: '#ff9800'
          }).setOrigin(0, 0.5);
          this.addTabElement(comboHistText);

          var distText = this.add.text(width / 2 + panelW / 2 - 25, hy,
            Math.floor(histEntry.distance) + 'm', {
            fontSize: '10px',
            color: '#bbbbbb'
          }).setOrigin(1, 0.5);
          this.addTabElement(distText);
        }
      }
    }

    if (this.scoreImprovements && this.scoreImprovements.improvements && this.scoreImprovements.improvements.length > 0) {
      this.createImprovementsSection(width, height, panelW);
    }
  };

  proto.createImprovementsSection = function(width, height, panelW) {
    var improvements = this.scoreImprovements.improvements;
    var leftX = width / 2 - panelW / 2 + 15;
    var baseY = height / 2 + 250;

    var impLabel = this.add.text(leftX, baseY, '📈 与上次对比', {
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#4caf50'
    }).setOrigin(0, 0.5);
    this.addTabElement(impLabel);

    var maxDisplay = Math.min(improvements.length, 4);
    for (var i = 0; i < maxDisplay; i++) {
      var imp = improvements[i];
      var ix = leftX + i * (panelW / 4);
      var iy = baseY + 22;

      var impBg = this.add.graphics();
      var impColor = imp.major ? 0xe8f5e9 : 0xf1f8e9;
      impBg.fillStyle(impColor, 1);
      impBg.fillRoundedRect(ix, iy, panelW / 4 - 5, 50, 6);
      this.addTabElement(impBg);

      var impIcon = this.add.text(ix + (panelW / 4 - 5) / 2, iy + 12, imp.icon, {
        fontSize: '14px'
      }).setOrigin(0.5);
      this.addTabElement(impIcon);

      var impText = this.add.text(ix + (panelW / 4 - 5) / 2, iy + 32, imp.label, {
        fontSize: '9px',
        fontWeight: 'bold',
        color: '#4caf50'
      }).setOrigin(0.5);
      this.addTabElement(impText);

      if (!imp.isBoolean) {
        var impDiff = this.add.text(ix + (panelW / 4 - 5) / 2, iy + 44, '+' + (typeof imp.diff === 'number' ? Math.floor(imp.diff) : imp.diff), {
          fontSize: '8px',
          color: '#81c784'
        }).setOrigin(0.5);
        this.addTabElement(impDiff);
      }
    }
  };

  proto.createWeightVisualization = function(width, startY, panelW, weightBreakdown) {
    var weightItems = [];

    if (weightBreakdown.riskWeight > 0) {
      weightItems.push({ label: '风险加成', value: weightBreakdown.riskWeight, color: '#f44336', icon: '⚠️' });
    }
    if (weightBreakdown.explorationWeight > 0) {
      weightItems.push({ label: '探索加成', value: weightBreakdown.explorationWeight, color: '#00bcd4', icon: '🗺️' });
    }
    if (weightBreakdown.perfectWeight > 0) {
      weightItems.push({ label: '完美加成', value: weightBreakdown.perfectWeight, color: '#ffd700', icon: '💯' });
    }
    if (weightBreakdown.branchWeight > 0) {
      weightItems.push({ label: '多路线加成', value: weightBreakdown.branchWeight, color: '#9c27b0', icon: '🔀' });
    }
    if (weightBreakdown.mergeWeight > 0) {
      weightItems.push({ label: '汇合加成', value: weightBreakdown.mergeWeight, color: '#8bc34a', icon: '🔄' });
    }
    if (weightBreakdown.hiddenWeight > 0) {
      weightItems.push({ label: '隐藏路线加成', value: weightBreakdown.hiddenWeight, color: '#e91e63', icon: '✨' });
    }
    if (weightBreakdown.comboWeight > 0) {
      weightItems.push({ label: '连击加成', value: weightBreakdown.comboWeight, color: '#ff5722', icon: '🔥' });
    }

    if (weightItems.length === 0) return;

    var container = this.add.graphics();
    container.fillStyle(0xfafafa, 1);
    container.fillRoundedRect(width / 2 - panelW / 2 + 15, startY, panelW - 30, 22 + weightItems.length * 16, 8);
    container.lineStyle(1, 0xe0e0e0, 1);
    container.strokeRoundedRect(width / 2 - panelW / 2 + 15, startY, panelW - 30, 22 + weightItems.length * 16, 8);
    this.addTabElement(container);

    var maxValue = Math.max.apply(null, weightItems.map(function(w) { return w.value; }));
    var barMaxWidth = panelW - 120;

    for (var i = 0; i < weightItems.length; i++) {
      var item = weightItems[i];
      var y = startY + 12 + i * 16;

      var wIcon = this.add.text(width / 2 - panelW / 2 + 25, y, item.icon, {
        fontSize: '12px'
      }).setOrigin(0, 0.5);
      this.addTabElement(wIcon);

      var wLabel = this.add.text(width / 2 - panelW / 2 + 45, y, item.label, {
        fontSize: '10px',
        color: '#666666',
        fontWeight: 'bold'
      }).setOrigin(0, 0.5);
      this.addTabElement(wLabel);

      var ratio = maxValue > 0 ? item.value / maxValue : 0;
      var barWidth = Math.max(4, barMaxWidth * ratio);
      var barX = width / 2 - panelW / 2 + 110;

      var wBarBg = this.add.graphics();
      wBarBg.fillStyle(0xf0f0f0, 1);
      wBarBg.fillRoundedRect(barX, y - 5, barMaxWidth, 10, 5);
      this.addTabElement(wBarBg);

      var wBar = this.add.graphics();
      var colorNum = Phaser.Display.Color.HexStringToColor(item.color).color;
      wBar.fillStyle(colorNum, 0.85);
      wBar.fillRoundedRect(barX, y - 5, barWidth, 10, 5);
      this.addTabElement(wBar);

      var wPct = this.add.text(barX + barMaxWidth + 5, y, '+' + (item.value * 100).toFixed(0) + '%', {
        fontSize: '10px',
        fontWeight: 'bold',
        color: item.color
      }).setOrigin(0, 0.5);
      this.addTabElement(wPct);
    }
  };

  proto.createButtons = function(width, height) {
    var btnW = 160;
    var btnH = 48;
    var panelOffset = 160;
    if (this.win && this.starRating) panelOffset = 450;
    else if (this.win && this.detailedStats) panelOffset = 350;
    var btnY = height / 2 + panelOffset;
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
