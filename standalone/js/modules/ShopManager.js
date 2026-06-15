(function() {
  var MountainRacer = window.MountainRacer || {};

  MountainRacer.ShopManager = function(dataManager) {
    this._dm = dataManager;
  };

  var proto = MountainRacer.ShopManager.prototype;

  proto._getShopData = function() {
    return this._dm.getData('shop', null);
  };

  proto._saveShopData = function(data) {
    this._dm.setData('shop', data);
  };

  proto._getInventory = function() {
    var inv = this._dm.getData('inventory', null);
    if (!inv) {
      inv = { items: {} };
      this._dm.setData('inventory', inv);
    }
    return inv;
  };

  proto._saveInventory = function(inv) {
    this._dm.setData('inventory', inv);
  };

  proto.getInventoryItems = function() {
    var inv = this._getInventory();
    return inv.items || {};
  };

  proto.getItemCount = function(itemId) {
    var inv = this._getInventory();
    return (inv.items && inv.items[itemId]) ? inv.items[itemId] : 0;
  };

  proto.addItem = function(itemId, count) {
    if (count <= 0) return false;
    var inv = this._getInventory();
    if (!inv.items) inv.items = {};
    var itemDef = MountainRacer.ShopConfig.getConsumableItem(itemId);
    var current = inv.items[itemId] || 0;
    var max = itemDef ? (itemDef.maxStack || 999) : 999;
    var final = Math.min(current + count, max);
    var added = final - current;
    if (added > 0) {
      inv.items[itemId] = final;
      this._saveInventory(inv);
      this._dm._emit('inventoryChanged', {
        itemId: itemId,
        count: final,
        added: added
      });
    }
    return added > 0;
  };

  proto.useItem = function(itemId, count) {
    count = count || 1;
    if (count <= 0) return { success: false, reason: 'invalid_count' };
    var inv = this._getInventory();
    if (!inv.items || !inv.items[itemId] || inv.items[itemId] < count) {
      return { success: false, reason: 'insufficient' };
    }
    inv.items[itemId] -= count;
    if (inv.items[itemId] <= 0) delete inv.items[itemId];
    this._saveInventory(inv);
    this._dm._emit('inventoryChanged', {
      itemId: itemId,
      count: inv.items[itemId] || 0,
      used: count
    });
    return { success: true, remaining: inv.items[itemId] || 0 };
  };

  proto.getDailyShop = function() {
    var shop = this._getShopData();
    var now = Date.now();
    var refreshConfig = MountainRacer.ShopConfig.getRefreshConfig();
    var intervalMs = refreshConfig.refreshIntervalHours * 60 * 60 * 1000;

    if (!shop || !shop.dailyItems || !shop.dailyRefreshTime ||
        (now - shop.dailyRefreshTime) >= intervalMs) {
      return this._refreshDailyShop(shop, now);
    }
    return shop.dailyItems;
  };

  proto._refreshDailyShop = function(shop, now) {
    if (!shop) shop = this._getShopData() || {};
    var seed = now;
    shop.dailyItems = MountainRacer.ShopConfig.generateDailyShopItems(seed);
    shop.dailyRefreshTime = now;
    shop.dailyRefreshCount = (shop.dailyRefreshCount || 0) + 1;
    this._saveShopData(shop);
    this._dm._emit('dailyShopRefreshed', { items: shop.dailyItems });
    return shop.dailyItems;
  };

  proto.canRefreshDailyShop = function() {
    var shop = this._getShopData() || {};
    var refreshConfig = MountainRacer.ShopConfig.getRefreshConfig();
    var today = new Date().toDateString();
    var lastRefreshDay = shop.lastFreeRefreshDay || '';
    var freeUsed = lastRefreshDay === today ? (shop.freeRefreshUsedToday || 0) : 0;
    var freeLeft = Math.max(0, refreshConfig.freeRefreshPerDay - freeUsed);
    var coins = this._dm.getGarageManager().getCoins();
    return {
      canRefresh: true,
      freeLeft: freeLeft,
      costCoins: refreshConfig.refreshCost,
      canAfford: coins >= refreshConfig.refreshCost
    };
  };

  proto.refreshDailyShop = function(useFree) {
    var check = this.canRefreshDailyShop();
    var shop = this._getShopData() || {};
    var today = new Date().toDateString();
    var garageMgr = this._dm.getGarageManager();

    if (useFree && check.freeLeft > 0) {
      shop.lastFreeRefreshDay = today;
      shop.freeRefreshUsedToday = (shop.freeRefreshUsedToday || 0) + 1;
      this._saveShopData(shop);
    } else {
      if (!check.canAfford) {
        return { success: false, reason: 'insufficient_coins', needed: refreshConfig.refreshCost - garageMgr.getCoins() };
      }
      var spendResult = garageMgr.spendCoins(MountainRacer.ShopConfig.getRefreshConfig().refreshCost, 'shop_refresh_daily');
      if (!spendResult.success) {
        return { success: false, reason: spendResult.reason };
      }
    }

    var items = this._refreshDailyShop(shop, Date.now());
    return { success: true, items: items, usedFree: useFree && check.freeLeft > 0 };
  };

  proto.getNextRefreshTime = function() {
    var shop = this._getShopData() || {};
    var refreshConfig = MountainRacer.ShopConfig.getRefreshConfig();
    var intervalMs = refreshConfig.refreshIntervalHours * 60 * 60 * 1000;
    var last = shop.dailyRefreshTime || 0;
    var next = last + intervalMs;
    var remaining = Math.max(0, next - Date.now());
    return {
      lastRefresh: last,
      nextRefresh: next,
      remainingMs: remaining,
      remainingMinutes: Math.ceil(remaining / 60000)
    };
  };

  proto.canClaimDailyPack = function(packId) {
    var shop = this._getShopData() || {};
    var claims = shop.dailyClaims || {};
    var lastClaim = claims[packId] || 0;
    var pack = null;
    var packs = MountainRacer.ShopConfig.getDailyPacks();
    for (var i = 0; i < packs.length; i++) {
      if (packs[i].id === packId) { pack = packs[i]; break; }
    }
    if (!pack) return { canClaim: false, reason: 'invalid_pack' };
    var cdMs = (pack.cooldownHours || 24) * 60 * 60 * 1000;
    var now = Date.now();
    if (now - lastClaim < cdMs) {
      return {
        canClaim: false,
        reason: 'cooldown',
        remainingMs: cdMs - (now - lastClaim),
        remainingMinutes: Math.ceil((cdMs - (now - lastClaim)) / 60000)
      };
    }
    return { canClaim: true };
  };

  proto.claimDailyPack = function(packId) {
    var check = this.canClaimDailyPack(packId);
    if (!check.canClaim) return { success: false, ...check };
    var pack = null;
    var packs = MountainRacer.ShopConfig.getDailyPacks();
    for (var i = 0; i < packs.length; i++) {
      if (packs[i].id === packId) { pack = packs[i]; break; }
    }
    if (!pack) return { success: false, reason: 'invalid_pack' };

    var shop = this._getShopData() || {};
    if (!shop.dailyClaims) shop.dailyClaims = {};
    shop.dailyClaims[packId] = Date.now();
    this._saveShopData(shop);

    var rewards = pack.rewards || {};
    var garageMgr = this._dm.getGarageManager();
    var granted = { coins: 0, items: [] };

    if (rewards.coins) {
      garageMgr.addCoins(rewards.coins, 'daily_pack:' + packId);
      granted.coins = rewards.coins;
    }
    if (rewards.items) {
      for (var j = 0; j < rewards.items.length; j++) {
        var it = rewards.items[j];
        this.addItem(it.id, it.count || 1);
        granted.items.push({ id: it.id, count: it.count || 1 });
      }
    }

    this._dm._emit('dailyPackClaimed', {
      packId: packId,
      rewards: granted
    });

    return { success: true, rewards: granted };
  };

  proto.getAvailableLimitedPacks = function() {
    var all = MountainRacer.ShopConfig.getLimitedTimePacks();
    var shop = this._getShopData() || {};
    var purchases = shop.limitedPurchases || {};
    var result = [];
    for (var i = 0; i < all.length; i++) {
      var pack = all[i];
      if (!MountainRacer.ShopConfig.isLimitedPackAvailable(pack)) continue;
      var bought = purchases[pack.id] || 0;
      var max = pack.maxPurchase || 999;
      result.push({
        ...pack,
        purchasedCount: bought,
        remaining: Math.max(0, max - bought),
        canPurchase: bought < max
      });
    }
    return result;
  };

  proto.purchaseConsumable = function(itemId, count) {
    count = count || 1;
    if (count <= 0) return { success: false, reason: 'invalid_count' };
    var dailyItems = this.getDailyShop();
    var shopItem = null;
    for (var i = 0; i < dailyItems.length; i++) {
      if (dailyItems[i].id === itemId) { shopItem = dailyItems[i]; break; }
    }
    if (!shopItem) {
      var def = MountainRacer.ShopConfig.getConsumableItem(itemId);
      if (!def) return { success: false, reason: 'invalid_item' };
      shopItem = def;
    }
    var garageMgr = this._dm.getGarageManager();
    var totalPrice = shopItem.price * count;
    var spendResult = garageMgr.spendCoins(totalPrice, 'shop_buy_item:' + itemId + 'x' + count);
    if (!spendResult.success) {
      return { success: false, reason: spendResult.reason, needed: spendResult.needed };
    }
    this.addItem(itemId, count);
    this._dm._emit('itemPurchased', {
      itemId: itemId,
      count: count,
      price: totalPrice,
      remainingCoins: spendResult.remaining
    });
    return {
      success: true,
      itemId: itemId,
      count: count,
      price: totalPrice,
      remainingCoins: spendResult.remaining
    };
  };

  proto.purchaseCoinPackage = function(packId) {
    var pack = MountainRacer.ShopConfig.getCoinPackage(packId);
    if (!pack) return { success: false, reason: 'invalid_package' };
    var garageMgr = this._dm.getGarageManager();
    garageMgr.addCoins(pack.coins, 'coin_package:' + packId);
    this._dm._emit('coinPackagePurchased', {
      packId: packId,
      coins: pack.coins
    });
    return { success: true, coins: pack.coins, pack: pack };
  };

  proto.purchaseLimitedPack = function(packId) {
    var all = MountainRacer.ShopConfig.getLimitedTimePacks();
    var pack = null;
    for (var i = 0; i < all.length; i++) {
      if (all[i].id === packId) { pack = all[i]; break; }
    }
    if (!pack) return { success: false, reason: 'invalid_pack' };
    if (!MountainRacer.ShopConfig.isLimitedPackAvailable(pack)) {
      return { success: false, reason: 'not_available' };
    }

    var shop = this._getShopData() || {};
    if (!shop.limitedPurchases) shop.limitedPurchases = {};
    var bought = shop.limitedPurchases[packId] || 0;
    var max = pack.maxPurchase || 999;
    if (bought >= max) return { success: false, reason: 'max_purchased' };

    var garageMgr = this._dm.getGarageManager();
    var unlockMgr = this._dm.getUnlockManager();
    var currency = pack.currency || 'coins';

    if (currency === 'coins') {
      var spendResult = garageMgr.spendCoins(pack.price, 'shop_limited_pack:' + packId);
      if (!spendResult.success) {
        return { success: false, reason: spendResult.reason, needed: spendResult.needed };
      }
    }

    var rewards = pack.rewards || {};
    var granted = { coins: 0, parts: [], cars: [], items: [] };

    if (rewards.coins) {
      garageMgr.addCoins(rewards.coins, 'limited_pack_reward:' + packId);
      granted.coins = rewards.coins;
    }
    if (rewards.parts) {
      var unlockedParts = this._dm.getData('unlocks.parts', []);
      for (var p = 0; p < rewards.parts.length; p++) {
        var partId = rewards.parts[p];
        if (unlockedParts.indexOf(partId) === -1) {
          unlockedParts.push(partId);
          granted.parts.push({ partId: partId, newlyUnlocked: true });
        } else {
          granted.parts.push({ partId: partId, alreadyOwned: true });
        }
      }
      this._dm.setData('unlocks.parts', unlockedParts);
    }
    if (rewards.cars) {
      var ownedCars = this._dm.getData('garage.ownedCars', ['car_basic']);
      var customizations = this._dm.getData('garage.carCustomizations', {});
      for (var c = 0; c < rewards.cars.length; c++) {
        var carId = rewards.cars[c];
        if (ownedCars.indexOf(carId) === -1) {
          ownedCars.push(carId);
          var carCfg = MountainRacer.PartsConfig.getCarConfig(carId);
          customizations[carId] = { color: carCfg ? carCfg.color : '#ff4500', decals: [] };
          granted.cars.push({ carId: carId, newlyUnlocked: true });
        } else {
          granted.cars.push({ carId: carId, alreadyOwned: true });
        }
      }
      this._dm.batchUpdate({
        'garage.ownedCars': ownedCars,
        'garage.carCustomizations': customizations
      });
    }
    if (rewards.items) {
      for (var it = 0; it < rewards.items.length; it++) {
        var itemDef = rewards.items[it];
        this.addItem(itemDef.id, itemDef.count || 1);
        granted.items.push({ id: itemDef.id, count: itemDef.count || 1 });
      }
    }

    shop.limitedPurchases[packId] = bought + 1;
    this._saveShopData(shop);

    this._dm._emit('limitedPackPurchased', {
      packId: packId,
      rewards: granted
    });

    return { success: true, rewards: granted };
  };

  proto.openLuckyBox = function(count) {
    count = count || 1;
    if (count <= 0) return { success: false, reason: 'invalid_count' };
    var itemCount = this.getItemCount('lucky_box');
    if (itemCount < count) {
      return { success: false, reason: 'insufficient_boxes', needed: count - itemCount };
    }
    var useResult = this.useItem('lucky_box', count);
    if (!useResult.success) return { success: false, reason: useResult.reason };

    var results = [];
    for (var i = 0; i < count; i++) {
      var reward = MountainRacer.ShopConfig.openLuckyBox();
      results.push(reward);
      this._applyLuckyBoxReward(reward);
    }
    this._dm._emit('luckyBoxOpened', { count: count, results: results });
    return { success: true, results: results };
  };

  proto._applyLuckyBoxReward = function(reward) {
    if (!reward) return;
    var garageMgr = this._dm.getGarageManager();

    if (reward.type === 'coins') {
      garageMgr.addCoins(reward.value, 'lucky_box');
    } else if (reward.type === 'part') {
      var unlocked = this._dm.getData('unlocks.parts', []);
      if (unlocked.indexOf(reward.partId) === -1) {
        unlocked.push(reward.partId);
        this._dm.setData('unlocks.parts', unlocked);
      }
    } else if (reward.type === 'item') {
      this.addItem(reward.value, reward.count || 1);
    } else if (reward.type === 'car') {
      var owned = this._dm.getData('garage.ownedCars', ['car_basic']);
      var customs = this._dm.getData('garage.carCustomizations', {});
      if (owned.indexOf(reward.carId) === -1) {
        owned.push(reward.carId);
        var cfg = MountainRacer.PartsConfig.getCarConfig(reward.carId);
        customs[reward.carId] = { color: cfg ? cfg.color : '#ff4500', decals: [] };
        this._dm.batchUpdate({
          'garage.ownedCars': owned,
          'garage.carCustomizations': customs
        });
      }
    }
  };

  proto.getShopStats = function() {
    var shop = this._getShopData() || {};
    var garageMgr = this._dm.getGarageManager();
    return {
      coins: garageMgr.getCoins(),
      totalCoinsEarned: garageMgr.getTotalEarned(),
      totalCoinsSpent: garageMgr.getTotalSpent(),
      dailyRefreshCount: shop.dailyRefreshCount || 0,
      inventorySize: Object.keys(this.getInventoryItems()).length
    };
  };

  proto.resetShop = function() {
    this._dm.setData('shop', null);
    this._dm.setData('inventory', null);
    this._dm._emit('shopReset', {});
  };

  window.MountainRacer = MountainRacer;
})();
