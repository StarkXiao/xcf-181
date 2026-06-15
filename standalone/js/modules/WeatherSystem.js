(function() {
  var MountainRacer = window.MountainRacer || {};

  var WEATHER_TYPES = {
    clear: {
      id: 'clear',
      name: '晴天',
      icon: '☀️',
      frictionMultiplier: 1.0,
      visibilityRange: 1.0,
      windForce: 0,
      damagePerSecond: 0,
      difficultyModifier: 0,
      particleColor: null,
      particleCount: 0,
      particleSpeed: 0,
      particleAngle: Math.PI / 2,
      overlayAlpha: 0,
      overlayColor: null,
      transitionDuration: 3000
    },
    rain: {
      id: 'rain',
      name: '雨天',
      icon: '🌧️',
      frictionMultiplier: 0.7,
      visibilityRange: 0.65,
      windForce: 0,
      damagePerSecond: 0,
      difficultyModifier: 0.15,
      particleColor: 0x88bbff,
      particleCount: 80,
      particleSpeed: 500,
      particleAngle: Math.PI / 2 + 0.15,
      overlayAlpha: 0.15,
      overlayColor: 0x334466,
      transitionDuration: 4000
    },
    heavyRain: {
      id: 'heavyRain',
      name: '暴雨',
      icon: '⛈️',
      frictionMultiplier: 0.5,
      visibilityRange: 0.4,
      windForce: 30,
      damagePerSecond: 2,
      difficultyModifier: 0.35,
      particleColor: 0x6699cc,
      particleCount: 150,
      particleSpeed: 700,
      particleAngle: Math.PI / 2 + 0.3,
      overlayAlpha: 0.3,
      overlayColor: 0x222233,
      transitionDuration: 3000
    },
    snow: {
      id: 'snow',
      name: '雪天',
      icon: '🌨️',
      frictionMultiplier: 0.55,
      visibilityRange: 0.7,
      windForce: 10,
      damagePerSecond: 0,
      difficultyModifier: 0.2,
      particleColor: 0xffffff,
      particleCount: 60,
      particleSpeed: 120,
      particleAngle: Math.PI / 2 + 0.2,
      overlayAlpha: 0.1,
      overlayColor: 0xccddff,
      transitionDuration: 5000
    },
    blizzard: {
      id: 'blizzard',
      name: '暴风雪',
      icon: '❄️',
      frictionMultiplier: 0.35,
      visibilityRange: 0.3,
      windForce: 60,
      damagePerSecond: 3,
      difficultyModifier: 0.5,
      particleColor: 0xeeeeff,
      particleCount: 200,
      particleSpeed: 300,
      particleAngle: Math.PI / 2 + 0.6,
      overlayAlpha: 0.35,
      overlayColor: 0xaabbcc,
      transitionDuration: 4000
    },
    sandstorm: {
      id: 'sandstorm',
      name: '沙尘暴',
      icon: '🌪️',
      frictionMultiplier: 0.6,
      visibilityRange: 0.35,
      windForce: 80,
      damagePerSecond: 4,
      difficultyModifier: 0.45,
      particleColor: 0xd4a853,
      particleCount: 180,
      particleSpeed: 450,
      particleAngle: Math.PI / 4,
      overlayAlpha: 0.35,
      overlayColor: 0x8b7355,
      transitionDuration: 3000
    },
    fog: {
      id: 'fog',
      name: '浓雾',
      icon: '🌫️',
      frictionMultiplier: 0.85,
      visibilityRange: 0.25,
      windForce: 0,
      damagePerSecond: 0,
      difficultyModifier: 0.25,
      particleColor: 0xcccccc,
      particleCount: 30,
      particleSpeed: 30,
      particleAngle: Math.PI / 2,
      overlayAlpha: 0.45,
      overlayColor: 0x999999,
      transitionDuration: 6000
    },
    wind: {
      id: 'wind',
      name: '大风',
      icon: '💨',
      frictionMultiplier: 0.8,
      visibilityRange: 0.8,
      windForce: 100,
      damagePerSecond: 0,
      difficultyModifier: 0.1,
      particleColor: 0xaaaaaa,
      particleCount: 40,
      particleSpeed: 350,
      particleAngle: Math.PI / 6,
      overlayAlpha: 0.05,
      overlayColor: 0x666666,
      transitionDuration: 3000
    }
  };

  var WEATHER_SEQUENCES = {
    level_1: [
      { weather: 'clear', startX: 0, endX: 2500 },
      { weather: 'rain', startX: 2500, endX: 4000 },
      { weather: 'clear', startX: 4000, endX: 5000 }
    ],
    level_2: [
      { weather: 'clear', startX: 0, endX: 1500 },
      { weather: 'rain', startX: 1500, endX: 3500 },
      { weather: 'fog', startX: 3500, endX: 5500 },
      { weather: 'wind', startX: 5500, endX: 7000 },
      { weather: 'clear', startX: 7000, endX: 8000 }
    ],
    level_3: [
      { weather: 'clear', startX: 0, endX: 1200 },
      { weather: 'snow', startX: 1200, endX: 3500 },
      { weather: 'blizzard', startX: 3500, endX: 5500 },
      { weather: 'heavyRain', startX: 5500, endX: 7500 },
      { weather: 'sandstorm', startX: 7500, endX: 9500 },
      { weather: 'fog', startX: 9500, endX: 10500 },
      { weather: 'clear', startX: 10500, endX: 12000 }
    ]
  };

  var TERRAIN_FRICTION_TABLE = {
    clear:   { normal: 1.0,  wet: 0.85, icy: 0.6,  sandy: 0.8, grassy: 0.95 },
    rain:    { normal: 0.7,  wet: 0.5,  icy: 0.45, sandy: 0.75, grassy: 0.6 },
    heavyRain: { normal: 0.5, wet: 0.35, icy: 0.3, sandy: 0.65, grassy: 0.45 },
    snow:    { normal: 0.55, wet: 0.45, icy: 0.25, sandy: 0.7, grassy: 0.5 },
    blizzard:{ normal: 0.35, wet: 0.25, icy: 0.15, sandy: 0.55, grassy: 0.3 },
    sandstorm: { normal: 0.6, wet: 0.55, icy: 0.5, sandy: 0.35, grassy: 0.55 },
    fog:     { normal: 0.85, wet: 0.7,  icy: 0.55, sandy: 0.75, grassy: 0.8 },
    wind:    { normal: 0.8,  wet: 0.65, icy: 0.5,  sandy: 0.7, grassy: 0.75 }
  };

  MountainRacer.WeatherSystem = function(scene, level) {
    this.scene = scene;
    this.level = level;
    this.currentWeather = 'clear';
    this.previousWeather = 'clear';
    this.transitionProgress = 1.0;
    this.transitionDuration = 3000;
    this.transitionStartTime = 0;
    this.isTransitioning = false;

    this.particles = [];
    this.maxParticles = 200;

    this.weatherOverlay = null;
    this.fogOverlay = null;
    this.visibilityMask = null;

    this.currentWindForce = 0;
    this.targetWindForce = 0;
    this.currentFriction = 1.0;
    this.currentVisibility = 1.0;
    this.currentDifficultyMod = 0;

    this.damageAccumulator = 0;
    this.lastUpdateTime = 0;

    this.weatherSequence = [];
    this.lastSequenceWeather = 'clear';
    this.manualOverride = false;

    this.lightningTimer = 0;
    this.lightningFlash = null;
    this.thunderShakeTimer = 0;

    this.windGustTimer = 0;
    this.windGustActive = false;
    this.windGustForce = 0;

    this.snowAccumulation = {};
    this.icingZones = [];

    this.initialize(level);
  };

  var proto = MountainRacer.WeatherSystem.prototype;

  proto.initialize = function(level) {
    var sequenceKey = 'level_' + level;
    this.weatherSequence = WEATHER_SEQUENCES[sequenceKey] || [
      { weather: 'clear', startX: 0, endX: 99999 }
    ];
  };

  proto.create = function() {
    this.weatherOverlay = this.scene.add.graphics();
    this.weatherOverlay.setScrollFactor(0);
    this.weatherOverlay.setDepth(400);
    this.weatherOverlay.setAlpha(0);

    this.fogOverlay = this.scene.add.graphics();
    this.fogOverlay.setScrollFactor(0);
    this.fogOverlay.setDepth(450);
    this.fogOverlay.setAlpha(0);

    this.lightningFlash = this.scene.add.graphics();
    this.lightningFlash.setScrollFactor(0);
    this.lightningFlash.setDepth(460);
    this.lightningFlash.setAlpha(0);
    this.lightningFlash.fillStyle(0xffffff, 1);
    this.lightningFlash.fillRect(0, 0, this.scene.scale.width, this.scene.scale.height);
  };

  proto.update = function(carX, deltaTime, carPhysics) {
    var dt = Math.min(deltaTime / 1000, 0.033);
    var now = Date.now();

    if (!this.manualOverride) {
      this.updateWeatherByPosition(carX);
    }

    if (this.isTransitioning) {
      var elapsed = now - this.transitionStartTime;
      this.transitionProgress = Math.min(1, elapsed / this.transitionDuration);
      if (this.transitionProgress >= 1) {
        this.isTransitioning = false;
        this.transitionProgress = 1;
      }
    }

    this.interpolateWeatherParams(dt);
    this.updateParticles(carX, dt);
    this.updateOverlays();
    this.updateLightning(dt);
    this.updateWindGusts(dt);
    this.applyWindForce(carPhysics, dt);
    this.applyWeatherDamage(carPhysics, dt);
    this.updateSnowAccumulation(carX, dt);

    this.lastUpdateTime = now;
  };

  proto.updateWeatherByPosition = function(carX) {
    var targetWeather = 'clear';
    for (var i = 0; i < this.weatherSequence.length; i++) {
      var entry = this.weatherSequence[i];
      if (carX >= entry.startX && carX < entry.endX) {
        targetWeather = entry.weather;
        break;
      }
    }

    if (targetWeather !== this.lastSequenceWeather) {
      this.lastSequenceWeather = targetWeather;
      this.setWeather(targetWeather);
    }
  };

  proto.setWeather = function(weatherId, instant) {
    if (weatherId === this.currentWeather && !this.isTransitioning) return;
    if (!WEATHER_TYPES[weatherId]) return;

    this.previousWeather = this.currentWeather;
    this.currentWeather = weatherId;

    var config = WEATHER_TYPES[weatherId];
    this.transitionDuration = config.transitionDuration;
    this.transitionStartTime = Date.now();
    this.isTransitioning = !instant;
    this.transitionProgress = instant ? 1 : 0;

    this.targetWindForce = config.windForce;
  };

  proto.interpolateWeatherParams = function(dt) {
    var target = WEATHER_TYPES[this.currentWeather];
    var prev = WEATHER_TYPES[this.previousWeather];
    var t = this.easeInOutCubic(this.transitionProgress);

    this.currentFriction = prev.frictionMultiplier * (1 - t) + target.frictionMultiplier * t;
    this.currentVisibility = prev.visibilityRange * (1 - t) + target.visibilityRange * t;
    this.currentDifficultyMod = prev.difficultyModifier * (1 - t) + target.difficultyModifier * t;

    this.currentWindForce += (this.targetWindForce - this.currentWindForce) * Math.min(1, dt * 2);
  };

  proto.easeInOutCubic = function(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  proto.getTerrainFriction = function(terrainType) {
    terrainType = terrainType || 'normal';
    var weatherId = this.currentWeather;
    var table = TERRAIN_FRICTION_TABLE[weatherId] || TERRAIN_FRICTION_TABLE.clear;
    return table[terrainType] || table.normal;
  };

  proto.getEffectiveFriction = function(baseFriction, terrainType) {
    var weatherFriction = this.getTerrainFriction(terrainType);
    return baseFriction * weatherFriction;
  };

  proto.getTerrainTypeAt = function(x, branchId, terrain) {
    var terrainType = 'normal';

    var weatherId = this.currentWeather;
    if (weatherId === 'rain' || weatherId === 'heavyRain') {
      terrainType = 'wet';
    } else if (weatherId === 'snow' || weatherId === 'blizzard') {
      terrainType = 'icy';
    } else if (weatherId === 'sandstorm') {
      terrainType = 'sandy';
    } else if (weatherId === 'fog') {
      terrainType = 'wet';
    }

    if (terrain && branchId) {
      var branchCfg = null;
      try {
        branchCfg = terrain.getBranchConfig(branchId);
      } catch (e) {
        branchCfg = null;
      }

      if (branchCfg && branchCfg.dangerZones) {
        for (var i = 0; i < branchCfg.dangerZones.length; i++) {
          var zone = branchCfg.dangerZones[i];
          if (x >= zone.startX && x <= zone.endX) {
            if (zone.type === 'slippery') {
              terrainType = 'icy';
            } else if (zone.type === 'rockfall') {
              terrainType = 'grassy';
            } else if (zone.type === 'cliff') {
              terrainType = 'sandy';
            }
            break;
          }
        }
      }

      if (branchCfg) {
        if (branchCfg.id === 'risky' && terrainType === 'normal') {
          terrainType = 'grassy';
        } else if (branchCfg.id === 'shortcut' && terrainType === 'normal') {
          terrainType = 'wet';
        } else if (branchCfg.id === 'skyroad' && terrainType === 'normal') {
          terrainType = 'icy';
        }
      }
    }

    return terrainType;
  };

  proto.getVisibilityRange = function() {
    return this.currentVisibility;
  };

  proto.getDifficultyModifier = function() {
    return this.currentDifficultyMod;
  };

  proto.getWindForce = function() {
    var gust = this.windGustActive ? this.windGustForce : 0;
    return this.currentWindForce + gust;
  };

  proto.updateParticles = function(carX, dt) {
    var config = WEATHER_TYPES[this.currentWeather];
    var targetCount = Math.floor(config.particleCount * this.transitionProgress +
      WEATHER_TYPES[this.previousWeather].particleCount * (1 - this.transitionProgress));

    while (this.particles.length < targetCount && this.particles.length < this.maxParticles) {
      this.spawnParticle(config, carX);
    }

    for (var i = this.particles.length - 1; i >= 0; i--) {
      var p = this.particles[i];
      p.life -= dt;

      if (p.life <= 0 || p.sprite.alpha <= 0) {
        p.sprite.destroy();
        this.particles.splice(i, 1);
        continue;
      }

      p.sprite.x += p.vx * dt;
      p.sprite.y += p.vy * dt;

      if (p.wobble) {
        p.wobblePhase += dt * p.wobbleSpeed;
        p.sprite.x += Math.sin(p.wobblePhase) * p.wobbleAmp * dt;
      }

      if (p.fadeIn) {
        p.fadeIn = false;
        p.sprite.setAlpha(p.targetAlpha);
      }

      var lifeRatio = p.life / p.maxLife;
      if (lifeRatio < 0.3) {
        p.sprite.setAlpha(p.targetAlpha * (lifeRatio / 0.3));
      }
    }
  };

  proto.spawnParticle = function(config, carX) {
    var width = this.scene.scale.width;
    var height = this.scene.scale.height;
    var cameraX = this.scene.cameras.main.scrollX;

    var isSnow = config.id === 'snow' || config.id === 'blizzard';
    var isSand = config.id === 'sandstorm';
    var isFog = config.id === 'fog';
    var isWind = config.id === 'wind';
    var isRain = config.id === 'rain' || config.id === 'heavyRain';

    var x, y, vx, vy, size, alpha, life;
    var color = config.particleColor;

    if (isRain) {
      x = cameraX + Math.random() * (width + 200) - 100;
      y = -10 - Math.random() * 100;
      vx = Math.cos(config.particleAngle) * config.particleSpeed * (0.8 + Math.random() * 0.4);
      vy = Math.sin(config.particleAngle) * config.particleSpeed * (0.8 + Math.random() * 0.4);
      size = config.id === 'heavyRain' ? 3 : 2;
      alpha = 0.4 + Math.random() * 0.3;
      life = 1.5 + Math.random();
    } else if (isSnow) {
      x = cameraX + Math.random() * (width + 300) - 150;
      y = -10 - Math.random() * 50;
      vx = (Math.random() - 0.5) * 40 + config.windForce * 0.3;
      vy = config.particleSpeed * (0.5 + Math.random() * 1.0);
      size = 2 + Math.random() * 4;
      alpha = 0.5 + Math.random() * 0.4;
      life = 4 + Math.random() * 3;
    } else if (isSand) {
      x = cameraX - 50;
      y = Math.random() * height;
      vx = config.particleSpeed * (0.6 + Math.random() * 0.8);
      vy = (Math.random() - 0.5) * 80;
      size = 1 + Math.random() * 3;
      alpha = 0.3 + Math.random() * 0.4;
      life = 2 + Math.random() * 2;
    } else if (isFog) {
      x = cameraX + Math.random() * width;
      y = Math.random() * height;
      vx = (Math.random() - 0.5) * 20;
      vy = (Math.random() - 0.5) * 10;
      size = 20 + Math.random() * 40;
      alpha = 0.08 + Math.random() * 0.12;
      life = 6 + Math.random() * 4;
    } else if (isWind) {
      x = cameraX - 30;
      y = 50 + Math.random() * (height - 100);
      vx = config.particleSpeed * (0.7 + Math.random() * 0.6);
      vy = (Math.random() - 0.5) * 30;
      size = 1 + Math.random() * 2;
      alpha = 0.2 + Math.random() * 0.2;
      life = 2 + Math.random();
    } else {
      return;
    }

    var sprite;
    if (isRain) {
      sprite = this.scene.add.graphics();
      sprite.fillStyle(color, alpha);
      sprite.fillRect(0, 0, 1, size * 3);
      sprite.x = x;
      sprite.y = y;
      sprite.rotation = config.particleAngle - Math.PI / 2 + (Math.random() - 0.5) * 0.1;
      sprite.setDepth(380);
    } else if (isFog) {
      sprite = this.scene.add.circle(x, y, size, color);
      sprite.setAlpha(0);
      sprite.setDepth(380);
    } else {
      sprite = this.scene.add.circle(x, y, size, color);
      sprite.setAlpha(alpha);
      sprite.setDepth(380);
    }

    var wobble = isSnow;
    var particle = {
      sprite: sprite,
      vx: vx,
      vy: vy,
      life: life,
      maxLife: life,
      targetAlpha: alpha,
      fadeIn: isFog,
      wobble: wobble,
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSpeed: 2 + Math.random() * 3,
      wobbleAmp: 15 + Math.random() * 25,
      type: config.id
    };

    this.particles.push(particle);
  };

  proto.updateOverlays = function() {
    var width = this.scene.scale.width;
    var height = this.scene.scale.height;
    var config = WEATHER_TYPES[this.currentWeather];
    var t = this.transitionProgress;

    if (this.weatherOverlay) {
      this.weatherOverlay.clear();
      if (config.overlayColor && config.overlayAlpha > 0) {
        var prevConfig = WEATHER_TYPES[this.previousWeather];
        var alpha = (prevConfig.overlayAlpha * (1 - t) + config.overlayAlpha * t);
        var color = config.overlayColor;
        this.weatherOverlay.fillStyle(color, alpha);
        this.weatherOverlay.fillRect(0, 0, width, height);
      }
      this.weatherOverlay.setAlpha(1);
    }

    if (this.fogOverlay) {
      this.fogOverlay.clear();
      if (this.currentVisibility < 0.9) {
        var fogAlpha = Math.max(0, (1 - this.currentVisibility) * 0.5);
        var cx = width / 2;
        var cy = height / 2;
        var innerR = width * this.currentVisibility * 0.3;
        var outerR = width * 0.7;

        this.fogOverlay.fillStyle(0x888888, fogAlpha);
        this.fogOverlay.fillRect(0, 0, width, height);

        this.fogOverlay.fillStyle(0x000000, 0);
        this.fogOverlay.beginPath();
        this.fogOverlay.arc(cx, cy, innerR, 0, Math.PI * 2);
        this.fogOverlay.fillPath();
      }
      this.fogOverlay.setAlpha(1);
    }
  };

  proto.updateLightning = function(dt) {
    if (this.currentWeather !== 'heavyRain') {
      if (this.lightningFlash) this.lightningFlash.setAlpha(0);
      this.lightningTimer = 0;
      return;
    }

    this.lightningTimer -= dt;
    if (this.lightningTimer <= 0) {
      this.lightningTimer = 5 + Math.random() * 15;
      this.triggerLightning();
    }

    if (this.thunderShakeTimer > 0) {
      this.thunderShakeTimer -= dt;
    }
  };

  proto.triggerLightning = function() {
    if (!this.lightningFlash) return;
    var self = this;

    this.lightningFlash.setAlpha(0.8);
    this.scene.tweens.add({
      targets: this.lightningFlash,
      alpha: { from: 0.8, to: 0 },
      duration: 150,
      ease: 'Quad.easeOut',
      onComplete: function() {
        self.lightningFlash.setAlpha(0);
      }
    });

    this.thunderShakeTimer = 0.5;
  };

  proto.updateWindGusts = function(dt) {
    var config = WEATHER_TYPES[this.currentWeather];
    if (config.windForce < 20) {
      this.windGustActive = false;
      this.windGustForce = 0;
      return;
    }

    this.windGustTimer -= dt;
    if (this.windGustTimer <= 0) {
      this.windGustTimer = 3 + Math.random() * 5;
      this.windGustActive = true;
      this.windGustForce = config.windForce * (0.5 + Math.random() * 1.0);

      var self = this;
      var gustDuration = 1000 + Math.random() * 1500;
      this.scene.time.delayedCall(gustDuration, function() {
        self.windGustActive = false;
        self.windGustForce = 0;
      });
    }
  };

  proto.applyWindForce = function(carPhysics, dt) {
    if (!carPhysics || !carPhysics.car) return;
    var wind = this.getWindForce();
    if (Math.abs(wind) < 1) return;

    var windEffect = wind * dt * 0.8;
    carPhysics.vx += windEffect;

    if (Math.abs(wind) > 40) {
      carPhysics.angularVelocity += (wind > 0 ? 1 : -1) * 0.02 * dt * Math.abs(wind) / 100;
    }
  };

  proto.applyWeatherDamage = function(carPhysics, dt) {
    var config = WEATHER_TYPES[this.currentWeather];
    if (config.damagePerSecond <= 0) return;
    this.damageAccumulator += config.damagePerSecond * dt;
  };

  proto.consumeWeatherDamage = function() {
    var config = WEATHER_TYPES[this.currentWeather];
    if (config.damagePerSecond <= 0) {
      this.damageAccumulator = 0;
      return 0;
    }

    var damage = Math.floor(this.damageAccumulator);
    if (damage > 0) {
      this.damageAccumulator -= damage;
    }
    return damage;
  };

  proto.updateSnowAccumulation = function(carX, dt) {
    var isSnowy = this.currentWeather === 'snow' || this.currentWeather === 'blizzard';
    if (!isSnowy) return;

    var segmentSize = 200;
    var segIdx = Math.floor(carX / segmentSize);
    if (!this.snowAccumulation[segIdx]) {
      this.snowAccumulation[segIdx] = 0;
    }
    var rate = this.currentWeather === 'blizzard' ? 3 : 1;
    this.snowAccumulation[segIdx] = Math.min(15, this.snowAccumulation[segIdx] + dt * rate);
  };

  proto.getSnowAccumulation = function(x) {
    var segIdx = Math.floor(x / 200);
    return this.snowAccumulation[segIdx] || 0;
  };

  proto.getWeatherConfig = function() {
    return WEATHER_TYPES[this.currentWeather];
  };

  proto.getWeatherName = function() {
    return WEATHER_TYPES[this.currentWeather].name;
  };

  proto.getWeatherIcon = function() {
    return WEATHER_TYPES[this.currentWeather].icon;
  };

  proto.getCurrentWeatherId = function() {
    return this.currentWeather;
  };

  proto.isThunderShaking = function() {
    return this.thunderShakeTimer > 0;
  };

  proto.getUpcomingWeather = function(carX) {
    for (var i = 0; i < this.weatherSequence.length; i++) {
      var entry = this.weatherSequence[i];
      if (carX < entry.startX) {
        var cfg = WEATHER_TYPES[entry.weather];
        return {
          weather: entry.weather,
          name: cfg.name,
          icon: cfg.icon,
          distance: entry.startX - carX
        };
      }
    }
    return null;
  };

  proto.setManualWeather = function(weatherId) {
    this.manualOverride = true;
    this.setWeather(weatherId);
  };

  proto.clearManualOverride = function() {
    this.manualOverride = false;
  };

  proto.destroy = function() {
    for (var i = 0; i < this.particles.length; i++) {
      this.particles[i].sprite.destroy();
    }
    this.particles = [];

    if (this.weatherOverlay) { this.weatherOverlay.destroy(); this.weatherOverlay = null; }
    if (this.fogOverlay) { this.fogOverlay.destroy(); this.fogOverlay = null; }
    if (this.lightningFlash) { this.lightningFlash.destroy(); this.lightningFlash = null; }
  };

  MountainRacer.WEATHER_TYPES = WEATHER_TYPES;
  MountainRacer.WEATHER_SEQUENCES = WEATHER_SEQUENCES;
  MountainRacer.TERRAIN_FRICTION_TABLE = TERRAIN_FRICTION_TABLE;

  window.MountainRacer = MountainRacer;
})();
