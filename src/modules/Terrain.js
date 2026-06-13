export const LEVEL_CONFIGS = {
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

export class Terrain {
  constructor(scene, level) {
    this.scene = scene;
    this.config = LEVEL_CONFIGS[level] || LEVEL_CONFIGS[1];
    this.points = [];
    this.texture = null;
    this.generate();
  }

  noise2D(x, y, seed = 0) {
    const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 43758.5453) * 43758.5453;
    return n - Math.floor(n);
  }

  smoothNoise(x, seed = 0) {
    const intX = Math.floor(x);
    const fracX = x - intX;
    const v1 = this.noise2D(intX, 0, seed);
    const v2 = this.noise2D(intX + 1, 0, seed);
    const i = fracX * fracX * (3 - 2 * fracX);
    return v1 * (1 - i) + v2 * i;
  }

  fbm(x, seed = 0) {
    let total = 0;
    let freq = 1;
    let amp = 1;
    let maxValue = 0;
    for (let i = 0; i < 4; i++) {
      total += this.smoothNoise(x * freq, seed + i * 100) * amp;
      maxValue += amp;
      amp *= 0.5;
      freq *= 2;
    }
    return total / maxValue;
  }

  generate() {
    const { length, baseHeight, amplitude, roughness } = this.config;
    const step = 4;
    this.points = [];

    for (let x = 0; x <= length; x += step) {
      const n1 = this.fbm(x * roughness, 1) * 2 - 1;
      const n2 = this.fbm(x * roughness * 3, 2) * 2 - 1;
      const combined = n1 * 0.7 + n2 * 0.3;

      let y = baseHeight + combined * amplitude;

      if (x > length - 300) {
        const t = (x - (length - 300)) / 300;
        y = y * (1 - t) + (baseHeight + 100) * t;
      }

      if (x < 200) {
        const t = x / 200;
        y = (baseHeight + 100) * (1 - t) + y * t;
      }

      this.points.push({ x, y });
    }
  }

  getHeight(x) {
    if (x <= 0) return this.points[0]?.y ?? 450;
    if (x >= this.config.length) {
      return this.points[this.points.length - 1]?.y ?? 450;
    }

    const step = 4;
    const idx = Math.floor(x / step);
    const i1 = Math.min(idx, this.points.length - 1);
    const i2 = Math.min(idx + 1, this.points.length - 1);
    const p1 = this.points[i1];
    const p2 = this.points[i2];

    if (p1.x === p2.x) return p1.y;

    const t = (x - p1.x) / (p2.x - p1.x);
    return p1.y + (p2.y - p1.y) * t;
  }

  getAngle(x) {
    const h1 = this.getHeight(x - 10);
    const h2 = this.getHeight(x + 10);
    return Math.atan2(h2 - h1, 20);
  }

  getNormal(x) {
    const angle = this.getAngle(x);
    return { x: -Math.sin(angle), y: Math.cos(angle) };
  }

  render() {
    const { length, bgLayers } = this.config;
    const height = 600;

    this.renderBackground(bgLayers, length, height);
    this.renderForeground(length, height);
  }

  renderBackground(layers, length, height) {
    const colors = [
      ['#6b8e23', '#556b2f'],
      ['#556b2f', '#3e511f'],
      ['#3e511f', '#2d3e16'],
      ['#2d3e16', '#1e2b0e'],
      ['#1e2b0e', '#141d08']
    ];

    for (let i = 0; i < layers; i++) {
      const parallax = 0.2 + i * 0.15;
      const amp = 40 + i * 30;
      const baseY = 300 + i * 50;

      const graphics = this.scene.add.graphics();
      const [c1, c2] = colors[i % colors.length];
      graphics.fillGradientStyle(
        Phaser.Display.Color.HexStringToColor(c1).color,
        Phaser.Display.Color.HexStringToColor(c1).color,
        Phaser.Display.Color.HexStringToColor(c2).color,
        Phaser.Display.Color.HexStringToColor(c2).color
      );

      graphics.beginPath();
      graphics.moveTo(0, height);

      for (let x = 0; x <= 800; x += 10) {
        const worldX = x / parallax;
        const n = this.fbm(worldX * 0.003 + i * 50, i + 50) * 2 - 1;
        const y = baseY + n * amp;
        graphics.lineTo(x, y);
      }

      graphics.lineTo(800, height);
      graphics.closePath();
      graphics.fillPath();
      graphics.setScrollFactor(parallax);
      graphics.setDepth(-10 - i);
    }

    const skyGraphics = this.scene.add.graphics();
    skyGraphics.fillGradientStyle(0x87ceeb, 0x87ceeb, 0xe0f6ff, 0xe0f6ff);
    skyGraphics.fillRect(0, 0, 800, 350);
    skyGraphics.setScrollFactor(0);
    skyGraphics.setDepth(-100);

    for (let i = 0; i < 6; i++) {
      const cloudX = Phaser.Math.Between(0, length);
      const cloudY = Phaser.Math.Between(30, 150);
      this.createCloud(cloudX, cloudY, 0.3 + Math.random() * 0.4);
    }
  }

  createCloud(x, y, scale) {
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0xffffff, 0.85);

    const s = scale;
    graphics.fillCircle(0, 0, 30 * s);
    graphics.fillCircle(35 * s, -5 * s, 25 * s);
    graphics.fillCircle(60 * s, 0, 30 * s);
    graphics.fillCircle(25 * s, 10 * s, 22 * s);
    graphics.fillCircle(50 * s, 12 * s, 24 * s);

    graphics.x = x;
    graphics.y = y;
    graphics.setScrollFactor(0.15);
    graphics.setDepth(-50);
  }

  renderForeground(length, height) {
    const mainGraphics = this.scene.add.graphics();
    mainGraphics.setDepth(5);

    mainGraphics.fillGradientStyle(0x8b7355, 0x8b7355, 0x654321, 0x654321);
    mainGraphics.beginPath();
    mainGraphics.moveTo(0, height);

    for (const p of this.points) {
      mainGraphics.lineTo(p.x, p.y);
    }

    mainGraphics.lineTo(length, height);
    mainGraphics.closePath();
    mainGraphics.fillPath();

    const topGraphics = this.scene.add.graphics();
    topGraphics.setDepth(6);
    topGraphics.lineStyle(5, 0x228b22, 1);
    topGraphics.beginPath();

    for (let i = 0; i < this.points.length; i++) {
      const p = this.points[i];
      if (i === 0) {
        topGraphics.moveTo(p.x, p.y);
      } else {
        topGraphics.lineTo(p.x, p.y);
      }
    }
    topGraphics.strokePath();

    const grassGraphics = this.scene.add.graphics();
    grassGraphics.setDepth(6);

    for (const p of this.points) {
      if (Math.random() < 0.08) {
        const nx = -Math.sin(this.getAngle(p.x));
        const ny = Math.cos(this.getAngle(p.x));
        const gh = 8 + Math.random() * 8;
        grassGraphics.lineStyle(2, 0x32cd32, 0.8);
        grassGraphics.beginPath();
        grassGraphics.moveTo(p.x, p.y);
        grassGraphics.lineTo(p.x + nx * gh + (Math.random() - 0.5) * 4, p.y - ny * gh);
        grassGraphics.strokePath();
      }
    }

    const flagGraphics = this.scene.add.graphics();
    flagGraphics.setDepth(20);
    const endX = length - 100;
    const endY = this.getHeight(endX);

    flagGraphics.fillStyle(0x8b4513);
    flagGraphics.fillRect(endX, endY - 100, 6, 100);

    flagGraphics.fillStyle(0xff0000);
    flagGraphics.fillTriangle(endX + 6, endY - 100, endX + 50, endY - 85, endX + 6, endY - 70);

    flagGraphics.fillStyle(0xffd700);
    flagGraphics.fillCircle(endX + 3, endY - 100, 5);

    const endZone = this.scene.add.zone(endX, endY - 50, 80, 100);
    this.scene.physics.world.enable(endZone);
    endZone.body.setAllowGravity(false);
    endZone.body.setImmovable(true);
    this.endZone = endZone;
  }
}
