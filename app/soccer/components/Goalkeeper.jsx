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
    this.reactionSpeed = 0.1; // Base reaction speed
    this.predictionFactor = 0.3; // How much to predict ball movement
    this.width = 20 * scaleX; // Goalkeeper width for collision detection

    this.isMoving = false;
    this.legFrame = 0;
    this.frameSpeed = 0.03;
    this.moveDirection = { x: 0 };
  }

  update(ball) {
    const prevX = this.x;

    // Only update position if not in two-player mode
    if (!this.p.isTwoPlayerMode) {
      if (ball.isKicking) {
        // When ball is being kicked, predict where it will go
        const predictedX = ball.ballX + ball.ballSpeedX * this.predictionFactor;
        this.targetX = this.p.lerp(this.x, predictedX, this.reactionSpeed);
      } else {
        // When ball is moving, track it with some prediction
        const targetX = ball.ballX + ball.ballSpeedX * this.predictionFactor;
        this.targetX = this.p.lerp(this.x, targetX, this.reactionSpeed);
      }

      // Move towards target position
      this.x = this.p.constrain(
        this.targetX,
        this.p.goalX + this.width / 2,
        this.p.goalX + this.p.goalWidth - this.width / 2
      );

      // Update movement animation
      this.isMoving = Math.abs(this.x - prevX) > 0.1;
      if (this.isMoving) {
        this.legFrame += this.frameSpeed;
        if (this.legFrame > 4) this.legFrame = 0;
      } else {
        this.legFrame = 0;
      }
    }

    // Stay centered unless reacting to a shot
    if (!this.isReacting && !ball.isKicking) {
      this.targetX = this.p.width / 2; // Always aim to return to center
      this.diveDirection = 0;
    }

    // Initiate reaction when ball is shot
    if (ball.isKicking && !this.isReacting) {
      this.isReacting = true;
      // Adjust reaction delay based on difficulty
      const baseDelay =
        this.difficulty === "easy" ? 15 : this.difficulty === "medium" ? 10 : 5;
      this.reactionDelay = this.p.random(baseDelay - 2, baseDelay + 2);
    }

    // Handle reaction after delay
    if (this.isReacting && this.reactionDelay > 0) {
      this.reactionDelay--;
      if (this.reactionDelay <= 0) {
        // Determine dive direction based on ball position
        const ballDirection = ball.ballX - this.x;
        this.diveDirection = ballDirection > 0 ? 1 : -1;

        // Adjust dive timing based on difficulty
        const diveSpeed =
          this.difficulty === "easy"
            ? 0.1
            : this.difficulty === "medium"
            ? 0.15
            : 0.2;
        this.x += this.diveDirection * this.speed * diveSpeed;
      }
    }

    // Reset reaction state when ball is no longer being kicked
    if (!ball.isKicking) {
      this.isReacting = false;
      this.diveDirection = 0;
    }

    // Improved ball saving logic
    if (ball.isKicking) {
      // Calculate the goalkeeper's collision area based on dive state
      const keeperWidth = this.isReacting ? 40 * this.size : 20 * this.size;
      const keeperHeight = this.isReacting ? 40 * this.size : 30 * this.size;

      // Calculate hand reach based on dive direction
      let handReachX = 0;
      let handReachY = 0;

      if (this.isReacting) {
        if (this.diveDirection === -1) {
          handReachX = -30 * this.size;
        } else if (this.diveDirection === 1) {
          handReachX = 30 * this.size;
        }
        handReachY = -20 * this.size; // Always reach up when diving
      }

      // Check collision with expanded area including hand reach
      const collisionX = this.x + handReachX;
      const collisionY = this.y + handReachY;

      if (
        ball.ballX > collisionX - keeperWidth / 2 &&
        ball.ballX < collisionX + keeperWidth / 2 &&
        ball.ballY > collisionY - keeperHeight / 2 &&
        ball.ballY < collisionY + keeperHeight / 2
      ) {
        // Calculate reflection vector with more realistic bounce
        const collisionNormal = this.p
          .createVector(ball.ballX - collisionX, ball.ballY - collisionY)
          .normalize();
        const dot =
          ball.ballSpeedX * collisionNormal.x +
          ball.ballSpeedY * collisionNormal.y;

        // More realistic bounce with energy loss
        const restitution = 0.6;
        ball.ballSpeedX =
          (ball.ballSpeedX - 2 * dot * collisionNormal.x) * restitution;
        ball.ballSpeedY =
          (ball.ballSpeedY - 2 * dot * collisionNormal.y) * restitution;

        // Calculate spin with reduced magnitude
        const relativeVelX = ball.ballSpeedX - (this.x - prevX);
        const relativeVelY = ball.ballSpeedY;
        ball.spin = this.p.constrain(
          (relativeVelX * collisionNormal.y -
            relativeVelY * collisionNormal.x) *
            0.02,
          -0.5,
          0.5
        );

        // Mark as saved
        ball.wasShotByPlayer = false;
        this.isReacting = false; // Reset reaction state after save
      }
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
