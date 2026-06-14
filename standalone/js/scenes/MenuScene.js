(function() {
  var MountainRacer = window.MountainRacer || {};

  MountainRacer.MenuScene = function() {
    Phaser.Scene.call(this, { key: 'MenuScene' });
  };

  MountainRacer.MenuScene.prototype = Object.create(Phaser.Scene.prototype);
  MountainRacer.MenuScene.prototype.constructor = MountainRacer.MenuScene;

  var proto = MountainRacer.MenuScene.prototype;

  proto.create = function() {
    var width = this.scale.width;
    var height = this.scale.height;

    this.createBackground(width, height);
    this.createTitle(width, height);
    this.createChapterProgress(width, height);
    this.createLevelCards(width, height);
    this.createInstructions(width, height);
    this.createControlsHint(width, height);
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

  proto.createLevelCards = function(width, height) {
    var cardY = 250;
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

      var unlocked = this.isLevelUnlocked(level);
      if (!unlocked) {
        var lockGfx = this.add.graphics();
        lockGfx.fillStyle(0x000000, 0.6);
        lockGfx.fillRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 16);
        var lockText = this.add.text(0, 0, '🔒 未解锁', {
          fontSize: '22px',
          fontWeight: 'bold',
          color: '#ffffff'
        }).setOrigin(0.5);
        container.add([lockGfx, lockText]);
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
    try {
      var key = 'mountain_racer_stars_' + level;
      var saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : { stars: 0, totalStars: 3 };
    } catch (e) {
      return { stars: 0, totalStars: 3 };
    }
  };

  proto.getChapterStarSummary = function() {
    try {
      var totalLevels = 3;
      var result = {
        totalStars: 0,
        maxStars: totalLevels * 3,
        levelStars: {},
        completionPercent: 0
      };

      for (var lvl = 1; lvl <= totalLevels; lvl++) {
        var saved = this.getSavedStarRating(lvl);
        result.levelStars[lvl] = saved.stars || 0;
        result.totalStars += saved.stars || 0;
      }

      result.completionPercent = Math.floor((result.totalStars / result.maxStars) * 100);
      return result;
    } catch (e) {
      return { totalStars: 0, maxStars: 9, levelStars: {}, completionPercent: 0 };
    }
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
    try {
      var key = 'mountain_racer_unlocked';
      var saved = localStorage.getItem(key);
      var unlocked = saved ? JSON.parse(saved) : [1];
      return Array.isArray(unlocked) && unlocked.indexOf(level) !== -1;
    } catch (e) {
      return level === 1;
    }
  };

  proto.getHighScore = function(level) {
    try {
      var key = 'mountain_racer_highscore_' + level;
      var saved = localStorage.getItem(key);
      return saved ? parseInt(saved, 10) : 0;
    } catch (e) {
      return 0;
    }
  };

  window.MountainRacer = MountainRacer;
})();
