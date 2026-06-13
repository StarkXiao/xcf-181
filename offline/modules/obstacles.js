(function() {
  var MountainRacer = window.MountainRacer || {};

  MountainRacer.Obstacles = function(scene, terrain, config) {
    this.scene = scene;
    this.terrain = terrain;
    this.config = config;
    this.obstacles = [];
    this.currentBranch = 'main';
    this.branchObstacles = {};
    this.spawn();
  };

  var proto = MountainRacer.Obstacles.prototype;

  proto.getBranchConfig = function(branchId) {
    var branches = this.config.branches || [];
    for (var i = 0; i < branches.length; i++) {
      if (branches[i].id === branchId) return branches[i];
    }
    return { obstacleMultiplier: 1.0 };
  };

  proto.spawn = function() {
    var branches = this.config.branches || [{ id: 'main', obstacleMultiplier: 1.0 }];

    for (var b = 0; b < branches.length; b++) {
      var branchId = branches[b].id;
      this.branchObstacles[branchId] = this.generateForBranch(branchId);
    }

    this.obstacles = this.branchObstacles['main'] || [];
  };

  proto.generateForBranch = function(branchId) {
    var branchCfg = this.getBranchConfig(branchId);
    var length = this.config.length;
    var obstacleDensity = this.config.obstacleDensity * (branchCfg.obstacleMultiplier || 1.0);
    var totalCount = Math.floor(length * obstacleDensity);
    var lastX = 400;
    var obstacles = [];

    for (var i = 0; i < totalCount; i++) {
      var gap = 150 + Math.random() * 200;
      lastX += gap;
      if (lastX > length - 500) break;

      var roll = Math.random();

      if (roll < 0.45) {
        obstacles.push(this.createRockData(lastX, branchId));
      } else if (roll < 0.75) {
        obstacles.push(this.createMudData(lastX, branchId));
      } else {
        obstacles.push(this.createRampData(lastX, branchId));
      }
    }

    return obstacles;
  };

  proto.createRockData = function(x, branchId) {
    return {
      type: 'rock',
      x: x,
      branch: branchId,
      size: 18 + Math.random() * 18,
      damage: 20,
      slowdown: 0.5,
      hit: false
    };
  };

  proto.createMudData = function(x, branchId) {
    return {
      type: 'mud',
      x: x,
      branch: branchId,
      width: 80 + Math.random() * 60,
      height: 8,
      damage: 0,
      slowdown: 0.4,
      hit: false
    };
  };

  proto.createRampData = function(x, branchId) {
    return {
      type: 'ramp',
      x: x,
      branch: branchId,
      width: 100,
      rampHeight: 50,
      damage: 0,
      slowdown: 1,
      boost: true,
      hit: false
    };
  };

  proto.regenerateForBranch = function(branchId) {
    this.currentBranch = branchId;
    this.clearRenderedObstacles();

    var data = this.branchObstacles[branchId] || [];
    this.obstacles = [];

    for (var i = 0; i < data.length; i++) {
      var obsData = data[i];
      var container = null;

      if (obsData.type === 'rock') {
        container = this.createRockFromData(obsData);
      } else if (obsData.type === 'mud') {
        container = this.createMudFromData(obsData);
      } else if (obsData.type === 'ramp') {
        container = this.createRampFromData(obsData);
      }

      if (container) {
        container.setData('dataIndex', i);
        this.obstacles.push(container);
      }
    }
  };

  proto.clearRenderedObstacles = function() {
    for (var i = 0; i < this.obstacles.length; i++) {
      var obs = this.obstacles[i];
      var hitbox = obs.getData('hitbox');
      if (hitbox) hitbox.destroy();
      obs.destroy();
    }
    this.obstacles = [];
  };

  proto.createRock = function(x) {
    var data = this.createRockData(x, this.currentBranch);
    var container = this.createRockFromData(data);
    if (container) {
      this.obstacles.push(container);
    }
    return container;
  };

  proto.createRockFromData = function(data) {
    var terrainY = this.terrain.getHeightAtBranch(data.x, data.branch) || 450;
    var size = data.size;

    var container = this.scene.add.container(data.x, terrainY - size * 0.6);
    container.setDepth(12);
    container.setData('type', 'rock');
    container.setData('damage', data.damage);
    container.setData('slowdown', data.slowdown);
    container.setData('hit', data.hit);

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

    var hitbox = this.scene.add.zone(data.x, terrainY - size * 0.6, size * 1.6, size * 1.2);
    this.scene.physics.world.enable(hitbox);
    hitbox.body.setAllowGravity(false);
    hitbox.body.setImmovable(true);
    container.setData('hitbox', hitbox);

    return container;
  };

  proto.createMud = function(x) {
    var data = this.createMudData(x, this.currentBranch);
    var container = this.createMudFromData(data);
    if (container) {
      this.obstacles.push(container);
    }
    return container;
  };

  proto.createMudFromData = function(data) {
    var terrainY = this.terrain.getHeightAtBranch(data.x, data.branch) || 450;
    var width = data.width;
    var height = data.height;

    var container = this.scene.add.container(data.x, terrainY - 2);
    container.setDepth(7);
    container.setData('type', 'mud');
    container.setData('damage', 0);
    container.setData('slowdown', data.slowdown);
    container.setData('hit', false);

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

    var hitbox = this.scene.add.zone(data.x, terrainY - 2, width * 0.85, height * 1.5);
    this.scene.physics.world.enable(hitbox);
    hitbox.body.setAllowGravity(false);
    hitbox.body.setImmovable(true);
    container.setData('hitbox', hitbox);

    return container;
  };

  proto.createRamp = function(x) {
    var data = this.createRampData(x, this.currentBranch);
    var container = this.createRampFromData(data);
    if (container) {
      this.obstacles.push(container);
    }
    return container;
  };

  proto.createRampFromData = function(data) {
    var terrainY = this.terrain.getHeightAtBranch(data.x, data.branch) || 450;
    var width = data.width;
    var rampHeight = data.rampHeight;
    var terrainAngle = this.terrain.getAngle ? this.terrain.getAngle(data.x) : 0;

    var container = this.scene.add.container(data.x, terrainY);
    container.setDepth(10);
    container.setData('type', 'ramp');
    container.setData('damage', 0);
    container.setData('slowdown', 1);
    container.setData('boost', true);
    container.setData('hit', false);

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

    var hitbox = this.scene.add.zone(data.x, terrainY - rampHeight / 2, width * 0.9, rampHeight);
    this.scene.physics.world.enable(hitbox);
    hitbox.body.setAllowGravity(false);
    hitbox.body.setImmovable(true);
    container.setData('hitbox', hitbox);

    return container;
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
          var idx = obs.getData('dataIndex');
          if (idx !== undefined && this.branchObstacles[this.currentBranch]) {
            this.branchObstacles[this.currentBranch][idx].hit = true;
          }
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
    this.clearRenderedObstacles();
    this.branchObstacles = {};
  };

  window.MountainRacer = MountainRacer;
})();
