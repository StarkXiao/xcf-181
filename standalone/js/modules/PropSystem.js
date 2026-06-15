(function() {
  var MountainRacer = window.MountainRacer || {};

  MountainRacer.PropSystem = function(scene, terrain, config) {
    this.scene = scene;
    this.terrain = terrain;
    this.config = config;
    this.propItems = [];
    this.branchProps = {};
    this.currentBranch = 'main';

    this.inventory = [];
    this.maxInventorySlots = 5;

    this.activeEffects = [];
    this.cooldowns = {};

    this.stats = {
      totalPickedUp: 0,
      totalUsed: 0,
      totalExpired: 0,
      byType: {},
      scoreFromProps: 0,
      damageBlocked: 0,
      healthRestored: 0,
      pickUpHistory: [],
      useHistory: []
    };

    this.propScoreMultiplier = 1.0;

    this.spawn();
  };

  var proto = MountainRacer.PropSystem.prototype;

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
      this.branchProps[branchId] = this.generateForBranch(branchId);
    }
    this.regenerateForBranch('main');
  };

  proto.generateForBranch = function(branchId) {
    var branchCfg = this.getBranchConfig(branchId);
    var length = this.config.length;
    var spawnCfg = MountainRacer.PropConfig.getSpawnConfig();
    var items = [];
    var lastX = 800;

    var density = spawnCfg.baseDensity;
    if (branchCfg.type && spawnCfg.branchBonusDensity[branchCfg.type]) {
      density += spawnCfg.branchBonusDensity[branchCfg.type];
    }

    if (branchCfg.rewardZones) {
      for (var z = 0; z < branchCfg.rewardZones.length; z++) {
        var zone = branchCfg.rewardZones[z];
        if (zone.type === 'prop' || zone.density > 0.005) {
          var zoneLen = zone.endX - zone.startX;
          var zoneCount = Math.floor(zoneLen * density * spawnCfg.zoneMultiplier);
          for (var c = 0; c < zoneCount; c++) {
            var zx = zone.startX + (c / zoneCount) * zoneLen + Math.random() * 60;
            items.push(this.createPropData(zx, branchId));
          }
        }
      }
    }

    var ambientCount = Math.floor(length * density);
    for (var a = 0; a < ambientCount; a++) {
      lastX += spawnCfg.minSpacing + Math.random() * (spawnCfg.maxSpacing - spawnCfg.minSpacing);
      if (lastX > length - 400) break;
      items.push(this.createPropData(lastX, branchId));
    }

    return items;
  };

  proto.createPropData = function(x, branchId) {
    var propId = MountainRacer.PropConfig.getRandomPropId();
    var def = MountainRacer.PropConfig.getPropDef(propId);
    return {
      propId: propId,
      x: x,
      branch: branchId,
      rarity: def.rarity,
      collected: false,
      instanceId: 'prop_' + Date.now() + '_' + Math.floor(Math.random() * 100000)
    };
  };

  proto.regenerateForBranch = function(branchId) {
    this.currentBranch = branchId;
    this.clearRendered();
    var data = this.branchProps[branchId] || [];
    this.propItems = [];
    for (var i = 0; i < data.length; i++) {
      if (!data[i].collected) {
        var container = this.createFromData(data[i]);
        if (container) {
          container.setData('dataIndex', i);
          this.propItems.push(container);
        }
      }
    }
  };

  proto.clearRendered = function() {
    for (var i = 0; i < this.propItems.length; i++) {
      var p = this.propItems[i];
      var hitbox = p.getData('hitbox');
      if (hitbox) hitbox.destroy();
      p.destroy();
    }
    this.propItems = [];
  };

  proto.createFromData = function(data) {
    var def = MountainRacer.PropConfig.getPropDef(data.propId);
    if (!def) return null;

    var terrainY = this.terrain.getHeightAtBranch(data.x, data.branch) || 450;
    var floatY = terrainY - 55 - Math.random() * 30;

    var container = this.scene.add.container(data.x, floatY);
    container.setDepth(12);
    container.setData('propId', data.propId);
    container.setData('rarity', data.rarity);
    container.setData('instanceId', data.instanceId);
    container.setData('collected', false);

    var rarityColor = MountainRacer.PropConfig.getRarityColor(def.rarity);
    var glow = this.scene.add.graphics();
    glow.fillStyle(rarityColor.hex, 0.25);
    glow.fillCircle(0, 0, 22);
    container.add(glow);

    var bg = this.scene.add.graphics();
    bg.fillStyle(def.color, 0.9);
    bg.fillRoundedRect(-16, -16, 32, 32, 8);
    bg.lineStyle(2, rarityColor.hex, 1);
    bg.strokeRoundedRect(-16, -16, 32, 32, 8);
    container.add(bg);

    var icon = this.scene.add.text(0, 0, def.icon, {
      fontSize: '18px'
    }).setOrigin(0.5);
    container.add(icon);

    container.setSize(36, 36);

    var hitbox = this.scene.add.zone(data.x, floatY, 34, 34);
    this.scene.physics.world.enable(hitbox);
    hitbox.body.setAllowGravity(false);
    hitbox.body.setImmovable(true);
    container.setData('hitbox', hitbox);

    this.scene.tweens.add({
      targets: container,
      y: floatY - 6,
      duration: 700 + Math.random() * 400,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });

    this.scene.tweens.add({
      targets: glow,
      alpha: { from: 0.25, to: 0.6 },
      duration: 600 + Math.random() * 300,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });

    return container;
  };

  proto.checkCollisions = function(carBounds, carPhysics) {
    var magnetActive = this.isEffectActive('magnet');
    var magnetRadius = magnetActive ? (this.getEffectValue('magnet', 'attractRadius') || 200) : 0;
    var results = [];

    for (var i = this.propItems.length - 1; i >= 0; i--) {
      var p = this.propItems[i];
      if (p.getData('collected')) continue;
      var hitbox = p.getData('hitbox');
      if (!hitbox) continue;

      var hb = hitbox.getBounds();

      if (magnetActive) {
        var dx = carBounds.centerX - hb.centerX;
        var dy = carBounds.centerY - hb.centerY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < magnetRadius && dist > 5) {
          var speed = 4;
          p.x += (dx / dist) * speed;
          p.y += (dy / dist) * speed;
          hitbox.x = p.x;
          hitbox.y = p.y;
        }
      }

      if (Phaser.Geom.Rectangle.Overlaps(carBounds, hb)) {
        var propId = p.getData('propId');
        var rarity = p.getData('rarity');
        var instanceId = p.getData('instanceId');

        p.setData('collected', true);
        var idx = p.getData('dataIndex');
        if (idx !== undefined && this.branchProps[this.currentBranch]) {
          this.branchProps[this.currentBranch][idx].collected = true;
        }

        var pickedUp = this.addToInventory(propId);
        if (pickedUp) {
          this.createPickupEffect(p, propId);
          this.recordPickup(propId, p.x);
          results.push({ propId: propId, rarity: rarity, instanceId: instanceId, autoUsed: false });
        } else {
          var def = MountainRacer.PropConfig.getPropDef(propId);
          if (def && def.duration === 0) {
            this.useProp(propId);
            this.createPickupEffect(p, propId);
            this.recordPickup(propId, p.x);
            results.push({ propId: propId, rarity: rarity, instanceId: instanceId, autoUsed: true });
          } else {
            this.createPickupEffect(p, propId);
            this.recordPickup(propId, p.x);
            results.push({ propId: propId, rarity: rarity, instanceId: instanceId, autoUsed: false });
          }
        }

        hitbox.destroy();
        p.destroy();
        this.propItems.splice(i, 1);
      }
    }

    return results.length > 0 ? results : null;
  };

  proto.addToInventory = function(propId) {
    var def = MountainRacer.PropConfig.getPropDef(propId);
    if (!def) return false;

    for (var i = 0; i < this.inventory.length; i++) {
      if (this.inventory[i].propId === propId && def.stackable && this.inventory[i].count < def.maxStack) {
        this.inventory[i].count++;
        return true;
      }
    }

    if (this.inventory.length >= this.maxInventorySlots) {
      return false;
    }

    this.inventory.push({
      propId: propId,
      count: 1,
      acquiredAt: Date.now()
    });

    return true;
  };

  proto.removeFromInventory = function(propId, count) {
    var removeCount = count || 1;
    for (var i = 0; i < this.inventory.length; i++) {
      if (this.inventory[i].propId === propId) {
        this.inventory[i].count -= removeCount;
        if (this.inventory[i].count <= 0) {
          this.inventory.splice(i, 1);
        }
        return true;
      }
    }
    return false;
  };

  proto.useProp = function(propId) {
    var def = MountainRacer.PropConfig.getPropDef(propId);
    if (!def) return { success: false, reason: 'invalid_prop' };

    if (this.cooldowns[propId] && Date.now() < this.cooldowns[propId]) {
      return { success: false, reason: 'cooldown', remaining: this.cooldowns[propId] - Date.now() };
    }

    var found = false;
    for (var i = 0; i < this.inventory.length; i++) {
      if (this.inventory[i].propId === propId && this.inventory[i].count > 0) {
        found = true;
        break;
      }
    }
    if (!found) return { success: false, reason: 'not_in_inventory' };

    this.removeFromInventory(propId);

    if (def.cooldown > 0) {
      this.cooldowns[propId] = Date.now() + def.cooldown;
    }

    var effectResult = this.applyEffect(propId, def);

    this.stats.totalUsed++;
    if (!this.stats.byType[propId]) this.stats.byType[propId] = { pickedUp: 0, used: 0, expired: 0 };
    this.stats.byType[propId].used++;
    this.stats.useHistory.push({
      propId: propId,
      timestamp: Date.now(),
      effect: def.effect.type
    });

    return { success: true, propId: propId, effect: effectResult };
  };

  proto.useInventorySlot = function(slotIndex) {
    if (slotIndex < 0 || slotIndex >= this.inventory.length) {
      return { success: false, reason: 'invalid_slot' };
    }
    var item = this.inventory[slotIndex];
    return this.useProp(item.propId);
  };

  proto.applyEffect = function(propId, def) {
    var effect = def.effect;
    var activeEffect = {
      propId: propId,
      type: effect.type,
      startTime: Date.now(),
      duration: def.duration,
      endTime: def.duration > 0 ? Date.now() + def.duration : 0,
      config: effect,
      blocksRemaining: effect.blockCount || 0,
      tickAccumulator: 0
    };

    if (effect.type === 'heal') {
      var healAmount = Math.floor(this.scene.scoreManager.maxHealth * (effect.healPercent / 100));
      this.scene.scoreManager.health = Math.min(
        this.scene.scoreManager.maxHealth,
        this.scene.scoreManager.health + healAmount
      );
      this.stats.healthRestored += healAmount;
      return { type: 'heal', amount: healAmount };
    }

    if (effect.type === 'speed') {
      if (this.scene.carPhysics) {
        this.scene.carPhysics.applySpeedBoost(effect.speedMultiplier, def.duration);
      }
    }

    if (effect.type === 'scoreMultiply') {
      this.propScoreMultiplier = effect.scoreMultiplier;
    }

    this.activeEffects.push(activeEffect);

    return { type: effect.type, duration: def.duration };
  };

  proto.isEffectActive = function(effectType) {
    for (var i = 0; i < this.activeEffects.length; i++) {
      if (this.activeEffects[i].type === effectType) return true;
    }
    return false;
  };

  proto.getEffectValue = function(effectType, key) {
    for (var i = 0; i < this.activeEffects.length; i++) {
      if (this.activeEffects[i].type === effectType && this.activeEffects[i].config[key] !== undefined) {
        return this.activeEffects[i].config[key];
      }
    }
    return null;
  };

  proto.processDamage = function(incomingDamage) {
    var remainingDamage = incomingDamage;

    for (var i = this.activeEffects.length - 1; i >= 0; i--) {
      var ae = this.activeEffects[i];
      if (ae.type === 'shield' && ae.blocksRemaining > 0) {
        ae.blocksRemaining--;
        this.stats.damageBlocked += remainingDamage;
        remainingDamage = 0;

        if (ae.blocksRemaining <= 0) {
          this.expireEffect(i);
        }
        break;
      }
    }

    return remainingDamage;
  };

  proto.update = function(delta, carPhysics) {
    var dt = delta / 1000;

    for (var i = this.activeEffects.length - 1; i >= 0; i--) {
      var ae = this.activeEffects[i];

      if (ae.duration > 0 && Date.now() >= ae.endTime) {
        this.expireEffect(i);
        continue;
      }

      if (ae.type === 'magnet') {
        ae.tickAccumulator += dt;
      }
    }

    this.propScoreMultiplier = 1.0;
    for (var j = 0; j < this.activeEffects.length; j++) {
      var eff = this.activeEffects[j];
      if (eff.type === 'scoreMultiply' && eff.config.scoreMultiplier) {
        this.propScoreMultiplier *= eff.config.scoreMultiplier;
      }
    }
  };

  proto.expireEffect = function(index) {
    var ae = this.activeEffects[index];

    if (ae.type === 'speed' && this.scene.carPhysics) {
      this.scene.carPhysics.clearSpeedBoost();
    }

    this.stats.totalExpired++;
    var propId = ae.propId;
    if (!this.stats.byType[propId]) this.stats.byType[propId] = { pickedUp: 0, used: 0, expired: 0 };
    this.stats.byType[propId].expired++;

    this.activeEffects.splice(index, 1);
  };

  proto.getScoreMultiplier = function() {
    return this.propScoreMultiplier;
  };

  proto.recordPickup = function(propId, position) {
    this.stats.totalPickedUp++;
    if (!this.stats.byType[propId]) this.stats.byType[propId] = { pickedUp: 0, used: 0, expired: 0 };
    this.stats.byType[propId].pickedUp++;
    this.stats.pickUpHistory.push({
      propId: propId,
      position: position,
      timestamp: Date.now()
    });
  };

  proto.getInventoryDisplay = function() {
    var display = [];
    for (var i = 0; i < this.inventory.length; i++) {
      var item = this.inventory[i];
      var def = MountainRacer.PropConfig.getPropDef(item.propId);
      if (def) {
        var cdRemaining = 0;
        if (this.cooldowns[item.propId] && Date.now() < this.cooldowns[item.propId]) {
          cdRemaining = this.cooldowns[item.propId] - Date.now();
        }
        display.push({
          slotIndex: i,
          propId: item.propId,
          name: def.name,
          icon: def.icon,
          count: item.count,
          cooldownRemaining: cdRemaining,
          canUse: cdRemaining <= 0
        });
      }
    }
    return display;
  };

  proto.getActiveEffectsDisplay = function() {
    var display = [];
    for (var i = 0; i < this.activeEffects.length; i++) {
      var ae = this.activeEffects[i];
      var def = MountainRacer.PropConfig.getPropDef(ae.propId);
      if (def) {
        var remaining = ae.duration > 0 ? Math.max(0, ae.endTime - Date.now()) : 0;
        display.push({
          propId: ae.propId,
          name: def.name,
          icon: def.icon,
          type: ae.type,
          remainingMs: remaining,
          totalDuration: ae.duration,
          progress: ae.duration > 0 ? 1 - (remaining / ae.duration) : 1,
          blocksRemaining: ae.blocksRemaining || 0
        });
      }
    }
    return display;
  };

  proto.getSettlementStats = function() {
    var byTypeDetailed = [];
    var typeKeys = Object.keys(this.stats.byType);
    for (var i = 0; i < typeKeys.length; i++) {
      var key = typeKeys[i];
      var def = MountainRacer.PropConfig.getPropDef(key);
      byTypeDetailed.push({
        propId: key,
        name: def ? def.name : key,
        icon: def ? def.icon : '❓',
        rarity: def ? def.rarity : 'common',
        color: def ? def.colorStr : '#999999',
        pickedUp: this.stats.byType[key].pickedUp,
        used: this.stats.byType[key].used,
        expired: this.stats.byType[key].expired
      });
    }

    return {
      totalPickedUp: this.stats.totalPickedUp,
      totalUsed: this.stats.totalUsed,
      totalExpired: this.stats.totalExpired,
      scoreFromProps: this.stats.scoreFromProps,
      damageBlocked: this.stats.damageBlocked,
      healthRestored: this.stats.healthRestored,
      byType: byTypeDetailed,
      unusedInventory: this.inventory.length,
      pickUpHistory: this.stats.pickUpHistory.slice(-20),
      useHistory: this.stats.useHistory.slice(-20)
    };
  };

  proto.createPickupEffect = function(propContainer, propId) {
    var x = propContainer.x;
    var y = propContainer.y;
    var def = MountainRacer.PropConfig.getPropDef(propId);
    var color = def ? def.color : 0xffffff;
    var icon = def ? def.icon : '🎁';

    for (var i = 0; i < 8; i++) {
      var particle = this.scene.add.circle(
        x + Phaser.Math.Between(-8, 8),
        y + Phaser.Math.Between(-8, 8),
        2 + Math.random() * 2,
        color
      );
      particle.setDepth(18);
      var vx = Phaser.Math.Between(-80, 80);
      var vy = Phaser.Math.Between(-120, -30);
      this.scene.tweens.add({
        targets: particle,
        x: particle.x + vx,
        y: particle.y + vy,
        alpha: 0,
        scale: 0.2,
        duration: 400 + Math.random() * 200,
        ease: 'Power2',
        onComplete: (function(p) { return function() { p.destroy(); }; })(particle)
      });
    }

    var floatT = this.scene.add.text(x, y - 15, icon, {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(1000);
    this.scene.tweens.add({
      targets: floatT,
      y: y - 45,
      alpha: 0,
      duration: 600,
      ease: 'Power2',
      onComplete: function() { floatT.destroy(); }
    });
  };

  proto.destroy = function() {
    this.clearRendered();
    this.branchProps = {};
    this.inventory = [];
    this.activeEffects = [];
    this.cooldowns = {};
  };

  window.MountainRacer = MountainRacer;
})();
