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
    this.ballY = 260;
    this.ballSpeedX = 0;
    this.ballSpeedY = 0;
    this.isKicking = false;
    this.spin = 0;

    // Aiming line properties
    this.playerX = playerX;
    this.playerY = playerY;
    this.aimAngle = aimAngle;
    this.kickDistance = 36 * scaleX; // Same distance used for kicking

    // Reference to the goalkeeper for restart logic
    this.goalkeeper = goalkeeper;

    // Flag to mark if the ball was shot directly by the player
    this.wasShotByPlayer = false;
  }

  update() {
    const p = this.p;

    if (this.isKicking) {
      // Apply Magnus effect
      const velocity = this.p.createVector(this.ballSpeedX, this.ballSpeedY);
      const magnusForce = velocity
        .copy()
        .rotate(this.p.HALF_PI)
        .mult(this.spin * 0.05);
      this.ballSpeedX += magnusForce.x;
      this.ballSpeedY += magnusForce.y;

      // Apply drag
      const speed = this.p.dist(0, 0, this.ballSpeedX, this.ballSpeedY);
      const drag = 0.0005 * speed * speed;
      const dragForce = this.p
        .createVector(this.ballSpeedX, this.ballSpeedY)
        .normalize()
        .mult(-drag);
      this.ballSpeedX += dragForce.x;
      this.ballSpeedY += dragForce.y;

      // Update position
      this.ballX += this.ballSpeedX;
      this.ballY += this.ballSpeedY;

      // Stop the ball if it slows down too much
      if (Math.abs(this.ballSpeedX) < 0.1 && Math.abs(this.ballSpeedY) < 0.1) {
        this.isKicking = false;
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
        this.resetBall();
      }
    }
  }

  kick(power, angleDeg) {
    if (!this.isKicking) {
      this.isKicking = true;
      // Mark the ball as shot directly by the player
      this.wasShotByPlayer = true;
      const rad = this.p.radians(angleDeg);
      this.ballSpeedX = power * this.p.cos(rad) * this.scaleX;
      this.ballSpeedY = power * this.p.sin(rad) * this.scaleY;
      this.spin = (angleDeg % 90) * 0.02;
    }
  }

  resetBall() {
    const p = this.p;
    if (this.goalkeeper) {
      // Position the ball near the goalkeeper with a small random offset
      this.ballX = this.goalkeeper.x + p.random(-10, 10);
      this.ballY = this.goalkeeper.y + p.random(-10, 10);

      // Generate random kick parameters for restarting play
      const randomAngle = p.random(30, 150); // degrees
      const randomPower = p.random(3, 7); // power/speed magnitude
      const rad = p.radians(randomAngle);

      this.ballSpeedX = randomPower * p.cos(rad) * this.scaleX;
      this.ballSpeedY = randomPower * p.sin(rad) * this.scaleY;
      this.isKicking = true;
      this.spin = p.random(-1, 1);

      // Reset the player-shot flag for the new serve
      this.wasShotByPlayer = false;
    } else {
      // Fallback reset (centered)
      this.ballX = p.width / 2;
      this.ballY = 130;
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
    this.wasShotByPlayer = false;
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
      // Reflect off left post
      const normal = this.p
        .createVector(this.ballX - leftPostX, this.ballY - goalY)
        .normalize();
      const dot = this.ballSpeedX * normal.x + this.ballSpeedY * normal.y;
      this.ballSpeedX = (this.ballSpeedX - 2 * dot * normal.x) * 0.8;
      this.ballSpeedY = (this.ballSpeedY - 2 * dot * normal.y) * 0.8;
      // Calculate spin
      const relativeVelX = this.ballSpeedX;
      const relativeVelY = this.ballSpeedY;
      this.spin = (relativeVelX * normal.y - relativeVelY * normal.x) * 0.1;
      // Reposition to avoid penetration
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
      // Reflect off right post
      const normal = this.p
        .createVector(this.ballX - rightPostX, this.ballY - goalY)
        .normalize();
      const dot = this.ballSpeedX * normal.x + this.ballSpeedY * normal.y;
      this.ballSpeedX = (this.ballSpeedX - 2 * dot * normal.x) * 0.8;
      this.ballSpeedY = (this.ballSpeedY - 2 * dot * normal.y) * 0.8;
      // Calculate spin
      const relativeVelX = this.ballSpeedX;
      const relativeVelY = this.ballSpeedY;
      this.spin = (relativeVelX * normal.y - relativeVelY * normal.x) * 0.1;
      // Reposition to avoid penetration
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
      // Calculate spin
      this.spin = this.ballSpeedX * 0.1;
    }
  }

  checkGoal() {
    const goalX = this.p.goalX;
    const goalY = this.p.goalY;
    const goalWidth = this.p.goalWidth;
    const ballRadius = 10 * this.scaleX;

    // Check if the ball crosses the goal line
    return (
      this.ballX >= goalX &&
      this.ballX <= goalX + goalWidth &&
      this.ballY <= goalY + ballRadius &&
      this.ballY >= goalY - ballRadius
    );
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
      p.translate(this.ballX + 30 * this.scaleX, this.ballY);
      p.rotate(p.radians(this.aimAngle));
      p.stroke(255, 0, 0);
      p.strokeWeight(2);
      p.line(0, 0, 50 * this.scaleX, 0);
      p.pop();
    }
  }
}
