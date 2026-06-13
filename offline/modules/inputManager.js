(function(global) {
  'use strict';

  class InputManager {
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
    }

    updateFromKeys() {
      if (!this.keys) return;

      this.input.accelerate = this.keys.up.isDown || this.keys.arrowUp.isDown || this.keys.space.isDown;
      this.input.brake = this.keys.down.isDown || this.keys.arrowDown.isDown;
      this.input.left = this.keys.left.isDown || this.keys.arrowLeft.isDown;
      this.input.right = this.keys.right.isDown || this.keys.arrowRight.isDown;
    }

    setupTouchControls() {
      const width = this.scene.scale.width;
      const height = this.scene.scale.height;

      const self = this;
      const createTouchButton = function(config) {
        const x = config.x;
        const y = config.y;
        const btnWidth = config.width;
        const btnHeight = config.height;
        const label = config.label;
        const action = config.action;
        const color = config.color || 0x333333;

        const container = self.scene.add.container(x, y);
        container.setScrollFactor(0);
        container.setDepth(1000);

        const graphics = self.scene.add.graphics();
        graphics.fillStyle(color, 0.5);
        graphics.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 12);
        graphics.lineStyle(3, 0xffffff, 0.6);
        graphics.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 12);

        const text = self.scene.add.text(0, 0, label, {
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#ffffff'
        });
        text.setOrigin(0.5);

        container.add([graphics, text]);
        container.setSize(btnWidth, btnHeight);
        container.setInteractive(
          new Phaser.Geom.Rectangle(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight),
          Phaser.Geom.Rectangle.Contains
        );

        const setPressed = function(pressed) {
          graphics.clear();
          if (pressed) {
            graphics.fillStyle(color, 0.8);
          } else {
            graphics.fillStyle(color, 0.5);
          }
          graphics.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 12);
          graphics.lineStyle(3, 0xffffff, pressed ? 0.9 : 0.6);
          graphics.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 12);
          self.input[action] = pressed;
        };

        container.on('pointerdown', function() { setPressed(true); });
        container.on('pointerup', function() { setPressed(false); });
        container.on('pointerout', function() { setPressed(false); });
        container.on('pointerleave', function() { setPressed(false); });

        self.scene.input.on('pointerup', function() {
          if (self.input[action] && !self.scene.input.activePointer.isDown) {
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
        color: 0xff6b35
      });

      this.touchButtons.brake = createTouchButton({
        x: width - margin - btnSize / 2 - btnSize - margin,
        y: height - margin - btnSize / 2,
        width: btnSize,
        height: btnSize,
        label: '▼',
        action: 'brake',
        color: 0x4a90d9
      });

      this.touchButtons.left = createTouchButton({
        x: margin + btnSize / 2,
        y: height - margin - btnSize / 2,
        width: btnSize,
        height: btnSize,
        label: '◀',
        action: 'left',
        color: 0x333333
      });

      this.touchButtons.right = createTouchButton({
        x: margin + btnSize / 2 + btnSize + margin,
        y: height - margin - btnSize / 2,
        width: btnSize,
        height: btnSize,
        label: '▶',
        action: 'right',
        color: 0x333333
      });
    }

    getState() {
      if (!this.isMobile && this.keys) {
        this.updateFromKeys();
      }
      return {
        accelerate: this.input.accelerate,
        brake: this.input.brake,
        left: this.input.left,
        right: this.input.right
      };
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

  global.MountainRacer = global.MountainRacer || {};
  global.MountainRacer.InputManager = InputManager;

})(window);
