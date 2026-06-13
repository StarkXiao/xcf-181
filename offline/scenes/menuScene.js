(function(global) {
  'use strict';

  const LEVEL_CONFIGS = global.MountainRacer.LEVEL_CONFIGS;

  class MenuScene extends Phaser.Scene {
    constructor() {
      super({ key: 'MenuScene' });
    }

    create() {
      const width = this.scale.width;
      const height = this.scale.height;

      this.createBackground(width, height);
      this.createTitle(width, height);
      this.createLevelCards(width, height);
      this.createInstructions(width, height);
      this.createControlsHint(width, height);
    }

    createBackground(width, height) {
      const skyGfx = this.add.graphics();
      skyGfx.fillGradientStyle(0x87ceeb, 0x87ceeb, 0xe0f6ff, 0xe0f6ff);
      skyGfx.fillRect(0, 0, width, height);

      for (let i = 0; i < 5; i++) {
        const parallax = 0.2 + i * 0.1;
        const amp = 30 + i * 20;
        const baseY = 280 + i * 50;
        const colors = [
          [0x6b8e23, 0x556b2f],
          [0x556b2f, 0x3e511f],
          [0x3e511f, 0x2d3e16],
          [0x2d3e16, 0x1e2b0e],
          [0x1e2b0e, 0x141d08]
        ];

        const gfx = this.add.graphics();
        const cPair = colors[i];
        gfx.fillGradientStyle(cPair[0], cPair[0], cPair[1], cPair[1]);
        gfx.beginPath();
        gfx.moveTo(0, height);

        for (let x = 0; x <= width; x += 8) {
          const wx = x / parallax;
          const n = Math.sin(wx * 0.006 + i * 2) * 0.5 + Math.sin(wx * 0.015 + i * 5) * 0.3;
          const y = baseY + n * amp;
          gfx.lineTo(x, y);
        }

        gfx.lineTo(width, height);
        gfx.closePath();
        gfx.fillPath();
        gfx.setDepth(-10 + i);
      }

      for (let i = 0; i < 5; i++) {
        this.createCloud(
          Phaser.Math.Between(50, width - 50),
          Phaser.Math.Between(30, 140),
          0.4 + Math.random() * 0.5
        );
      }
    }

    createCloud(x, y, scale) {
      const gfx = this.add.graphics();
      gfx.fillStyle(0xffffff, 0.85);
      const s = scale;
      gfx.fillCircle(0, 0, 25 * s);
      gfx.fillCircle(30 * s, -5 * s, 22 * s);
      gfx.fillCircle(52 * s, 0, 26 * s);
      gfx.fillCircle(20 * s, 8 * s, 18 * s);
      gfx.x = x;
      gfx.y = y;
      gfx.setDepth(-5);
    }

    createTitle(width, height) {
      const titleY = 80;

      const titleShadow = this.add.text(width / 2 + 4, titleY + 4, '🏁 山地赛车', {
        fontSize: '56px',
        fontWeight: 'bold',
        color: '#000000',
        stroke: '#000000',
        strokeThickness: 0
      }).setOrigin(0.5).setAlpha(0.3);

      const title = this.add.text(width / 2, titleY, '🏁 山地赛车', {
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

      const subtitle = this.add.text(width / 2, 145, 'MOUNTAIN RACER', {
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#ffffff',
        stroke: '#ff6b35',
        strokeThickness: 3,
        letterSpacing: 6
      }).setOrigin(0.5);
    }

    createLevelCards(width, height) {
      const cardY = 250;
      const cardWidth = 210;
      const cardHeight = 160;
      const spacing = 30;
      const totalWidth = cardWidth * 3 + spacing * 2;
      const startX = (width - totalWidth) / 2 + cardWidth / 2;

      this.levelCards = [];
      const self = this;

      for (let level = 1; level <= 3; level++) {
        const config = LEVEL_CONFIGS[level];
        const x = startX + (level - 1) * (cardWidth + spacing);

        const container = this.add.container(x, cardY);
        container.setSize(cardWidth, cardHeight);

        const gfx = this.add.graphics();
        const levelColors = {
          1: [0x4caf50, 0x2e7d32],
          2: [0xff9800, 0xe65100],
          3: [0xf44336, 0xb71c1c]
        };
        const cPair = levelColors[level];

        gfx.fillStyle(0xffffff, 0.95);
        gfx.fillRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 16);

        gfx.lineGradientStyle(4, cPair[0], cPair[0], cPair[1], cPair[1], 1);
        gfx.strokeRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 16);

        gfx.fillStyle(cPair[0], 1);
        gfx.fillRoundedRect(-cardWidth / 2 + 12, -cardHeight / 2 + 12, 36, 36, 8);

        const levelNum = this.add.text(-cardWidth / 2 + 30, -cardHeight / 2 + 30, level.toString(), {
          fontSize: '26px',
          fontWeight: 'bold',
          color: '#ffffff'
        }).setOrigin(0.5);

        const levelName = this.add.text(0, -cardHeight / 2 + 40, config.name, {
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#333333'
        }).setOrigin(0.5, 0);

        const difficulty = level === 1 ? '⭐' : level === 2 ? '⭐⭐' : '⭐⭐⭐';
        const diffText = this.add.text(0, 0, difficulty, {
          fontSize: '22px'
        }).setOrigin(0.5);

        const lenText = this.add.text(0, 40, '长度: ' + Math.floor(config.length / 1000) + 'km', {
          fontSize: '14px',
          color: '#666666'
        }).setOrigin(0.5);

        const unlocked = this.isLevelUnlocked(level);
        if (!unlocked) {
          const lock = this.add.graphics();
          lock.fillStyle(0x000000, 0.6);
          lock.fillRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 16);
          const lockText = this.add.text(0, 0, '🔒 未解锁', {
            fontSize: '22px',
            fontWeight: 'bold',
            color: '#ffffff'
          }).setOrigin(0.5);
          container.add([lock, lockText]);
        }

        const highScore = this.getHighScore(level);
        if (highScore > 0) {
          const hsText = this.add.text(0, cardHeight / 2 - 20, '最高分: ' + highScore, {
            fontSize: '13px',
            fontWeight: 'bold',
            color: '#ff6b35'
          }).setOrigin(0.5);
          container.add(hsText);
        }

        container.add([gfx, levelNum, levelName, diffText, lenText]);

        if (unlocked) {
          container.setInteractive(
            new Phaser.Geom.Rectangle(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight),
            Phaser.Geom.Rectangle.Contains
          );

          container.on('pointerover', function() {
            self.tweens.add({
              targets: container,
              scale: 1.06,
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
          });

          container.on('pointerdown', function() {
            self.tweens.add({
              targets: container,
              scale: 0.95,
              duration: 80,
              yoyo: true,
              onComplete: function() {
                self.scene.start('GameScene', { level: level });
              }
            });
          });
        }

        this.levelCards.push(container);
      }
    }

    createInstructions(width, height) {
      const panelY = 445;
      const panelWidth = 680;
      const panelHeight = 80;

      const gfx = this.add.graphics();
      gfx.fillStyle(0x000000, 0.45);
      gfx.fillRoundedRect(width / 2 - panelWidth / 2, panelY - panelHeight / 2, panelWidth, panelHeight, 12);

      gfx.lineStyle(2, 0xffffff, 0.3);
      gfx.strokeRoundedRect(width / 2 - panelWidth / 2, panelY - panelHeight / 2, panelWidth, panelHeight, 12);

      const title = this.add.text(width / 2, panelY - 25, '🎮 操作说明', {
        fontSize: '15px',
        fontWeight: 'bold',
        color: '#ffd700'
      }).setOrigin(0.5);

      const helpText = this.add.text(width / 2, panelY + 10,
        '加速: W / ↑ / 空格   减速: S / ↓   空中平衡: A/D 或 ←/→',
        {
          fontSize: '14px',
          color: '#ffffff'
        }).setOrigin(0.5);
    }

    createControlsHint(width, height) {
      const hint = this.add.text(width / 2, height - 25, '点击上方关卡卡片开始游戏  |  移动端自动显示虚拟按键', {
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
    }

    isLevelUnlocked(level) {
      try {
        const key = 'mountain_racer_unlocked';
        const saved = localStorage.getItem(key);
        const unlocked = saved ? JSON.parse(saved) : [1];
        return Array.isArray(unlocked) && unlocked.indexOf(level) !== -1;
      } catch(e) {
        return level === 1;
      }
    }

    getHighScore(level) {
      try {
        const key = 'mountain_racer_highscore_' + level;
        const saved = localStorage.getItem(key);
        return saved ? parseInt(saved, 10) : 0;
      } catch(e) {
        return 0;
      }
    }
  }

  global.MountainRacer = global.MountainRacer || {};
  global.MountainRacer.MenuScene = MenuScene;

})(window);
