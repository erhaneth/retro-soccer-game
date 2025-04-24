export class Goalkeeper {
  constructor(p, scaleX, scaleY, difficulty, playerNumber = 1) {
    this.p = p;
    this.scaleX = scaleX;
    this.scaleY = scaleY;
    this.difficulty = difficulty;
    this.playerNumber = playerNumber;

    this.x = p.width / 2; // Start at goal center
    this.y = 50 * scaleY;
    this.speed = difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 3;
    this.size = 3 * scaleX;
    this.isReacting = false;
    this.reactionDelay = 0;
    this.diveDirection = 0; // -1 for left, 1 for right, 0 for none
    this.targetX = this.x; // Target position for movement

    this.isMoving = false;
    this.legFrame = 0;
    this.frameSpeed = 0.03;
    this.moveDirection = { x: 0 };
  }

  update(ball) {
    const prevX = this.x;

    // Only update position if not in two-player mode
    if (!this.p.isTwoPlayerMode) {
      // Existing AI behavior
      const targetX = this.p.lerp(this.x, ball.ballX, this.reactionSpeed);
      this.x = this.p.constrain(
        targetX,
        this.p.goalX + this.width / 2,
        this.p.goalX + this.p.goalWidth - this.width / 2
      );
    }

    // Stay centered unless reacting to a shot
    if (!this.isReacting && !ball.isKicking) {
      this.targetX = this.p.width / 2; // Always aim to return to center
      this.diveDirection = 0;
    }

    // Initiate reaction when ball is shot
    if (ball.isKicking && !this.isReacting && this.p.random() > 0.3) {
      this.isReacting = true;
      this.reactionDelay = this.p.random(5, 15); // ~0.08-0.25s delay at 60fps
    }

    // Handle reaction after delay
    if (this.isReacting && this.reactionDelay > 0) {
      this.reactionDelay -= 1;
    } else if (this.isReacting && this.reactionDelay <= 0 && ball.isKicking) {
      if (this.difficulty !== "easy") {
        // Predict ball's trajectory and move
        let predictedX = ball.ballX;
        let predictedY = ball.ballY;
        let tempSpeedX = ball.ballSpeedX;
        let tempSpeedY = ball.ballSpeedY;
        for (let t = 0; t < 30; t++) {
          // Simulate 0.5s at 60fps
          predictedX += tempSpeedX;
          predictedY += tempSpeedY;
          const velocity = this.p.createVector(tempSpeedX, tempSpeedY);
          const magnusForce = velocity
            .copy()
            .rotate(this.p.HALF_PI)
            .mult(ball.spin * 0.05);
          tempSpeedX += magnusForce.x;
          tempSpeedY += magnusForce.y;
          tempSpeedX *= 0.98;
          tempSpeedY *= 0.98;
        }
        this.targetX = this.p.constrain(
          predictedX,
          this.p.goalX + 20 * this.scaleX,
          this.p.goalX + this.p.goalWidth - 20 * this.scaleX
        );
        this.diveDirection =
          predictedX < this.x ? -1 : predictedX > this.x ? 1 : 0;
      } else {
        // Easy mode: less accurate movement
        this.targetX = this.x + this.p.random(-20, 20) * this.scaleX;
        this.diveDirection =
          this.targetX < this.x ? -1 : this.targetX > this.x ? 1 : 0;
      }
    }

    // Smoothly move toward targetX with acceleration
    const accel = 0.5 * this.speed;
    const velX = (this.targetX - this.x) * 0.1; // Proportional control
    this.x += this.p.constrain(velX, -this.speed, this.speed);
    this.isMoving = Math.abs(velX) > 0.1;

    // Reset reaction after shot is resolved
    if (!ball.isKicking) {
      this.isReacting = false;
      this.reactionDelay = 0;
      this.diveDirection = 0;
      this.targetX = this.p.width / 2; // Return to center
    }

    // Update leg animation for movement
    if (this.isMoving) {
      this.moveDirection.x = this.x - prevX;
      this.legFrame += this.frameSpeed;
      if (this.legFrame > 4) this.legFrame = 0;
    } else {
      this.moveDirection.x = 0;
      this.legFrame = 0;
    }

    // Handle ball saving
    const keeperWidth = 20 * this.size;
    const keeperHeight = 30 * this.size;
    if (
      ball.ballX > this.x - keeperWidth / 2 &&
      ball.ballX < this.x + keeperWidth / 2 &&
      ball.ballY > this.y - keeperHeight / 2 &&
      ball.ballY < this.y + keeperHeight / 2 &&
      ball.isKicking
    ) {
      // Calculate reflection vector
      const collisionNormal = this.p
        .createVector(ball.ballX - this.x, ball.ballY - this.y)
        .normalize();
      const dot =
        ball.ballSpeedX * collisionNormal.x +
        ball.ballSpeedY * collisionNormal.y;
      const restitution = 0.7;
      ball.ballSpeedX =
        (ball.ballSpeedX - 2 * dot * collisionNormal.x) * restitution;
      ball.ballSpeedY =
        (ball.ballSpeedY - 2 * dot * collisionNormal.y) * restitution;
      // Calculate spin with reduced magnitude
      const relativeVelX = ball.ballSpeedX - (this.x - prevX);
      const relativeVelY = ball.ballSpeedY;
      ball.spin = this.p.constrain(
        (relativeVelX * collisionNormal.y - relativeVelY * collisionNormal.x) *
          0.02,
        -0.5,
        0.5
      );
      ball.wasShotByPlayer = false;
    }
  }

  draw() {
    const p = this.p;
    const s = this.size;
    const startX = this.x - 8 * s;
    const startY = this.y - 15 * s;

    if (this.isReacting && this.diveDirection !== 0) {
      // Draw diving animation
      p.push();
      p.translate(this.x, this.y);
      p.rotate(p.radians(this.diveDirection * 30)); // 30 degrees left or right

      p.noStroke();
      p.fill(50, 50, 50); // Head
      p.rect(-6 * s, -15 * s, s * 6, s * 3);
      p.fill(240, 190, 140); // Face
      p.rect(-5 * s, -12 * s, s * 4, s * 4);
      p.fill(255); // Eyes
      p.rect(-4 * s, -11 * s, s, s);
      p.rect(-2 * s, -11 * s, s, s);
      p.fill(0);
      p.rect(-4 * s, -10 * s, s * 0.5, s * 0.5);
      p.rect(-2 * s, -10 * s, s * 0.5, s * 0.5);

      // Use different colors for each player's jersey
      if (this.playerNumber === 1) {
        p.fill(200, 0, 0); // Red for Player 1
      } else {
        p.fill(0, 0, 200); // Blue for Player 2
      }
      p.rect(-10 * s, -9 * s, s * 12, s * 6);
      p.fill(240, 190, 140); // Arms
      p.rect(-12 * s, -9 * s, s * 3, s * 8); // Extended arm
      p.rect(4 * s, -9 * s, s * 3, s * 8); // Extended arm

      p.fill(0); // Legs
      p.rect(-4 * s, -3 * s, s * 3, s * 6);
      p.rect(0 * s, -3 * s, s * 3, s * 6);
      p.pop();
    } else {
      // Draw standing animation
      p.noStroke();
      p.fill(50, 50, 50); // Head
      p.rect(startX + s * 5, startY, s * 6, s * 3);
      p.rect(startX + s * 4, startY + s * 3, s * 8, s * 2);

      p.fill(240, 190, 140); // Face
      p.rect(startX + s * 5, startY + s * 5, s * 6, s * 5);
      p.fill(255); // Eyes
      p.rect(startX + s * 6, startY + s * 6, s * 2, s * 2);
      p.rect(startX + s * 9, startY + s * 6, s * 2, s * 2);
      p.fill(0);
      p.rect(startX + s * 7, startY + s * 7, s, s);
      p.rect(startX + s * 10, startY + s * 7, s, s);

      p.fill(0); // Mouth
      p.rect(startX + s * 7, startY + s * 9, s * 3, s);

      // Use different colors for each player's jersey
      if (this.playerNumber === 1) {
        p.fill(200, 0, 0); // Red for Player 1
      } else {
        p.fill(0, 0, 200); // Blue for Player 2
      }
      p.rect(startX + s * 4, startY + s * 10, s * 8, s * 5);
      p.fill(240, 190, 140); // Arms
      p.rect(startX + s * 2, startY + s * 10, s * 3, s * 3);
      p.rect(startX + s * 11, startY + s * 10, s * 3, s * 3);

      p.fill(0); // Shorts
      p.rect(startX + s * 5, startY + s * 15, s * 6, s * 3);

      // Draw legs with animation if moving
      p.fill(240, 190, 140);
      const legOffset = Math.sin(this.legFrame * Math.PI) * 2 * s;
      if (this.isMoving) {
        let legSwingDirection = this.moveDirection.x >= 0 ? 1 : -1;

        p.push();
        p.translate(startX + s * 5, startY + s * 18);
        p.rotate(p.radians(legOffset * 10 * legSwingDirection));
        p.rect(0, 0, s * 2, s * 4);
        p.fill(255); // Shoes
        p.rect(0, s * 4, s * 2, s * 2);
        p.fill(0);
        p.rect(0, s * 6, s * 2.5, s * 2);
        p.pop();

        p.push();
        p.translate(startX + s * 9, startY + s * 18);
        p.rotate(p.radians(-legOffset * 10 * legSwingDirection));
        p.rect(0, 0, s * 2, s * 4);
        p.fill(255);
        p.rect(0, s * 4, s * 2, s * 2);
        p.fill(0);
        p.rect(0, s * 6, s * 2.5, s * 2);
        p.pop();
      } else {
        p.rect(startX + s * 5, startY + s * 18, s * 2, s * 4);
        p.rect(startX + s * 9, startY + s * 18, s * 2, s * 4);
        p.fill(255);
        p.rect(startX + s * 5, startY + s * 22, s * 2, s * 2);
        p.rect(startX + s * 9, startY + s * 22, s * 2, s * 2);
        p.fill(0);
        p.rect(startX + s * 5, startY + s * 24, s * 2.5, s * 2);
        p.rect(startX + s * 8.5, startY + s * 24, s * 2.5, s * 2);
      }
    }
  }
}
