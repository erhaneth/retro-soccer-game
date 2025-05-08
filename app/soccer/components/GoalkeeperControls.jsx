export class GoalkeeperControls {
  constructor(p) {
    this.p = p;
    this.leftKey = false;
    this.rightKey = false;
    this.upKey = false;
    this.downKey = false;
    this.speed = 5;
    this.diveSpeed = 20; // Increased speed for more responsive diving
    this.isDiving = false;
    this.diveDirection = null;
    this.diveStartTime = 0;
    this.diveDuration = 300; // Shorter duration for quicker dives
    this.originalX = 0;
    this.originalY = 0;
    this.recoveryTime = 0; // Time needed to recover from a dive
    this.maxDiveDistance = 100; // Maximum distance the goalkeeper can dive
    this.handReach = 30; // Distance the goalkeeper can reach with their hands
  }

  handleKeyPress(keyCode) {
    if (this.isDiving) return; // Can't start a new dive while already diving

    switch (keyCode) {
      case 74: // 'J' key - dive left
        this.startDive("left");
        break;
      case 76: // 'L' key - dive right
        this.startDive("right");
        break;
      case 73: // 'I' key - dive up
        this.startDive("up");
        break;
      case 75: // 'K' key - dive down
        this.startDive("down");
        break;
      case 65: // 'A' key - move left
      case 37: // Left arrow
        this.leftKey = true;
        break;
      case 68: // 'D' key - move right
      case 39: // Right arrow
        this.rightKey = true;
        break;
    }
  }

  handleKeyRelease(keyCode) {
    switch (keyCode) {
      case 65: // 'A' key - move left
      case 37: // Left arrow
        this.leftKey = false;
        break;
      case 68: // 'D' key - move right
      case 39: // Right arrow
        this.rightKey = false;
        break;
    }
  }

  startDive(direction) {
    this.isDiving = true;
    this.diveDirection = direction;
    this.diveStartTime = this.p.millis();
    this.originalX = this.goalkeeper.x;
    this.originalY = this.goalkeeper.y;
    this.recoveryTime = 0;
  }

  update(goalkeeper, ball) {
    this.goalkeeper = goalkeeper;

    // Allow walking left/right when not diving
    if (!this.isDiving) {
      if (this.leftKey) {
        goalkeeper.x -= this.speed;
      }
      if (this.rightKey) {
        goalkeeper.x += this.speed;
      }
      // Keep within bounds
      goalkeeper.x = this.p.constrain(goalkeeper.x, 0, this.p.width);
      goalkeeper.handX = goalkeeper.x;
      goalkeeper.handY = goalkeeper.y;
    }

    if (this.isDiving) {
      const currentTime = this.p.millis();
      const diveProgress =
        (currentTime - this.diveStartTime) / this.diveDuration;

      if (diveProgress >= 1) {
        // Start recovery phase
        this.recoveryTime += this.p.deltaTime;
        if (this.recoveryTime >= 200) {
          // 200ms recovery time
          this.isDiving = false;
          this.diveDirection = null;
          // Do NOT reset to originalX/originalY; stay at new position
          // goalkeeper.x = this.originalX;
          // goalkeeper.y = this.originalY;
          goalkeeper.handX = goalkeeper.x;
          goalkeeper.handY = goalkeeper.y;
        }
        return;
      }

      // Calculate dive movement with smooth acceleration and deceleration
      const diveDistance =
        this.maxDiveDistance * Math.sin(diveProgress * Math.PI);

      // Adjust dive distance based on ball speed
      let speedMultiplier = 1;
      if (ball) {
        const ballSpeed = Math.sqrt(
          ball.ballSpeedX * ball.ballSpeedX + ball.ballSpeedY * ball.ballSpeedY
        );
        speedMultiplier = Math.min(1.5, 1 + ballSpeed / 10); // Increase dive distance for faster shots
      }

      const adjustedDiveDistance = diveDistance * speedMultiplier;

      // Calculate hand reach based on dive progress
      const handReachProgress = Math.sin(diveProgress * Math.PI);
      const currentHandReach = this.handReach * handReachProgress;

      // Always set handX and handY for all directions
      switch (this.diveDirection) {
        case "left":
          goalkeeper.x = this.originalX - adjustedDiveDistance;
          goalkeeper.y = this.originalY;
          goalkeeper.handX = goalkeeper.x - currentHandReach;
          goalkeeper.handY = goalkeeper.y;
          break;
        case "right":
          goalkeeper.x = this.originalX + adjustedDiveDistance;
          goalkeeper.y = this.originalY;
          goalkeeper.handX = goalkeeper.x + currentHandReach;
          goalkeeper.handY = goalkeeper.y;
          break;
        case "up":
          goalkeeper.x = this.originalX;
          goalkeeper.y = this.originalY - adjustedDiveDistance;
          goalkeeper.handX = goalkeeper.x;
          goalkeeper.handY = goalkeeper.y - currentHandReach;
          break;
        case "down":
          goalkeeper.x = this.originalX;
          goalkeeper.y = this.originalY + adjustedDiveDistance;
          goalkeeper.handX = goalkeeper.x;
          goalkeeper.handY = goalkeeper.y + currentHandReach;
          break;
      }

      // Keep goalkeeper within bounds
      goalkeeper.x = this.p.constrain(goalkeeper.x, 0, this.p.width);
      goalkeeper.y = this.p.constrain(goalkeeper.y, 0, this.p.height / 2);
      goalkeeper.handX = this.p.constrain(goalkeeper.handX, 0, this.p.width);
      goalkeeper.handY = this.p.constrain(
        goalkeeper.handY,
        0,
        this.p.height / 2
      );

      // Check if ball is within hand reach
      if (ball) {
        const distanceToBall = Math.sqrt(
          Math.pow(ball.ballX - goalkeeper.handX, 2) +
            Math.pow(ball.ballY - goalkeeper.handY, 2)
        );

        if (distanceToBall < this.handReach) {
          // Ball is within reach, save it
          ball.ballSpeedX *= 0.5; // Reduce ball speed
          ball.ballSpeedY *= 0.5;
          ball.ballX = goalkeeper.handX;
          ball.ballY = goalkeeper.handY;
          ball.wasSaved = true; // Set the wasSaved flag
        }
      }
    } else {
      // Not diving: hands at body
      goalkeeper.handX = goalkeeper.x;
      goalkeeper.handY = goalkeeper.y;
    }
  }
}
