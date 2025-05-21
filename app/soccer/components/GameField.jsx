"use client";

import React, { useRef, useEffect } from "react";
import { Player } from "./Player";
import { Goalkeeper } from "./Goalkeeper";
import { Ball } from "./Ball";
import LogoBanner from "./LogoBanner";
import { GoalkeeperControls } from "./GoalkeeperControls";

const sketch = (s) => {
  let player;
  let goalkeeper;
  let ball;
  let goalkeeperControls;
  let score = 0;
  let shotsTaken = 0;
  let playerOneScore = 0;
  let playerTwoScore = 0;
  let playerOneShots = 0;
  let playerTwoShots = 0;
  let playerOneFlag;
  let playerTwoFlag;
  const maxShots = 5;
  let gameOver = false;
  let goalMessageTimer = 0;
  let netColorChangeTimer = 0;
  let missMessageTimer = 0;
  let difficulty = "easy";
  let adImage;
  let ctdLogo;
  let isTwoPlayerMode = false;
  let isPlayerOneKicker = true;

  // Add new variables for role swap animation
  let isSwappingRoles = false;
  let swapStartTime = 0;
  const swapDuration = 2000; // 2 seconds for the swap animation
  let swapStartPositions = {
    player: { x: 0, y: 0 },
    goalkeeper: { x: 0, y: 0 },
  };
  let swapTargetPositions = {
    player: { x: 0, y: 0 },
    goalkeeper: { x: 0, y: 0 },
  };
  let turnIndicatorTimer = 0;
  const turnIndicatorDuration = 3000; // 3 seconds for turn indicator display

  const pixelsPerYard = 13.33;
  const fieldWidth = 60 * pixelsPerYard;
  const fieldHeight = 50 * pixelsPerYard;
  const goalWidth = 8 * pixelsPerYard * 2.6;
  const goalHeight = 2.67 * pixelsPerYard * 1.8;
  const penaltyAreaWidth = 50 * pixelsPerYard;
  const penaltyAreaHeight = 25 * pixelsPerYard;
  const penaltyMarkY = 20 * pixelsPerYard;
  const goalAreaWidth = 20 * pixelsPerYard;
  const goalAreaHeight = 6 * pixelsPerYard;
  const centerCircleRadius = 6 * pixelsPerYard;
  const topOffset = 60;
  const fieldYOffset = 60; // Push the field down to make space for ads
  const bannerHeight = 60;

  s.preload = () => {
    adImage = s.loadImage("/ctdlabs.png");
    ctdLogo = s.loadImage("/ctd.png");
    // Load flag images
    if (window.playerOneCountry) {
      playerOneFlag = s.loadImage(
        `https://flagcdn.com/w80/${window.playerOneCountry.toLowerCase()}.png`
      );
    }
    if (window.playerTwoCountry) {
      playerTwoFlag = s.loadImage(
        `https://flagcdn.com/w80/${window.playerTwoCountry.toLowerCase()}.png`
      );
    }
  };

  s.setup = () => {
    let canvas = s.createCanvas(800, 800);
    canvas.style("background-color", "transparent");
    s.noSmooth();
    s.pixelDensity(1);

    // Set game mode from window variable
    isTwoPlayerMode = window.isTwoPlayerMode;

    drawBackground(s);
    drawField(s);
    drawPenaltyArea(s);
    drawGoal(s, 0);
    drawAds(s);

    initializeRoles();
  };

  function initializeRoles() {
    // Initialize player and goalkeeper based on current roles
    player = new Player(
      s,
      1,
      1,
      () => {
        if (isPlayerOneKicker) {
          playerOneShots += 1;
        } else {
          playerTwoShots += 1;
        }
      },
      isPlayerOneKicker ? 1 : 2
    );

    // Place goalkeeper inside the goal (not above the ads)
    const keeperY = fieldYOffset + 45; // 30px below the top of the goal
    goalkeeper = new Goalkeeper(s, 1, 1, difficulty, isPlayerOneKicker ? 2 : 1);
    goalkeeper.y = keeperY;
    ball = new Ball(s, 1, 1, player.x, player.y, player.aimAngle, goalkeeper);

    if (isTwoPlayerMode) {
      goalkeeperControls = new GoalkeeperControls(s);
    }

    // Reset ball to penalty spot
    const penaltySpotX = s.width / 2;
    const penaltySpotY = penaltyMarkY + fieldYOffset;
    ball.resetToPenalty(penaltySpotX, penaltySpotY);
    player.x = penaltySpotX;
    player.y = penaltySpotY + 50;
  }

  function swapRoles() {
    isPlayerOneKicker = !isPlayerOneKicker;
    // Store current positions for animation
    swapStartPositions = {
      player: { x: player.x, y: player.y },
      goalkeeper: { x: goalkeeper.x, y: goalkeeper.y },
    };

    // Calculate target positions (swap positions)
    swapTargetPositions = {
      player: { x: goalkeeper.x, y: goalkeeper.y },
      goalkeeper: { x: player.x, y: player.y },
    };

    // Start the swap animation
    isSwappingRoles = true;
    swapStartTime = s.millis();
    turnIndicatorTimer = turnIndicatorDuration;

    // Reset shots for the new kicker
    shotsTaken = 0;
  }

  s.keyPressed = () => {
    if (isTwoPlayerMode) {
      if (
        s.keyCode === 74 ||
        s.keyCode === 76 ||
        s.keyCode === 73 ||
        s.keyCode === 75
      ) {
        goalkeeperControls.handleKeyPress(s.keyCode);
        return;
      }
    }

    // Handle space key for both modes
    if (s.keyCode === 32) {
      if (player && !player.isCharging) {
        player.isCharging = true;
        player.kickPower = 0;
      }
    }
  };

  s.keyReleased = () => {
    if (isTwoPlayerMode) {
      if (
        s.keyCode === 74 ||
        s.keyCode === 76 ||
        s.keyCode === 73 ||
        s.keyCode === 75
      ) {
        goalkeeperControls.handleKeyRelease(s.keyCode);
        return;
      }
    }

    // Handle space key for both modes
    if (s.keyCode === 32) {
      if (player && player.isCharging) {
        player.isCharging = false;
        if (ball) {
          ball.kick(player.kickPower, player.aimAngle);
        }
      }
    }
  };

  s.draw = () => {
    if (!gameOver) {
      s.clear();
      drawBackground(s);
      drawField(s);
      drawPenaltyArea(s);
      drawGoal(s, netColorChangeTimer);
      drawAds(s);

      // Handle role swap animation
      if (isSwappingRoles) {
        const currentTime = s.millis();
        const swapProgress = (currentTime - swapStartTime) / swapDuration;

        if (swapProgress >= 1) {
          // Animation complete, reinitialize players with swapped roles
          isSwappingRoles = false;
          initializeRoles();
        } else {
          // Calculate intermediate positions using smooth easing
          const easedProgress = 0.5 - Math.cos(swapProgress * Math.PI) / 2;

          // Update positions
          player.x = s.lerp(
            swapStartPositions.player.x,
            swapTargetPositions.player.x,
            easedProgress
          );
          player.y = s.lerp(
            swapStartPositions.player.y,
            swapTargetPositions.player.y,
            easedProgress
          );
          goalkeeper.x = s.lerp(
            swapStartPositions.goalkeeper.x,
            swapTargetPositions.goalkeeper.x,
            easedProgress
          );
          goalkeeper.y = s.lerp(
            swapStartPositions.goalkeeper.y,
            swapTargetPositions.goalkeeper.y,
            easedProgress
          );
        }
      }

      if (goalkeeper) {
        if (isTwoPlayerMode) {
          goalkeeperControls.update(goalkeeper, ball);
        } else {
          goalkeeper.update(ball);
        }
        goalkeeper.draw();
      }

      if (player) {
        player.update(ball, goalkeeper);
        player.draw();
      }

      if (ball) {
        ball.update();
        ball.draw(player.x, player.y);

        // Handle save as a miss first
        if (ball.wasSaved) {
          shotsTaken += 1;
          missMessageTimer = 60;
          // Reset ball to penalty spot
          const penaltySpotX = s.width / 2;
          const penaltySpotY = penaltyMarkY + fieldYOffset;
          ball.resetToPenalty(penaltySpotX, penaltySpotY);
          player.x = penaltySpotX;
          player.y = penaltySpotY + 50;
          ball.wasSaved = false;
        } else if (ball.checkGoal()) {
          // Only check for goal if there was no save
          if (isPlayerOneKicker) {
            playerOneScore += 1;
          } else {
            playerTwoScore += 1;
          }
          shotsTaken += 1;
          goalMessageTimer = 60;
          netColorChangeTimer = 60;
        }

        if (ball.isKicking) {
          if (
            ball.ballX < 0 ||
            ball.ballX > s.width ||
            ball.ballY < 0 ||
            ball.ballY > s.height ||
            (Math.abs(ball.ballSpeedX) < 0.3 &&
              Math.abs(ball.ballSpeedY) < 0.3 &&
              ball.ballY >= s.height - 20)
          ) {
            shotsTaken += 1;
            missMessageTimer = 60;
          }
        }

        if (!ball.isKicking && ball.wasShotByPlayer) {
          const penaltySpotX = s.width / 2;
          const penaltySpotY = penaltyMarkY + fieldYOffset;
          ball.resetToPenalty(penaltySpotX, penaltySpotY);
          player.x = penaltySpotX;
          player.y = penaltySpotY + 50;
          ball.wasShotByPlayer = false;
        }
      }

      if (shotsTaken >= maxShots) {
        if (isTwoPlayerMode) {
          if (isPlayerOneKicker) {
            playerOneShots = maxShots;
            swapRoles();
          } else {
            playerTwoShots = maxShots;
            gameOver = true;
          }
        } else {
          gameOver = true;
        }
      }

      // Draw enhanced turn indicator
      if (turnIndicatorTimer > 0) {
        turnIndicatorTimer -= s.deltaTime;

        // Retro Pulsing: Blinking text (toggle visibility or color)

        const blinkSpeed = 30; // Lower is faster blinking
        const isVisible = s.frameCount % blinkSpeed < blinkSpeed / 2;

        s.push();
        // Move indicator to the bottom center (or top for a scoreboard feel)
        s.translate(s.width / 2, s.height - 60); // Adjusted Y position for a bar

        // --- Background Bar ---
        const barWidth = 300;
        const barHeight = 60;
        const barColor = s.color(0, 0, 50); // Dark retro blue
        const borderColor = s.color(255, 200, 0); // Retro yellow/gold

        s.fill(barColor);
        s.stroke(borderColor);
        s.strokeWeight(4); // Chunky border
        s.rectMode(s.CENTER);
        s.rect(0, 0, barWidth, barHeight);

        // --- Swapping Icon ---
        const iconSize = 20;
        const iconPadding = 15;
        const iconY = 0; // Centered vertically in the bar
        const iconColor = s.color(0, 255, 255); // Cyan

        s.fill(iconColor);
        s.noStroke();
        // Arrow 1 (pointing left)
        s.beginShape();
        s.vertex(
          -barWidth / 2 + iconPadding + iconSize / 2,
          iconY - iconSize / 2
        ); // Arrow point
        s.vertex(-barWidth / 2 + iconPadding + iconSize, iconY);
        s.vertex(
          -barWidth / 2 + iconPadding + iconSize / 2,
          iconY + iconSize / 2
        );
        s.vertex(
          -barWidth / 2 + iconPadding + iconSize / 2,
          iconY + iconSize / 4
        );
        s.vertex(-barWidth / 2 + iconPadding, iconY + iconSize / 4);
        s.vertex(-barWidth / 2 + iconPadding, iconY - iconSize / 4);
        s.vertex(
          -barWidth / 2 + iconPadding + iconSize / 2,
          iconY - iconSize / 4
        );
        s.endShape(s.CLOSE);

        // Arrow 2 (pointing right) - conceptual placement
        const iconOffsetForSecondArrow = iconSize + 5; // Space between arrows
        s.beginShape();
        s.vertex(
          -barWidth / 2 + iconPadding + iconOffsetForSecondArrow + iconSize / 2,
          iconY
        ); // Arrow point (right)
        s.vertex(
          -barWidth / 2 + iconPadding + iconOffsetForSecondArrow,
          iconY - iconSize / 2
        );
        s.vertex(
          -barWidth / 2 + iconPadding + iconOffsetForSecondArrow,
          iconY + iconSize / 2
        );
        // ... and so on for the body of the right-pointing arrow, mirrored from the left one.
        s.endShape(s.CLOSE);

        // --- Text ---
        const turnText = isPlayerOneKicker
          ? "PLAYER 1 TURN" // Or "P1 TURN" for brevity
          : "PLAYER 2 TURN"; // Or "P2 TURN"
        s.textAlign(s.CENTER, s.CENTER);
        s.textSize(20); // Adjust for pixel font readability

        s.textStyle(s.NORMAL); // Retro fonts often don't need 'BOLD' explicitly

        // Blinking Text Logic
        if (isVisible) {
          s.fill(255, 255, 255); // White text
          s.text(turnText, 0, 0); // Centered in the bar
        }

        s.pop();
      }

      drawUI(s);

      if (goalMessageTimer > 0) {
        s.push();
        s.fill(255, 215, 0);
        s.textSize(64);
        s.textAlign(s.CENTER, s.CENTER);
        s.text("GOOOAL!", s.width / 2, s.height / 2);
        s.pop();
        goalMessageTimer -= 1;
      }

      if (missMessageTimer > 0) {
        s.push();
        s.fill(255, 0, 0);
        s.textSize(64);
        s.textAlign(s.CENTER, s.CENTER);
        s.text("MISSED!", s.width / 2, s.height / 2);
        s.pop();
        missMessageTimer -= 1;
      }
    } else {
      drawGameOver(s);
    }
  };

  function drawBackground(s) {
    s.clear();
    const stripeHeight = 20;
    for (let y = topOffset; y < s.height; y += stripeHeight * 2) {
      s.fill("#0aa116");
      s.noStroke();
      s.rect(0, y, s.width, stripeHeight);
      s.fill("#0ca618");
      s.rect(0, y + stripeHeight, s.width, stripeHeight);
    }
  }

  function drawAds(s) {
    if (!adImage || !ctdLogo) return;

    // Draw full-width white banner background
    s.push();
    s.noStroke();
    s.fill(255);
    s.rect(0, 0, s.width, bannerHeight);
    s.pop();

    // --- Left: Player flag and name ---
    const flagWidth = 36;
    const flagHeight = 24;
    const leftPadding = 20;
    const textPadding = 10;
    let flagImg = playerOneFlag;
    let playerName = `Player 1: ${playerOneScore}`;
    if (!isPlayerOneKicker && isTwoPlayerMode) {
      flagImg = playerTwoFlag;
      playerName = `Player 2: ${playerTwoScore}`;
    }
    if (flagImg) {
      s.image(
        flagImg,
        leftPadding,
        (bannerHeight - flagHeight) / 2,
        flagWidth,
        flagHeight
      );
    }
    s.fill(30);
    s.textSize(22);
    s.textAlign(s.LEFT, s.CENTER);
    s.text(playerName, leftPadding + flagWidth + textPadding, bannerHeight / 2);

    // --- Center: Ads ---
    const logoCount = 4;
    const logoW = 60;
    const logoH = 30;
    const totalLogoWidth = logoCount * logoW;
    const logoSpacing = 20;
    const totalSpacing = (logoCount - 1) * logoSpacing;
    const centerStartX = s.width / 2 - (totalLogoWidth + totalSpacing) / 2;
    for (let i = 0; i < logoCount; i++) {
      const img = i % 2 === 0 ? ctdLogo : adImage;
      const imgX = centerStartX + i * (logoW + logoSpacing);
      const imgY = (bannerHeight - logoH) / 2;
      s.image(img, imgX, imgY, logoW, logoH);
    }

    // --- Right: Shots tracker ---
    s.textAlign(s.RIGHT, s.CENTER);
    s.textSize(22);
    const shotsText = `Shots: ${shotsTaken}/${maxShots}`;
    s.text(shotsText, s.width - leftPadding, bannerHeight / 2);
  }

  function drawField(s) {
    const stripeHeight = 20;
    for (let y = topOffset; y < s.height; y += stripeHeight * 2) {
      s.fill("#0aa116");
      s.noStroke();
      s.rect(0, y + fieldYOffset, s.width, stripeHeight);
      s.fill("#0ca618");
      s.rect(0, y + stripeHeight + fieldYOffset, s.width, stripeHeight);
    }

    s.fill(255);
    s.noStroke();
    s.rect(0, fieldYOffset, s.width, 4);
    s.rect(0, s.height - 4, s.width, 4);

    s.noFill();
    s.stroke(255);
    s.strokeWeight(2);
    s.arc(
      s.width / 2,
      s.height,
      centerCircleRadius * 2,
      centerCircleRadius * 2,
      s.radians(180),
      s.radians(360)
    );
  }

  function drawPenaltyArea(s) {
    const boxX = s.width / 2 - penaltyAreaWidth / 2;
    const boxY = fieldYOffset;
    s.stroke(255);
    s.strokeWeight(2);
    s.noFill();
    s.rect(boxX, boxY, penaltyAreaWidth, penaltyAreaHeight);

    const penaltySpotX = s.width / 2;
    const penaltySpotY = penaltyMarkY + fieldYOffset;
    s.fill(255);
    s.noStroke();
    s.circle(penaltySpotX, penaltySpotY, 8);

    s.noFill();
    s.stroke(255);
    s.strokeWeight(2);
    const arcRadius = 15 * pixelsPerYard;
    s.arc(
      penaltySpotX,
      penaltySpotY,
      arcRadius * 2,
      arcRadius * 2,
      s.radians(20),
      s.radians(160),
      s.OPEN
    );

    const goalAreaX = s.width / 2 - goalAreaWidth / 2;
    const goalAreaY = fieldYOffset;
    s.stroke(255);
    s.strokeWeight(2);
    s.noFill();
    s.rect(goalAreaX, goalAreaY, goalAreaWidth, goalAreaHeight);
  }

  function drawGoal(s, netColorTimer) {
    const goalX = s.width / 2 - goalWidth / 2;
    const goalY = fieldYOffset;

    s.fill(255);
    s.noStroke();
    s.rect(goalX, goalY, goalWidth, 8); // goal line
    s.rect(goalX, goalY, 8, goalHeight);
    s.rect(goalX + goalWidth - 8, goalY, 8, goalHeight);

    const netTopY = goalY + 2;
    const netBottomY = goalY + goalHeight;
    const inset = 20;

    const netTopLeft = s.createVector(goalX, netTopY);
    const netTopRight = s.createVector(goalX + goalWidth, netTopY);
    const netBottomLeft = s.createVector(goalX + inset, netBottomY);
    const netBottomRight = s.createVector(
      goalX + goalWidth - inset,
      netBottomY
    );

    if (netColorTimer > 0) {
      s.stroke(255, 215, 0, 150);
      netColorChangeTimer -= 1;
    } else {
      s.stroke(255, 150);
    }
    s.strokeWeight(1);

    let vSteps = 10;
    for (let i = 0; i <= vSteps; i++) {
      let t = i / vSteps;
      let xTop = s.lerp(netTopLeft.x, netTopRight.x, t);
      let xBottom = s.lerp(netBottomLeft.x, netBottomRight.x, t);
      s.line(xTop, netTopY, xBottom, netBottomY);
    }

    let hSteps = 8;
    for (let j = 0; j <= hSteps; j++) {
      let t = j / hSteps;
      let yLine = s.lerp(netTopY, netBottomY, t);
      let xLeft = s.lerp(netTopLeft.x, netBottomLeft.x, t);
      let xRight = s.lerp(netTopRight.x, netBottomRight.x, t);
      s.line(xLeft, yLine, xRight, yLine);
    }

    s.goalX = goalX;
    s.goalY = goalY;
    s.goalWidth = goalWidth;
    s.goalHeight = goalHeight;
  }

  function drawUI(s) {
    const uiStartY = 50;
    s.fill(255);
    s.textSize(16);
    s.textAlign(s.LEFT, s.TOP);

    // Draw flags and scores
    const flagWidth = 30;
    const flagHeight = 20;
    const scoreX = 10;
    const scoreY = uiStartY + 20;
    const spacing = 10;

    // Player One Score and Flag
    if (playerOneFlag) {
      // s.image(playerOneFlag, scoreX, scoreY, flagWidth, flagHeight);
    }
    // s.text(
    //   `Player 1: ${playerOneScore}`,
    //   scoreX + flagWidth + spacing,
    //   scoreY + flagHeight / 2 - 8
    // );

    // Player Two Score and Flag (only if two player mode)
    if (isTwoPlayerMode) {
      // if (playerTwoFlag) {
      //   s.image(
      //     playerTwoFlag,
      //     scoreX,
      //     scoreY + flagHeight + spacing,
      //     flagWidth,
      //     flagHeight
      //   );
      // }
      // s.text(
      //   `Player 2: ${playerTwoScore}`,
      //   scoreX + flagWidth + spacing,
      //   scoreY + flagHeight + spacing + flagHeight / 2 - 8
      // );
    }

    // Rest of the UI
    // s.text(
    //   `Shots: ${shotsTaken}/${maxShots}`,
    //   10,
    //   scoreY + (flagHeight + spacing) * (isTwoPlayerMode ? 2 : 1)
    // );

    // --- PENALTY KICK CONTROLS ---
    if (!ball.isKicking) {
      // Calculate control panel position and dimensions
      const controlPanelWidth = 300;
      const controlPanelHeight = 80;
      const controlPanelX = s.width / 2 - controlPanelWidth / 2;
      const controlPanelY = s.height - controlPanelHeight - 20;

      // Draw control panel background
      s.push();
      s.noStroke();
      s.fill(30, 30, 30, 220);
      s.rect(
        controlPanelX,
        controlPanelY,
        controlPanelWidth,
        controlPanelHeight,
        9
      );

      // Draw panel border
      s.stroke(255, 200, 0);
      s.strokeWeight(3);
      s.noFill();
      s.rect(
        controlPanelX,
        controlPanelY,
        controlPanelWidth,
        controlPanelHeight,
        9
      );

      // --- POWER BAR ---
      const powerBarWidth = 200;
      const powerBarHeight = 15;
      const powerBarX = s.width / 2 - powerBarWidth / 2;
      const powerBarY = controlPanelY + 15;

      // Power bar background
      s.noStroke();
      s.fill(50, 50, 50);
      s.rect(powerBarX, powerBarY, powerBarWidth, powerBarHeight, 7);

      // Draw power segments
      const segmentCount = 10;
      const segmentWidth = powerBarWidth / segmentCount;
      s.stroke(255, 255, 255, 30);
      s.strokeWeight(1);
      for (let i = 1; i < segmentCount; i++) {
        s.line(
          powerBarX + i * segmentWidth,
          powerBarY,
          powerBarX + i * segmentWidth,
          powerBarY + powerBarHeight
        );
      }

      // Power bar fill with sweeping motion
      if (player.isCharging) {
        // Draw the current power level
        s.fill(255, 0, 0);
        s.rect(
          powerBarX,
          powerBarY,
          player.kickPower * powerBarWidth,
          powerBarHeight,
          7
        );

        // Draw the sweeping indicator
        const sweepX = powerBarX + player.powerSweepAngle * powerBarWidth;
        s.fill(255, 255, 255, 150);
        s.triangle(
          sweepX - 5,
          powerBarY - 8,
          sweepX + 5,
          powerBarY - 8,
          sweepX,
          powerBarY
        );
      }

      // --- AIMING METER ---
      const meterWidth = 200;
      const meterHeight = 18;
      const meterX = s.width / 2 - meterWidth / 2;
      const meterY = controlPanelY + 45;

      // Meter background
      s.noStroke();
      s.fill(50, 50, 50);
      s.rect(meterX, meterY, meterWidth, meterHeight, 9);

      // Draw center line
      s.stroke(255, 255, 255, 80);
      s.strokeWeight(1);
      s.line(
        meterX + meterWidth / 2,
        meterY,
        meterX + meterWidth / 2,
        meterY + meterHeight
      );

      // Auto-sweeping aim dot
      const minAngle = -180;
      const maxAngle = 0;
      const sweepSpeed = 0.02;
      const sweepRange = maxAngle - minAngle;
      const currentSweep = (Math.sin(s.frameCount * sweepSpeed) + 1) / 2; // 0 to 1
      const currentAngle = minAngle + sweepRange * currentSweep;

      // Only update the aim angle if not charging (first press of space)
      if (!player.isCharging) {
        player.aimAngle = currentAngle;
      }

      // Draw aim dot (always show current sweep position)
      const markerNorm = (currentAngle - minAngle) / sweepRange;
      const markerX = meterX + markerNorm * meterWidth;

      // Flash the dot when ready to kick
      const flashRate = 0.1;
      const isFlashing = Math.sin(s.frameCount * flashRate) > 0;
      s.noStroke();
      s.fill(255, 80, 0, isFlashing ? 255 : 180);
      s.ellipse(markerX, meterY + meterHeight / 2, 18, 18);

      // Draw text labels
      s.textAlign(s.LEFT, s.CENTER);
      s.textSize(12);
      s.fill(255);
      s.text("LEFT", meterX - 38, meterY + meterHeight / 2);
      s.textAlign(s.RIGHT, s.CENTER);
      s.text("RIGHT", meterX + meterWidth + 38, meterY + meterHeight / 2);

      // Draw "Ready to Kick" text when not charging
      if (!player.isCharging) {
        s.textAlign(s.CENTER, s.CENTER);
        s.textSize(14);
        s.fill(255, 200, 0);
        s.text("TAP TO KICK", s.width / 2, controlPanelY - 10);
      }

      // Draw "Kick!" text when charging
      if (player.isCharging) {
        s.textAlign(s.CENTER, s.CENTER);
        s.textSize(20);
        s.fill(255, 0, 0);
        s.text("KICK!", s.width / 2, controlPanelY - 10);
      }

      s.pop();
    }

    // Draw minimap
    const miniMapWidth = 100;
    const miniMapHeight = 100;
    const miniMapX = s.width - miniMapWidth - 10;
    const miniMapY = s.height - miniMapHeight - 10;

    s.fill(0, 100, 0, 200);
    s.rect(miniMapX, miniMapY, miniMapWidth, miniMapHeight);

    const scaleX = miniMapWidth / s.width;
    const scaleY = miniMapHeight / s.height;

    s.fill(255, 0, 0);
    s.circle(miniMapX + player.x * scaleX, miniMapY + player.y * scaleY, 5);
    s.fill(0, 0, 255);
    s.circle(
      miniMapX + goalkeeper.x * scaleX,
      miniMapY + goalkeeper.y * scaleY,
      5
    );
    s.fill(255);
    s.circle(miniMapX + ball.ballX * scaleX, miniMapY + ball.ballY * scaleY, 3);
  }

  function drawGameOver(s) {
    s.background(0, 0, 0, 230); // Semi-transparent black background

    // Center container
    const centerX = s.width / 2;
    const centerY = s.height / 2;
    const containerWidth = 400;
    const containerHeight = 300;
    const containerX = centerX - containerWidth / 2;
    const containerY = centerY - containerHeight / 2;

    // Draw container background
    s.fill(28, 33, 48);
    s.noStroke();
    s.rect(containerX, containerY, containerWidth, containerHeight, 15);

    // Game Over text
    s.fill(255);
    s.textSize(42);
    s.textAlign(s.CENTER, s.CENTER);
    s.text("Game Over!", centerX, containerY + 60);

    if (isTwoPlayerMode) {
      // Draw flags and scores for two-player mode
      const flagWidth = 40;
      const flagHeight = 26;
      const scoreSpacing = 80;

      // Player One Score and Flag
      if (playerOneFlag) {
        s.image(
          playerOneFlag,
          centerX - scoreSpacing - flagWidth,
          centerY - flagHeight / 2,
          flagWidth,
          flagHeight
        );
      }
      s.textSize(32);
      s.text(playerOneScore, centerX - scoreSpacing + flagWidth / 2, centerY);

      // VS text
      s.textSize(24);
      s.text("vs", centerX, centerY);

      // Player Two Score and Flag
      if (playerTwoFlag) {
        s.image(
          playerTwoFlag,
          centerX + scoreSpacing,
          centerY - flagHeight / 2,
          flagWidth,
          flagHeight
        );
      }
      s.textSize(32);
      s.text(playerTwoScore, centerX + scoreSpacing + flagWidth * 1.5, centerY);
    } else {
      // Single player mode - show final score
      s.textSize(32);
      s.text(`Final Score: ${playerOneScore}`, centerX, centerY);
    }

    // Play Again button
    const buttonWidth = 200;
    const buttonHeight = 50;
    const buttonX = centerX - buttonWidth / 2;
    const buttonY = containerY + containerHeight - buttonHeight - 40;

    // Check if mouse is over button
    const isHovered =
      s.mouseX > buttonX &&
      s.mouseX < buttonX + buttonWidth &&
      s.mouseY > buttonY &&
      s.mouseY < buttonY + buttonHeight;

    // Draw button
    s.fill(isHovered ? "#4CAF50" : "#2E7D32");
    s.rect(buttonX, buttonY, buttonWidth, buttonHeight, 25);

    // Button text
    s.fill(255);
    s.textSize(24);
    s.text("Play Again", centerX, buttonY + buttonHeight / 2);

    // Add click handler for the button
    s.mousePressed = () => {
      if (isHovered) {
        window.location.href = "/";
      }
    };
  }
};

