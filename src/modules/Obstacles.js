export class Obstacles {
  constructor(scene, terrain, config) {
    this.scene = scene;
    this.terrain = terrain;
    this.config = config;
    this.obstacles = [];
    this.spawn();
  }

  spawn() {
    const { length, obstacleDensity } = this.config;
    const totalCount = Math.floor(length * obstacleDensity);
    let lastX = 400;

    for (let i = 0; i < totalCount; i++) {
      const gap = 150 + Math.random() * 200;
      lastX += gap;
      if (lastX > length - 500) break;

      const roll = Math.random();

      if (roll < 0.45) {
        this.createRock(lastX);
      } else if (roll < 0.75) {
        this.createMud(lastX);
      } else {
        this.createRamp(lastX);
      }
    }
  }

  createRock(x) {
    const terrainY = this.terrain.getHeight(x);
    const size = 18 + Math.random() * 18;

    const container = this.scene.add.container(x, terrainY - size * 0.6);
    container.setDepth(12);
    container.setData('type', 'rock');
    container.setData('damage', 20);
    container.setData('slowdown', 0.5);

    const graphics = this.scene.add.graphics();
    const shade = 80 + Math.floor(Math.random() * 40);

    graphics.fillStyle(Phaser.Display.Color.GetColor(shade, shade - 10, shade - 20), 1);
    graphics.beginPath();

    const points = 7;
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const r = size * (0.7 + Math.random() * 0.6);
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r * 0.75;

      if (i === 0) {
        graphics.moveTo(px, py);
      } else {
        graphics.lineTo(px, py);
      }
    }
    graphics.closePath();
    graphics.fillPath();

    graphics.lineStyle(2, Phaser.Display.Color.GetColor(shade - 30, shade - 40, shade - 50), 1);
    graphics.strokePath();

    graphics.fillStyle(Phaser.Display.Color.GetColor(shade + 30, shade + 20, shade + 10), 0.6);
    graphics.beginPath();
    graphics.arc(-size * 0.2, -size * 0.2, size * 0.25, 0, Math.PI * 2);
    graphics.fillPath();

    container.add(graphics);
    container.setSize(size * 1.8, size * 1.5);

    const hitbox = this.scene.add.zone(x, terrainY - size * 0.6, size * 1.6, size * 1.2);
    this.scene.physics.world.enable(hitbox);
    hitbox.body.setAllowGravity(false);
    hitbox.body.setImmovable(true);
    container.setData('hitbox', hitbox);

    this.obstacles.push(container);
  }

  createMud(x) {
    const terrainY = this.terrain.getHeight(x);
    const width = 80 + Math.random() * 60;
    const height = 8;

    const container = this.scene.add.container(x, terrainY - 2);
    container.setDepth(7);
    container.setData('type', 'mud');
    container.setData('damage', 0);
    container.setData('slowdown', 0.4);

    const graphics = this.scene.add.graphics();

    graphics.fillStyle(0x4a2c0a, 0.85);
    graphics.fillEllipse(0, 0, width, height);

    graphics.fillStyle(0x3d240a, 0.6);
    for (let i = 0; i < 5; i++) {
      const bx = Phaser.Math.Between(-width / 2 + 8, width / 2 - 8);
      const by = Phaser.Math.Between(-2, 2);
      graphics.fillCircle(bx, by, 2 + Math.random() * 3);
    }

    graphics.lineStyle(1, 0x2a1808, 0.7);
    graphics.strokeEllipse(0, 0, width, height);

    container.add(graphics);
    container.setSize(width, height * 2);

    const hitbox = this.scene.add.zone(x, terrainY - 2, width * 0.85, height * 1.5);
    this.scene.physics.world.enable(hitbox);
    hitbox.body.setAllowGravity(false);
    hitbox.body.setImmovable(true);
    container.setData('hitbox', hitbox);

    this.obstacles.push(container);
  }

  createRamp(x) {
    const terrainY = this.terrain.getHeight(x);
    const width = 100;
    const rampHeight = 50;
    const terrainAngle = this.terrain.getAngle(x);

    const container = this.scene.add.container(x, terrainY);
    container.setDepth(10);
    container.setData('type', 'ramp');
    container.setData('damage', 0);
    container.setData('slowdown', 1);
    container.setData('boost', true);

    const graphics = this.scene.add.graphics();

    graphics.fillGradientStyle(0x8b4513, 0x8b4513, 0x654321, 0x654321);
    graphics.beginPath();
    graphics.moveTo(-width / 2, 0);
    graphics.lineTo(width / 2, 0);
    graphics.lineTo(width / 2, -rampHeight);
    graphics.closePath();
    graphics.fillPath();

    graphics.fillGradientStyle(0xdaa520, 0xdaa520, 0xb8860b, 0xb8860b);
    graphics.lineStyle(3, 0xffd700, 1);
    graphics.beginPath();
    graphics.moveTo(-width / 2, 0);
    graphics.lineTo(width / 2, -rampHeight);
    graphics.strokePath();

    const stripeCount = 5;
    graphics.lineStyle(2, 0xff0000, 0.8);
    for (let i = 0; i < stripeCount; i++) {
      const t = (i + 0.5) / stripeCount;
      const sx = Phaser.Math.Linear(-width / 2, width / 2, t);
      const sy = Phaser.Math.Linear(0, -rampHeight, t);
      const ex = sx + 10 * Math.sin(terrainAngle);
      const ey = sy - 10 * Math.cos(terrainAngle);
      graphics.beginPath();
      graphics.moveTo(sx, sy);
      graphics.lineTo(ex, ey);
      graphics.strokePath();
    }

    container.add(graphics);
    container.setSize(width, rampHeight + 10);

    const hitbox = this.scene.add.zone(x, terrainY - rampHeight / 2, width * 0.9, rampHeight);
    this.scene.physics.world.enable(hitbox);
    hitbox.body.setAllowGravity(false);
    hitbox.body.setImmovable(true);
    container.setData('hitbox', hitbox);

    this.obstacles.push(container);
  }

  checkCollisions(carBounds, carPhysics) {
    let result = null;

    for (const obs of this.obstacles) {
      if (obs.getData('hit')) continue;

      const hitbox = obs.getData('hitbox');
      if (!hitbox) continue;

      const hb = hitbox.getBounds();
      if (Phaser.Geom.Rectangle.Overlaps(carBounds, hb)) {
        const type = obs.getData('type');
        const damage = obs.getData('damage');
        const slowdown = obs.getData('slowdown');

        if (type === 'ramp') {
          result = { type: 'ramp', boost: obs.getData('boost') };
        } else if (type === 'rock') {
          obs.setData('hit', true);
          this.createHitEffect(obs);
          result = { type: 'rock', damage, slowdown };
        } else if (type === 'mud') {
          result = { type: 'mud', slowdown };
        }
      }
    }

    return result;
  }

  createHitEffect(obstacle) {
    this.scene.tweens.add({
      targets: obstacle,
      x: obstacle.x + Phaser.Math.Between(-5, 5),
      y: obstacle.y + Phaser.Math.Between(-5, 5),
      duration: 60,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        obstacle.setAlpha(0.6);
        this.scene.tweens.add({
          targets: obstacle,
          alpha: 0.2,
          duration: 300
        });
      }
    });

    for (let i = 0; i < 10; i++) {
      const particle = this.scene.add.circle(
        obstacle.x + Phaser.Math.Between(-15, 15),
        obstacle.y + Phaser.Math.Between(-10, 10),
        2 + Math.random() * 3,
        0x888888
      );
      particle.setDepth(18);

      this.scene.tweens.add({
        targets: particle,
        x: particle.x + Phaser.Math.Between(-80, 80),
        y: particle.y + Phaser.Math.Between(-120, -30),
        alpha: 0,
        duration: 400 + Math.random() * 300,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }
  }

  destroy() {
    for (const obs of this.obstacles) {
      const hitbox = obs.getData('hitbox');
      if (hitbox) hitbox.destroy();
      obs.destroy();
    }
    this.obstacles = [];
  }
}
