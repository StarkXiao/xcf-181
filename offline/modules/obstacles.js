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

    this.regenerateForBranch('main');
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

      if (roll < 0.30) {
        obstacles.push(this.createRockData(lastX, branchId));
      } else if (roll < 0.50) {
        obstacles.push(this.createMudData(lastX, branchId));
      } else if (roll < 0.65) {
        obstacles.push(this.createRampData(lastX, branchId));
      } else if (roll < 0.80) {
        obstacles.push(this.createCrateData(lastX, branchId));
      } else if (roll < 0.92) {
        obstacles.push(this.createBarrelData(lastX, branchId));
      } else {
        obstacles.push(this.createSignData(lastX, branchId));
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

  proto.createCrateData = function(x, branchId) {
    return {
      type: 'crate',
      x: x,
      branch: branchId,
      width: 40,
      height: 40,
      hp: 1,
      damage: 10,
      slowdown: 0.7,
      scoreReward: 80,
      hit: false,
      destroyed: false
    };
  };

  proto.createBarrelData = function(x, branchId) {
    return {
      type: 'barrel',
      x: x,
      branch: branchId,
      width: 34,
      height: 48,
      hp: 1,
      damage: 25,
      slowdown: 0.5,
      scoreReward: 120,
      explosionRadius: 80,
      hit: false,
      destroyed: false
    };
  };

  proto.createSignData = function(x, branchId) {
    return {
      type: 'sign',
      x: x,
      branch: branchId,
      width: 30,
      height: 60,
      hp: 1,
      damage: 5,
      slowdown: 0.85,
      scoreReward: 50,
      hit: false,
      destroyed: false
    };
  };

  proto.regenerateForBranch = function(branchId) {
    this.currentBranch = branchId;
    this.clearRenderedObstacles();

    var data = this.branchObstacles[branchId] || [];
    this.obstacles = [];

    for (var i = 0; i < data.length; i++) {
      var obsData = data[i];
      if (obsData.destroyed) continue;
      var container = null;

      if (obsData.type === 'rock') {
        container = this.createRockFromData(obsData);
      } else if (obsData.type === 'mud') {
        container = this.createMudFromData(obsData);
      } else if (obsData.type === 'ramp') {
        container = this.createRampFromData(obsData);
      } else if (obsData.type === 'crate') {
        container = this.createCrateFromData(obsData);
      } else if (obsData.type === 'barrel') {
        container = this.createBarrelFromData(obsData);
      } else if (obsData.type === 'sign') {
        container = this.createSignFromData(obsData);
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

  proto.createCrate = function(x) {
    var data = this.createCrateData(x, this.currentBranch);
    var container = this.createCrateFromData(data);
    if (container) {
      this.obstacles.push(container);
    }
    return container;
  };

  proto.createCrateFromData = function(data) {
    var terrainY = this.terrain.getHeightAtBranch(data.x, data.branch) || 450;
    var w = data.width;
    var h = data.height;

    var container = this.scene.add.container(data.x, terrainY - h / 2);
    container.setDepth(12);
    container.setData('type', 'crate');
    container.setData('hp', data.hp);
    container.setData('damage', data.damage);
    container.setData('slowdown', data.slowdown);
    container.setData('scoreReward', data.scoreReward);
    container.setData('hit', data.hit);
    container.setData('destroyed', data.destroyed);
    container.setData('destructible', true);

    var graphics = this.scene.add.graphics();

    graphics.fillStyle(0x8b5a2b, 1);
    graphics.fillRoundedRect(-w / 2, -h / 2, w, h, 3);

    graphics.fillStyle(0xa0522d, 1);
    graphics.fillRect(-w / 2 + 3, -h / 2 + 3, w - 6, 4);
    graphics.fillRect(-w / 2 + 3, h / 2 - 7, w - 6, 4);
    graphics.fillRect(-w / 2 + 3, -3, w - 6, 4);

    graphics.lineStyle(2, 0x5c3317, 1);
    graphics.strokeRoundedRect(-w / 2, -h / 2, w, h, 3);

    graphics.lineStyle(1.5, 0x6b4423, 1);
    graphics.beginPath();
    graphics.moveTo(-w / 2, -h / 2);
    graphics.lineTo(w / 2, h / 2);
    graphics.moveTo(w / 2, -h / 2);
    graphics.lineTo(-w / 2, h / 2);
    graphics.strokePath();

    container.add(graphics);
    container.setSize(w, h);

    var hitbox = this.scene.add.zone(data.x, terrainY - h / 2, w * 0.9, h * 0.9);
    this.scene.physics.world.enable(hitbox);
    hitbox.body.setAllowGravity(false);
    hitbox.body.setImmovable(true);
    container.setData('hitbox', hitbox);

    return container;
  };

  proto.createBarrel = function(x) {
    var data = this.createBarrelData(x, this.currentBranch);
    var container = this.createBarrelFromData(data);
    if (container) {
      this.obstacles.push(container);
    }
    return container;
  };

  proto.createBarrelFromData = function(data) {
    var terrainY = this.terrain.getHeightAtBranch(data.x, data.branch) || 450;
    var w = data.width;
    var h = data.height;

    var container = this.scene.add.container(data.x, terrainY - h / 2);
    container.setDepth(12);
    container.setData('type', 'barrel');
    container.setData('hp', data.hp);
    container.setData('damage', data.damage);
    container.setData('slowdown', data.slowdown);
    container.setData('scoreReward', data.scoreReward);
    container.setData('explosionRadius', data.explosionRadius);
    container.setData('hit', data.hit);
    container.setData('destroyed', data.destroyed);
    container.setData('destructible', true);
    container.setData('explosive', true);

    var graphics = this.scene.add.graphics();

    graphics.fillStyle(0xcc2200, 1);
    graphics.fillEllipse(0, 0, w, h);

    graphics.fillStyle(0x991a00, 1);
    graphics.fillEllipse(0, -h / 4, w * 0.9, h / 8);
    graphics.fillEllipse(0, h / 4, w * 0.9, h / 8);

    graphics.lineStyle(3, 0x661100, 1);
    graphics.strokeEllipse(0, 0, w, h);

    graphics.lineStyle(2, 0x888888, 1);
    graphics.strokeEllipse(0, -h / 3, w * 0.85, 4);
    graphics.strokeEllipse(0, h / 3, w * 0.85, 4);

    var warn = this.scene.add.text(0, 0, '!', {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    container.add([graphics, warn]);

    container.setSize(w, h);

    var hitbox = this.scene.add.zone(data.x, terrainY - h / 2, w * 0.85, h * 0.9);
    this.scene.physics.world.enable(hitbox);
    hitbox.body.setAllowGravity(false);
    hitbox.body.setImmovable(true);
    container.setData('hitbox', hitbox);

    return container;
  };

  proto.createSign = function(x) {
    var data = this.createSignData(x, this.currentBranch);
    var container = this.createSignFromData(data);
    if (container) {
      this.obstacles.push(container);
    }
    return container;
  };

  proto.createSignFromData = function(data) {
    var terrainY = this.terrain.getHeightAtBranch(data.x, data.branch) || 450;
    var w = data.width;
    var h = data.height;

    var container = this.scene.add.container(data.x, terrainY - h / 2);
    container.setDepth(12);
    container.setData('type', 'sign');
    container.setData('hp', data.hp);
    container.setData('damage', data.damage);
    container.setData('slowdown', data.slowdown);
    container.setData('scoreReward', data.scoreReward);
    container.setData('hit', data.hit);
    container.setData('destroyed', data.destroyed);
    container.setData('destructible', true);

    var graphics = this.scene.add.graphics();

    graphics.fillStyle(0x5c4033, 1);
    graphics.fillRect(-2, -h / 2 + 18, 4, h / 2 + 2);

    graphics.fillStyle(0xffd700, 1);
    graphics.fillRoundedRect(-w / 2, -h / 2, w, 28, 4);

    graphics.lineStyle(2, 0x8b6914, 1);
    graphics.strokeRoundedRect(-w / 2, -h / 2, w, 28, 4);

    graphics.lineStyle(2, 0x000000, 0.6);
    graphics.beginPath();
    graphics.moveTo(-w / 2 + 5, -h / 2 + 4);
    graphics.lineTo(-w / 2 + 5, -h / 2 + 24);
    graphics.moveTo(w / 2 - 5, -h / 2 + 4);
    graphics.lineTo(w / 2 - 5, -h / 2 + 24);
    graphics.strokePath();

    var arrow = this.scene.add.text(0, -h / 2 + 14, '➡', {
      fontSize: '16px',
      color: '#000000'
    }).setOrigin(0.5);
    container.add([graphics, arrow]);

    container.setSize(w, h);

    var hitbox = this.scene.add.zone(data.x, terrainY - h / 2 + 5, w * 0.8, h * 0.7);
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
        } else if (type === 'crate' || type === 'barrel' || type === 'sign') {
          obs.setData('hit', true);
          obs.setData('destroyed', true);
          var dIdx = obs.getData('dataIndex');
          if (dIdx !== undefined && this.branchObstacles[this.currentBranch]) {
            this.branchObstacles[this.currentBranch][dIdx].hit = true;
            this.branchObstacles[this.currentBranch][dIdx].destroyed = true;
          }

          var scoreReward = obs.getData('scoreReward') || 50;
          var isExplosive = obs.getData('explosive') || false;
          var explosionRadius = obs.getData('explosionRadius') || 0;

          if (isExplosive) {
            this.createExplosionEffect(obs);
          } else {
            this.createDestructionEffect(obs);
          }

          this.removeObstacle(obs, i);

          result = {
            type: type,
            destructible: true,
            damage: damage,
            slowdown: slowdown,
            scoreReward: scoreReward,
            explosive: isExplosive,
            explosionRadius: explosionRadius
          };
        }
      }
    }

    return result;
  };

  proto.removeObstacle = function(obs, index) {
    var hitbox = obs.getData('hitbox');
    if (hitbox) hitbox.destroy();
    obs.destroy();
    if (index !== undefined) {
      this.obstacles.splice(index, 1);
    } else {
      var pos = this.obstacles.indexOf(obs);
      if (pos !== -1) this.obstacles.splice(pos, 1);
    }
  };

  proto.createDestructionEffect = function(obstacle) {
    var x = obstacle.x;
    var y = obstacle.y;
    var type = obstacle.getData('type');
    var particleColor = 0x8b5a2b;
    var particleCount = 15;

    if (type === 'crate') {
      particleColor = 0x8b5a2b;
      particleCount = 18;
    } else if (type === 'sign') {
      particleColor = 0xffd700;
      particleCount = 12;
    }

    for (var i = 0; i < particleCount; i++) {
      var size = 3 + Math.random() * 5;
      var particle = this.scene.add.rectangle(
        x + Phaser.Math.Between(-15, 15),
        y + Phaser.Math.Between(-15, 10),
        size,
        size,
        particleColor
      );
      particle.setDepth(18);
      particle.setAngle(Phaser.Math.Between(0, 360));

      var vx = Phaser.Math.Between(-150, 150);
      var vy = Phaser.Math.Between(-200, -50);
      var rotSpeed = Phaser.Math.Between(-360, 360);

      this.scene.tweens.add({
        targets: particle,
        x: particle.x + vx,
        y: particle.y + vy + 150,
        angle: particle.angle + rotSpeed,
        alpha: 0,
        duration: 500 + Math.random() * 400,
        ease: 'Quad.easeIn',
        onComplete: (function(p) {
          return function() { p.destroy(); };
        })(particle)
      });
    }

    var floatT = this.scene.add.text(x, y - 20,
      '+' + (obstacle.getData('scoreReward') || 50), {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#4caf50',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5).setDepth(1000);
    this.scene.tweens.add({
      targets: floatT,
      y: y - 60,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: function() { floatT.destroy(); }
    });
  };

  proto.createExplosionEffect = function(obstacle) {
    var x = obstacle.x;
    var y = obstacle.y;
    var radius = obstacle.getData('explosionRadius') || 80;

    var flash = this.scene.add.circle(x, y, 10, 0xffff00);
    flash.setDepth(19);
    flash.setAlpha(0.9);
    this.scene.tweens.add({
      targets: flash,
      scale: radius / 10,
      alpha: 0,
      duration: 300,
      ease: 'Quad.easeOut',
      onComplete: function() { flash.destroy(); }
    });

    for (var r = 0; r < 3; r++) {
      var shockwave = this.scene.add.circle(x, y, 10);
      shockwave.setStrokeStyle(3, 0xff6600, 0.8 - r * 0.2);
      shockwave.setDepth(19);
      this.scene.tweens.add({
        targets: shockwave,
        scale: (radius * (0.8 + r * 0.3)) / 10,
        alpha: 0,
        duration: 400 + r * 100,
        ease: 'Quad.easeOut',
        onComplete: (function(s) {
          return function() { s.destroy(); };
        })(shockwave)
      });
    }

    for (var i = 0; i < 25; i++) {
      var isFire = Math.random() < 0.6;
      var pColor = isFire ? (Math.random() < 0.5 ? 0xff4400 : 0xffaa00) : 0x444444;
      var pSize = isFire ? (4 + Math.random() * 6) : (2 + Math.random() * 4);
      var particle = this.scene.add.circle(
        x + Phaser.Math.Between(-10, 10),
        y + Phaser.Math.Between(-10, 10),
        pSize,
        pColor
      );
      particle.setDepth(18);

      var angle = Math.random() * Math.PI * 2;
      var speed = Phaser.Math.Between(80, 250);
      var vx = Math.cos(angle) * speed;
      var vy = Math.sin(angle) * speed - 80;

      this.scene.tweens.add({
        targets: particle,
        x: particle.x + vx,
        y: particle.y + vy + 100,
        alpha: 0,
        scale: isFire ? 0.3 : 1.5,
        duration: 500 + Math.random() * 500,
        ease: 'Quad.easeOut',
        onComplete: (function(p) {
          return function() { p.destroy(); };
        })(particle)
      });
    }

    for (var s = 0; s < 10; s++) {
      var smoke = this.scene.add.circle(
        x + Phaser.Math.Between(-20, 20),
        y + Phaser.Math.Between(-20, 0),
        8 + Math.random() * 10,
        0x666666
      );
      smoke.setDepth(17);
      smoke.setAlpha(0.6);
      this.scene.tweens.add({
        targets: smoke,
        x: smoke.x + Phaser.Math.Between(-40, 40),
        y: smoke.y - 60 - Math.random() * 60,
        scale: 2.5,
        alpha: 0,
        duration: 800 + Math.random() * 500,
        ease: 'Quad.easeOut',
        onComplete: (function(sm) {
          return function() { sm.destroy(); };
        })(smoke)
      });
    }

    var floatT = this.scene.add.text(x, y - 30,
      '💥 +' + (obstacle.getData('scoreReward') || 120), {
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#ff6600',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5).setDepth(1000);
    this.scene.tweens.add({
      targets: floatT,
      y: y - 80,
      alpha: 0,
      duration: 900,
      ease: 'Power2',
      onComplete: function() { floatT.destroy(); }
    });
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
