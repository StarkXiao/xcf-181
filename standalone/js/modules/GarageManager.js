(function() {
  var MountainRacer = window.MountainRacer || {};

  MountainRacer.GarageManager = function(dataManager) {
    this._dm = dataManager;
  };

  var proto = MountainRacer.GarageManager.prototype;

  proto.getCoins = function() {
    return this._dm.getData('economy.coins', 0);
  };

  proto.addCoins = function(amount, reason) {
    if (amount <= 0) return false;
    var current = this.getCoins();
    var total = this._dm.getData('economy.totalCoinsEarned', 0);
    this._dm.batchUpdate({
      'economy.coins': current + amount,
      'economy.totalCoinsEarned': total + amount
    });
    this._dm._emit('coinsChanged', {
      action: 'add',
      amount: amount,
      total: current + amount,
      reason: reason || 'unknown'
    });
    return true;
  };

  proto.spendCoins = function(amount, reason) {
    if (amount <= 0) return { success: false, reason: 'invalid_amount' };
    var current = this.getCoins();
    if (current < amount) {
      return { success: false, reason: 'insufficient', needed: amount - current };
    }
    var total = this._dm.getData('economy.totalCoinsSpent', 0);
    this._dm.batchUpdate({
      'economy.coins': current - amount,
      'economy.totalCoinsSpent': total + amount
    });
    this._dm._emit('coinsChanged', {
      action: 'spend',
      amount: amount,
      total: current - amount,
      reason: reason || 'unknown'
    });
    return { success: true, remaining: current - amount };
  };

  proto.getTotalEarned = function() {
    return this._dm.getData('economy.totalCoinsEarned', 0);
  };

  proto.getTotalSpent = function() {
    return this._dm.getData('economy.totalCoinsSpent', 0);
  };

  proto.getUnlockedParts = function() {
    var parts = this._dm.getData('unlocks.parts', []);
    return Array.isArray(parts) ? parts.slice() : [];
  };

  proto.isPartUnlocked = function(partId) {
    var parts = this.getUnlockedParts();
    return parts.indexOf(partId) !== -1;
  };

  proto.canUnlockPart = function(partId) {
    var partInfo = MountainRacer.PartsConfig.getPartById(partId);
    if (!partInfo) return { canUnlock: false, reason: 'invalid_part' };
    var config = partInfo.config;
    if (this.isPartUnlocked(partId)) {
      return { canUnlock: false, reason: 'already_owned' };
    }
    var unlockMgr = this._dm.getUnlockManager();
    if (!unlockMgr.isLevelUnlocked(config.unlockLevel)) {
      return { canUnlock: false, reason: 'level_locked', requiredLevel: config.unlockLevel };
    }
    var coins = this.getCoins();
    if (coins < config.price) {
      return { canUnlock: false, reason: 'insufficient_coins', needed: config.price - coins, price: config.price };
    }
    return { canUnlock: true, price: config.price };
  };

  proto.unlockPart = function(partId) {
    var check = this.canUnlockPart(partId);
    if (!check.canUnlock) return { success: false, ...check };
    var partInfo = MountainRacer.PartsConfig.getPartById(partId);
    var config = partInfo.config;
    var spendResult = this.spendCoins(config.price, 'unlock_part:' + partId);
    if (!spendResult.success) {
      return { success: false, reason: spendResult.reason };
    }
    var parts = this.getUnlockedParts();
    parts.push(partId);
    this._dm.setData('unlocks.parts', parts);
    this._dm._emit('partUnlocked', {
      partId: partId,
      category: partInfo.category,
      config: config,
      remainingCoins: spendResult.remaining
    });
    return { success: true, remainingCoins: spendResult.remaining, config: config };
  };

  proto.getEquippedParts = function() {
    var equipped = this._dm.getData('garage.equippedParts', {});
    return {
      engine: equipped.engine || 'engine_basic',
      tires: equipped.tires || 'tires_basic',
      suspension: equipped.suspension || 'suspension_basic',
      brakes: equipped.brakes || 'brakes_basic',
      body: equipped.body || 'body_basic',
      nitro: equipped.nitro || 'nitro_none'
    };
  };

  proto.getEquippedPart = function(category) {
    var equipped = this.getEquippedParts();
    return equipped[category] || null;
  };

  proto.canEquipPart = function(category, partId) {
    var partConfig = MountainRacer.PartsConfig.getPartConfig(category, partId);
    if (!partConfig) return { canEquip: false, reason: 'invalid_part' };
    if (!this.isPartUnlocked(partId)) {
      return { canEquip: false, reason: 'not_unlocked' };
    }
    var current = this.getEquippedPart(category);
    if (current === partId) {
      return { canEquip: false, reason: 'already_equipped' };
    }
    return { canEquip: true };
  };

  proto.equipPart = function(category, partId) {
    var check = this.canEquipPart(category, partId);
    if (!check.canEquip) return { success: false, ...check };
    var equipped = this.getEquippedParts();
    var oldPart = equipped[category];
    equipped[category] = partId;
    this._dm.setData('garage.equippedParts', equipped);
    var partConfig = MountainRacer.PartsConfig.getPartConfig(category, partId);
    this._dm._emit('partEquipped', {
      category: category,
      partId: partId,
      oldPartId: oldPart,
      config: partConfig
    });
    return { success: true, oldPart: oldPart, config: partConfig };
  };

  proto.getCurrentCarId = function() {
    return this._dm.getData('garage.currentCar', 'car_basic');
  };

  proto.getOwnedCars = function() {
    var cars = this._dm.getData('garage.ownedCars', ['car_basic']);
    return Array.isArray(cars) ? cars.slice() : ['car_basic'];
  };

  proto.isCarOwned = function(carId) {
    var cars = this.getOwnedCars();
    return cars.indexOf(carId) !== -1;
  };

  proto.canBuyCar = function(carId) {
    var carConfig = MountainRacer.PartsConfig.getCarConfig(carId);
    if (!carConfig) return { canBuy: false, reason: 'invalid_car' };
    if (this.isCarOwned(carId)) {
      return { canBuy: false, reason: 'already_owned' };
    }
    var unlockMgr = this._dm.getUnlockManager();
    if (!unlockMgr.isLevelUnlocked(carConfig.unlockLevel)) {
      return { canBuy: false, reason: 'level_locked', requiredLevel: carConfig.unlockLevel };
    }
    var coins = this.getCoins();
    if (coins < carConfig.price) {
      return { canBuy: false, reason: 'insufficient_coins', needed: carConfig.price - coins, price: carConfig.price };
    }
    return { canBuy: true, price: carConfig.price };
  };

  proto.buyCar = function(carId) {
    var check = this.canBuyCar(carId);
    if (!check.canBuy) return { success: false, ...check };
    var carConfig = MountainRacer.PartsConfig.getCarConfig(carId);
    var spendResult = this.spendCoins(carConfig.price, 'buy_car:' + carId);
    if (!spendResult.success) {
      return { success: false, reason: spendResult.reason };
    }
    var cars = this.getOwnedCars();
    cars.push(carId);
    var customizations = this._dm.getData('garage.carCustomizations', {});
    customizations[carId] = { color: carConfig.color, decals: [] };
    this._dm.batchUpdate({
      'garage.ownedCars': cars,
      'garage.carCustomizations': customizations
    });
    this._dm._emit('carPurchased', {
      carId: carId,
      config: carConfig,
      remainingCoins: spendResult.remaining
    });
    return { success: true, remainingCoins: spendResult.remaining, config: carConfig };
  };

  proto.canSelectCar = function(carId) {
    if (!this.isCarOwned(carId)) {
      return { canSelect: false, reason: 'not_owned' };
    }
    if (this.getCurrentCarId() === carId) {
      return { canSelect: false, reason: 'already_selected' };
    }
    return { canSelect: true };
  };

  proto.selectCar = function(carId) {
    var check = this.canSelectCar(carId);
    if (!check.canSelect) return { success: false, ...check };
    var oldCar = this.getCurrentCarId();
    this._dm.setData('garage.currentCar', carId);
    var carConfig = MountainRacer.PartsConfig.getCarConfig(carId);
    this._dm._emit('carSelected', {
      carId: carId,
      oldCarId: oldCar,
      config: carConfig
    });
    return { success: true, oldCar: oldCar, config: carConfig };
  };

  proto.getCarCustomization = function(carId) {
    var id = carId || this.getCurrentCarId();
    var customizations = this._dm.getData('garage.carCustomizations', {});
    return customizations[id] || { color: '#ff4500', decals: [] };
  };

  proto.calculateCarStats = function(carId) {
    var cid = carId || this.getCurrentCarId();
    var carConfig = MountainRacer.PartsConfig.getCarConfig(cid);
    if (!carConfig) return null;
    var equipped = this.getEquippedParts();
    var base = carConfig.baseStats;
    var result = {
      carId: cid,
      acceleration: base.baseAcceleration,
      maxSpeed: base.baseMaxSpeed,
      brakePower: base.baseBrake,
      baseHealth: base.baseHealth,
      weight: base.weight,
      grip: 1.0,
      stability: 50,
      damageReduction: 0,
      rollResist: 0,
      suspensionStiffness: 0.5,
      suspensionDamping: 0.2,
      landingBonus: 0,
      nitroBoost: 0,
      nitroDuration: 0,
      nitroCount: 0,
      totalPower: 0
    };
    var categories = ['engine', 'tires', 'suspension', 'brakes', 'body', 'nitro'];
    for (var i = 0; i < categories.length; i++) {
      var cat = categories[i];
      var partId = equipped[cat];
      var partCfg = MountainRacer.PartsConfig.getPartConfig(cat, partId);
      if (!partCfg) continue;
      var stats = partCfg.stats;
      if (stats.power) result.totalPower += stats.power;
      if (cat === 'engine') {
        if (stats.acceleration) result.acceleration = stats.acceleration;
        if (stats.maxSpeed) result.maxSpeed = stats.maxSpeed;
      } else if (cat === 'tires') {
        if (stats.grip) result.grip = Math.max(1.0, stats.grip);
        if (stats.frictionBonus) result.grip += stats.frictionBonus;
        if (stats.stability) result.stability = Math.max(result.stability, stats.stability);
      } else if (cat === 'suspension') {
        if (stats.stiffness) result.suspensionStiffness = stats.stiffness;
        if (stats.damping) result.suspensionDamping = stats.damping;
        if (stats.stability) result.stability = Math.max(result.stability, stats.stability);
        if (stats.landingBonus) result.landingBonus = stats.landingBonus;
      } else if (cat === 'brakes') {
        if (stats.brakePower) result.brakePower = stats.brakePower;
      } else if (cat === 'body') {
        if (stats.damageReduction) result.damageReduction = stats.damageReduction;
        if (stats.rollResist) result.rollResist = stats.rollResist;
        if (stats.weight) result.weight += stats.weight;
        if (stats.armor) result.baseHealth = base.baseHealth + stats.armor;
      } else if (cat === 'nitro') {
        if (stats.nitroBoost) result.nitroBoost = stats.nitroBoost;
        if (stats.nitroDuration) result.nitroDuration = stats.nitroDuration;
        if (stats.nitroCount) result.nitroCount = stats.nitroCount;
      }
    }
    result.maxSpeed = Math.floor(result.maxSpeed);
    result.acceleration = Math.floor(result.acceleration);
    result.brakePower = Math.floor(result.brakePower);
    result.performanceRating = this.calculatePerformanceRating(result);
    return result;
  };

  proto.calculatePerformanceRating = function(stats) {
    if (!stats) return 0;
    var speedScore = (stats.maxSpeed / 1100) * 300;
    var accelScore = (stats.acceleration / 650) * 250;
    var brakeScore = (stats.brakePower / 900) * 150;
    var gripScore = Math.min((stats.grip - 1) / 0.5, 1) * 150;
    var healthScore = (stats.baseHealth / 170) * 100;
    var nitroScore = (stats.nitroBoost * stats.nitroCount) * 100;
    return Math.floor(speedScore + accelScore + brakeScore + gripScore + healthScore + nitroScore);
  };

  proto.getCurrentPerformanceRating = function() {
    var stats = this.calculateCarStats();
    return stats ? stats.performanceRating : 0;
  };

  proto.getLevelRequirement = function(level) {
    var key = 'level_' + level;
    var reqs = this._dm.getData('garage.levelRequirements', {});
    return reqs[key] || { minPower: 0, coinsRequired: 0 };
  };

  proto.checkLevelEntry = function(level) {
    var unlockMgr = this._dm.getUnlockManager();
    if (!unlockMgr.isLevelUnlocked(level)) {
      return {
        canEnter: false,
        reason: 'level_not_unlocked',
        message: '需要先通过前一关解锁此关卡'
      };
    }
    var req = this.getLevelRequirement(level);
    var currentPower = this.getCurrentPerformanceRating();
    if (req.minPower > 0 && currentPower < req.minPower) {
      return {
        canEnter: false,
        reason: 'insufficient_power',
        message: '车辆性能不足，需要前往工坊升级改装',
        requiredPower: req.minPower,
        currentPower: currentPower,
        deficit: req.minPower - currentPower
      };
    }
    var coins = this.getCoins();
    if (req.coinsRequired > 0 && coins < req.coinsRequired) {
      return {
        canEnter: false,
        reason: 'insufficient_coins',
        message: '入场金币不足',
        requiredCoins: req.coinsRequired,
        currentCoins: coins,
        deficit: req.coinsRequired - coins
      };
    }
    return {
      canEnter: true,
      power: currentPower,
      coins: coins
    };
  };

  proto.getLevelEntryHint = function(level) {
    var check = this.checkLevelEntry(level);
    if (check.canEnter) {
      return { allowed: true, message: '✅ 可以进入关卡' };
    }
    if (check.reason === 'level_not_unlocked') {
      return { allowed: false, message: '🔒 关卡未解锁' };
    }
    if (check.reason === 'insufficient_power') {
      return {
        allowed: false,
        message: '⚙️ 性能不足 (' + check.currentPower + '/' + check.requiredPower + ')'
      };
    }
    if (check.reason === 'insufficient_coins') {
      return {
        allowed: false,
        message: '💰 金币不足 (' + check.currentCoins + '/' + check.requiredCoins + ')'
      };
    }
    return { allowed: false, message: '❌ 无法进入' };
  };

  proto.calculateCoinsFromRun = function(runStats) {
    if (!runStats) return 0;
    var baseCoins = Math.floor((runStats.totalScore || 0) / 50);
    var distanceCoins = Math.floor((runStats.distance || 0) / 200);
    var timeBonus = 0;
    if (runStats.time && runStats.time < 120) {
      timeBonus = Math.floor((120 - runStats.time) * 2);
    }
    var healthBonus = 0;
    if (runStats.health && runStats.health >= 80) {
      healthBonus = Math.floor(runStats.health);
    }
    var starBonus = 0;
    if (runStats.starRating) {
      starBonus = runStats.starRating.stars * 50;
    }
    var perfectBonus = runStats.perfectRun ? 200 : 0;
    var branchBonus = 0;
    if (runStats.branches) {
      branchBonus = Object.keys(runStats.branches).length * 30;
    }
    var comboBonus = 0;
    if (runStats.comboInfo && runStats.comboInfo.maxCombo) {
      comboBonus = runStats.comboInfo.maxCombo * 10;
    }
    var total = baseCoins + distanceCoins + timeBonus + healthBonus +
                starBonus + perfectBonus + branchBonus + comboBonus;
    return Math.max(10, Math.floor(total));
  };

  proto.applyCoinsFromRun = function(runStats) {
    var earned = this.calculateCoinsFromRun(runStats);
    if (earned > 0) {
      this.addCoins(earned, 'run_reward');
    }
    return earned;
  };

  proto.getAllPartsSummary = function() {
    var categories = MountainRacer.PartsConfig.getCategories();
    var catKeys = Object.keys(categories).filter(function(k) { return k !== 'categories'; });
    var unlocked = this.getUnlockedParts();
    var equipped = this.getEquippedParts();
    var summary = {
      categories: {},
      totalUnlocked: unlocked.length,
      totalEquipped: 0,
      totalParts: 0
    };
    for (var i = 0; i < catKeys.length; i++) {
      var cat = catKeys[i];
      var allParts = MountainRacer.PartsConfig.getAllPartsByCategory(cat);
      var partIds = Object.keys(allParts);
      var unlockedCount = 0;
      for (var j = 0; j < partIds.length; j++) {
        if (unlocked.indexOf(partIds[j]) !== -1) unlockedCount++;
      }
      summary.totalParts += partIds.length;
      if (equipped[cat]) summary.totalEquipped++;
      summary.categories[cat] = {
        label: categories[cat].label,
        icon: categories[cat].icon,
        description: categories[cat].description,
        allParts: partIds,
        unlockedCount: unlockedCount,
        totalCount: partIds.length,
        equippedPart: equipped[cat],
        isComplete: unlockedCount === partIds.length
      };
    }
    return summary;
  };

  proto.resetGarage = function() {
    this._dm.batchUpdate({
      'economy.coins': 500,
      'economy.totalCoinsEarned': 0,
      'economy.totalCoinsSpent': 0,
      'garage.currentCar': 'car_basic',
      'garage.ownedCars': ['car_basic'],
      'garage.equippedParts': {
        engine: 'engine_basic',
        tires: 'tires_basic',
        suspension: 'suspension_basic',
        brakes: 'brakes_basic',
        body: 'body_basic',
        nitro: 'nitro_none'
      },
      'garage.carCustomizations': {
        car_basic: { color: '#ff4500', decals: [] }
      },
      'unlocks.parts': ['engine_basic', 'tires_basic', 'suspension_basic', 'brakes_basic', 'body_basic', 'nitro_none']
    });
    this._dm._emit('garageReset', {});
  };

  window.MountainRacer = MountainRacer;
})();
