export class Goalkeeper {
  constructor(p, scaleX, scaleY, difficulty) {
    this.p = p;
    this.scaleX = scaleX;
    this.scaleY = scaleY;
    this.difficulty = difficulty;

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
        const predictedX = ball.ballX;
        if (predictedX < this.x - 10 * this.scaleX) {
          this.targetX = this.p.constrain(
            predictedX,
            this.p.goalX + 20 * this.scaleX,
            this.p.goalX + this.p.goalWidth - 20 * this.scaleX
          );
          this.diveDirection = -1; // Dive left
        } else if (predictedX > this.x + 10 * this.scaleX) {
          this.targetX = this.p.constrain(
            predictedX,
            this.p.goalX + 20 * this.scaleX,
            this.p.goalX + this.p.goalWidth - 20 * this.scaleX
          );
          this.diveDirection = 1; // Dive right
        } else {
          this.diveDirection = 0; // Stay centered for straight shots
        }
      } else {
        // Easy mode: less accurate movement
        this.targetX = this.x + this.p.random(-20, 20) * this.scaleX;
        this.diveDirection =
          this.targetX < this.x ? -1 : this.targetX > this.x ? 1 : 0;
      }
    }

    // Smoothly move toward targetX
    if (Math.abs(this.x - this.targetX) > this.speed) {
      this.x += this.speed * (this.targetX > this.x ? 1 : -1);
      this.isMoving = true;
    } else {
      this.x = this.targetX;
      this.isMoving = false;
    }

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
    const distanceToBall = this.p.dist(this.x, this.y, ball.ballX, ball.ballY);
    if (ball.wasShotByPlayer && distanceToBall < 20 * this.scaleX) {
      const angle = Math.atan2(ball.ballY - this.y, ball.ballX - this.x);
      ball.ballSpeedX = Math.cos(angle) * 5;
      ball.ballSpeedY = Math.sin(angle) * 5;
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

      p.fill(0, 0, 200); // Body (stretched for dive)
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

      p.fill(0, 0, 200); // Body
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
