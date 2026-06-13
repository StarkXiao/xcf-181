(function() {
  var MountainRacer = window.MountainRacer || {};

  MountainRacer.LEVEL_CONFIGS = {
    1: {
      name: '初级赛道',
      length: 5000,
      baseHeight: 450,
      amplitude: 60,
      roughness: 0.006,
      obstacleDensity: 0.015,
      bgLayers: 3
    },
    2: {
      name: '中级赛道',
      length: 8000,
      baseHeight: 430,
      amplitude: 90,
      roughness: 0.008,
      obstacleDensity: 0.025,
      bgLayers: 4
    },
    3: {
      name: '高级赛道',
      length: 12000,
      baseHeight: 400,
      amplitude: 120,
      roughness: 0.01,
      obstacleDensity: 0.035,
      bgLayers: 5
    }
  };

  MountainRacer.Terrain = function(scene, level) {
    this.scene = scene;
    this.config = MountainRacer.LEVEL_CONFIGS[level] || MountainRacer.LEVEL_CONFIGS[1];
    this.points = [];
    this.texture = null;
    this.generate();
  };

  var proto = MountainRacer.Terrain.prototype;

  proto.noise2D = function(x, y, seed) {
    seed = seed || 0;
    var n = Math.sin(x * 12.9898 + y * 78.233 + seed * 43758.5453) * 43758.5453;
    return n - Math.floor(n);
  };

  proto.smoothNoise = function(x, seed) {
    seed = seed || 0;
    var intX = Math.floor(x);
    var fracX = x - intX;
    var v1 = this.noise2D(intX, 0, seed);
    var v2 = this.noise2D(intX + 1, 0, seed);
    var i = fracX * fracX * (3 - 2 * fracX);
    return v1 * (1 - i) + v2 * i;
  };

  proto.fbm = function(x, seed) {
    seed = seed || 0;
    var total = 0;
    var freq = 1;
    var amp = 1;
    var maxValue = 0;
    for (var i = 0; i < 4; i++) {
      total += this.smoothNoise(x * freq, seed + i * 100) * amp;
      maxValue += amp;
      amp *= 0.5;
      freq *= 2;
    }
    return total / maxValue;
  };

  proto.generate = function() {
    var config = this.config;
    var length = config.length;
    var baseHeight = config.baseHeight;
    var amplitude = config.amplitude;
    var roughness = config.roughness;
    var step = 4;
    this.points = [];

    for (var x = 0; x <= length; x += step) {
      var n1 = this.fbm(x * roughness, 1) * 2 - 1;
      var n2 = this.fbm(x * roughness * 3, 2) * 2 - 1;
      var combined = n1 * 0.7 + n2 * 0.3;

      var y = baseHeight + combined * amplitude;

      if (x > length - 300) {
        var t = (x - (length - 300)) / 300;
        y = y * (1 - t) + (baseHeight + 100) * t;
      }

      if (x < 200) {
        var t2 = x / 200;
        y = (baseHeight + 100) * (1 - t2) + y * t2;
      }

      this.points.push({ x: x, y: y });
    }
  };

  proto.getHeight = function(x) {
    if (x <= 0) return this.points[0] ? this.points[0].y : 450;
    if (x >= this.config.length) {
      return this.points[this.points.length - 1] ? this.points[this.points.length - 1].y : 450;
    }

    var step = 4;
    var idx = Math.floor(x / step);
    var i1 = Math.min(idx, this.points.length - 1);
    var i2 = Math.min(idx + 1, this.points.length - 1);
    var p1 = this.points[i1];
    var p2 = this.points[i2];

    if (p1.x === p2.x) return p1.y;

    var t = (x - p1.x) / (p2.x - p1.x);
    return p1.y + (p2.y - p1.y) * t;
  };

  proto.getAngle = function(x) {
    var h1 = this.getHeight(x - 10);
    var h2 = this.getHeight(x + 10);
    return Math.atan2(h2 - h1, 20);
  };

  proto.getNormal = function(x) {
    var angle = this.getAngle(x);
    return { x: -Math.sin(angle), y: Math.cos(angle) };
  };

  proto.render = function() {
    var length = this.config.length;
    var bgLayers = this.config.bgLayers;
    var height = 600;

    this.renderBackground(bgLayers, length, height);
    this.renderForeground(length, height);
  };

  proto.renderBackground = function(layers, length, height) {
    var colors = [
      ['#6b8e23', '#556b2f'],
      ['#556b2f', '#3e511f'],
      ['#3e511f', '#2d3e16'],
      ['#2d3e16', '#1e2b0e'],
      ['#1e2b0e', '#141d08']
    ];

    for (var i = 0; i < layers; i++) {
      var parallax = 0.2 + i * 0.15;
      var amp = 40 + i * 30;
      var baseY = 300 + i * 50;

      var graphics = this.scene.add.graphics();
      var c1 = Phaser.Display.Color.HexStringToColor(colors[i % colors.length][0]).color;
      var c2 = Phaser.Display.Color.HexStringToColor(colors[i % colors.length][1]).color;
      graphics.fillGradientStyle(c1, c1, c2, c2);

      graphics.beginPath();
      graphics.moveTo(0, height);

      for (var x = 0; x <= 800; x += 10) {
        var worldX = x / parallax;
        var n = this.fbm(worldX * 0.003 + i * 50, i + 50) * 2 - 1;
        var y = baseY + n * amp;
        graphics.lineTo(x, y);
      }

      graphics.lineTo(800, height);
      graphics.closePath();
      graphics.fillPath();
      graphics.setScrollFactor(parallax);
      graphics.setDepth(-10 - i);
    }

    var skyGraphics = this.scene.add.graphics();
    skyGraphics.fillGradientStyle(0x87ceeb, 0x87ceeb, 0xe0f6ff, 0xe0f6ff);
    skyGraphics.fillRect(0, 0, 800, 350);
    skyGraphics.setScrollFactor(0);
    skyGraphics.setDepth(-100);

    for (var j = 0; j < 6; j++) {
      var cloudX = Phaser.Math.Between(0, length);
      var cloudY = Phaser.Math.Between(30, 150);
      this.createCloud(cloudX, cloudY, 0.3 + Math.random() * 0.4);
    }
  };

  proto.createCloud = function(x, y, scale) {
    var graphics = this.scene.add.graphics();
    graphics.fillStyle(0xffffff, 0.85);

    var s = scale;
    graphics.fillCircle(0, 0, 30 * s);
    graphics.fillCircle(35 * s, -5 * s, 25 * s);
    graphics.fillCircle(60 * s, 0, 30 * s);
    graphics.fillCircle(25 * s, 10 * s, 22 * s);
    graphics.fillCircle(50 * s, 12 * s, 24 * s);

    graphics.x = x;
    graphics.y = y;
    graphics.setScrollFactor(0.15);
    graphics.setDepth(-50);
  };

  proto.renderForeground = function(length, height) {
    var mainGraphics = this.scene.add.graphics();
    mainGraphics.setDepth(5);

    mainGraphics.fillGradientStyle(0x8b7355, 0x8b7355, 0x654321, 0x654321);
    mainGraphics.beginPath();
    mainGraphics.moveTo(0, height);

    for (var i = 0; i < this.points.length; i++) {
      var p = this.points[i];
      mainGraphics.lineTo(p.x, p.y);
    }

    mainGraphics.lineTo(length, height);
    mainGraphics.closePath();
    mainGraphics.fillPath();

    var topGraphics = this.scene.add.graphics();
    topGraphics.setDepth(6);
    topGraphics.lineStyle(5, 0x228b22, 1);
    topGraphics.beginPath();

    for (var j = 0; j < this.points.length; j++) {
      var p2 = this.points[j];
      if (j === 0) {
        topGraphics.moveTo(p2.x, p2.y);
      } else {
        topGraphics.lineTo(p2.x, p2.y);
      }
    }
    topGraphics.strokePath();

    var grassGraphics = this.scene.add.graphics();
    grassGraphics.setDepth(6);

    for (var k = 0; k < this.points.length; k++) {
      var p3 = this.points[k];
      if (Math.random() < 0.08) {
        var angle = this.getAngle(p3.x);
        var nx = -Math.sin(angle);
        var ny = Math.cos(angle);
        var gh = 8 + Math.random() * 8;
        grassGraphics.lineStyle(2, 0x32cd32, 0.8);
        grassGraphics.beginPath();
        grassGraphics.moveTo(p3.x, p3.y);
        grassGraphics.lineTo(p3.x + nx * gh + (Math.random() - 0.5) * 4, p3.y - ny * gh);
        grassGraphics.strokePath();
      }
    }

    var flagGraphics = this.scene.add.graphics();
    flagGraphics.setDepth(20);
    var endX = length - 100;
    var endY = this.getHeight(endX);

    flagGraphics.fillStyle(0x8b4513);
    flagGraphics.fillRect(endX, endY - 100, 6, 100);

    flagGraphics.fillStyle(0xff0000);
    flagGraphics.fillTriangle(endX + 6, endY - 100, endX + 50, endY - 85, endX + 6, endY - 70);

    flagGraphics.fillStyle(0xffd700);
    flagGraphics.fillCircle(endX + 3, endY - 100, 5);

    var endZone = this.scene.add.zone(endX, endY - 50, 80, 100);
    this.scene.physics.world.enable(endZone);
    endZone.body.setAllowGravity(false);
    endZone.body.setImmovable(true);
    this.endZone = endZone;
  };

  window.MountainRacer = MountainRacer;
})();
