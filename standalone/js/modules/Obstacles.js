(function() {
  var MountainRacer = window.MountainRacer || {};

  MountainRacer.Obstacles = function(scene, terrain, config) {
    this.scene = scene;
    this.terrain = terrain;
    this.config = config;
    this.obstacles = [];
    this.spawn();
  };

  var proto = MountainRacer.Obstacles.prototype;

  proto.spawn = function() {
    var length = this.config.length;
    var obstacleDensity = this.config.obstacleDensity;
    var totalCount = Math.floor(length * obstacleDensity);
    var lastX = 400;

    for (var i = 0; i < totalCount; i++) {
      var gap = 150 + Math.random() * 200;
      lastX += gap;
      if (lastX > length - 500) break;

      var roll = Math.random();

      if (roll < 0.45) {
        this.createRock(lastX);
      } else if (roll < 0.75) {
        this.createMud(lastX);
      } else {
        this.createRamp(lastX);
      }
    }
  };

  proto.createRock = function(x) {
    var terrainY = this.terrain.getHeight(x);
    var size = 18 + Math.random() * 18;

    var container = this.scene.add.container(x, terrainY - size * 0.6);
    container.setDepth(12);
    container.setData('type', 'rock');
    container.setData('damage', 20);
    container.setData('slowdown', 0.5);

    var graphics = this.scene.add.graphics();
    var shade = 80 + Math.floor(Math.random() * 40);
    var rockColor = Phaser.Display.Color.GetColor(shade, shade - 10, shade - 20);
    var rockDark = Phaser.Display.Color.GetColor(shade - 30, shade - 40, shade - 50);
    var rockLight = Phaser.Display.Color.GetColor(shade + 30, shade + 20, shade + 10);

    graphics.fillStyle(rockColor, 1);
    graphics.beginPath();

    var points = 7;
    for (var i = 0; i < points; i++) {
      var angle = (i / points) * Math.PI * 2;
      var r = size * (0.7 + Math.random() * 0.6);
      var px = Math.cos(angle) * r;
      var py = Math.sin(angle) * r * 0.75;

      if (i === 0) {
        graphics.moveTo(px, py);
      } else {
        graphics.lineTo(px, py);
      }
    }
    graphics.closePath();
    graphics.fillPath();

    graphics.lineStyle(2, rockDark, 1);
    graphics.strokePath();

    graphics.fillStyle(rockLight, 0.6);
    graphics.beginPath();
    graphics.arc(-size * 0.2, -size * 0.2, size * 0.25, 0, Math.PI * 2);
    graphics.fillPath();

    container.add(graphics);
    container.setSize(size * 1.8, size * 1.5);

    var hitbox = this.scene.add.zone(x, terrainY - size * 0.6, size * 1.6, size * 1.2);
    this.scene.physics.world.enable(hitbox);
    hitbox.body.setAllowGravity(false);
    hitbox.body.setImmovable(true);
    container.setData('hitbox', hitbox);

    this.obstacles.push(container);
  };

  proto.createMud = function(x) {
    var terrainY = this.terrain.getHeight(x);
    var width = 80 + Math.random() * 60;
    var height = 8;

    var container = this.scene.add.container(x, terrainY - 2);
    container.setDepth(7);
    container.setData('type', 'mud');
    container.setData('damage', 0);
    container.setData('slowdown', 0.4);

    var graphics = this.scene.add.graphics();

    graphics.fillStyle(0x4a2c0a, 0.85);
    graphics.fillEllipse(0, 0, width, height);

    graphics.fillStyle(0x3d240a, 0.6);
    for (var i = 0; i < 5; i++) {
      var bx = Phaser.Math.Between(-width / 2 + 8, width / 2 - 8);
      var by = Phaser.Math.Between(-2, 2);
      graphics.fillCircle(bx, by, 2 + Math.random() * 3);
    }

    graphics.lineStyle(1, 0x2a1808, 0.7);
    graphics.strokeEllipse(0, 0, width, height);

    container.add(graphics);
    container.setSize(width, height * 2);

    var hitbox = this.scene.add.zone(x, terrainY - 2, width * 0.85, height * 1.5);
    this.scene.physics.world.enable(hitbox);
    hitbox.body.setAllowGravity(false);
    hitbox.body.setImmovable(true);
    container.setData('hitbox', hitbox);

    this.obstacles.push(container);
  };

  proto.createRamp = function(x) {
    var terrainY = this.terrain.getHeight(x);
    var width = 100;
    var rampHeight = 50;
    var terrainAngle = this.terrain.getAngle(x);

    var container = this.scene.add.container(x, terrainY);
    container.setDepth(10);
    container.setData('type', 'ramp');
    container.setData('damage', 0);
    container.setData('slowdown', 1);
    container.setData('boost', true);

    var graphics = this.scene.add.graphics();

    graphics.fillGradientStyle(0x8b4513, 0x8b4513, 0x654321, 0x654321);
    graphics.beginPath();
    graphics.moveTo(-width / 2, 0);
    graphics.lineTo(width / 2, 0);
    graphics.lineTo(width / 2, -rampHeight);
    graphics.closePath();
    graphics.fillPath();

    graphics.lineStyle(3, 0xffd700, 1);
    graphics.beginPath();
    graphics.moveTo(-width / 2, 0);
    graphics.lineTo(width / 2, -rampHeight);
    graphics.strokePath();

    var stripeCount = 5;
    graphics.lineStyle(2, 0xff0000, 0.8);
    for (var i = 0; i < stripeCount; i++) {
      var t = (i + 0.5) / stripeCount;
      var sx = Phaser.Math.Linear(-width / 2, width / 2, t);
      var sy = Phaser.Math.Linear(0, -rampHeight, t);
      var ex = sx + 10 * Math.sin(terrainAngle);
      var ey = sy - 10 * Math.cos(terrainAngle);
      graphics.beginPath();
      graphics.moveTo(sx, sy);
      graphics.lineTo(ex, ey);
      graphics.strokePath();
    }

    container.add(graphics);
    container.setSize(width, rampHeight + 10);

    var hitbox = this.scene.add.zone(x, terrainY - rampHeight / 2, width * 0.9, rampHeight);
    this.scene.physics.world.enable(hitbox);
    hitbox.body.setAllowGravity(false);
    hitbox.body.setImmovable(true);
    container.setData('hitbox', hitbox);

    this.obstacles.push(container);
  };

  proto.checkCollisions = function(carBounds, carPhysics) {
    var result = null;

    for (var i = 0; i < this.obstacles.length; i++) {
      var obs = this.obstacles[i];
      if (obs.getData('hit')) continue;

      var hitbox = obs.getData('hitbox');
      if (!hitbox) continue;

      var hb = hitbox.getBounds();
      if (Phaser.Geom.Rectangle.Overlaps(carBounds, hb)) {
        var type = obs.getData('type');
        var damage = obs.getData('damage');
        var slowdown = obs.getData('slowdown');

        if (type === 'ramp') {
          result = { type: 'ramp', boost: obs.getData('boost') };
        } else if (type === 'rock') {
          obs.setData('hit', true);
          this.createHitEffect(obs);
          result = { type: 'rock', damage: damage, slowdown: slowdown };
        } else if (type === 'mud') {
          result = { type: 'mud', slowdown: slowdown };
        }
      }
    }

    return result;
  };

  proto.createHitEffect = function(obstacle) {
    this.scene.tweens.add({
      targets: obstacle,
      x: obstacle.x + Phaser.Math.Between(-5, 5),
      y: obstacle.y + Phaser.Math.Between(-5, 5),
      duration: 60,
      yoyo: true,
      repeat: 3,
      onComplete: function() {
        obstacle.setAlpha(0.6);
        this.scene.tweens.add({
          targets: obstacle,
          alpha: 0.2,
          duration: 300
        });
      }.bind(this)
    });

    for (var i = 0; i < 10; i++) {
      var particle = this.scene.add.circle(
        obstacle.x + Phaser.Math.Between(-15, 15),
        obstacle.y + Phaser.Math.Between(-10, 10),
        2 + Math.random() * 3,
        0x888888
      );
      particle.setDepth(18);

      var vx = Phaser.Math.Between(-80, 80);
      var vy = Phaser.Math.Between(-120, -30);

      this.scene.tweens.add({
        targets: particle,
        x: particle.x + vx,
        y: particle.y + vy,
        alpha: 0,
        duration: 400 + Math.random() * 300,
        ease: 'Power2',
        onComplete: (function(p) {
          return function() { p.destroy(); };
        })(particle)
      });
    }
  };

  proto.destroy = function() {
    for (var i = 0; i < this.obstacles.length; i++) {
      var obs = this.obstacles[i];
      var hitbox = obs.getData('hitbox');
      if (hitbox) hitbox.destroy();
      obs.destroy();
    }
    this.obstacles = [];
  };

  window.MountainRacer = MountainRacer;
})();
