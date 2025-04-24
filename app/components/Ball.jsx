export class Ball {
  constructor(
    p,
    scaleX,
    scaleY,
    playerX,
    playerY,
    aimAngle,
    goalkeeper = null
  ) {
    this.p = p;
    this.scaleX = scaleX;
    this.scaleY = scaleY;

    // Ball properties
    this.ballX = p.width / 2;
    this.ballY = 260; // Penalty spot position
    this.ballSpeedX = 0;
    this.ballSpeedY = 0;
    this.isKicking = false;
    this.spin = 0;
    this.gravity = 0.001; // Reduced gravity for minimal vertical drop
    this.friction = 0.98; // Ground friction
    this.drag = 0.0002; // Slightly reduced air resistance

    // Aiming line properties
    this.playerX = playerX;
    this.playerY = playerY;
    this.aimAngle = aimAngle;
    this.kickDistance = 36 * scaleX;

    // Reference to the goalkeeper for restart logic
    this.goalkeeper = goalkeeper;
    this.wasShotByPlayer = false;
    this.visible = true; // Ensure ball is visible after reset
  }

  update() {
    const p = this.p;

    if (this.isKicking) {
      // Apply gravity (minimal effect)
      this.ballSpeedY += this.gravity;

      // Apply Magnus effect only if ball has significant speed
      const speed = p.dist(0, 0, this.ballSpeedX, this.ballSpeedY);
      if (speed > 0.5) {
        // Only apply spin effect if ball is moving fast enough
        const velocity = p.createVector(this.ballSpeedX, this.ballSpeedY);
        const magnusForce = velocity
          .copy()
          .rotate(p.HALF_PI)
          .mult(this.spin * 0.02);
        this.ballSpeedX += magnusForce.x;
        this.ballSpeedY += magnusForce.y;
      }

      // Apply air resistance
      const drag = this.drag * speed * speed;
      const dragForce = p
        .createVector(this.ballSpeedX, this.ballSpeedY)
        .normalize()
        .mult(-drag);
      this.ballSpeedX += dragForce.x;
      this.ballSpeedY += dragForce.y;

      // Update position
      this.ballX += this.ballSpeedX;
      this.ballY += this.ballSpeedY;

      // Ground collision (only if ball is low and past goal)
      if (
        this.ballY > p.height - 20 &&
        this.ballX > p.goalX &&
        this.ballX < p.goalX + p.goalWidth
      ) {
        this.ballY = p.height - 20;
        this.ballSpeedY *= -0.6; // Bounce with energy loss
        this.ballSpeedX *= this.friction; // Apply ground friction
      }

      // Stop the ball if it's moving too slowly
      if (speed < 0.3) {
        this.stopBall();
        return;
      }

      // Check collision with goalposts
      this.checkGoalpostCollision();

      // Reset if off-screen
      if (
        this.ballX < 0 ||
        this.ballX > p.width ||
        this.ballY < 0 ||
        this.ballY > p.height
      ) {
        this.stopBall();
        return;
      }
    }
  }

  stopBall() {
    this.isKicking = false;
    this.ballSpeedX = 0;
    this.ballSpeedY = 0;
    this.spin = 0;
  }

  kick(power, angleDeg) {
    if (!this.isKicking) {
      this.isKicking = true;
      this.wasShotByPlayer = true;
      const rad = this.p.radians(angleDeg);

      // Increase base speed and reduce vertical component for flat shots
      const minPower = 1;
      const effectivePower = Math.max(power * 7, minPower); // Increased from 5 to 7
      const verticalScale = Math.abs(angleDeg) > 30 ? 1 : 0.3; // Reduce vertical for flat shots

      this.ballSpeedX = effectivePower * this.p.cos(rad) * this.scaleX;
      this.ballSpeedY =
        effectivePower * this.p.sin(rad) * this.scaleY * verticalScale;

      // Make spin proportional to both power and angle
      // At low power, spin should be minimal
      const spinFactor = Math.max(0.1, power); // Minimum spin factor of 0.1
      this.spin = (angleDeg % 90) * 0.01 * spinFactor;
    }
  }

  resetBall() {
    const p = this.p;
    if (this.goalkeeper) {
      this.ballX = this.goalkeeper.x + p.random(-10, 10);
      this.ballY = this.goalkeeper.y + p.random(-10, 10);
      const randomAngle = p.random(30, 150);
      const randomPower = p.random(3, 7);
      const rad = p.radians(randomAngle);
      this.ballSpeedX = randomPower * p.cos(rad) * this.scaleX;
      this.ballSpeedY = randomPower * p.sin(rad) * this.scaleY;
      this.isKicking = true;
      this.spin = p.random(-1, 1);
      this.wasShotByPlayer = false;
    } else {
      this.ballX = p.width / 2;
      this.ballY = 260;
      this.ballSpeedX = 0;
      this.ballSpeedY = 0;
      this.isKicking = false;
      this.spin = 0;
      this.wasShotByPlayer = false;
    }
  }

  resetToPenalty(spotX, spotY) {
    this.ballX = spotX;
    this.ballY = spotY;
    this.ballSpeedX = 0;
    this.ballSpeedY = 0;
    this.isKicking = false;
    this.spin = 0;
    this.visible = true;
  }

  checkGoalpostCollision() {
    const goalX = this.p.goalX;
    const goalY = this.p.goalY;
    const goalWidth = this.p.goalWidth;
    const goalHeight = this.p.goalHeight;
    const ballRadius = 10 * this.scaleX;
    const postRadius = 5 * this.scaleX;

    const leftPostX = goalX + 8;
    const rightPostX = goalX + goalWidth - 8;
    if (
      this.p.dist(this.ballX, this.ballY, leftPostX, goalY) <
      ballRadius + postRadius
    ) {
      const normal = this.p
        .createVector(this.ballX - leftPostX, this.ballY - goalY)
        .normalize();
      const dot = this.ballSpeedX * normal.x + this.ballSpeedY * normal.y;
      this.ballSpeedX = (this.ballSpeedX - 2 * dot * normal.x) * 0.8;
      this.ballSpeedY = (this.ballSpeedY - 2 * dot * normal.y) * 0.8;
      const relativeVelX = this.ballSpeedX;
      const relativeVelY = this.ballSpeedY;
      this.spin = (relativeVelX * normal.y - relativeVelY * normal.x) * 0.1;
      const dist = this.p.dist(this.ballX, this.ballY, leftPostX, goalY);
      this.ballX =
        leftPostX +
        ((this.ballX - leftPostX) * (ballRadius + postRadius)) / dist;
      this.ballY =
        goalY + ((this.ballY - goalY) * (ballRadius + postRadius)) / dist;
    } else if (
      this.p.dist(this.ballX, this.ballY, rightPostX, goalY) <
      ballRadius + postRadius
    ) {
      const normal = this.p
        .createVector(this.ballX - rightPostX, this.ballY - goalY)
        .normalize();
      const dot = this.ballSpeedX * normal.x + this.ballSpeedY * normal.y;
      this.ballSpeedX = (this.ballSpeedX - 2 * dot * normal.x) * 0.8;
      this.ballSpeedY = (this.ballSpeedY - 2 * dot * normal.y) * 0.8;
      const relativeVelX = this.ballSpeedX;
      const relativeVelY = this.ballSpeedY;
      this.spin = (relativeVelX * normal.y - relativeVelY * normal.x) * 0.1;
      const dist = this.p.dist(this.ballX, this.ballY, rightPostX, goalY);
      this.ballX =
        rightPostX +
        ((this.ballX - rightPostX) * (ballRadius + postRadius)) / dist;
      this.ballY =
        goalY + ((this.ballY - goalY) * (ballRadius + postRadius)) / dist;
    } else if (
      this.ballY - ballRadius <= goalY + 8 &&
      this.ballX >= goalX &&
      this.ballX <= goalX + goalWidth
    ) {
      this.ballSpeedY *= -0.8;
      this.ballY = goalY + 8 + ballRadius;
      this.spin = this.ballSpeedX * 0.1;
    }
  }

  checkGoal() {
    const goalX = this.p.goalX;
    const goalY = this.p.goalY;
    const goalWidth = this.p.goalWidth;
    const goalHeight = this.p.goalHeight;
    const ballRadius = 10 * this.scaleX;

    const isGoal =
      this.ballX >= goalX &&
      this.ballX <= goalX + goalWidth &&
      this.ballY <= goalY + goalHeight &&
      this.ballY >= goalY - ballRadius &&
      this.wasShotByPlayer;

    if (isGoal) {
      this.stopBall();
    }

    return isGoal;
  }

  draw() {
    const p = this.p;

    // Draw the ball
    p.fill(255);
    p.circle(this.ballX, this.ballY, 20 * this.scaleX);
    p.fill(0);
    for (let i = 0; i < 5; i++) {
      p.circle(
        this.ballX + p.cos(p.radians(i * 72)) * 5 * this.scaleX,
        this.ballY + p.sin(p.radians(i * 72)) * 5 * this.scaleX,
        4 * this.scaleX
      );
    }

    // Draw Curvature Indicator if the ball is in motion and spin is present
    if (this.isKicking && Math.abs(this.spin) > 0) {
      p.push();
      p.translate(this.ballX + 30 * this.scaleX, this.ballY);
      p.rotate(p.radians(this.spin * 90));
      p.strokeWeight(2);
      p.line(0, 0, 20 * this.scaleX * Math.abs(this.spin), 0);
      p.pop();
    }

    // Draw Aiming Line if the player is near and the ball is not moving
    const distanceToPlayer = p.dist(
      this.ballX,
      this.ballY,
      this.playerX,
      this.playerY
    );
    if (distanceToPlayer < this.kickDistance && !this.isKicking) {
      p.push();
      p.translate(this.ballX, this.ballY);
      p.rotate(p.radians(this.aimAngle));

      const lineLength = 50 * this.scaleX;
      for (let i = 0; i < lineLength; i++) {
        const alpha = p.map(i, 0, lineLength, 255, 50);
        p.stroke(255, 0, 0, alpha);
        p.strokeWeight(2);
        p.line(i, -1, i, 1);
      }

      const pulse = p.sin(p.frameCount * 0.1) * 0.5 + 1.5;
      p.noStroke();
      for (let i = 0; i < 5; i++) {
        const dotX = 10 * i * this.scaleX;
        const dotSize = 3 * this.scaleX * pulse;
        p.fill(255, 0, 0, 150);
        p.circle(dotX, 0, dotSize);
      }

      const power = this.p.kickPower || 0;
      const powerBarLength = 50 * this.scaleX * power;
      for (let i = 0; i < powerBarLength; i++) {
        const alpha = p.map(i, 0, powerBarLength, 200, 50);
        p.stroke(255, 0, 0, alpha);
        p.strokeWeight(4);
        p.line(i, -5 * this.scaleX, i, 5 * this.scaleX);
      }

      p.pop();
    }
  }
}
