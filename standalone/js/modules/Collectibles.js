(function() {
  var MountainRacer = window.MountainRacer || {};

  MountainRacer.Collectibles = function(scene, terrain, config) {
    this.scene = scene;
    this.terrain = terrain;
    this.config = config;
    this.collectibles = [];
    this.currentBranch = 'main';
    this.branchCollectibles = {};
    this.collected = { coin: 0, gem: 0 };
    this.spawn();
  };

  var proto = MountainRacer.Collectibles.prototype;

  proto.getBranchConfig = function(branchId) {
    var branches = this.config.branches || [];
    for (var i = 0; i < branches.length; i++) {
      if (branches[i].id === branchId) return branches[i];
    }
    return { rewardMultiplier: 1.0 };
  };

  proto.spawn = function() {
    var branches = this.config.branches || [{ id: 'main' }];
    for (var b = 0; b < branches.length; b++) {
      var branchId = branches[b].id;
      this.branchCollectibles[branchId] = this.generateForBranch(branchId);
    }
    this.regenerateForBranch('main');
  };

  proto.generateForBranch = function(branchId) {
    var branchCfg = this.getBranchConfig(branchId);
    var length = this.config.length;
    var items = [];
    var lastX = 500;

    if (branchCfg.rewardZones) {
      for (var z = 0; z < branchCfg.rewardZones.length; z++) {
        var zone = branchCfg.rewardZones[z];
        var zoneLength = zone.endX - zone.startX;
        var count = Math.floor(zoneLength * zone.density);
        var type = zone.type === 'gem' ? 'gem' : 'coin';

        for (var c = 0; c < count; c++) {
          var x = zone.startX + (c / count) * zoneLength + Math.random() * 20;
          items.push(this.createCollectibleData(x, type, branchId));
        }
      }
    }

    var ambientDensity = 0.008;
    var ambientCount = Math.floor(length * ambientDensity);
    for (var a = 0; a < ambientCount; a++) {
      lastX += 80 + Math.random() * 180;
      if (lastX > length - 400) break;
      var inZone = false;
      if (branchCfg.rewardZones) {
        for (var zz = 0; zz < branchCfg.rewardZones.length; zz++) {
          if (lastX >= branchCfg.rewardZones[zz].startX && lastX <= branchCfg.rewardZones[zz].endX) {
            inZone = true;
            break;
          }
        }
      }
      if (!inZone) {
        var atype = Math.random() < 0.85 ? 'coin' : 'gem';
        items.push(this.createCollectibleData(lastX, atype, branchId));
      }
    }

    return items;
  };

  proto.createCollectibleData = function(x, type, branchId) {
    return {
      type: type,
      x: x,
      branch: branchId,
      value: type === 'gem' ? 50 : 10,
      collected: false
    };
  };

  proto.regenerateForBranch = function(branchId) {
    this.currentBranch = branchId;
    this.clearRendered();
    var data = this.branchCollectibles[branchId] || [];
    this.collectibles = [];
    for (var i = 0; i < data.length; i++) {
      if (!data[i].collected) {
        var container = this.createFromData(data[i]);
        if (container) {
          container.setData('dataIndex', i);
          this.collectibles.push(container);
        }
      }
    }
  };

  proto.clearRendered = function() {
    for (var i = 0; i < this.collectibles.length; i++) {
      var c = this.collectibles[i];
      var hitbox = c.getData('hitbox');
      if (hitbox) hitbox.destroy();
      c.destroy();
    }
    this.collectibles = [];
  };

  proto.createFromData = function(data) {
    var terrainY = this.terrain.getHeightAtBranch(data.x, data.branch) || 450;
    var floatY = terrainY - 50 - Math.random() * 40;

    var container = this.scene.add.container(data.x, floatY);
    container.setDepth(11);
    container.setData('type', data.type);
    container.setData('value', data.value);
    container.setData('collected', false);

    var gfx = this.scene.add.graphics();
    if (data.type === 'coin') {
      gfx.fillStyle(0xffd700, 1);
      gfx.fillCircle(0, 0, 14);
      gfx.fillStyle(0xffeb3b, 0.8);
      gfx.fillCircle(-3, -3, 8);
      gfx.lineStyle(2, 0xff9800, 1);
      gfx.strokeCircle(0, 0, 14);
      var sign = this.scene.add.text(0, 0, '¥', {
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#8b6914'
      }).setOrigin(0.5);
      container.add([gfx, sign]);
    } else {
      gfx.fillStyle(0xe91e63, 1);
      gfx.beginPath();
      gfx.moveTo(0, -16);
      gfx.lineTo(14, -4);
      gfx.lineTo(8, 14);
      gfx.lineTo(-8, 14);
      gfx.lineTo(-14, -4);
      gfx.closePath();
      gfx.fillPath();
      gfx.fillStyle(0xf48fb1, 0.6);
      gfx.beginPath();
      gfx.moveTo(0, -12);
      gfx.lineTo(8, -2);
      gfx.lineTo(0, 4);
      gfx.lineTo(-8, -2);
      gfx.closePath();
      gfx.fillPath();
      gfx.lineStyle(2, 0x880e4f, 1);
      gfx.beginPath();
      gfx.moveTo(0, -16);
      gfx.lineTo(14, -4);
      gfx.lineTo(8, 14);
      gfx.lineTo(-8, 14);
      gfx.lineTo(-14, -4);
      gfx.closePath();
      gfx.strokePath();
      container.add(gfx);
    }

    container.setSize(30, 30);

    var hitbox = this.scene.add.zone(data.x, floatY, 28, 28);
    this.scene.physics.world.enable(hitbox);
    hitbox.body.setAllowGravity(false);
    hitbox.body.setImmovable(true);
    container.setData('hitbox', hitbox);

    this.scene.tweens.add({
      targets: container,
      y: floatY - 8,
      duration: 600 + Math.random() * 400,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });

    return container;
  };

  proto.checkCollisions = function(carBounds, carPhysics) {
    var result = null;
    for (var i = this.collectibles.length - 1; i >= 0; i--) {
      var c = this.collectibles[i];
      if (c.getData('collected')) continue;
      var hitbox = c.getData('hitbox');
      if (!hitbox) continue;
      var hb = hitbox.getBounds();
      if (Phaser.Geom.Rectangle.Overlaps(carBounds, hb)) {
        var type = c.getData('type');
        var value = c.getData('value');
        c.setData('collected', true);
        var idx = c.getData('dataIndex');
        if (idx !== undefined && this.branchCollectibles[this.currentBranch]) {
          this.branchCollectibles[this.currentBranch][idx].collected = true;
        }
        this.createCollectEffect(c);
        this.collected[type] = (this.collected[type] || 0) + 1;
        hitbox.destroy();
        c.destroy();
        this.collectibles.splice(i, 1);
        result = { type: type, value: value };
      }
    }
    return result;
  };

  proto.createCollectEffect = function(collectible) {
    var x = collectible.x;
    var y = collectible.y;
    var color = collectible.getData('type') === 'gem' ? 0xe91e63 : 0xffd700;
    for (var i = 0; i < 12; i++) {
      var particle = this.scene.add.circle(
        x + Phaser.Math.Between(-10, 10),
        y + Phaser.Math.Between(-10, 10),
        2 + Math.random() * 3,
        color
      );
      particle.setDepth(18);
      var vx = Phaser.Math.Between(-100, 100);
      var vy = Phaser.Math.Between(-150, -40);
      this.scene.tweens.add({
        targets: particle,
        x: particle.x + vx,
        y: particle.y + vy,
        alpha: 0,
        scale: 0.3,
        duration: 500 + Math.random() * 300,
        ease: 'Power2',
        onComplete: (function(p) { return function() { p.destroy(); }; })(particle)
      });
    }
    var floatT = this.scene.add.text(x, y - 10,
      '+' + collectible.getData('value'), {
        fontSize: '16px',
        fontWeight: 'bold',
        color: collectible.getData('type') === 'gem' ? '#e91e63' : '#ffd700',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5).setDepth(1000);
    this.scene.tweens.add({
      targets: floatT,
      y: y - 40,
      alpha: 0,
      duration: 700,
      ease: 'Power2',
      onComplete: function() { floatT.destroy(); }
    });
  };

  proto.getCollected = function() {
    return {
      coin: this.collected.coin || 0,
      gem: this.collected.gem || 0,
      totalValue: (this.collected.coin || 0) * 10 + (this.collected.gem || 0) * 50
    };
  };

  proto.destroy = function() {
    this.clearRendered();
    this.branchCollectibles = {};
  };

  window.MountainRacer = MountainRacer;
})();
