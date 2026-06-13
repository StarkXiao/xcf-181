(function(global) {
  'use strict';

  class CarPhysics {
    constructor(scene) {
      this.scene = scene;
      this.car = null;
      this.wheelFL = null;
      this.wheelFR = null;
      this.wheelBL = null;
      this.wheelBR = null;
      this.carBody = null;

      this.maxSpeed = 600;
      this.acceleration = 250;
      this.brakeAcceleration = 400;
      this.friction = 0.98;
      this.airFriction = 0.995;
      this.gravity = 900;

      this.isGrounded = false;
      this.wheelRadius = 12;
      this.carWidth = 60;
      this.carHeight = 24;
      this.wheelBase = 40;

      this.suspensionLength = 8;
      this.suspensionStiffness = 0.5;
      this.suspensionDamping = 0.2;

      this.suspensionVelFL = 0;
      this.suspensionVelFR = 0;
      this.suspensionVelBL = 0;
      this.suspensionVelBR = 0;

      this.bounceTimer = 0;
      this.trailPoints = [];
    }

    create(x, y) {
      this.car = this.scene.add.container(x, y);
      this.car.setDepth(50);

      const bodyGraphics = this.scene.add.graphics();
      bodyGraphics.fillStyle(0xff4500, 1);
      bodyGraphics.fillRoundedRect(-30, -28, 60, 22, 4);

      bodyGraphics.fillStyle(0xff6347, 1);
      bodyGraphics.fillRoundedRect(-12, -40, 28, 14, 3);

      bodyGraphics.fillStyle(0x87ceeb, 0.8);
      bodyGraphics.fillRoundedRect(-8, -38, 22, 10, 2);

      bodyGraphics.lineStyle(2, 0x8b0000, 1);
      bodyGraphics.strokeRoundedRect(-30, -28, 60, 22, 4);

      bodyGraphics.fillStyle(0xffff00, 1);
      bodyGraphics.fillCircle(26, -20, 3);
      bodyGraphics.fillCircle(26, -12, 3);

      bodyGraphics.fillStyle(0xff0000, 0.9);
      bodyGraphics.fillCircle(-26, -20, 3);
      bodyGraphics.fillCircle(-26, -12, 3);

      bodyGraphics.fillStyle(0x222222, 1);
      bodyGraphics.fillRoundedRect(-8, -18, 16, 10, 2);

      this.car.add(bodyGraphics);

      this.wheelFL = this.createWheel(-20, 0);
      this.wheelFR = this.createWheel(20, 0);
      this.wheelBL = this.createWheel(-20, 12);
      this.wheelBR = this.createWheel(20, 12);

      this.car.add([this.wheelFL.sprite, this.wheelFR.sprite, this.wheelBL.sprite, this.wheelBR.sprite]);

      this.vx = 0;
      this.vy = 0;
      this.angularVelocity = 0;
      this.angle = 0;
      this.lastAngle = 0;

      this.trailGraphics = this.scene.add.graphics();
      this.trailGraphics.setDepth(8);

      return this.car;
    }

    createWheel(offsetX, offsetY) {
      const graphics = this.scene.add.graphics();

      graphics.fillStyle(0x1a1a1a, 1);
      graphics.fillCircle(0, 0, this.wheelRadius);

      graphics.fillStyle(0x444444, 1);
      graphics.fillCircle(0, 0, this.wheelRadius - 4);

      graphics.fillStyle(0x888888, 1);
      graphics.fillCircle(0, 0, 3);

      graphics.lineStyle(1.5, 0x333333, 1);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        graphics.beginPath();
        graphics.moveTo(Math.cos(a) * 4, Math.sin(a) * 4);
        graphics.lineTo(Math.cos(a) * (this.wheelRadius - 5), Math.sin(a) * (this.wheelRadius - 5));
        graphics.strokePath();
      }

      return {
        sprite: graphics,
        offsetX: offsetX,
        offsetY: offsetY,
        rotation: 0,
        suspensionOffset: 0
      };
    }

    update(deltaTime, terrain, input) {
      const dt = Math.min(deltaTime / 1000, 0.033);
      const carX = this.car.x;
      const carY = this.car.y;

      this.wheelFL.worldX = carX + Math.cos(this.angle) * this.wheelFL.offsetX - Math.sin(this.angle) * this.wheelFL.offsetY;
      this.wheelFL.worldY = carY + Math.sin(this.angle) * this.wheelFL.offsetX + Math.cos(this.angle) * this.wheelFL.offsetY;
      this.wheelFR.worldX = carX + Math.cos(this.angle) * this.wheelFR.offsetX - Math.sin(this.angle) * this.wheelFR.offsetY;
      this.wheelFR.worldY = carY + Math.sin(this.angle) * this.wheelFR.offsetX + Math.cos(this.angle) * this.wheelFR.offsetY;
      this.wheelBL.worldX = carX + Math.cos(this.angle) * this.wheelBL.offsetX - Math.sin(this.angle) * this.wheelBL.offsetY;
      this.wheelBL.worldY = carY + Math.sin(this.angle) * this.wheelBL.offsetX + Math.cos(this.angle) * this.wheelBL.offsetY;
      this.wheelBR.worldX = carX + Math.cos(this.angle) * this.wheelBR.offsetX - Math.sin(this.angle) * this.wheelBR.offsetY;
      this.wheelBR.worldY = carY + Math.sin(this.angle) * this.wheelBR.offsetX + Math.cos(this.angle) * this.wheelBR.offsetY;

      this.vy += this.gravity * dt;

      const wheels = [this.wheelFL, this.wheelFR, this.wheelBL, this.wheelBR];
      let groundedCount = 0;
      let normalSumX = 0;
      let normalSumY = 0;

      for (let i = 0; i < wheels.length; i++) {
        const wheel = wheels[i];
        const terrainY = terrain.getHeight(wheel.worldX);
        const wheelBottom = wheel.worldY + this.wheelRadius;
        const penetration = wheelBottom - terrainY;

        if (penetration > 0) {
          groundedCount++;
          const normal = terrain.getNormal(wheel.worldX);
          normalSumX += normal.x;
          normalSumY += normal.y;

          const targetSuspension = -Math.min(penetration, this.suspensionLength * 2);
          const springForce = (targetSuspension - wheel.suspensionOffset) * this.suspensionStiffness;
          wheel.suspensionOffset += springForce;
          wheel.suspensionOffset = Math.max(-this.suspensionLength * 2, Math.min(this.suspensionLength * 0.5, wheel.suspensionOffset));

          const liftForce = penetration * 15;
          this.vy -= liftForce * dt * 60;

          const terrainAngle = terrain.getAngle(wheel.worldX);
          const normalVel = this.vx * Math.sin(terrainAngle) + this.vy * Math.cos(terrainAngle);

          if (normalVel > 200) {
            this.vy = 0;
            this.bounceTimer = 0.1;
            this.createBounceParticles(wheel.worldX, terrainY);
          }
        } else {
          wheel.suspensionOffset *= 0.9;
        }
      }

      this.isGrounded = groundedCount > 0;

      if (this.isGrounded) {
        const avgNormalX = normalSumX / groundedCount;
        const avgNormalY = normalSumY / groundedCount;
        const targetAngle = Math.atan2(-avgNormalX, avgNormalY);

        const angleDiff = Phaser.Math.Angle.Wrap(targetAngle - this.angle);
        this.angle += angleDiff * Math.min(dt * 8, 1);
      } else {
        this.angularVelocity += (input.right - input.left) * 3 * dt;
        this.angularVelocity *= 0.98;
        this.angle += this.angularVelocity * dt;
      }

      if (this.isGrounded) {
        const terrainAngle = terrain.getAngle(carX);
        const forwardDirX = Math.cos(terrainAngle);
        const forwardDirY = Math.sin(terrainAngle);

        if (input.accelerate) {
          this.vx += forwardDirX * this.acceleration * dt;
          this.vy += forwardDirY * this.acceleration * dt;
        }
        if (input.brake) {
          this.vx -= forwardDirX * this.brakeAcceleration * dt;
          this.vy -= forwardDirY * this.brakeAcceleration * dt;
        }

        this.vx *= this.friction;
        this.vy *= this.friction;

        const gravityAlong = Math.sin(terrainAngle) * this.gravity * 0.3;
        this.vx += gravityAlong * Math.cos(terrainAngle) * dt;
        this.vy += gravityAlong * Math.sin(terrainAngle) * dt;
      } else {
        this.vx *= this.airFriction;
        this.vy *= this.airFriction;
      }

      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (speed > this.maxSpeed) {
        const scale = this.maxSpeed / speed;
        this.vx *= scale;
        this.vy *= scale;
      }

      this.car.x += this.vx * dt;
      this.car.y += this.vy * dt;

      this.car.rotation = this.angle;

      this.updateWheelPositions();
      this.updateWheelRotation(dt);

      this.bounceTimer = Math.max(0, this.bounceTimer - dt);

      if (this.isGrounded && Math.abs(this.vx) > 50) {
        this.updateTrail(terrain);
      }

      if (this.car.y > 700) {
        return 'fell';
      }

      return null;
    }

    updateWheelPositions() {
      const wheels = [this.wheelFL, this.wheelFR, this.wheelBL, this.wheelBR];
      const baseY = this.carHeight / 2;

      for (let i = 0; i < wheels.length; i++) {
        const wheel = wheels[i];
        let x = wheel.offsetX;
        let y = baseY + wheel.suspensionOffset;

        wheel.sprite.x = x;
        wheel.sprite.y = y;
      }
    }

    updateWheelRotation(dt) {
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      const rotationSpeed = (speed / this.wheelRadius) * dt;

      this.wheelFL.sprite.rotation += rotationSpeed;
      this.wheelFR.sprite.rotation += rotationSpeed;
      this.wheelBL.sprite.rotation += rotationSpeed;
      this.wheelBR.sprite.rotation += rotationSpeed;
    }

    updateTrail(terrain) {
      const wheels = [this.wheelBL, this.wheelBR];

      for (let i = 0; i < wheels.length; i++) {
        const wheel = wheels[i];
        const worldX = this.car.x + Math.cos(this.angle) * wheel.offsetX - Math.sin(this.angle) * (this.carHeight / 2 + wheel.suspensionOffset);
        const worldY = terrain.getHeight(worldX) - 2;

        this.trailPoints.push({ x: worldX, y: worldY, alpha: 1, time: Date.now() });
      }

      const now = Date.now();
      this.trailPoints = this.trailPoints.filter(function(p) { return now - p.time < 3000; });

      this.trailGraphics.clear();
      for (let i = 0; i < this.trailPoints.length; i++) {
        const p = this.trailPoints[i];
        const age = (now - p.time) / 3000;
        const alpha = 1 - age;
        this.trailGraphics.lineStyle(3, 0x4a3728, alpha * 0.5);
        this.trailGraphics.fillPoint(p.x, p.y, 3);
      }
    }

    createBounceParticles(x, y) {
      for (let i = 0; i < 8; i++) {
        const particle = this.scene.add.circle(x + Phaser.Math.Between(-10, 10), y, 2 + Math.random() * 2, 0x8b7355);
        particle.setDepth(15);

        const vx = Phaser.Math.Between(-100, 100);
        const vy = Phaser.Math.Between(-200, -50);

        this.scene.tweens.add({
          targets: particle,
          x: particle.x + vx,
          y: particle.y + vy,
          alpha: 0,
          duration: 500,
          ease: 'Power2',
          onComplete: function() { particle.destroy(); }
        });
      }
    }

    getSpeed() {
      return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    }

    getBounds() {
      return new Phaser.Geom.Rectangle(
        this.car.x - this.carWidth / 2,
        this.car.y - this.carHeight,
        this.carWidth,
        this.carHeight + this.wheelRadius * 2
      );
    }

    applyDamage() {
      const self = this;
      this.car.each(function(child) {
        if (child.type === 'Graphics') {
          self.scene.tweens.add({
            targets: child,
            alpha: { from: 1, to: 0.3 },
            duration: 80,
            yoyo: true,
            repeat: 4
          });
        }
      });
    }

    slowDown(amount) {
      this.vx *= amount;
      this.vy *= amount;
    }

    destroy() {
      if (this.trailGraphics) this.trailGraphics.destroy();
      if (this.car) this.car.destroy();
    }
  }

  global.MountainRacer = global.MountainRacer || {};
  global.MountainRacer.CarPhysics = CarPhysics;

})(window);
