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
    this.layoutManager = null;
    this.editMode = false;
    this.dragState = null;
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

    if (!this.layoutManager) {
      this.layoutManager = new MountainRacer.ButtonLayoutManager(width, height);
    }

    var createTouchButton = function(action) {
      var meta = self.layoutManager.getButtonMeta(action);
      var config = self.layoutManager.getButtonConfig(action);
      if (!meta || !config) return null;

      var btnSize = self.layoutManager.getEffectiveButtonSize(action);
      var x = config.x;
      var y = config.y;
      var label = meta.label;
      var color = meta.color;
      var opacity = config.opacity || 0.5;

      var container = self.scene.add.container(x, y);
      container.setScrollFactor(0);
      container.setDepth(1000);
      container.setAlpha(opacity);

      container.btnAction = action;
      container.btnSize = btnSize;
      container.btnColor = color;
      container.isDragging = false;

      var glowGraphics = self.scene.add.graphics();
      glowGraphics.setAlpha(0);

      var graphics = self.scene.add.graphics();
      graphics.fillStyle(color, 0.5);
      graphics.fillRoundedRect(-btnSize / 2, -btnSize / 2, btnSize, btnSize, 12);
      graphics.lineStyle(3, 0xffffff, 0.6);
      graphics.strokeRoundedRect(-btnSize / 2, -btnSize / 2, btnSize, btnSize, 12);

      var editOutline = self.scene.add.graphics();
      editOutline.setAlpha(0);

      var posLabel = self.scene.add.text(0, -btnSize / 2 - 14, '', {
        fontSize: '10px',
        fontWeight: 'bold',
        color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: { x: 4, y: 2 }
      });
      posLabel.setOrigin(0.5);
      posLabel.setAlpha(0);

      var text = self.scene.add.text(0, 0, label, {
        fontSize: Math.max(16, Math.floor(28 * (btnSize / 80))) + 'px',
        fontWeight: 'bold',
        color: '#ffffff'
      });
      text.setOrigin(0.5);

      container.add([glowGraphics, graphics, editOutline, posLabel, text]);
      container.setSize(btnSize, btnSize);
      container.setInteractive(
        new Phaser.Geom.Rectangle(-btnSize / 2, -btnSize / 2, btnSize, btnSize),
        Phaser.Geom.Rectangle.Contains
      );

      var drawGlow = function(active) {
        glowGraphics.clear();
        if (active) {
          glowGraphics.fillStyle(color, 0.3);
          glowGraphics.fillRoundedRect(-btnSize / 2 - 8, -btnSize / 2 - 8, btnSize + 16, btnSize + 16, 16);
          glowGraphics.lineStyle(4, 0x00e5ff, 0.9);
          glowGraphics.strokeRoundedRect(-btnSize / 2 - 8, -btnSize / 2 - 8, btnSize + 16, btnSize + 16, 16);
        }
      };

      var drawEditOutline = function(enabled) {
        editOutline.clear();
        if (enabled) {
          editOutline.lineStyle(2, 0x00e5ff, 1);
          var dashSize = 6;
          var halfW = btnSize / 2;
          var halfH = btnSize / 2;
          var x1 = -halfW, y1 = -halfH, x2 = halfW, y2 = halfH;
          for (var xi = x1; xi < x2; xi += dashSize * 2) {
            editOutline.lineBetween(xi, y1, Math.min(xi + dashSize, x2), y1);
            editOutline.lineBetween(xi, y2, Math.min(xi + dashSize, x2), y2);
          }
          for (var yi = y1; yi < y2; yi += dashSize * 2) {
            editOutline.lineBetween(x1, yi, x1, Math.min(yi + dashSize, y2));
            editOutline.lineBetween(x2, yi, x2, Math.min(yi + dashSize, y2));
          }
        }
      };

      var updatePosLabel = function() {
        posLabel.setText(Math.round(container.x) + ',' + Math.round(container.y));
      };

      var setEditVisuals = function(editEnabled) {
        if (editEnabled) {
          container.setAlpha(1.0);
          editOutline.setAlpha(1);
          posLabel.setAlpha(1);
          drawEditOutline(true);
          updatePosLabel();
        } else {
          var cfg = self.layoutManager.getButtonConfig(action);
          container.setAlpha(cfg ? cfg.opacity : 0.5);
          editOutline.setAlpha(0);
          posLabel.setAlpha(0);
          drawEditOutline(false);
        }
      };

      container.setEditVisuals = setEditVisuals;

      var setPressed = function(pressed) {
        graphics.clear();
        if (pressed) {
          graphics.fillStyle(color, 0.8);
        } else {
          graphics.fillStyle(color, 0.5);
        }
        graphics.fillRoundedRect(-btnSize / 2, -btnSize / 2, btnSize, btnSize, 12);
        graphics.lineStyle(3, 0xffffff, pressed ? 0.9 : 0.6);
        graphics.strokeRoundedRect(-btnSize / 2, -btnSize / 2, btnSize, btnSize, 12);
        self.input[action] = pressed;
      };

      container.on('pointerdown', function(pointer) {
        if (self.editMode) {
          self.startDrag(action, pointer);
          container.isDragging = true;
          drawGlow(true);
          glowGraphics.setAlpha(1);
          container.setDepth(1002);
          return;
        }
        setPressed(true);
      });
      container.on('pointerup', function() {
        if (self.editMode) {
          container.isDragging = false;
          drawGlow(false);
          glowGraphics.setAlpha(0);
          container.setDepth(1000);
          return;
        }
        setPressed(false);
      });
      container.on('pointerout', function() {
        if (self.editMode) return;
        setPressed(false);
      });
      container.on('pointerleave', function() {
        if (self.editMode) return;
        setPressed(false);
      });

      self.scene.input.on('pointerup', function() {
        if (self.editMode) {
          self.stopDrag();
          container.isDragging = false;
          drawGlow(false);
          glowGraphics.setAlpha(0);
          container.setDepth(1000);
          return;
        }
        if (self.input[action] && !self.scene.input.activePointer.isDown) {
          setPressed(false);
        }
      });

      self.scene.input.on('pointermove', function(pointer) {
        if (self.editMode && self.dragState && self.dragState.action === action) {
          self.doDrag(pointer);
          updatePosLabel();
        }
      });

      container.setPressed = setPressed;
      container.redraw = function(newSize, newOpacity) {
        btnSize = newSize;
        container.btnSize = newSize;
        graphics.clear();
        graphics.fillStyle(color, 0.5);
        graphics.fillRoundedRect(-btnSize / 2, -btnSize / 2, btnSize, btnSize, 12);
        graphics.lineStyle(3, 0xffffff, 0.6);
        graphics.strokeRoundedRect(-btnSize / 2, -btnSize / 2, btnSize, btnSize, 12);
        text.setFontSize(Math.max(16, Math.floor(28 * (btnSize / 80))) + 'px');
        container.setSize(btnSize, btnSize);
        container.input.hitArea = new Phaser.Geom.Rectangle(-btnSize / 2, -btnSize / 2, btnSize, btnSize);
        drawEditOutline(self.editMode);
        posLabel.y = -btnSize / 2 - 14;
        updatePosLabel();
        if (typeof newOpacity === 'number') {
          container.setAlpha(self.editMode ? 1.0 : newOpacity);
        }
      };

      return container;
    };

    var actions = this.layoutManager.getAllButtonActions();
    for (var i = 0; i < actions.length; i++) {
      var action = actions[i];
      this.touchButtons[action] = createTouchButton(action);
    }
  };

  proto.startDrag = function(action, pointer) {
    var btn = this.touchButtons[action];
    if (!btn) return;
    this.dragState = {
      action: action,
      offsetX: pointer.x - btn.x,
      offsetY: pointer.y - btn.y
    };
    btn.setDepth(1001);
  };

  proto.doDrag = function(pointer) {
    if (!this.dragState) return;
    var btn = this.touchButtons[this.dragState.action];
    if (!btn) return;
    var newX = pointer.x - this.dragState.offsetX;
    var newY = pointer.y - this.dragState.offsetY;
    newX = Math.max(40, Math.min(this.scene.scale.width - 40, newX));
    newY = Math.max(40, Math.min(this.scene.scale.height - 40, newY));
    btn.x = newX;
    btn.y = newY;
    this.layoutManager.updateButtonPosition(this.dragState.action, newX, newY);
  };

  proto.stopDrag = function() {
    if (!this.dragState) return;
    var btn = this.touchButtons[this.dragState.action];
    if (btn) {
      btn.setDepth(1000);
    }
    this.dragState = null;
  };

  proto.setEditMode = function(enabled) {
    this.editMode = enabled;
    var actions = this.layoutManager.getAllButtonActions();
    for (var i = 0; i < actions.length; i++) {
      var btn = this.touchButtons[actions[i]];
      if (!btn) continue;
      if (typeof btn.setEditVisuals === 'function') {
        btn.setEditVisuals(enabled);
      } else {
        if (enabled) {
          btn.setAlpha(1.0);
        } else {
          var config = this.layoutManager.getButtonConfig(actions[i]);
          btn.setAlpha(config ? config.opacity : 0.5);
        }
      }
    }
  };

  proto.applyButtonScale = function(action, scale) {
    this.layoutManager.updateButtonScale(action, scale);
    var btn = this.touchButtons[action];
    if (!btn) return;
    var newSize = this.layoutManager.getEffectiveButtonSize(action);
    var config = this.layoutManager.getButtonConfig(action);
    btn.redraw(newSize, config ? config.opacity : 0.5);
  };

  proto.applyAllButtonScale = function(scale) {
    this.layoutManager.updateAllScales(scale);
    var actions = this.layoutManager.getAllButtonActions();
    for (var i = 0; i < actions.length; i++) {
      var btn = this.touchButtons[actions[i]];
      if (!btn) continue;
      var newSize = this.layoutManager.getEffectiveButtonSize(actions[i]);
      var config = this.layoutManager.getButtonConfig(actions[i]);
      btn.redraw(newSize, config ? config.opacity : 0.5);
    }
  };

  proto.applyButtonOpacity = function(action, opacity) {
    this.layoutManager.updateButtonOpacity(action, opacity);
    var btn = this.touchButtons[action];
    if (!btn) return;
    btn.setAlpha(opacity);
  };

  proto.applyAllButtonOpacity = function(opacity) {
    this.layoutManager.updateAllOpacity(opacity);
    var actions = this.layoutManager.getAllButtonActions();
    for (var i = 0; i < actions.length; i++) {
      var btn = this.touchButtons[actions[i]];
      if (btn) btn.setAlpha(opacity);
    }
  };

  proto.applyPreset = function(name) {
    this.layoutManager.switchPreset(name);
    this.rebuildTouchControls();
  };

  proto.rebuildTouchControls = function() {
    this.destroyTouchButtons();
    this.setupTouchControls();
  };

  proto.destroyTouchButtons = function() {
    for (var key in this.touchButtons) {
      if (this.touchButtons[key]) {
        this.touchButtons[key].destroy();
      }
    }
    this.touchButtons = {};
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
    this.destroyTouchButtons();
  };

  window.MountainRacer = MountainRacer;
})();
