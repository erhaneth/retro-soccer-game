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
  let difficulty = "hard";
  let adImage;
  let isTwoPlayerMode = false;
  let isPlayerOneKicker = true;

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
  const topOffset = 40;

  s.preload = () => {
    adImage = s.loadImage("/icon-192x192.png");
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

    goalkeeper = new Goalkeeper(s, 1, 1, difficulty, isPlayerOneKicker ? 2 : 1);
    ball = new Ball(s, 1, 1, player.x, player.y, player.aimAngle, goalkeeper);

    if (isTwoPlayerMode) {
      goalkeeperControls = new GoalkeeperControls(s);
    }

    // Reset ball to penalty spot
    const penaltySpotX = s.width / 2;
    const penaltySpotY = penaltyMarkY;
    ball.resetToPenalty(penaltySpotX, penaltySpotY);
    player.x = penaltySpotX;
    player.y = penaltySpotY + 50;
  }

  function swapRoles() {
    isPlayerOneKicker = !isPlayerOneKicker;
    // Reset shots for the new kicker
    shotsTaken = 0;
    // Reinitialize players with swapped roles
    initializeRoles();
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
          const penaltySpotY = penaltyMarkY;
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
          const penaltySpotY = penaltyMarkY;
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
    if (adImage) {
      const adWidth = 80; // Reduced ad size to make space
      const adHeight = 32;
      const numAds = 8;
      const spacing = 1;
      const totalWidth = adWidth * numAds + spacing * (numAds - 1);
      const startX = (s.width - totalWidth) / 2;
      const adY = 5;

      s.fill(255);
      s.noStroke();
      s.rect(0, adY, s.width, adHeight);

      for (let i = 0; i < numAds; i++) {
        const adX = startX + i * (adWidth + spacing);
        s.image(adImage, adX, adY, adWidth, adHeight);
      }
    }
  }

  function drawField(s) {
    const stripeHeight = 20;
    for (let y = topOffset; y < s.height; y += stripeHeight * 2) {
      s.fill("#0aa116");
      s.noStroke();
      s.rect(0, y, s.width, stripeHeight);
      s.fill("#0ca618");
      s.rect(0, y + stripeHeight, s.width, stripeHeight);
    }

    s.fill(255);
    s.noStroke();
    s.rect(0, 0, s.width, 4);
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
    const boxY = 0;
    s.stroke(255);
    s.strokeWeight(2);
    s.noFill();
    s.rect(boxX, boxY, penaltyAreaWidth, penaltyAreaHeight);

    const penaltySpotX = s.width / 2;
    const penaltySpotY = penaltyMarkY;
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
    const goalAreaY = 0;
    s.stroke(255);
    s.strokeWeight(2);
    s.noFill();
    s.rect(goalAreaX, goalAreaY, goalAreaWidth, goalAreaHeight);
  }

  function drawGoal(s, netColorTimer) {
    const goalX = s.width / 2 - goalWidth / 2;
    const goalY = 0;

    s.fill(255);
    s.noStroke();
    s.rect(goalX, goalY, goalWidth, 8);
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
      s.image(playerOneFlag, scoreX, scoreY, flagWidth, flagHeight);
    }
    s.text(
      `Player 1: ${playerOneScore}`,
      scoreX + flagWidth + spacing,
      scoreY + flagHeight / 2 - 8
    );

    // Player Two Score and Flag (only if two player mode)
    if (isTwoPlayerMode) {
      if (playerTwoFlag) {
        s.image(
          playerTwoFlag,
          scoreX,
          scoreY + flagHeight + spacing,
          flagWidth,
          flagHeight
        );
      }
      s.text(
        `Player 2: ${playerTwoScore}`,
        scoreX + flagWidth + spacing,
        scoreY + flagHeight + spacing + flagHeight / 2 - 8
      );
    }

    // Rest of the UI
    s.text(
      `Shots: ${shotsTaken}/${maxShots}`,
      10,
      scoreY + (flagHeight + spacing) * (isTwoPlayerMode ? 2 : 1)
    );
    s.text(`Aim Angle: ${Math.round(player.aimAngle)}°`, 10, s.height - 60);
    s.text(`Power: ${Math.round(player.kickPower * 100)}%`, 10, s.height - 40);

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

    if (player.isCharging) {
      s.fill(255, 0, 0);
      s.rect(10, s.height - 20, player.kickPower * 100, 10);
    }
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
  const mountedRef = useRef(false);

  useEffect(() => {
    // Make country codes and game mode available to the sketch
    window.playerOneCountry = playerOneCountry;
    window.playerTwoCountry = playerTwoCountry;
    window.isTwoPlayerMode = mode === "two";

    if (mountedRef.current) return;
    mountedRef.current = true;

    let p5;
    if (typeof window !== "undefined" && !p5Instance.current) {
      import("p5").then((p5Module) => {
        p5 = p5Module.default;
        if (!p5Instance.current && sketchRef.current) {
          p5Instance.current = new p5(sketch, sketchRef.current);
        }
      });
    }

    return () => {
      mountedRef.current = false;
      if (p5Instance.current) {
        p5Instance.current.remove();
        p5Instance.current = null;
      }
      // Clean up global variables
      delete window.playerOneCountry;
      delete window.playerTwoCountry;
      delete window.isTwoPlayerMode;
    };
  }, [playerOneCountry, playerTwoCountry, mode]);

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