export default function GameField({
  playerOneCountry,
  playerTwoCountry,
  mode,
}) {
  const sketchRef = useRef();
  const p5Instance = useRef(null);
  const [isClient, setIsClient] = React.useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    // Make country codes and game mode available to the sketch
    window.playerOneCountry = playerOneCountry;
    window.playerTwoCountry = playerTwoCountry;
    window.isTwoPlayerMode = mode === "two";

    let p5;
    if (!p5Instance.current) {
      import("p5").then((p5Module) => {
        p5 = p5Module.default;
        if (!p5Instance.current && sketchRef.current) {
          p5Instance.current = new p5(sketch, sketchRef.current);
        }
      });
    }

    return () => {
      if (p5Instance.current) {
        p5Instance.current.remove();
        p5Instance.current = null;
      }
      // Clean up global variables
      delete window.playerOneCountry;
      delete window.playerTwoCountry;
      delete window.isTwoPlayerMode;
    };
  }, [isClient, playerOneCountry, playerTwoCountry, mode]);

  if (!isClient) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div
          ref={sketchRef}
          className="relative"
          style={{
            width: "800px",
            height: "800px",
            margin: "0 auto",
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-full h-full">
      <div
        ref={sketchRef}
        className="relative"
        style={{
          width: "800px",
          height: "800px",
          margin: "0 auto",
        }}
      />
    </div>
  );
}
