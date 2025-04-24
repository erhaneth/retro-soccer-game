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
  let playerOneScore = 0; // Track Player 1's score
  let playerTwoScore = 0; // Track Player 2's score
  let playerOneShots = 0; // Track Player 1's shots
  let playerTwoShots = 0; // Track Player 2's shots
  const maxShots = 5;
  let gameOver = false;
  let goalMessageTimer = 0;
  let netColorChangeTimer = 0;
  let missMessageTimer = 0;
  let difficulty = "hard";
  let adImage;
  let isTwoPlayerMode = true;
  let isPlayerOneKicker = true; // Track which player is the kicker

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
  };

  s.setup = () => {
    let canvas = s.createCanvas(800, 800);
    canvas.style("background-color", "transparent");
    s.noSmooth();
    s.pixelDensity(1);

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

      if (s.keyCode === 32) {
        if (player && !player.isCharging) {
          player.isCharging = true;
          player.kickPower = 0;
        }
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

      if (s.keyCode === 32) {
        if (player && player.isCharging) {
          player.isCharging = false;
          if (ball) {
            ball.kick(player.kickPower, player.aimAngle);
          }
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

        if (ball.checkGoal()) {
          if (isPlayerOneKicker) {
            playerOneScore += 1;
          } else {
            playerTwoScore += 1;
          }
          shotsTaken += 1;
          goalMessageTimer = 60;
          netColorChangeTimer = 60;
          console.log("Crowd cheers: 'GOOOAL!'");
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
            console.log("Crowd groans: 'Missed!'");
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

      // Check for role swap after 5 shots
      if (shotsTaken >= maxShots) {
        if (isPlayerOneKicker) {
          playerOneShots = maxShots;
          swapRoles();
        } else {
          playerTwoShots = maxShots;
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
      s.background(0);
      s.fill(255);
      s.textSize(32);
      s.textAlign(s.CENTER, s.CENTER);
      s.text("Game Over!", s.width / 2, s.height / 2 - 40);
      s.text(`Player 1 Score: ${playerOneScore}`, s.width / 2, s.height / 2);
      s.text(
        `Player 2 Score: ${playerTwoScore}`,
        s.width / 2,
        s.height / 2 + 40
      );
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
    // Display shots info near the ads at the top
    const uiStartY = 50; // Position below ads
    s.fill(255);
    s.textSize(16);
    s.textAlign(s.LEFT, s.TOP);

    // Show current roles
    // s.text(
    //   `Player ${isPlayerOneKicker ? 1 : 2} (Kicker) vs Player ${
    //     isPlayerOneKicker ? 2 : 1
    //   } (Goalkeeper)`,
    //   10,
    //   uiStartY
    // );

    s.text(
      `Player ${isPlayerOneKicker ? 1 : 2} Score: ${
        isPlayerOneKicker ? playerOneScore : playerTwoScore
      }`,
      10,
      uiStartY + 20
    );
    s.text(`Shots: ${shotsTaken}/${maxShots}`, 10, uiStartY + 40);
    s.text(`Aim Angle: ${Math.round(player.aimAngle)}°`, 10, s.height - 60);
    s.text(`Power: ${Math.round(player.kickPower * 100)}%`, 10, s.height - 40);

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
};

export default function GameField() {
  const sketchRef = useRef();

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("p5").then((p5) => {
        const p5Instance = new p5.default(sketch, sketchRef.current);
        return () => {
          p5Instance.remove();
        };
      });
    }
  }, []);

  return (
    <div className="relative">
      <div className="absolute top-10 left-0 w-full h-20 z-10"></div>
      <div
        ref={sketchRef}
        className="relative z-20"
        style={{ backgroundColor: "transparent" }}
      />
    </div>
  );
}
