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
      this.ballX += this.ballSpeedX;
      this.ballY += this.ballSpeedY;

      // Apply spin and friction
      this.ballSpeedX += this.spin * 0.05;
      this.ballSpeedY += this.spin * 0.05;
      this.ballSpeedX *= 0.98;
      this.ballSpeedY *= 0.98;

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

    if (
      this.ballX - ballRadius <= goalX + 8 &&
      this.ballY >= goalY &&
      this.ballY <= goalY + goalHeight
    ) {
      this.ballSpeedX *= -1;
      this.ballX = goalX + 8 + ballRadius;
    }

    if (
      this.ballX + ballRadius >= goalX + goalWidth - 8 &&
      this.ballY >= goalY &&
      this.ballY <= goalY + goalHeight
    ) {
      this.ballSpeedX *= -1;
      this.ballX = goalX + goalWidth - 8 - ballRadius;
    }

    if (
      this.ballY - ballRadius <= goalY + 8 &&
      this.ballX >= goalX &&
      this.ballX <= goalX + goalWidth
    ) {
      this.ballSpeedY *= -1;
      this.ballY = goalY + 8 + ballRadius;
    }
  }

  //   checkGoal() {
  //     // Use circle-rectangle collision detection so that the entire ball counts toward a goal
  //     const goalX = this.p.goalX;
  //     const goalY = this.p.goalY;
  //     const goalWidth = this.p.goalWidth;
  //     const goalHeight = this.p.goalHeight;
  //     const ballRadius = 10 * this.scaleX;

  //     // Find the closest point within the goal rectangle to the ball's center
  //     const closestX = Math.max(goalX, Math.min(this.ballX, goalX + goalWidth));
  //     const closestY = Math.max(goalY, Math.min(this.ballY, goalY + goalHeight));

  //     const dx = this.ballX - closestX;
  //     const dy = this.ballY - closestY;

  //     return dx * dx + dy * dy <= ballRadius * ballRadius;
  //   }
  checkGoal() {
    const goalX = this.p.goalX;
    const goalY = this.p.goalY;
    const goalWidth = this.p.goalWidth;
    const goalHeight = this.p.goalHeight;
    const ballRadius = 10 * this.scaleX;

    // Check if the entire ball is within goal boundaries
    return (
      this.ballX - ballRadius >= goalX &&
      this.ballX + ballRadius <= goalX + goalWidth &&
      this.ballY - ballRadius >= goalY &&
      this.ballY + ballRadius <= goalY + goalHeight
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
      p.stroke(0, 255, 0);
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
