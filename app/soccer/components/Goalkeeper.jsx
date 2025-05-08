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
        // AI: Instantly move to predicted ball path for hard saves
        const predictedX = ball.ballX + ball.ballSpeedX * 10; // Predict further ahead
        this.x = this.p.constrain(
          predictedX,
          this.p.goalX + this.width / 2,
          this.p.goalX + this.p.goalWidth - this.width / 2
        );
      } else {
        // When ball is moving, track it
        const targetX = ball.ballX;
        this.x = this.p.constrain(
          targetX,
          this.p.goalX + this.width / 2,
          this.p.goalX + this.p.goalWidth - this.width / 2
        );
      }

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
      this.reactionDelay = 0; // No delay for AI
    }

    // Handle reaction after delay
    if (this.isReacting && this.reactionDelay > 0) {
      this.reactionDelay--;
      if (this.reactionDelay <= 0) {
        // Determine dive direction based on ball position
        const ballDirection = ball.ballX - this.x;
        this.diveDirection = ballDirection > 0 ? 1 : -1;
        // No need to move here, already moved above
      }
    }

    // Reset reaction state when ball is no longer being kicked
    if (!ball.isKicking) {
      this.isReacting = false;
      this.diveDirection = 0;
    }

    // Improved ball saving logic
    if (ball.isKicking) {
      // --- AI or Two-Player Mode: Use large area and hands for saves ---
      let keeperWidth,
        keeperHeight,
        handReachX = 0,
        handReachY = 0;
      let collisionX = this.x,
        collisionY = this.y;
      let checkHand = false;
      let handX = this.x,
        handY = this.y;
      let handRadius = 30 * this.size;

      if (!this.p.isTwoPlayerMode) {
        // AI: Large area and hand reach
        keeperWidth = this.isReacting ? 80 * this.size : 40 * this.size;
        keeperHeight = this.isReacting ? 80 * this.size : 40 * this.size;
        if (this.isReacting) {
          if (this.diveDirection === -1) handReachX = -40 * this.size;
          else if (this.diveDirection === 1) handReachX = 40 * this.size;
          handReachY = -30 * this.size;
        }
        collisionX = this.x + handReachX;
        collisionY = this.y + handReachY;
      } else {
        // Two-player: Use larger area when diving, and check hands
        keeperWidth = this.isReacting ? 80 * this.size : 40 * this.size;
        keeperHeight = this.isReacting ? 80 * this.size : 40 * this.size;
        // Always use current position for body collision
        collisionX = this.x;
        collisionY = this.y;
        // If GoalkeeperControls sets handX/handY, use those
        if (typeof this.handX === "number" && typeof this.handY === "number") {
          handX = this.handX;
          handY = this.handY;
          checkHand = true;
        }
      }

      // --- Body collision (always check at current position) ---
      if (
        ball.ballX > collisionX - keeperWidth / 2 &&
        ball.ballX < collisionX + keeperWidth / 2 &&
        ball.ballY > collisionY - keeperHeight / 2 &&
        ball.ballY < collisionY + keeperHeight / 2
      ) {
        // Deflect as usual
        const collisionNormal = this.p
          .createVector(ball.ballX - collisionX, ball.ballY - collisionY)
          .normalize();
        const dot =
          ball.ballSpeedX * collisionNormal.x +
          ball.ballSpeedY * collisionNormal.y;
        const restitution = 0.7;
        ball.ballSpeedX =
          (ball.ballSpeedX - 2 * dot * collisionNormal.x) * restitution;
        ball.ballSpeedY =
          (ball.ballSpeedY - 2 * dot * collisionNormal.y) * restitution;
        const angleJitter = this.p.radians(this.p.random(-10, 10));
        const speed = Math.sqrt(
          ball.ballSpeedX * ball.ballSpeedX + ball.ballSpeedY * ball.ballSpeedY
        );
        const newAngle =
          Math.atan2(ball.ballSpeedY, ball.ballSpeedX) + angleJitter;
        ball.ballSpeedX = speed * Math.cos(newAngle);
        ball.ballSpeedY = speed * Math.sin(newAngle);
        const relativeVelX = ball.ballSpeedX - (this.x - prevX);
        const relativeVelY = ball.ballSpeedY;
        ball.spin = this.p.constrain(
          (relativeVelX * collisionNormal.y -
            relativeVelY * collisionNormal.x) *
            0.03,
          -0.7,
          0.7
        );
        const ballRadius = 10 * this.scaleX;
        ball.ballX =
          collisionX + collisionNormal.x * (keeperWidth / 2 + ballRadius + 2);
        ball.ballY =
          collisionY + collisionNormal.y * (keeperHeight / 2 + ballRadius + 2);
        ball.wasShotByPlayer = false;
        ball.wasSaved = true;
        this.isReacting = false;
        return;
      }

      // --- Hand collision (two-player mode only) ---
      if (checkHand) {
        const distToHand = this.p.dist(ball.ballX, ball.ballY, handX, handY);
        if (distToHand < handRadius) {
          // Deflect as if hit by hand
          const collisionNormal = this.p
            .createVector(ball.ballX - handX, ball.ballY - handY)
            .normalize();
          const dot =
            ball.ballSpeedX * collisionNormal.x +
            ball.ballSpeedY * collisionNormal.y;
          const restitution = 0.7;
          ball.ballSpeedX =
            (ball.ballSpeedX - 2 * dot * collisionNormal.x) * restitution;
          ball.ballSpeedY =
            (ball.ballSpeedY - 2 * dot * collisionNormal.y) * restitution;
          const angleJitter = this.p.radians(this.p.random(-10, 10));
          const speed = Math.sqrt(
            ball.ballSpeedX * ball.ballSpeedX +
              ball.ballSpeedY * ball.ballSpeedY
          );
          const newAngle =
            Math.atan2(ball.ballSpeedY, ball.ballSpeedX) + angleJitter;
          ball.ballSpeedX = speed * Math.cos(newAngle);
          ball.ballSpeedY = speed * Math.sin(newAngle);
          const relativeVelX = ball.ballSpeedX - (this.x - prevX);
          const relativeVelY = ball.ballSpeedY;
          ball.spin = this.p.constrain(
            (relativeVelX * collisionNormal.y -
              relativeVelY * collisionNormal.x) *
              0.03,
            -0.7,
            0.7
          );
          const ballRadius = 10 * this.scaleX;
          ball.ballX =
            handX + collisionNormal.x * (handRadius + ballRadius + 2);
          ball.ballY =
            handY + collisionNormal.y * (handRadius + ballRadius + 2);
          ball.wasShotByPlayer = false;
          ball.wasSaved = true;
          this.isReacting = false;
          return;
        }
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
