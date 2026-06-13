export class InputManager {
  constructor(scene) {
    this.scene = scene;
    this.input = {
      accelerate: false,
      brake: false,
      left: false,
      right: false
    };
    this.keys = null;
    this.touchButtons = {};
    this.isMobile = this.detectMobile();
  }

  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      || (navigator.maxTouchPoints > 1);
  }

  setup() {
    this.setupKeyboard();
    if (this.isMobile) {
      this.setupTouchControls();
    }
  }

  setupKeyboard() {
    this.keys = this.scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      arrowUp: Phaser.Input.Keyboard.KeyCodes.UP,
      arrowDown: Phaser.Input.Keyboard.KeyCodes.DOWN,
      arrowLeft: Phaser.Input.Keyboard.KeyCodes.LEFT,
      arrowRight: Phaser.Input.Keyboard.KeyCodes.RIGHT
    });

    this.scene.input.keyboard.on('keydown', (e) => {
      this.updateFromKeys();
    });

    this.scene.input.keyboard.on('keyup', (e) => {
      this.updateFromKeys();
    });
  }

  updateFromKeys() {
    if (!this.keys) return;

    this.input.accelerate = this.keys.up.isDown || this.keys.arrowUp.isDown || this.keys.space.isDown;
    this.input.brake = this.keys.down.isDown || this.keys.arrowDown.isDown;
    this.input.left = this.keys.left.isDown || this.keys.arrowLeft.isDown;
    this.input.right = this.keys.right.isDown || this.keys.arrowRight.isDown;
  }

  setupTouchControls() {
    const { width, height } = this.scene.scale;

    const createTouchButton = (config) => {
      const { x, y, width, height, label, action, key, color } = config;

      const container = this.scene.add.container(x, y);
      container.setScrollFactor(0);
      container.setDepth(1000);

      const graphics = this.scene.add.graphics();
      graphics.fillStyle(color || 0x333333, 0.5);
      graphics.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
      graphics.lineStyle(3, 0xffffff, 0.6);
      graphics.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);

      const text = this.scene.add.text(0, 0, label, {
        fontSize: '28px',
        fontWeight: 'bold',
        color: '#ffffff'
      });
      text.setOrigin(0.5);

      container.add([graphics, text]);
      container.setSize(width, height);
      container.setInteractive(new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height), Phaser.Geom.Rectangle.Contains);

      const setPressed = (pressed) => {
        graphics.clear();
        if (pressed) {
          graphics.fillStyle(color || 0xffffff, 0.8);
        } else {
          graphics.fillStyle(color || 0x333333, 0.5);
        }
        graphics.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
        graphics.lineStyle(3, 0xffffff, pressed ? 0.9 : 0.6);
        graphics.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);
        this.input[action] = pressed;
      };

      container.on('pointerdown', () => setPressed(true));
      container.on('pointerup', () => setPressed(false));
      container.on('pointerout', () => setPressed(false));
      container.on('pointerleave', () => setPressed(false));

      this.scene.input.on('pointerup', () => {
        if (this.input[action] && !this.scene.input.activePointer.isDown) {
          setPressed(false);
        }
      });

      return container;
    };

    const btnSize = 80;
    const margin = 20;

    this.touchButtons.accelerate = createTouchButton({
      x: width - margin - btnSize / 2,
      y: height - margin - btnSize / 2,
      width: btnSize,
      height: btnSize,
      label: '▲',
      action: 'accelerate',
      key: 'accelerate',
      color: 0xff6b35
    });

    this.touchButtons.brake = createTouchButton({
      x: width - margin - btnSize / 2 - btnSize - margin,
      y: height - margin - btnSize / 2,
      width: btnSize,
      height: btnSize,
      label: '▼',
      action: 'brake',
      key: 'brake',
      color: 0x4a90d9
    });

    this.touchButtons.left = createTouchButton({
      x: margin + btnSize / 2,
      y: height - margin - btnSize / 2,
      width: btnSize,
      height: btnSize,
      label: '◀',
      action: 'left',
      key: 'left',
      color: 0x333333
    });

    this.touchButtons.right = createTouchButton({
      x: margin + btnSize / 2 + btnSize + margin,
      y: height - margin - btnSize / 2,
      width: btnSize,
      height: btnSize,
      label: '▶',
      action: 'right',
      key: 'right',
      color: 0x333333
    });
  }

  getState() {
    if (!this.isMobile && this.keys) {
      this.updateFromKeys();
    }
    return { ...this.input };
  }

  destroy() {
    for (const key in this.touchButtons) {
      if (this.touchButtons[key]) {
        this.touchButtons[key].destroy();
      }
    }
    this.touchButtons = {};
  }
}
