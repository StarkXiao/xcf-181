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

    var width = this.scale.width;
    var height = this.scale.height;

    this.createBackground(width, height);
    this.createTitle(width, height);
    this.createTopBar(width, height);
    this.createChapterProgress(width, height);
    this.createLevelCards(width, height);
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

  proto.createLevelCards = function(width, height) {
    var cardY = 290;
    var cardWidth = 210;
    var cardHeight = 160;
    var spacing = 30;
    var totalWidth = cardWidth * 3 + spacing * 2;
    var startX = (width - totalWidth) / 2 + cardWidth / 2;

    this.levelCards = [];

    for (var level = 1; level <= 3; level++) {
      var config = MountainRacer.LEVEL_CONFIGS[level];
      var x = startX + (level - 1) * (cardWidth + spacing);

      var container = this.add.container(x, cardY);
      container.setSize(cardWidth, cardHeight);

      var gfx = this.add.graphics();
      var levelColors = {
        1: [0x4caf50, 0x2e7d32],
        2: [0xff9800, 0xe65100],
        3: [0xf44336, 0xb71c1c]
      };
      var c1 = levelColors[level][0];
      var c2 = levelColors[level][1];

      gfx.fillStyle(0xffffff, 0.95);
      gfx.fillRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 16);

      gfx.lineGradientStyle(4, c1, c1, c2, c2, 1);
      gfx.strokeRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 16);

      gfx.fillStyle(c1, 1);
      gfx.fillRoundedRect(-cardWidth / 2 + 12, -cardHeight / 2 + 12, 36, 36, 8);

      var levelNum = this.add.text(-cardWidth / 2 + 30, -cardHeight / 2 + 30, level.toString(), {
        fontSize: '26px',
        fontWeight: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5);

      var levelName = this.add.text(0, -cardHeight / 2 + 40, config.name, {
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#333333'
      }).setOrigin(0.5, 0);

      var difficulty = level === 1 ? '⭐' : level === 2 ? '⭐⭐' : '⭐⭐⭐';
      var diffText = this.add.text(0, 0, difficulty, {
        fontSize: '22px'
      }).setOrigin(0.5);

      var lenText = this.add.text(0, 40, '长度: ' + Math.floor(config.length / 1000) + 'km', {
        fontSize: '14px',
        color: '#666666'
      }).setOrigin(0.5);

      container.add([gfx, levelNum, levelName, diffText, lenText]);

      this.createLevelCardStars(level, cardWidth, cardHeight, container);

      var highScore = this.getHighScore(level);
      if (highScore > 0) {
        var hsText = this.add.text(0, cardHeight / 2 - 20, '最高分: ' + highScore, {
          fontSize: '13px',
          fontWeight: 'bold',
          color: '#ff6b35'
        }).setOrigin(0.5);
        container.add(hsText);
      }

      var entryCheck = this.garageMgr.checkLevelEntry(level);
      var unlocked = entryCheck.canEnter;
      var lockReason = entryCheck.reason;

      if (!unlocked) {
        var lockGfx = this.add.graphics();
        lockGfx.fillStyle(0x000000, 0.65);
        lockGfx.fillRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 16);

        var lockMsg = '🔒 未解锁';
        if (lockReason === 'insufficient_power') {
          lockMsg = '⚡ 战力不足';
        } else if (lockReason === 'insufficient_coins') {
          lockMsg = '💰 金币不足';
        }
        var lockText = this.add.text(0, -10, lockMsg, {
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#ffffff'
        }).setOrigin(0.5);

        var hintText = null;
        if (lockReason === 'insufficient_power') {
          hintText = this.add.text(0, 20,
            '需 ' + entryCheck.requiredPower + ' 战力',
            {
              fontSize: '12px',
              color: '#ffcc00',
              align: 'center'
            }
          ).setOrigin(0.5);
        } else if (lockReason === 'level_not_unlocked') {
          hintText = this.add.text(0, 20, '先通关上一关', {
            fontSize: '12px',
            color: '#cccccc',
            align: 'center'
          }).setOrigin(0.5);
        }
        if (hintText) {
          container.add([lockGfx, lockText, hintText]);
        } else {
          container.add([lockGfx, lockText]);
        }
      }

      if (unlocked) {
        var req = this.garageMgr.getLevelRequirement(level);
        if (req.minPower > 0) {
          var reqText = this.add.text(0, cardHeight / 2 - 5,
            '⚡需战力: ' + req.minPower,
            {
              fontSize: '11px',
              color: '#4a90d9',
              fontWeight: 'bold'
            }
          ).setOrigin(0.5);
          container.add(reqText);
        }
      }

      if (unlocked) {
        var self = this;
        container.setInteractive(
          new Phaser.Geom.Rectangle(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight),
          Phaser.Geom.Rectangle.Contains
        );

        container.on('pointerover', function() {
          self.tweens.add({
            targets: this,
            scale: 1.06,
            duration: 150,
            ease: 'Power2'
          });
        });

        container.on('pointerout', function() {
          self.tweens.add({
            targets: this,
            scale: 1.0,
            duration: 150,
            ease: 'Power2'
          });
        });

        container.on('pointerdown', (function(lvl) {
          return function() {
            var check = self.garageMgr.checkLevelEntry(lvl);
            if (!check.canEnter) {
              self.showLevelDenied(check);
              return;
            }
            self.tweens.add({
              targets: this,
              scale: 0.95,
              duration: 80,
              yoyo: true,
              onComplete: function() {
                self.scene.start('GameScene', { level: lvl });
              }
            });
          };
        })(level));
      }

      this.levelCards.push(container);
    }
  };

  proto.showLevelDenied = function(check) {
    var width = this.scale.width;
    var height = this.scale.height;
    var msg = '';
    if (check.reason === 'insufficient_power') {
      msg = '⚡ 战力不足\n当前: ' + check.currentPower + ' / 需要: ' + check.requiredPower;
    } else if (check.reason === 'insufficient_coins') {
      msg = '💰 金币不足\n当前: ' + check.currentCoins + ' / 需要: ' + check.requiredCoins;
    } else {
      msg = '🔒 关卡未解锁';
    }

    var overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.5);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(9000);
    overlay.setAlpha(0);

    var panel = this.add.container(width / 2, height / 2);
    panel.setDepth(9001);
    panel.setAlpha(0);

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

    var btnGfx = this.add.graphics();
    btnGfx.fillStyle(0x4a90d9, 0.95);
    btnGfx.fillRoundedRect(-80, 50, 160, 40, 10);
    var btnText = this.add.text(0, 70, '前往工坊升级', {
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

    var self = this;
    btnContainer.on('pointerdown', function() {
      self.tweens.add({
      targets: [overlay, panel],
      alpha: 0,
      duration: 200,
      onComplete: function() {
        overlay.destroy();
        panel.destroy();
        self.scene.start('GarageScene');
      }
    });
    btnContainer.on('pointerover', function() { btnGfx.clear(); btnGfx.fillStyle(0x6ab0ff, 0.95); btnGfx.fillRoundedRect(-80, 50, 160, 40, 10); });
    btnContainer.on('pointerout', function() { btnGfx.clear(); btnGfx.fillStyle(0x4a90d9, 0.95); btnGfx.fillRoundedRect(-80, 50, 160, 40, 10); });

    var closeBtn = this.add.text(150, -75, '✕', {
      fontSize: '22px',
      color: '#ffffff',
      fontWeight: 'bold'
    }).setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', function() {
      self.tweens.add({
        targets: [overlay, panel],
        alpha: 0,
        duration: 200,
        onComplete: function() {
          overlay.destroy();
          panel.destroy();
        }
      });
    });
    panel.add(closeBtn);

    this.tweens.add({
      targets: [overlay, panel],
      alpha: 1,
      duration: 200
    });
    this.tweens.add({
      targets: panel,
      scale: { from: 0.8, to: 1 },
      duration: 250,
      ease: 'Back.easeOut'
    });
  };

  proto.createChapterProgress = function(width, height) {
    var summary = this.getChapterStarSummary();
    var barY = 200;
    var barWidth = 520;
    var barHeight = 24;

    var container = this.add.container(width / 2, barY);

    var label = this.add.text(-barWidth / 2, -14, '🌟 章节进度', {
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0, 0.5);
    container.add(label);

    var starText = this.add.text(barWidth / 2, -14,
      summary.totalStars + ' / ' + summary.maxStars + ' ⭐', {
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(1, 0.5);
    container.add(starText);

    var bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.4);
    bg.fillRoundedRect(-barWidth / 2, 0, barWidth, barHeight, 12);
    container.add(bg);

    var progressWidth = (summary.completionPercent / 100) * (barWidth - 8);
    var progress = this.add.graphics();
    progress.fillGradientStyle(0xffd700, 0xffb300, 0xffd700, 0xffb300);
    progress.fillRoundedRect(-barWidth / 2 + 4, 4, Math.max(4, progressWidth), barHeight - 8, 8);
    container.add(progress);

    var pctText = this.add.text(0, barHeight / 2,
      summary.completionPercent + '%', {
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5, 0.5);
    container.add(pctText);

    this.chapterProgressContainer = container;
  };

  proto.createLevelCardStars = function(level, cardWidth, cardHeight, container) {
    var starData = this.getSavedStarRating(level);
    var stars = starData.stars || 0;
    var starY = cardHeight / 2 - 42;
    var starSize = 22;
    var startX = -((3 - 1) * starSize) / 2;

    for (var i = 0; i < 3; i++) {
      var isFilled = i < stars;
      var starChar = isFilled ? '⭐' : '☆';
      var color = isFilled ? '#ffd700' : '#cccccc';
      var star = this.add.text(startX + i * starSize, starY, starChar, {
        fontSize: starSize + 'px',
        color: color,
        stroke: isFilled ? '#000000' : '#999999',
        strokeThickness: isFilled ? 2 : 0
      }).setOrigin(0.5, 0.5);
      container.add(star);

      if (isFilled && stars === 3) {
        this.tweens.add({
          targets: star,
          scale: { from: 1, to: 1.15 },
          duration: 800 + i * 200,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1,
          delay: i * 150
        });
      }
    }
  };

  proto.getSavedStarRating = function(level) {
    return this.highScoreMgr.getStarRating(level);
  };

  proto.getChapterStarSummary = function() {
    return this.highScoreMgr.getChapterStarSummary(3);
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
    var hint = this.add.text(width / 2, height - 25, '点击上方关卡卡片开始游戏  |  移动端自动显示虚拟按键', {
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

  proto.isLevelUnlocked = function(level) {
    return this.unlockMgr.isLevelUnlocked(level);
  };

  proto.getHighScore = function(level) {
    return this.highScoreMgr.getHighScore(level);
  };

  window.MountainRacer = MountainRacer;
})();
