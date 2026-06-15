(function() {
  var MountainRacer = window.MountainRacer || {};

  var PARTS_CONFIG = {
    categories: {
      engine: { label: '引擎', icon: '⚙️', description: '决定车辆的加速性能和最高速度' },
      tires: { label: '轮胎', icon: '🛞', description: '影响抓地力和过弯稳定性' },
      suspension: { label: '悬挂', icon: '🔩', description: '调节颠簸吸收和落地稳定性' },
      brakes: { label: '刹车', icon: '🛑', description: '提升减速效率和制动响应' },
      body: { label: '车身', icon: '🚗', description: '强化结构减少碰撞伤害' },
      nitro: { label: '氮气', icon: '💨', description: '临时加速装置，一次性消耗' }
    },

    engine: {
      engine_basic: {
        id: 'engine_basic',
        name: '标准引擎',
        tier: 1,
        price: 0,
        unlockLevel: 1,
        stats: { acceleration: 250, maxSpeed: 600, power: 50 },
        description: '原厂配置，性能平衡可靠。'
      },
      engine_sport: {
        id: 'engine_sport',
        name: '运动引擎',
        tier: 2,
        price: 800,
        unlockLevel: 1,
        stats: { acceleration: 320, maxSpeed: 700, power: 120 },
        description: '升级运动调校，加速和极速均有提升。'
      },
      engine_racing: {
        id: 'engine_racing',
        name: '赛车引擎',
        tier: 3,
        price: 2500,
        unlockLevel: 2,
        stats: { acceleration: 420, maxSpeed: 820, power: 220 },
        description: '专业赛车级引擎，强劲动力输出。'
      },
      engine_turbo: {
        id: 'engine_turbo',
        name: '涡轮引擎',
        tier: 4,
        price: 6000,
        unlockLevel: 2,
        stats: { acceleration: 520, maxSpeed: 950, power: 350 },
        description: '涡轮增压加持，爆发惊人的动力表现。'
      },
      engine_pro: {
        id: 'engine_pro',
        name: '专业引擎',
        tier: 5,
        price: 15000,
        unlockLevel: 3,
        stats: { acceleration: 650, maxSpeed: 1100, power: 500 },
        description: '顶级专业级引擎，极限性能发挥。'
      }
    },

    tires: {
      tires_basic: {
        id: 'tires_basic',
        name: '标准轮胎',
        tier: 1,
        price: 0,
        unlockLevel: 1,
        stats: { grip: 1.0, frictionBonus: 0, stability: 50, power: 20 },
        description: '日常通勤轮胎，抓地力标准。'
      },
      tires_sport: {
        id: 'tires_sport',
        name: '运动轮胎',
        tier: 2,
        price: 600,
        unlockLevel: 1,
        stats: { grip: 1.15, frictionBonus: 0.02, stability: 70, power: 60 },
        description: '升级运动胎面，抓地和稳定性提升。'
      },
      tires_racing: {
        id: 'tires_racing',
        name: '赛车轮胎',
        tier: 3,
        price: 1800,
        unlockLevel: 2,
        stats: { grip: 1.3, frictionBonus: 0.04, stability: 90, power: 120 },
        description: '半热熔竞技胎，极限抓地性能。'
      },
      tires_offroad: {
        id: 'tires_offroad',
        name: '越野轮胎',
        tier: 3,
        price: 2200,
        unlockLevel: 2,
        stats: { grip: 1.25, frictionBonus: 0.03, stability: 110, power: 140 },
        description: '适合山地颠簸路面，优秀的防滑能力。'
      },
      tires_slick: {
        id: 'tires_slick',
        name: '光头胎',
        tier: 5,
        price: 12000,
        unlockLevel: 3,
        stats: { grip: 1.5, frictionBonus: 0.06, stability: 80, power: 250 },
        description: '专业赛道光头胎，极致抓地性能。'
      }
    },

    suspension: {
      suspension_basic: {
        id: 'suspension_basic',
        name: '标准悬挂',
        tier: 1,
        price: 0,
        unlockLevel: 1,
        stats: { stiffness: 0.5, damping: 0.2, stability: 50, landingBonus: 0, power: 20 },
        description: '舒适型悬挂，吸收日常颠簸。'
      },
      suspension_sport: {
        id: 'suspension_sport',
        name: '运动悬挂',
        tier: 2,
        price: 700,
        unlockLevel: 1,
        stats: { stiffness: 0.6, damping: 0.25, stability: 75, landingBonus: 0.1, power: 70 },
        description: '硬调悬挂，高速过弯更稳。'
      },
      suspension_racing: {
        id: 'suspension_racing',
        name: '竞技悬挂',
        tier: 3,
        price: 2000,
        unlockLevel: 2,
        stats: { stiffness: 0.7, damping: 0.3, stability: 95, landingBonus: 0.2, power: 150 },
        description: '专业竞技调校，极致操控响应。'
      },
      suspension_offroad: {
        id: 'suspension_offroad',
        name: '越野悬挂',
        tier: 3,
        price: 2500,
        unlockLevel: 2,
        stats: { stiffness: 0.4, damping: 0.35, stability: 110, landingBonus: 0.35, power: 170 },
        description: '长行程越野悬挂，轻松应对大坑洼。'
      },
      suspension_pro: {
        id: 'suspension_pro',
        name: '专业悬挂',
        tier: 5,
        price: 14000,
        unlockLevel: 3,
        stats: { stiffness: 0.65, damping: 0.4, stability: 130, landingBonus: 0.5, power: 300 },
        description: '顶级电子悬挂，自适应各种路况。'
      }
    },

    brakes: {
      brakes_basic: {
        id: 'brakes_basic',
        name: '标准刹车',
        tier: 1,
        price: 0,
        unlockLevel: 1,
        stats: { brakePower: 400, response: 1.0, power: 15 },
        description: '普通碟刹，制动力适中。'
      },
      brakes_sport: {
        id: 'brakes_sport',
        name: '运动刹车',
        tier: 2,
        price: 500,
        unlockLevel: 1,
        stats: { brakePower: 550, response: 1.15, power: 50 },
        description: '升级刹车片，制动力明显提升。'
      },
      brakes_racing: {
        id: 'brakes_racing',
        name: '竞技刹车',
        tier: 3,
        price: 1600,
        unlockLevel: 2,
        stats: { brakePower: 720, response: 1.3, power: 110 },
        description: '大六活塞卡钳，强悍制动性能。'
      },
      brakes_carbon: {
        id: 'brakes_carbon',
        name: '碳陶刹车',
        tier: 4,
        price: 5500,
        unlockLevel: 3,
        stats: { brakePower: 900, response: 1.5, power: 220 },
        description: '碳纤维陶瓷刹车，永不衰减的制动力。'
      }
    },

    body: {
      body_basic: {
        id: 'body_basic',
        name: '标准车身',
        tier: 1,
        price: 0,
        unlockLevel: 1,
        stats: { armor: 0, damageReduction: 0, rollResist: 0, weight: 0, power: 10 },
        description: '原厂车身，无额外防护。'
      },
      body_sport: {
        id: 'body_sport',
        name: '加固车身',
        tier: 2,
        price: 600,
        unlockLevel: 1,
        stats: { armor: 20, damageReduction: 0.1, rollResist: 0.1, weight: 5, power: 50 },
        description: '局部加固，减少碰撞伤害。'
      },
      body_racing: {
        id: 'body_racing',
        name: '赛车车架',
        tier: 3,
        price: 1800,
        unlockLevel: 2,
        stats: { armor: 40, damageReduction: 0.2, rollResist: 0.25, weight: 10, power: 120 },
        description: '防滚架加持，翻车抗性大幅提升。'
      },
      body_tank: {
        id: 'body_tank',
        name: '装甲车壳',
        tier: 4,
        price: 5000,
        unlockLevel: 2,
        stats: { armor: 70, damageReduction: 0.4, rollResist: 0.4, weight: 30, power: 200 },
        description: '重型装甲，牺牲灵活换极致防护。'
      },
      body_pro: {
        id: 'body_pro',
        name: '专业车架',
        tier: 5,
        price: 13000,
        unlockLevel: 3,
        stats: { armor: 60, damageReduction: 0.35, rollResist: 0.5, weight: 5, power: 280 },
        description: '碳纤维+钛合金，轻量与坚固兼得。'
      }
    },

    nitro: {
      nitro_none: {
        id: 'nitro_none',
        name: '无氮气',
        tier: 0,
        price: 0,
        unlockLevel: 1,
        stats: { nitroBoost: 0, nitroDuration: 0, nitroCount: 0, power: 0 },
        description: '不安装氮气加速系统。'
      },
      nitro_small: {
        id: 'nitro_small',
        name: '小氮气瓶',
        tier: 1,
        price: 400,
        unlockLevel: 1,
        stats: { nitroBoost: 0.3, nitroDuration: 2.5, nitroCount: 2, power: 40 },
        description: '2瓶装小氮气，短距离加速。'
      },
      nitro_medium: {
        id: 'nitro_medium',
        name: '氮气套装',
        tier: 2,
        price: 1200,
        unlockLevel: 2,
        stats: { nitroBoost: 0.45, nitroDuration: 3.5, nitroCount: 3, power: 100 },
        description: '3瓶装标准氮气，加速更持久。'
      },
      nitro_large: {
        id: 'nitro_large',
        name: '专业氮气',
        tier: 3,
        price: 3500,
        unlockLevel: 2,
        stats: { nitroBoost: 0.6, nitroDuration: 5.0, nitroCount: 4, power: 180 },
        description: '4瓶大剂量氮气，专业车手之选。'
      },
      nitro_ultimate: {
        id: 'nitro_ultimate',
        name: '终极氮气',
        tier: 5,
        price: 10000,
        unlockLevel: 3,
        stats: { nitroBoost: 0.8, nitroDuration: 6.0, nitroCount: 5, power: 300 },
        description: '5瓶超高纯度氮气，爆炸般的加速。'
      }
    }
  };

  var CAR_CONFIGS = {
    car_basic: {
      id: 'car_basic',
      name: '入门赛车',
      price: 0,
      unlockLevel: 1,
      baseStats: {
        baseAcceleration: 250,
        baseMaxSpeed: 600,
        baseBrake: 400,
        baseHealth: 100,
        weight: 100
      },
      description: '入门级赛车，适合新手练习。',
      color: '#ff4500'
    },
    car_sport: {
      id: 'car_sport',
      name: '跑车',
      price: 5000,
      unlockLevel: 2,
      baseStats: {
        baseAcceleration: 300,
        baseMaxSpeed: 700,
        baseBrake: 450,
        baseHealth: 90,
        weight: 90
      },
      description: '轻量化跑车，加速敏捷。',
      color: '#3498db'
    },
    car_muscle: {
      id: 'car_muscle',
      name: '肌肉车',
      price: 8000,
      unlockLevel: 2,
      baseStats: {
        baseAcceleration: 350,
        baseMaxSpeed: 650,
        baseBrake: 400,
        baseHealth: 140,
        weight: 140
      },
      description: '大马力肌肉车，坚固耐撞。',
      color: '#e74c3c'
    },
    car_super: {
      id: 'car_super',
      name: '超跑',
      price: 25000,
      unlockLevel: 3,
      baseStats: {
        baseAcceleration: 450,
        baseMaxSpeed: 900,
        baseBrake: 600,
        baseHealth: 80,
        weight: 75
      },
      description: '顶级超跑，速度之王。',
      color: '#f39c12'
    }
  };

  MountainRacer.PartsConfig = {
    getCategories: function() {
      return PARTS_CONFIG.categories;
    },

    getCategoryConfig: function(category) {
      return PARTS_CONFIG[category] || {};
    },

    getAllPartsByCategory: function(category) {
      return PARTS_CONFIG[category] || {};
    },

    getPartConfig: function(category, partId) {
      if (!PARTS_CONFIG[category]) return null;
      return PARTS_CONFIG[category][partId] || null;
    },

    getPartById: function(partId) {
      var categories = Object.keys(PARTS_CONFIG).filter(function(k) {
        return k !== 'categories';
      });
      for (var i = 0; i < categories.length; i++) {
        var cat = categories[i];
        if (PARTS_CONFIG[cat][partId]) {
          return { category: cat, config: PARTS_CONFIG[cat][partId] };
        }
      }
      return null;
    },

    getCarConfig: function(carId) {
      return CAR_CONFIGS[carId] || null;
    },

    getAllCars: function() {
      return CAR_CONFIGS;
    },

    getOwnedCars: function() {
      return CAR_CONFIGS;
    }
  };

  MountainRacer.PARTS_CONFIG = PARTS_CONFIG;
  MountainRacer.CAR_CONFIGS = CAR_CONFIGS;

  window.MountainRacer = MountainRacer;
})();
