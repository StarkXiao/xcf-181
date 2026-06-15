(function() {
  var MountainRacer = window.MountainRacer || {};

  var COIN_PACKAGES = {
    coin_pack_small: {
      id: 'coin_pack_small',
      name: '小额金币包',
      icon: '💰',
      description: '获得 500 金币',
      coins: 500,
      realPrice: 6,
      discountPrice: 6,
      originalPrice: 6,
      discount: 0,
      hot: false,
      rarity: 'common'
    },
    coin_pack_medium: {
      id: 'coin_pack_medium',
      name: '中额金币包',
      icon: '💰💰',
      description: '获得 1,500 金币',
      coins: 1500,
      realPrice: 18,
      discountPrice: 18,
      originalPrice: 18,
      discount: 0,
      hot: false,
      rarity: 'common'
    },
    coin_pack_large: {
      id: 'coin_pack_large',
      name: '大额金币包',
      icon: '💰💰💰',
      description: '获得 5,000 金币',
      coins: 5000,
      realPrice: 50,
      discountPrice: 50,
      originalPrice: 50,
      discount: 0,
      hot: true,
      rarity: 'rare'
    },
    coin_pack_huge: {
      id: 'coin_pack_huge',
      name: '超级金币包',
      icon: '💎',
      description: '获得 15,000 金币',
      coins: 15000,
      realPrice: 128,
      discountPrice: 128,
      originalPrice: 128,
      discount: 0,
      hot: false,
      rarity: 'epic'
    },
    coin_pack_ultimate: {
      id: 'coin_pack_ultimate',
      name: '至尊金币包',
      icon: '👑',
      description: '获得 50,000 金币',
      coins: 50000,
      realPrice: 328,
      discountPrice: 328,
      originalPrice: 328,
      discount: 0,
      hot: true,
      rarity: 'legendary'
    }
  };

  var CONSUMABLE_ITEMS = {
    nitro_refill: {
      id: 'nitro_refill',
      name: '氮气补充包',
      icon: '💨',
      description: '立即补充 3 次氮气使用次数',
      category: 'consumable',
      type: 'nitro',
      value: 3,
      price: 300,
      originalPrice: 300,
      discount: 0,
      hot: false,
      rarity: 'common',
      maxStack: 99,
      currency: 'coins'
    },
    repair_kit: {
      id: 'repair_kit',
      name: '维修工具包',
      icon: '🔧',
      description: '立即恢复车辆 50 点生命值',
      category: 'consumable',
      type: 'repair',
      value: 50,
      price: 200,
      originalPrice: 200,
      discount: 0,
      hot: false,
      rarity: 'common',
      maxStack: 99,
      currency: 'coins'
    },
    shield_item: {
      id: 'shield_item',
      name: '护盾道具',
      icon: '🛡️',
      description: '下一场比赛免疫首次碰撞伤害',
      category: 'consumable',
      type: 'shield',
      value: 1,
      price: 500,
      originalPrice: 500,
      discount: 0,
      hot: true,
      rarity: 'rare',
      maxStack: 10,
      currency: 'coins'
    },
    score_boost: {
      id: 'score_boost',
      name: '分数加成卡',
      icon: '⭐',
      description: '下一场比赛分数 +20%',
      category: 'consumable',
      type: 'scoreBoost',
      value: 0.2,
      price: 400,
      originalPrice: 400,
      discount: 0,
      hot: false,
      rarity: 'rare',
      maxStack: 10,
      currency: 'coins'
    },
    coin_boost: {
      id: 'coin_boost',
      name: '金币加成卡',
      icon: '🪙',
      description: '下一场比赛金币收益 +50%',
      category: 'consumable',
      type: 'coinBoost',
      value: 0.5,
      price: 600,
      originalPrice: 600,
      discount: 0,
      hot: true,
      rarity: 'rare',
      maxStack: 10,
      currency: 'coins'
    },
    lucky_box: {
      id: 'lucky_box',
      name: '幸运宝箱',
      icon: '🎁',
      description: '随机获得金币、零件或车辆',
      category: 'consumable',
      type: 'luckyBox',
      value: 1,
      price: 1000,
      originalPrice: 1000,
      discount: 0,
      hot: false,
      rarity: 'epic',
      maxStack: 50,
      currency: 'coins'
    }
  };

  var DAILY_PACKS = [
    {
      id: 'daily_login_starter',
      name: '新手礼包',
      icon: '🎊',
      description: '每日登录领取 100 金币',
      type: 'daily',
      rewards: { coins: 100 },
      cooldownHours: 24,
      price: 0,
      originalPrice: 0,
      discount: 100,
      hot: false,
      rarity: 'common',
      currency: 'free'
    },
    {
      id: 'daily_bonus_small',
      name: '每日小礼包',
      icon: '📦',
      description: '500 金币 + 氮气补充包 x1',
      type: 'daily',
      rewards: { coins: 500, items: [{ id: 'nitro_refill', count: 1 }] },
      cooldownHours: 24,
      price: 0,
      originalPrice: 0,
      discount: 100,
      hot: true,
      rarity: 'common',
      currency: 'free',
      requireAd: true
    }
  ];

  var LIMITED_TIME_PACKS = [
    {
      id: 'starter_bundle',
      name: '新手加速礼包',
      icon: '🚀',
      description: '2000 金币 + 运动引擎 + 运动轮胎',
      type: 'limited',
      rewards: {
        coins: 2000,
        parts: ['engine_sport', 'tires_sport']
      },
      durationHours: 72,
      price: 30,
      originalPrice: 68,
      discount: 56,
      hot: true,
      rarity: 'rare',
      currency: 'real',
      availableFrom: '2026-01-01',
      availableUntil: '2026-12-31',
      maxPurchase: 1
    },
    {
      id: 'weekend_speed',
      name: '周末极速礼包',
      icon: '⚡',
      description: '8000 金币 + 赛车引擎 + 赛车轮胎',
      type: 'limited',
      rewards: {
        coins: 8000,
        parts: ['engine_racing', 'tires_racing']
      },
      durationHours: 48,
      price: 68,
      originalPrice: 128,
      discount: 47,
      hot: true,
      rarity: 'epic',
      currency: 'real',
      weekdays: [5, 6, 0],
      maxPurchase: 3
    },
    {
      id: 'vip_value',
      name: '超值VIP礼包',
      icon: '💎',
      description: '20000 金币 + 涡轮引擎 + 碳陶刹车 + 超跑解锁',
      type: 'limited',
      rewards: {
        coins: 20000,
        parts: ['engine_turbo', 'brakes_carbon'],
        cars: ['car_super']
      },
      durationHours: 168,
      price: 198,
      originalPrice: 398,
      discount: 50,
      hot: false,
      rarity: 'legendary',
      currency: 'real',
      maxPurchase: 1
    },
    {
      id: 'repair_bundle',
      name: '维修超值包',
      icon: '🧰',
      description: '维修工具包 x10 + 护盾道具 x3',
      type: 'limited',
      rewards: {
        items: [
          { id: 'repair_kit', count: 10 },
          { id: 'shield_item', count: 3 }
        ]
      },
      durationHours: 24,
      price: 1500,
      originalPrice: 3500,
      discount: 57,
      hot: false,
      rarity: 'rare',
      currency: 'coins',
      maxPurchase: 5
    }
  ];

  var REFRESH_CONFIG = {
    dailyShopItems: 6,
    refreshIntervalHours: 6,
    freeRefreshPerDay: 1,
    refreshCost: 100,
    itemCategories: ['consumable'],
    discountRange: { min: 0, max: 40 },
    discountWeights: [
      { discount: 0, weight: 40 },
      { discount: 10, weight: 25 },
      { discount: 20, weight: 20 },
      { discount: 30, weight: 10 },
      { discount: 40, weight: 5 }
    ]
  };

  var RARITY_COLORS = {
    common: { hex: 0x9e9e9e, name: '普通', glow: 'rgba(158,158,158,0.5)' },
    rare: { hex: 0x2196f3, name: '稀有', glow: 'rgba(33,150,243,0.5)' },
    epic: { hex: 0x9c27b0, name: '史诗', glow: 'rgba(156,39,176,0.5)' },
    legendary: { hex: 0xff9800, name: '传说', glow: 'rgba(255,152,0,0.5)' }
  };

  MountainRacer.ShopConfig = {
    getCoinPackages: function() {
      return COIN_PACKAGES;
    },

    getCoinPackage: function(id) {
      return COIN_PACKAGES[id] || null;
    },

    getConsumableItems: function() {
      return CONSUMABLE_ITEMS;
    },

    getConsumableItem: function(id) {
      return CONSUMABLE_ITEMS[id] || null;
    },

    getDailyPacks: function() {
      return DAILY_PACKS;
    },

    getLimitedTimePacks: function() {
      return LIMITED_TIME_PACKS;
    },

    getRefreshConfig: function() {
      return REFRESH_CONFIG;
    },

    getRarityColor: function(rarity) {
      return RARITY_COLORS[rarity] || RARITY_COLORS.common;
    },

    getAllRarities: function() {
      return RARITY_COLORS;
    },

    isLimitedPackAvailable: function(pack) {
      if (!pack) return false;
      var now = Date.now();

      if (pack.availableFrom) {
        var from = new Date(pack.availableFrom).getTime();
        if (now < from) return false;
      }
      if (pack.availableUntil) {
        var until = new Date(pack.availableUntil).getTime();
        if (now > until) return false;
      }
      if (pack.weekdays) {
        var d = new Date().getDay();
        if (pack.weekdays.indexOf(d) === -1) return false;
      }
      return true;
    },

    generateDailyShopItems: function(seed) {
      var config = REFRESH_CONFIG;
      var items = [];
      var allItems = Object.values(CONSUMABLE_ITEMS);
      var used = {};
      var rng = seed || Date.now();

      function pseudoRandom() {
        rng = (rng * 9301 + 49297) % 233280;
        return rng / 233280;
      }

      function pickDiscount() {
        var total = 0;
        for (var i = 0; i < config.discountWeights.length; i++) {
          total += config.discountWeights[i].weight;
        }
        var r = pseudoRandom() * total;
        var acc = 0;
        for (var j = 0; j < config.discountWeights.length; j++) {
          acc += config.discountWeights[j].weight;
          if (r <= acc) return config.discountWeights[j].discount;
        }
        return 0;
      }

      var count = Math.min(config.dailyShopItems, allItems.length);
      while (items.length < count) {
        var idx = Math.floor(pseudoRandom() * allItems.length);
        var item = allItems[idx];
        if (!item || used[item.id]) continue;
        used[item.id] = true;

        var discount = pickDiscount();
        var finalPrice = Math.floor(item.price * (1 - discount / 100));

        items.push({
          id: item.id,
          name: item.name,
          icon: item.icon,
          description: item.description,
          category: item.category,
          type: item.type,
          value: item.value,
          rarity: item.rarity,
          maxStack: item.maxStack,
          currency: item.currency,
          price: finalPrice,
          originalPrice: item.price,
          discount: discount,
          hot: item.hot
        });
      }

      return items;
    },

    openLuckyBox: function() {
      var r = Math.random();
      if (r < 0.5) {
        var coins = [200, 500, 1000, 2000];
        var idx = Math.floor(Math.random() * coins.length);
        return { type: 'coins', value: coins[idx], name: '金币 x' + coins[idx], icon: '💰' };
      } else if (r < 0.85) {
        var partList = ['engine_sport', 'tires_sport', 'suspension_sport', 'brakes_sport', 'body_sport'];
        var pIdx = Math.floor(Math.random() * partList.length);
        var partId = partList[pIdx];
        var partInfo = MountainRacer.PartsConfig.getPartById(partId);
        return {
          type: 'part',
          value: partId,
          name: (partInfo ? partInfo.config.name : '零件'),
          icon: '⚙️',
          partId: partId
        };
      } else if (r < 0.98) {
        var itemList = Object.keys(CONSUMABLE_ITEMS);
        var iIdx = Math.floor(Math.random() * itemList.length);
        var itemDef = CONSUMABLE_ITEMS[itemList[iIdx]];
        return {
          type: 'item',
          value: itemList[iIdx],
          name: itemDef.name + ' x' + Math.floor(1 + Math.random() * 3),
          icon: itemDef.icon,
          count: Math.floor(1 + Math.random() * 3)
        };
      } else {
        return {
          type: 'car',
          value: 'car_sport',
          name: '跑车',
          icon: '🏎️',
          carId: 'car_sport'
        };
      }
    }
  };

  MountainRacer.COIN_PACKAGES = COIN_PACKAGES;
  MountainRacer.CONSUMABLE_ITEMS = CONSUMABLE_ITEMS;
  MountainRacer.DAILY_PACKS = DAILY_PACKS;
  MountainRacer.LIMITED_TIME_PACKS = LIMITED_TIME_PACKS;

  window.MountainRacer = MountainRacer;
})();
