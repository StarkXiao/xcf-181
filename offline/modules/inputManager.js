(function() {
  var MountainRacer = window.MountainRacer || {};

  MountainRacer.InputManager = function(scene) {
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
  };

  var proto = MountainRacer.InputManager.prototype;

  proto.detectMobile = function() {
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      (navigator.maxTouchPoints > 1)
    );
  };

  proto.setup = function() {
    this.setupKeyboard();
    if (this.isMobile) {
      this.setupTouchControls();
    }
  };

  proto.setupKeyboard = function() {
    var KeyCodes = Phaser.Input.Keyboard.KeyCodes;
    this.keys = this.scene.input.keyboard.addKeys({
      up: KeyCodes.W,
      down: KeyCodes.S,
      left: KeyCodes.A,
      right: KeyCodes.D,
      space: KeyCodes.SPACE,
      arrowUp: KeyCodes.UP,
      arrowDown: KeyCodes.DOWN,
      arrowLeft: KeyCodes.LEFT,
      arrowRight: KeyCodes.RIGHT
    });
  };

  proto.updateFromKeys = function() {
    if (!this.keys) return;

    this.input.accelerate =
      this.keys.up.isDown || this.keys.arrowUp.isDown || this.keys.space.isDown;
    this.input.brake = this.keys.down.isDown || this.keys.arrowDown.isDown;
    this.input.left = this.keys.left.isDown || this.keys.arrowLeft.isDown;
    this.input.right = this.keys.right.isDown || this.keys.arrowRight.isDown;
  };

  proto.setupTouchControls = function() {
    var width = this.scene.scale.width;
    var height = this.scene.scale.height;
    var self = this;

    var createTouchButton = function(config) {
      var x = config.x;
      var y = config.y;
      var btnWidth = config.width;
      var btnHeight = config.height;
      var label = config.label;
      var action = config.action;
      var color = config.color || 0x333333;

      var container = self.scene.add.container(x, y);
      container.setScrollFactor(0);
      container.setDepth(1000);

      var graphics = self.scene.add.graphics();
      graphics.fillStyle(color, 0.5);
      graphics.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 12);
      graphics.lineStyle(3, 0xffffff, 0.6);
      graphics.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 12);

      var text = self.scene.add.text(0, 0, label, {
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

      var setPressed = function(pressed) {
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

    var btnSize = 80;
    var margin = 20;

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
  };

  proto.getState = function() {
    if (!this.isMobile && this.keys) {
      this.updateFromKeys();
    }
    return {
      accelerate: this.input.accelerate,
      brake: this.input.brake,
      left: this.input.left,
      right: this.input.right
    };
  };

  proto.destroy = function() {
    for (var key in this.touchButtons) {
      if (this.touchButtons[key]) {
        this.touchButtons[key].destroy();
      }
    }
    this.touchButtons = {};
  };

  window.MountainRacer = MountainRacer;
})();
