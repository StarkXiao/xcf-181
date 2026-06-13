(function() {
  var MountainRacer = window.MountainRacer || {};

  MountainRacer.CarPhysics = function(scene) {
    this.scene = scene;
    this.car = null;
    this.wheelFL = null;
    this.wheelFR = null;
    this.wheelBL = null;
    this.wheelBR = null;

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

    this.vx = 0;
    this.vy = 0;
    this.angularVelocity = 0;
    this.angle = 0;
    this.lastAngle = 0;
  };

  var proto = MountainRacer.CarPhysics.prototype;

  proto.create = function(x, y) {
    this.car = this.scene.add.container(x, y);
    this.car.setDepth(50);

    var bodyGraphics = this.scene.add.graphics();
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
    this.bodyGraphics = bodyGraphics;

    this.wheelFL = this.createWheel(-20, 0);
    this.wheelFR = this.createWheel(20, 0);
    this.wheelBL = this.createWheel(-20, 12);
    this.wheelBR = this.createWheel(20, 12);

    this.car.add([
      this.wheelFL.sprite,
      this.wheelFR.sprite,
      this.wheelBL.sprite,
      this.wheelBR.sprite
    ]);

    this.trailGraphics = this.scene.add.graphics();
    this.trailGraphics.setDepth(8);

    return this.car;
  };

  proto.createWheel = function(offsetX, offsetY) {
    var graphics = this.scene.add.graphics();

    graphics.fillStyle(0x1a1a1a, 1);
    graphics.fillCircle(0, 0, this.wheelRadius);

    graphics.fillStyle(0x444444, 1);
    graphics.fillCircle(0, 0, this.wheelRadius - 4);

    graphics.fillStyle(0x888888, 1);
    graphics.fillCircle(0, 0, 3);

    graphics.lineStyle(1.5, 0x333333, 1);
    for (var i = 0; i < 4; i++) {
      var a = (i / 4) * Math.PI * 2;
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
  };

  proto.update = function(deltaTime, terrain, input) {
    var dt = Math.min(deltaTime / 1000, 0.033);
    var carX = this.car.x;
    var carY = this.car.y;

    var cosAngle = Math.cos(this.angle);
    var sinAngle = Math.sin(this.angle);

    this.wheelFL.worldX = carX + cosAngle * this.wheelFL.offsetX - sinAngle * this.wheelFL.offsetY;
    this.wheelFL.worldY = carY + sinAngle * this.wheelFL.offsetX + cosAngle * this.wheelFL.offsetY;
    this.wheelFR.worldX = carX + cosAngle * this.wheelFR.offsetX - sinAngle * this.wheelFR.offsetY;
    this.wheelFR.worldY = carY + sinAngle * this.wheelFR.offsetX + cosAngle * this.wheelFR.offsetY;
    this.wheelBL.worldX = carX + cosAngle * this.wheelBL.offsetX - sinAngle * this.wheelBL.offsetY;
    this.wheelBL.worldY = carY + sinAngle * this.wheelBL.offsetX + cosAngle * this.wheelBL.offsetY;
    this.wheelBR.worldX = carX + cosAngle * this.wheelBR.offsetX - sinAngle * this.wheelBR.offsetY;
    this.wheelBR.worldY = carY + sinAngle * this.wheelBR.offsetX + cosAngle * this.wheelBR.offsetY;

    this.vy += this.gravity * dt;

    var wheels = [this.wheelFL, this.wheelFR, this.wheelBL, this.wheelBR];
    var groundedCount = 0;
    var normalSumX = 0;
    var normalSumY = 0;

    for (var w = 0; w < wheels.length; w++) {
      var wheel = wheels[w];
      var terrainY = terrain.getHeight(wheel.worldX);
      var wheelBottom = wheel.worldY + this.wheelRadius;
      var penetration = wheelBottom - terrainY;

      if (penetration > 0) {
        groundedCount++;
        var normal = terrain.getNormal(wheel.worldX);
        normalSumX += normal.x;
        normalSumY += normal.y;

        var targetSuspension = -Math.min(penetration, this.suspensionLength * 2);
        var springForce = (targetSuspension - wheel.suspensionOffset) * this.suspensionStiffness;
        wheel.suspensionOffset += springForce;
        wheel.suspensionOffset = Math.max(-this.suspensionLength * 2, Math.min(this.suspensionLength * 0.5, wheel.suspensionOffset));

        var liftForce = penetration * 15;
        this.vy -= liftForce * dt * 60;

        var terrainAngle = terrain.getAngle(wheel.worldX);
        var normalVel = this.vx * Math.sin(terrainAngle) + this.vy * Math.cos(terrainAngle);

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
      var avgNormalX = normalSumX / groundedCount;
      var avgNormalY = normalSumY / groundedCount;
      var targetAngle = Math.atan2(-avgNormalX, avgNormalY);

      var angleDiff = Phaser.Math.Angle.Wrap(targetAngle - this.angle);
      this.angle += angleDiff * Math.min(dt * 8, 1);
    } else {
      this.angularVelocity += (input.right - input.left) * 3 * dt;
      this.angularVelocity *= 0.98;
      this.angle += this.angularVelocity * dt;
    }

    if (this.isGrounded) {
      var terrainAngle2 = terrain.getAngle(carX);
      var forwardDirX = Math.cos(terrainAngle2);
      var forwardDirY = Math.sin(terrainAngle2);

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

      var gravityAlong = Math.sin(terrainAngle2) * this.gravity * 0.3;
      this.vx += gravityAlong * Math.cos(terrainAngle2) * dt;
      this.vy += gravityAlong * Math.sin(terrainAngle2) * dt;
    } else {
      this.vx *= this.airFriction;
      this.vy *= this.airFriction;
    }

    var speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > this.maxSpeed) {
      var scale = this.maxSpeed / speed;
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
  };

  proto.updateWheelPositions = function() {
    var wheels = [this.wheelFL, this.wheelFR, this.wheelBL, this.wheelBR];
    var baseY = this.carHeight / 2;

    for (var w = 0; w < wheels.length; w++) {
      var wheel = wheels[w];
      wheel.sprite.x = wheel.offsetX;
      wheel.sprite.y = baseY + wheel.suspensionOffset;
    }
  };

  proto.updateWheelRotation = function(dt) {
    var speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    var rotationSpeed = (speed / this.wheelRadius) * dt;

    this.wheelFL.sprite.rotation += rotationSpeed;
    this.wheelFR.sprite.rotation += rotationSpeed;
    this.wheelBL.sprite.rotation += rotationSpeed;
    this.wheelBR.sprite.rotation += rotationSpeed;
  };

  proto.updateTrail = function(terrain) {
    var wheels = [this.wheelBL, this.wheelBR];
    var cosAngle = Math.cos(this.angle);
    var sinAngle = Math.sin(this.angle);

    for (var w = 0; w < wheels.length; w++) {
      var wheel = wheels[w];
      var worldX = this.car.x + cosAngle * wheel.offsetX - sinAngle * (this.carHeight / 2 + wheel.suspensionOffset);
      var worldY = terrain.getHeight(worldX) - 2;

      this.trailPoints.push({ x: worldX, y: worldY, alpha: 1, time: Date.now() });
    }

    var now = Date.now();
    var newPoints = [];
    for (var i = 0; i < this.trailPoints.length; i++) {
      if (now - this.trailPoints[i].time < 3000) {
        newPoints.push(this.trailPoints[i]);
      }
    }
    this.trailPoints = newPoints;

    this.trailGraphics.clear();
    for (var j = 0; j < this.trailPoints.length; j++) {
      var p = this.trailPoints[j];
      var age = (now - p.time) / 3000;
      var alpha = 1 - age;
      this.trailGraphics.lineStyle(3, 0x4a3728, alpha * 0.5);
      this.trailGraphics.fillPoint(p.x, p.y, 3);
    }
  };

  proto.createBounceParticles = function(x, y) {
    for (var i = 0; i < 8; i++) {
      var particle = this.scene.add.circle(
        x + Phaser.Math.Between(-10, 10),
        y,
        2 + Math.random() * 2,
        0x8b7355
      );
      particle.setDepth(15);

      var vx = Phaser.Math.Between(-100, 100);
      var vy = Phaser.Math.Between(-200, -50);

      this.scene.tweens.add({
        targets: particle,
        x: particle.x + vx,
        y: particle.y + vy,
        alpha: 0,
        duration: 500,
        ease: 'Power2',
        onComplete: (function(p) {
          return function() { p.destroy(); };
        })(particle)
      });
    }
  };

  proto.getSpeed = function() {
    return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
  };

  proto.getBounds = function() {
    return new Phaser.Geom.Rectangle(
      this.car.x - this.carWidth / 2,
      this.car.y - this.carHeight,
      this.carWidth,
      this.carHeight + this.wheelRadius * 2
    );
  };

  proto.applyDamage = function() {
    var self = this;
    this.car.iterate(function(child) {
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
  };

  proto.slowDown = function(amount) {
    this.vx *= amount;
    this.vy *= amount;
  };

  proto.destroy = function() {
    if (this.trailGraphics) this.trailGraphics.destroy();
    if (this.car) this.car.destroy();
  };

  window.MountainRacer = MountainRacer;
})();
