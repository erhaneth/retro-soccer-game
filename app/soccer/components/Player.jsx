export class Player {
  constructor(p, scaleX, scaleY, onShotCallback, playerNumber = 1) {
    this.p = p;
    this.scaleX = scaleX;
    this.scaleY = scaleY;
    this.playerNumber = playerNumber;

    this.x = 260 * scaleX;
    this.y = 300 * scaleY;
    this.speed = 2 * scaleX;
    this.size = 3 * scaleX;

    this.aimAngle = 0;
    this.isCharging = false;
    this.kickPower = 0;
    this.maxPower = 1;
    this.chargeSpeed = 0.02;

    // Animation state
    this.isMoving = false;
    this.legFrame = 0;
    this.frameSpeed = 0.1;
    this.moveDirection = { x: 0, y: 0 };
    this.onShotCallback = onShotCallback;

    // Improved aiming angle control
    this.aimSpeed = 2; // Base speed for aiming
  }

  update(ball, goalkeeper) {
    const p = this.p;

    const prevX = this.x;
    const prevY = this.y;

    if (p.keyIsDown(87)) this.y -= this.speed;
    if (p.keyIsDown(83)) this.y += this.speed;
    if (p.keyIsDown(65)) this.x -= this.speed;
    if (p.keyIsDown(68)) this.x += this.speed;

    this.x = p.constrain(this.x, 0, p.width - 30 * this.scaleX);
    this.y = p.constrain(this.y, 0, p.height - 30 * this.scaleY);

    this.isMoving = this.x !== prevX || this.y !== prevY;
    if (this.isMoving) {
      this.moveDirection.x = this.x - prevX;
      this.moveDirection.y = this.y - prevY;
      this.legFrame += this.frameSpeed;
      if (this.legFrame > 4) this.legFrame = 0;
    } else {
      this.moveDirection.x = 0;
      this.moveDirection.y = 0;
      this.legFrame = 0;
    }

    // Improved aiming angle control
    const aimAcceleration = 0.1; // How quickly the aiming speed increases
    const maxAimSpeed = 5; // Maximum aiming speed

    if (p.keyIsDown(p.LEFT_ARROW)) {
      this.aimSpeed = p.min(this.aimSpeed + aimAcceleration, maxAimSpeed);
      this.aimAngle -= this.aimSpeed;
    } else if (p.keyIsDown(p.RIGHT_ARROW)) {
      this.aimSpeed = p.min(this.aimSpeed + aimAcceleration, maxAimSpeed);
      this.aimAngle += this.aimSpeed;
    } else {
      this.aimSpeed = 2; // Reset to base speed when not pressing
    }

    // Keep angle between -90 and 90 degrees
    this.aimAngle = p.constrain(this.aimAngle, -180, 0);

    if (p.keyIsDown(32)) {
      this.isCharging = true;
      this.kickPower = p.min(this.kickPower + this.chargeSpeed, this.maxPower);
    } else if (this.isCharging) {
      const distance = p.dist(this.x, this.y, ball.ballX, ball.ballY);
      if (distance < 30 * this.scaleX) {
        const power = this.kickPower * 15;
        ball.kick(power, this.aimAngle);
        this.onShotCallback();
      }
      this.isCharging = false;
      this.kickPower = 0;
    }

    // Update ball's reference to player position for aiming line
    ball.playerX = this.x;
    ball.playerY = this.y;
    ball.aimAngle = this.aimAngle;
  }

  draw() {
    const p = this.p;
    const s = this.size;
    const startX = this.x - 8 * s;
    const startY = this.y - 15 * s;

    // --- Draw Player Sprite ---
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
      let legSwingDirection = 1;
      if (Math.abs(this.moveDirection.x) > Math.abs(this.moveDirection.y)) {
        legSwingDirection = this.moveDirection.x >= 0 ? 1 : -1;
      } else {
        legSwingDirection = this.moveDirection.y >= 0 ? 1 : -1;
      }

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
