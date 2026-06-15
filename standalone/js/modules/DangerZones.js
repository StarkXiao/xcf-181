(function() {
  var MountainRacer = window.MountainRacer || {};

  MountainRacer.DangerZones = function(scene, terrain, config) {
    this.scene = scene;
    this.terrain = terrain;
    this.config = config;
    this.currentBranch = 'main';
    this.activeEffects = {};
    this.zoneIndicators = [];
    this.nextDamageTime = 0;
    this.renderZones();
  };

  var proto = MountainRacer.DangerZones.prototype;

  proto.getBranchConfig = function(branchId) {
    var branches = this.config.branches || [];
    for (var i = 0; i < branches.length; i++) {
      if (branches[i].id === branchId) return branches[i];
    }
    return null;
  };

  proto.renderZones = function() {
    this.clearIndicators();
    var branches = this.config.branches || [];
    for (var b = 0; b < branches.length; b++) {
      var branch = branches[b];
      if (!branch.dangerZones) continue;
      if (branch.hidden && !this.terrain.hiddenUnlocked[branch.id]) continue;
      for (var z = 0; z < branch.dangerZones.length; z++) {
        this.renderZoneIndicator(branch.dangerZones[z], branch);
      }
    }
  };

  proto.renderZoneIndicator = function(zone, branchCfg) {
    var startX = zone.startX;
    var endX = zone.endX;
    var centerX = (startX + endX) / 2;
    var terrainY = this.terrain.getHeightAtBranch(centerX, branchCfg.id) || 450;

    var gfx = this.scene.add.graphics();
    gfx.setDepth(4);
    gfx.x = centerX;
    gfx.y = terrainY - 2;

    var width = endX - startX;
    var zoneColor = this.getZoneColor(zone.type);
    gfx.fillStyle(zoneColor, 0.35);
    gfx.fillRect(-width / 2, -8, width, 12);

    gfx.lineStyle(2, zoneColor, 0.8);
    gfx.strokeRect(-width / 2, -8, width, 12);

    this.zoneIndicators.push(gfx);

    var icon = this.getZoneIcon(zone.type);
    var iconText = this.scene.add.text(centerX, terrainY - 27, icon, {
      fontSize: '20px'
    }).setOrigin(0.5);
    iconText.setDepth(4);
    this.zoneIndicators.push(iconText);

    var label = this.scene.add.text(centerX, terrainY - 47, this.getZoneLabel(zone.type), {
      fontSize: '11px',
      fontWeight: 'bold',
      color: '#' + zoneColor.toString(16).padStart(6, '0'),
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    label.setDepth(4);
    this.zoneIndicators.push(label);
  };

  proto.getZoneColor = function(type) {
    var colors = {
      'rockfall': 0xf44336,
      'slippery': 0x2196f3,
      'cliff': 0x9c27b0,
      'mud': 0x795548
    };
    return colors[type] || 0xff5722;
  };

  proto.getZoneIcon = function(type) {
    var icons = {
      'rockfall': '🪨',
      'slippery': '💧',
      'cliff': '⚠️',
      'mud': '🟤'
    };
    return icons[type] || '⚠️';
  };

  proto.getZoneLabel = function(type) {
    var labels = {
      'rockfall': '落石区',
      'slippery': '湿滑路面',
      'cliff': '悬崖路段',
      'mud': '泥泞区'
    };
    return labels[type] || '危险区';
  };

  proto.clearIndicators = function() {
    for (var i = 0; i < this.zoneIndicators.length; i++) {
      this.zoneIndicators[i].destroy();
    }
    this.zoneIndicators = [];
  };

  proto.setCurrentBranch = function(branchId) {
    this.currentBranch = branchId;
    this.activeEffects = {};
  };

  proto.unlockBranch = function(branchId) {
    this.renderZones();
  };

  proto.update = function(carX, carPhysics, delta, now, timeScale) {
    var zone = this.terrain.isInDangerZone(carX, this.currentBranch);
    var result = { damage: 0, slowdown: 1, message: null };
    var ts = timeScale !== undefined ? timeScale : 1.0;

    if (!zone) {
      this.activeEffects = {};
      return result;
    }

    switch (zone.type) {
      case 'rockfall':
        if (now >= this.nextDamageTime) {
          result.damage = zone.damage || 15;
          result.message = '💥 落石袭击!';
          var baseInterval = 800 + Math.random() * 1200;
          this.nextDamageTime = now + Math.floor(baseInterval / ts);
          this.createRockfallEffect(carX, this.terrain.getHeight(carX));
        }
        break;

      case 'slippery':
        result.slowdown = zone.slowdown || 0.7;
        if (!this.activeEffects.slippery) {
          result.message = '💧 路面湿滑!';
          this.activeEffects.slippery = true;
        }
        break;

      case 'cliff':
        if (Math.random() < (zone.fallChance || 0.2) * (delta / 1000) * 10) {
          result.damage = zone.damage || 20;
          result.message = '⚠️ 差点坠落!';
          this.nextDamageTime = now + Math.floor(1500 / ts);
        }
        if (!this.activeEffects.cliff) {
          this.activeEffects.cliff = true;
        }
        break;

      case 'mud':
        result.slowdown = zone.slowdown || 0.5;
        if (!this.activeEffects.mud) {
          result.message = '🟤 陷入泥泞!';
          this.activeEffects.mud = true;
        }
        break;
    }

    return result;
  };

  proto.createRockfallEffect = function(x, y) {
    for (var i = 0; i < 6; i++) {
      var rx = x + Phaser.Math.Between(-60, 60);
      var ry = y - 100 - Phaser.Math.Between(0, 80);
      var rock = this.scene.add.circle(rx, ry, 4 + Math.random() * 6, 0x666666);
      rock.setDepth(17);
      var vx = Phaser.Math.Between(-50, 50);
      var vy = Phaser.Math.Between(200, 400);
      this.scene.tweens.add({
        targets: rock,
        x: rock.x + vx,
        y: rock.y + vy,
        rotation: Phaser.Math.Between(-6, 6),
        alpha: 0,
        duration: 600 + Math.random() * 400,
        ease: 'Quad.easeIn',
        onComplete: (function(r) { return function() { r.destroy(); }; })(rock)
      });
    }
    for (var j = 0; j < 8; j++) {
      var dust = this.scene.add.circle(
        x + Phaser.Math.Between(-40, 40),
        y - 5,
        3 + Math.random() * 4,
        0xaaaaaa
      );
      dust.setDepth(16);
      dust.setAlpha(0.7);
      this.scene.tweens.add({
        targets: dust,
        x: dust.x + Phaser.Math.Between(-30, 30),
        y: dust.y - Phaser.Math.Between(10, 30),
        alpha: 0,
        scale: 2,
        duration: 500,
        ease: 'Power2',
        onComplete: (function(d) { return function() { d.destroy(); }; })(dust)
      });
    }
  };

  proto.destroy = function() {
    this.clearIndicators();
  };

  window.MountainRacer = MountainRacer;
})();
