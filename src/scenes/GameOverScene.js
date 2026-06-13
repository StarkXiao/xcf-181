import { LEVEL_CONFIGS } from '../modules/Terrain.js';

export class GameOverScene extends Phaser.Scene {
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
  }

  create() {
    const { width, height } = this.scale;

    this.createBackground(width, height);
    this.createResultPanel(width, height);
    this.createStats(width, height);
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
      duration,
      ease: 'Linear',
      onComplete: () => gfx.destroy()
    });
  }

  createResultPanel(width, height) {
    const panelW = 420;
    const panelH = 430;

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
  }

  createStats(width, height) {
    const config = LEVEL_CONFIGS[this.level];
    const statsStartY = height / 2 - 25;
    const statWidth = 340;
    const labelWidth = 100;
    const valueX = width / 2 - statWidth / 2 + labelWidth + 20;

    const stats = [
      { label: '关卡', value: `Level ${this.level} - ${config.name}`, color: '#1a5235' },
      { label: '得分', value: this.score.toString(), color: '#ff6b35' },
      { label: '用时', value: this.time, color: '#2196f3' },
      { label: '剩余生命', value: `${this.health}%`, color: this.health > 50 ? '#4caf50' : this.health > 25 ? '#ff9800' : '#f44336' },
      { label: '最高分', value: this.highScore.toString(), color: '#ffd700' }
    ];

    stats.forEach((stat, i) => {
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
    });
  }

  createButtons(width, height) {
    const btnW = 160;
    const btnH = 48;
    const btnY = height / 2 + 160;
    const gap = 20;
    const totalW = btnW * 3 + gap * 2;
    const startX = width / 2 - totalW / 2 + btnW / 2;

    const createBtn = (x, label, color, onClick) => {
      const container = this.add.container(x, btnY);
      container.setSize(btnW, btnH);

      const bg = this.add.graphics();
      bg.fillStyle(color, 1);
      bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 12);
      bg.lineStyle(2, 0xffffff, 0.5);
      bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 12);

      const text = this.add.text(0, 0, label, {
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5);

      container.add([bg, text]);
      container.setInteractive(new Phaser.Geom.Rectangle(-btnW / 2, -btnH / 2, btnW, btnH), Phaser.Geom.Rectangle.Contains);

      container.on('pointerover', () => {
        this.tweens.add({
          targets: container,
          scale: 1.04,
          duration: 100
        });
      });

      container.on('pointerout', () => {
        this.tweens.add({
          targets: container,
          scale: 1,
          duration: 100
        });
      });

      container.on('pointerdown', () => {
        this.tweens.add({
          targets: container,
          scale: 0.95,
          duration: 80,
          yoyo: true,
          onComplete: onClick
        });
      });

      return container;
    };

    createBtn(startX, '🏠 菜单', 0x9e9e9e, () => {
      this.scene.start('MenuScene');
    });

    createBtn(startX + btnW + gap, '🔄 重玩', 0x2196f3, () => {
      this.scene.start('GameScene', { level: this.level });
    });

    if (this.win && this.level < 3) {
      createBtn(startX + (btnW + gap) * 2, '➡ 下一关', 0x4caf50, () => {
        this.scene.start('GameScene', { level: this.level + 1 });
      });
    } else {
      createBtn(startX + (btnW + gap) * 2, this.win ? '🌟 通关' : '🎯 重试', 0xff6b35, () => {
        this.scene.start('GameScene', { level: this.level });
      });
    }
  }
}
