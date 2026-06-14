(function(global) {
  'use strict';

  const LEVEL_CONFIGS = global.MountainRacer.LEVEL_CONFIGS;

  class GameOverScene extends Phaser.Scene {
    constructor() {
      super({ key: 'GameOverScene' });
    }

    init(data) {
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
    }

    create() {
      const width = this.scale.width;
      const height = this.scale.height;

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
    }

    createBackground(width, height) {
      const skyGfx = this.add.graphics();
      if (this.win) {
        skyGfx.fillGradientStyle(0x1a5235, 0x1a5235, 0x2e7d32, 0x2e7d32);
      } else {
        skyGfx.fillGradientStyle(0x2c1810, 0x2c1810, 0x4a2c2a, 0x4a2c2a);
      }
      skyGfx.fillRect(0, 0, width, height);

      for (let i = 0; i < 12; i++) {
        this.createConfetti(
          Phaser.Math.Between(0, width),
          Phaser.Math.Between(-100, -20),
          Phaser.Math.Between(0, 360)
        );
      }
    }

    createConfetti(x, y, angle) {
      const colors = [0xff6b35, 0xffd700, 0x4caf50, 0x2196f3, 0xe91e63, 0x9c27b0];
      const color = Phaser.Utils.Array.GetRandom(colors);
      const size = 6 + Math.random() * 6;

      const gfx = this.add.graphics();
      gfx.fillStyle(color, 1);
      gfx.fillRect(-size / 2, -size / 2, size, size * 0.6);
      gfx.x = x;
      gfx.y = y;
      gfx.rotation = Phaser.Math.DegToRad(angle);
      gfx.setDepth(5);

      const duration = 2500 + Math.random() * 2000;
      this.tweens.add({
        targets: gfx,
        y: 650,
        x: x + Phaser.Math.Between(-80, 80),
        rotation: Phaser.Math.DegToRad(angle + Phaser.Math.Between(-720, 720)),
        duration: duration,
        ease: 'Linear',
        onComplete: function() { gfx.destroy(); }
      });
    }

    createResultPanel(width, height) {
      const panelW = 420;
      const panelH = this.win && this.detailedStats ? 780 : 430;

      const shadow = this.add.graphics();
      shadow.fillStyle(0x000000, 0.4);
      shadow.fillRoundedRect(width / 2 - panelW / 2 + 6, height / 2 - panelH / 2 + 6, panelW, panelH, 20);

      const panel = this.add.graphics();
      panel.fillStyle(0xffffff, 0.98);
      panel.fillRoundedRect(width / 2 - panelW / 2, height / 2 - panelH / 2, panelW, panelH, 20);

      const borderColor = this.win ? 0xffd700 : 0xf44336;
      panel.lineStyle(5, borderColor, 1);
      panel.strokeRoundedRect(width / 2 - panelW / 2, height / 2 - panelH / 2, panelW, panelH, 20);

      const resultIcon = this.win ? '🏆' : '💥';
      const icon = this.add.text(width / 2, height / 2 - panelH / 2 + 55, resultIcon, {
        fontSize: '52px'
      }).setOrigin(0.5);

      const resultTitle = this.win ? '🎉 通关成功!' : '💥 挑战失败';
      const title = this.add.text(width / 2, height / 2 - panelH / 2 + 105, resultTitle, {
        fontSize: '30px',
        fontWeight: 'bold',
        color: this.win ? '#2e7d32' : '#c62828'
      }).setOrigin(0.5);

      const msg = this.add.text(width / 2, height / 2 - panelH / 2 + 140, this.message, {
        fontSize: '15px',
        color: '#666666'
      }).setOrigin(0.5);

      const isNewRecord = this.win && this.score >= this.highScore && this.score > 0;
      if (isNewRecord) {
        const record = this.add.text(width / 2, height / 2 - panelH / 2 + 165, '✨ 新纪录! ✨', {
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

      if (this.win && this.performanceGrade) {
        this.createPerformanceGrade(width, height, panelH);
      }
    }

    createPerformanceGrade(width, height, panelH) {
      const grade = this.performanceGrade;
      const gradeY = height / 2 - panelH / 2 + 210;

      const gradeLabel = this.add.text(width / 2, gradeY, grade.label, {
        fontSize: '48px',
        fontWeight: 'bold',
        color: grade.color,
        stroke: '#ffffff',
        strokeThickness: 4
      }).setOrigin(0.5).setDepth(10);

      this.tweens.add({
        targets: gradeLabel,
        scale: { from: 0.5, to: 1 },
        alpha: { from: 0, to: 1 },
        duration: 800,
        ease: 'Back.easeOut',
        delay: 300
      });

      const starsY = gradeY + 45;
      for (let i = 0; i < grade.stars; i++) {
        const star = this.add.text(width / 2 - (grade.stars - 1) * 15 + i * 30, starsY, '⭐', {
          fontSize: '24px'
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
          targets: star,
          alpha: 1,
          scale: { from: 0, to: 1 },
          duration: 400,
          delay: 600 + i * 150,
          ease: 'Back.easeOut'
        });
      }

      const descY = starsY + 35;
      const desc = this.add.text(width / 2, descY, grade.desc, {
        fontSize: '14px',
        color: '#666666',
        fontStyle: 'italic'
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({
        targets: desc,
        alpha: 1,
        duration: 500,
        delay: 1200
      });
    }

    createStats(width, height) {
      const config = LEVEL_CONFIGS[this.level];
      const statsStartY = height / 2 - 25;
      const statWidth = 340;
      const labelWidth = 100;
      const valueX = width / 2 - statWidth / 2 + labelWidth + 20;

      const stats = [
        { label: '关卡', value: 'Level ' + this.level + ' - ' + config.name, color: '#1a5235' },
        { label: '得分', value: this.score.toString(), color: '#ff6b35' },
        { label: '用时', value: this.time, color: '#2196f3' },
        { label: '剩余生命', value: this.health + '%', color: this.health > 50 ? '#4caf50' : this.health > 25 ? '#ff9800' : '#f44336' },
        { label: '最高分', value: this.highScore.toString(), color: '#ffd700' }
      ];

      for (let i = 0; i < stats.length; i++) {
        const stat = stats[i];
        const y = statsStartY + i * 32;

        const bg = this.add.graphics();
        bg.fillStyle(0xf5f5f5, 1);
        bg.fillRoundedRect(width / 2 - statWidth / 2, y - 12, statWidth, 26, 6);

        const label = this.add.text(width / 2 - statWidth / 2 + 15, y, stat.label, {
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#666666'
        }).setOrigin(0, 0.5);

        const val = this.add.text(valueX, y, stat.value, {
          fontSize: '16px',
          fontWeight: 'bold',
          color: stat.color
        }).setOrigin(0, 0.5);
      }
    }

    createHighScoreCelebration(width, height) {
      const self = this;
      if (this.highScoreAnimationPlayed) return;
      if (!this.scoreImprovements || !this.scoreImprovements.isNewBest) return;

      this.highScoreAnimationPlayed = true;

      const celebration = this.add.container(width / 2, height / 2 - 100);
      celebration.setDepth(100);
      celebration.setScale(0);

      const burst = this.add.graphics();
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const dist = 60;
        const colors = [0xffd700, 0xff6b35, 0x4caf50, 0x2196f3, 0xe91e63];
        const color = colors[i % colors.length];
        burst.fillStyle(color, 1);
        burst.fillCircle(
          Math.cos(angle) * dist,
          Math.sin(angle) * dist,
          8
        );
      }

      const text1 = this.add.text(0, -20, '🎉 新纪录!', {
        fontSize: '32px',
        fontWeight: 'bold',
        color: '#ffd700',
        stroke: '#ffffff',
        strokeThickness: 4
      }).setOrigin(0.5);

      const text2 = this.add.text(0, 20, '恭喜打破记录!', {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#ffffff',
        stroke: '#ff6b35',
        strokeThickness: 3
      }).setOrigin(0.5);

      celebration.add([burst, text1, text2]);

      this.tweens.add({
        targets: celebration,
        scale: { from: 0, to: 1.2 },
        alpha: { from: 0, to: 1 },
        duration: 600,
        ease: 'Back.easeOut',
        yoyo: true,
        hold: 1500,
        onComplete: function() { celebration.destroy(); }
      });

      for (let i = 0; i < 30; i++) {
        setTimeout(function() {
          const x = width / 2 + Phaser.Math.Between(-150, 150);
          const y = height / 2 - 100 + Phaser.Math.Between(-100, 100);
          self.createCelebrationParticle(x, y);
        }, i * 50);
      }
    }

    createCelebrationParticle(x, y) {
      const colors = [0xffd700, 0xff6b35, 0x4caf50, 0x2196f3, 0xe91e63, 0x9c27b0];
      const color = Phaser.Utils.Array.GetRandom(colors);
      const size = 4 + Math.random() * 6;

      const particle = this.add.graphics();
      particle.fillStyle(color, 1);
      particle.fillCircle(0, 0, size);
      particle.x = x;
      particle.y = y;
      particle.setDepth(99);

      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 100;

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed * 2,
        y: y + Math.sin(angle) * speed * 2,
        alpha: { from: 1, to: 0 },
        scale: { from: 1, to: 0 },
        duration: 800 + Math.random() * 400,
        ease: 'Quad.easeOut',
        onComplete: function() { particle.destroy(); }
      });
    }

    createTabs(width, height) {
      const self = this;
      const panelH = 780;
      const tabsY = height / 2 - panelH / 2 + 300;

      const tabs = [
        { id: 'summary', label: '📊 概览' },
        { id: 'breakdown', label: '🔍 拆解' },
        { id: 'comparison', label: '📈 对比' }
      ];

      const tabWidth = 110;
      const gap = 10;
      const totalW = tabWidth * tabs.length + gap * (tabs.length - 1);
      const startX = width / 2 - totalW / 2 + tabWidth / 2;

      this.tabButtons = [];
      this.tabBgs = [];

      tabs.forEach(function(tab, index) {
        const x = startX + index * (tabWidth + gap);
        const btn = self.createTabButton(x, tabsY, tab, tab.id === self.activeTab);
        self.tabButtons.push(btn);
        self.tabBgs.push(btn.getAt(0));
      });
    }

    createTabButton(x, y, tab, isActive) {
      const self = this;
      const btn = this.add.container(x, y);
      btn.setSize(110, 36);
      btn.setDepth(20);
      btn.tabId = tab.id;

      const bg = this.add.graphics();
      bg.fillStyle(isActive ? 0xff6b35 : 0xf0f0f0, 1);
      bg.fillRoundedRect(-55, -18, 110, 36, 8);
      if (isActive) {
        bg.lineStyle(2, 0xe65100, 1);
        bg.strokeRoundedRect(-55, -18, 110, 36, 8);
      }

      const text = this.add.text(0, 0, tab.label, {
        fontSize: '13px',
        fontWeight: 'bold',
        color: isActive ? '#ffffff' : '#666666'
      }).setOrigin(0.5);

      btn.add([bg, text]);

      btn.setInteractive(
        new Phaser.Geom.Rectangle(-55, -18, 110, 36),
        Phaser.Geom.Rectangle.Contains
      );

      btn.on('pointerdown', function() {
        if (self.activeTab !== tab.id) {
          self.switchTab(tab.id);
        }
      });

      return btn;
    }

    updateTabBg() {
      const self = this;
      this.tabButtons.forEach(function(btn) {
        const isActive = self.activeTab === btn.tabId;
        const bg = btn.getAt(0);
        const text = btn.getAt(1);

        bg.clear();
        bg.fillStyle(isActive ? 0xff6b35 : 0xf0f0f0, 1);
        bg.fillRoundedRect(-55, -18, 110, 36, 8);
        if (isActive) {
          bg.lineStyle(2, 0xe65100, 1);
          bg.strokeRoundedRect(-55, -18, 110, 36, 8);
        }

        text.setColor(isActive ? '#ffffff' : '#666666');
      });
    }

    switchTab(tabId) {
      this.activeTab = tabId;
      this.updateTabBg();
      this.clearTabElements();

      const width = this.scale.width;
      const height = this.scale.height;

      if (tabId === 'summary') {
        this.createSummaryTab(width, height);
      } else if (tabId === 'breakdown') {
        this.createBreakdownTab(width, height);
      } else if (tabId === 'comparison') {
        this.createComparisonTab(width, height);
      }
    }

    clearTabElements() {
      this.tabElements.forEach(function(elem) {
        if (elem && elem.destroy) elem.destroy();
      });
      this.tabElements = [];
    }

    addTabElement(elem) {
      this.tabElements.push(elem);
    }

    createSummaryTab(width, height) {
      const self = this;
      const config = LEVEL_CONFIGS[this.level];
      const panelH = 780;
      const contentY = height / 2 - panelH / 2 + 350;
      const statWidth = 340;
      const labelWidth = 100;
      const valueX = width / 2 - statWidth / 2 + labelWidth + 20;

      const stats = [
        { label: '关卡', value: 'Level ' + this.level + ' - ' + config.name, color: '#1a5235' },
        { label: '得分', value: this.score.toString(), color: '#ff6b35' },
        { label: '用时', value: this.time, color: '#2196f3' },
        { label: '剩余生命', value: this.health + '%', color: this.health > 50 ? '#4caf50' : this.health > 25 ? '#ff9800' : '#f44336' },
        { label: '最高分', value: this.highScore.toString(), color: '#ffd700' }
      ];

      for (let i = 0; i < stats.length; i++) {
        const stat = stats[i];
        const y = contentY + i * 32;

        const bg = this.add.graphics();
        bg.fillStyle(0xf5f5f5, 1);
        bg.fillRoundedRect(width / 2 - statWidth / 2, y - 12, statWidth, 26, 6);

        const label = this.add.text(width / 2 - statWidth / 2 + 15, y, stat.label, {
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#666666'
        }).setOrigin(0, 0.5);

        const val = this.add.text(valueX, y, stat.value, {
          fontSize: '16px',
          fontWeight: 'bold',
          color: stat.color
        }).setOrigin(0, 0.5);

        this.addTabElement(bg);
        this.addTabElement(label);
        this.addTabElement(val);
      }

      if (this.scoreImprovements && this.scoreImprovements.improvements && this.scoreImprovements.improvements.length > 0) {
        const improvementsTitle = this.add.text(width / 2, contentY + stats.length * 32 + 20, '🏆 本次突破', {
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#ff6b35'
        }).setOrigin(0.5);
        this.addTabElement(improvementsTitle);

        this.scoreImprovements.improvements.slice(0, 4).forEach(function(imp, index) {
          const y = contentY + stats.length * 32 + 50 + index * 28;

          const icon = self.add.text(width / 2 - statWidth / 2 + 15, y, imp.icon + ' ' + imp.label, {
            fontSize: '13px',
            color: '#333333',
            fontWeight: 'bold'
          }).setOrigin(0, 0.5);

          let changeText;
          if (imp.isBoolean) {
            changeText = imp.current;
          } else if (imp.faster) {
            changeText = '⏱ -' + imp.diff.toFixed(1) + 's (' + imp.percent + '%)';
          } else {
            changeText = '⬆ +' + imp.diff + ' (' + imp.percent + '%)';
          }

          const change = self.add.text(width / 2 + statWidth / 2 - 15, y, changeText, {
            fontSize: '13px',
            color: imp.major ? '#ff6b35' : '#4caf50',
            fontWeight: 'bold'
          }).setOrigin(1, 0.5);

          self.addTabElement(icon);
          self.addTabElement(change);
        });
      }
    }

    createBreakdownTab(width, height) {
      const self = this;
      const panelH = 780;
      const contentY = height / 2 - panelH / 2 + 340;

      if (!this.performanceGrade || !this.performanceGrade.scoreBreakdown) return;

      const breakdown = this.performanceGrade.scoreBreakdown;
      const radarSize = 180;
      const radarX = width / 2;
      const radarY = contentY + radarSize / 2 + 10;

      const radarBg = this.createRadarBackground(radarX, radarY, radarSize, breakdown.length);
      this.addTabElement(radarBg);

      const radarData = this.createRadarData(radarX, radarY, radarSize, breakdown);
      this.addTabElement(radarData);

      breakdown.forEach(function(item, index) {
        const angle = (index / breakdown.length) * Math.PI * 2 - Math.PI / 2;
        const labelDist = radarSize / 2 + 25;
        const lx = radarX + Math.cos(angle) * labelDist;
        const ly = radarY + Math.sin(angle) * labelDist;

        const label = self.add.text(lx, ly, item.icon + item.label, {
          fontSize: '12px',
          fontWeight: 'bold',
          color: '#333333'
        }).setOrigin(0.5);
        self.addTabElement(label);
      });

      const detailY = radarY + radarSize / 2 + 30;
      const barWidth = 280;
      const gap = 30;

      breakdown.forEach(function(item, index) {
        const y = detailY + index * gap;

        const icon = self.add.text(width / 2 - barWidth / 2, y, item.icon, {
          fontSize: '18px'
        }).setOrigin(0, 0.5);

        const label = self.add.text(width / 2 - barWidth / 2 + 28, y, item.label, {
          fontSize: '13px',
          fontWeight: 'bold',
          color: '#333333'
        }).setOrigin(0, 0.5);

        const bg = self.add.graphics();
        bg.fillStyle(0xeeeeee, 1);
        bg.fillRoundedRect(width / 2 - barWidth / 2 + 80, y - 6, barWidth - 100, 12, 6);

        const fillWidth = Math.min(barWidth - 100, (item.score / 100) * (barWidth - 100));
        const fill = self.add.graphics();
        fill.fillStyle(item.color.replace('#', '0x'), 1);
        fill.fillRoundedRect(width / 2 - barWidth / 2 + 80, y - 6, fillWidth, 12, 6);

        const score = self.add.text(width / 2 + barWidth / 2, y, item.score + '分', {
          fontSize: '12px',
          color: '#666666',
          fontWeight: 'bold'
        }).setOrigin(1, 0.5);

        self.addTabElement(icon);
        self.addTabElement(label);
        self.addTabElement(bg);
        self.addTabElement(fill);
        self.addTabElement(score);
      });
    }

    createRadarBackground(cx, cy, size, numPoints) {
      const gfx = this.add.graphics();
      gfx.setDepth(15);

      for (let level = 1; level <= 4; level++) {
        const radius = (size / 2) * (level / 4);
        const points = [];
        for (let i = 0; i < numPoints; i++) {
          const angle = (i / numPoints) * Math.PI * 2 - Math.PI / 2;
          points.push({
            x: cx + Math.cos(angle) * radius,
            y: cy + Math.sin(angle) * radius
          });
        }
        gfx.fillStyle(0xf5f5f5, 1);
        gfx.strokeStyle(0xdddddd, 1);
        gfx.beginPath();
        gfx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          gfx.lineTo(points[i].x, points[i].y);
        }
        gfx.closePath();
        gfx.fillPath();
        gfx.strokePath();
      }

      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2 - Math.PI / 2;
        const radius = size / 2;
        gfx.strokeStyle(0xcccccc, 0.5);
        gfx.beginPath();
        gfx.moveTo(cx, cy);
        gfx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
        gfx.strokePath();
      }

      return gfx;
    }

    createRadarData(cx, cy, size, breakdown) {
      const gfx = this.add.graphics();
      gfx.setDepth(16);

      const points = [];
      breakdown.forEach(function(item, index) {
        const angle = (index / breakdown.length) * Math.PI * 2 - Math.PI / 2;
        const radius = (size / 2) * Math.min(1, item.score / 100);
        points.push({
          x: cx + Math.cos(angle) * radius,
          y: cy + Math.sin(angle) * radius
        });
      });

      gfx.fillStyle(0xff6b35, 0.3);
      gfx.strokeStyle(0xff6b35, 2);
      gfx.beginPath();
      gfx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        gfx.lineTo(points[i].x, points[i].y);
      }
      gfx.closePath();
      gfx.fillPath();
      gfx.strokePath();

      points.forEach(function(p) {
        gfx.fillStyle(0xff6b35, 1);
        gfx.fillCircle(p.x, p.y, 4);
      });

      return gfx;
    }

    createComparisonTab(width, height) {
      const self = this;
      const panelH = 780;
      const contentY = height / 2 - panelH / 2 + 340;
      const statWidth = 340;

      const title = this.add.text(width / 2, contentY, '📈 与历史最佳对比', {
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#333333'
      }).setOrigin(0.5);
      this.addTabElement(title);

      const headers = ['', '本次', '最佳', '变化'];
      const headerX = [
        width / 2 - statWidth / 2 + 30,
        width / 2 - statWidth / 2 + 120,
        width / 2 - statWidth / 2 + 200,
        width / 2 - statWidth / 2 + 290
      ];

      headers.forEach(function(h, i) {
        const t = self.add.text(headerX[i], contentY + 30, h, {
          fontSize: '12px',
          fontWeight: 'bold',
          color: '#999999'
        }).setOrigin(0.5);
        self.addTabElement(t);
      });

      const prev = this.previousBestStats;
      const curr = this.detailedStats;

      const comparisons = [
        {
          label: '得分',
          curr: curr ? curr.totalScore : this.score,
          prev: prev ? prev.totalScore : this.highScore,
          format: function(v) { return v.toLocaleString(); }
        },
        {
          label: '用时',
          curr: curr ? curr.time : 0,
          prev: prev ? prev.time : 0,
          format: function(v) { return v ? v.toFixed(1) + 's' : '-'; },
          isTime: true
        },
        {
          label: '生命',
          curr: curr ? curr.health : this.health,
          prev: prev ? prev.health : 0,
          format: function(v) { return v + '%'; }
        },
        {
          label: '极速',
          curr: curr ? curr.maxSpeed : 0,
          prev: prev ? prev.maxSpeed : 0,
          format: function(v) { return v + ' km/h'; }
        }
      ];

      comparisons.forEach(function(c, index) {
        const y = contentY + 60 + index * 30;

        const label = self.add.text(headerX[0], y, c.label, {
          fontSize: '13px',
          color: '#333333',
          fontWeight: 'bold'
        }).setOrigin(0.5);

        const currVal = self.add.text(headerX[1], y, c.format(c.curr), {
          fontSize: '13px',
          color: '#ff6b35',
          fontWeight: 'bold'
        }).setOrigin(0.5);

        const prevVal = self.add.text(headerX[2], y, c.format(c.prev), {
          fontSize: '13px',
          color: '#666666'
        }).setOrigin(0.5);

        let diffText = '-';
        let diffColor = '#999999';
        if (c.prev > 0) {
          if (c.isTime) {
            const diff = c.prev - c.curr;
            if (diff > 0.1) {
              diffText = '⬆ +' + diff.toFixed(1) + 's';
              diffColor = '#4caf50';
            } else if (diff < -0.1) {
              diffText = '⬇ ' + diff.toFixed(1) + 's';
              diffColor = '#f44336';
            } else {
              diffText = '–';
            }
          } else {
            const diff = c.curr - c.prev;
            if (diff > 0) {
              diffText = '⬆ +' + diff.toLocaleString();
              diffColor = '#4caf50';
            } else if (diff < 0) {
              diffText = '⬇ ' + diff.toLocaleString();
              diffColor = '#f44336';
            } else {
              diffText = '–';
            }
          }
        }

        const diff = self.add.text(headerX[3], y, diffText, {
          fontSize: '12px',
          color: diffColor,
          fontWeight: 'bold'
        }).setOrigin(0.5);

        self.addTabElement(label);
        self.addTabElement(currVal);
        self.addTabElement(prevVal);
        self.addTabElement(diff);
      });

      const historyTitleY = contentY + 60 + comparisons.length * 30 + 25;
      const historyTitle = this.add.text(width / 2, historyTitleY, '📜 最近记录', {
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#333333'
      }).setOrigin(0.5);
      this.addTabElement(historyTitle);

      if (this.runHistory && this.runHistory.length > 0) {
        const maxShow = Math.min(3, this.runHistory.length);
        for (let i = 0; i < maxShow; i++) {
          const run = this.runHistory[i];
          const y = historyTitleY + 25 + i * 26;

          const bg = this.add.graphics();
          bg.fillStyle(i === 0 ? 0xfff3e0 : 0xf9f9f9, 1);
          bg.fillRoundedRect(width / 2 - statWidth / 2, y - 10, statWidth, 22, 4);

          const rank = this.add.text(width / 2 - statWidth / 2 + 15, y, i === 0 ? '🏆' : '#' + (i + 1), {
            fontSize: '12px',
            fontWeight: 'bold',
            color: i === 0 ? '#ff6b35' : '#999999'
          }).setOrigin(0, 0.5);

          const score = this.add.text(width / 2 - statWidth / 2 + 60, y, run.score.toLocaleString() + '分', {
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#333333'
          }).setOrigin(0, 0.5);

          const time = this.add.text(width / 2 - statWidth / 2 + 160, y, run.time.toFixed(1) + 's', {
            fontSize: '12px',
            color: '#666666'
          }).setOrigin(0, 0.5);

          const result = this.add.text(width / 2 + statWidth / 2 - 15, y, run.win ? '✅ 通关' : '❌ 失败', {
            fontSize: '11px',
            color: run.win ? '#4caf50' : '#f44336'
          }).setOrigin(1, 0.5);

          this.addTabElement(bg);
          this.addTabElement(rank);
          this.addTabElement(score);
          this.addTabElement(time);
          this.addTabElement(result);
        }
      } else {
        const noHistory = this.add.text(width / 2, historyTitleY + 40, '暂无历史记录', {
          fontSize: '13px',
          color: '#999999'
        }).setOrigin(0.5);
        this.addTabElement(noHistory);
      }
    }

    createButtons(width, height) {
      const btnW = 160;
      const btnH = 48;
      const btnY = height / 2 + 160;
      const gap = 20;
      const totalW = btnW * 3 + gap * 2;
      const startX = width / 2 - totalW / 2 + btnW / 2;
      const self = this;

      const createBtn = function(x, label, color, onClick) {
        const container = self.add.container(x, btnY);
        container.setSize(btnW, btnH);

        const bg = self.add.graphics();
        bg.fillStyle(color, 1);
        bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 12);
        bg.lineStyle(2, 0xffffff, 0.5);
        bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 12);

        const text = self.add.text(0, 0, label, {
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
    }
  }

  global.MountainRacer = global.MountainRacer || {};
  global.MountainRacer.GameOverScene = GameOverScene;

})(window);
