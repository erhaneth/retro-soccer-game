"use client";

import React, { useRef, useEffect } from "react";
import { Player } from "./Player";
import { Goalkeeper } from "./Goalkeeper";
import { Ball } from "./Ball";
import LogoBanner from "./LogoBanner";
const sketch = (s) => {
  let player;
  let goalkeeper;
  let ball;
  let score = 0;
  let shotsTaken = 0;
  const maxShots = 10;
  let gameOver = false;
  let goalMessageTimer = 0;
  let netColorChangeTimer = 0;
  let missMessageTimer = 0;
  let difficulty = "medium";
  let adImage; // Store the advertisement image

  // Scaling factor
  const pixelsPerYard = 13.33;

  // Field dimensions
  const fieldWidth = 60 * pixelsPerYard;
  const fieldHeight = 50 * pixelsPerYard;

  // Goal dimensions
  const goalWidth = 8 * pixelsPerYard * 2.6; // ~106.64 pixels
  const goalHeight = 2.67 * pixelsPerYard * 1.8; // ~35.59 pixels

  // Penalty area
  const penaltyAreaWidth = 50 * pixelsPerYard;
  const penaltyAreaHeight = 25 * pixelsPerYard;

  // Penalty mark
  const penaltyMarkY = 20 * pixelsPerYard;

  // Goal area
  const goalAreaWidth = 20 * pixelsPerYard;
  const goalAreaHeight = 6 * pixelsPerYard;

  // Center circle
  const centerCircleRadius = 5 * pixelsPerYard;

  s.preload = () => {
    // Load the advertisement image
    adImage = s.loadImage("/icon-192x192.png");
  };

  s.setup = () => {
    s.createCanvas(800, 800);
    s.noSmooth();
    s.pixelDensity(1);

    player = new Player(s, 1, 1, () => {
      shotsTaken += 1;
    });

    goalkeeper = new Goalkeeper(s, 1, 1, difficulty);
    ball = new Ball(s, 1, 1, player.x, player.y, player.aimAngle, goalkeeper);
  };

  s.draw = () => {
    if (!gameOver) {
      drawBackground(s);
      drawAds(s);
      drawField(s);
      drawPenaltyArea(s);
      drawGoal(s, netColorChangeTimer);

      if (goalkeeper) {
        goalkeeper.update(ball);
        goalkeeper.draw();
      }

      if (player) {
        player.update(ball, goalkeeper);
        player.draw();
      }

      if (ball) {
        ball.update();
        ball.draw(player.x, player.y);

        // Check for goal
        if (ball.checkGoal()) {
          score += 1;
          shotsTaken += 1;
          goalMessageTimer = 60;
          netColorChangeTimer = 60;
          console.log("Crowd cheers: 'GOOOAL!'");
        }

        // Check for miss (ball stops or goes out of bounds)
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

        // Reset ball to penalty spot after each shot
        if (!ball.isKicking && ball.wasShotByPlayer) {
          const penaltySpotX = s.width / 2;
          const penaltySpotY = penaltyMarkY;
          ball.resetToPenalty(penaltySpotX, penaltySpotY);
          player.x = penaltySpotX;
          player.y = penaltySpotY + 50;
          ball.wasShotByPlayer = false; // Reset the flag
        }
      }

      if (shotsTaken >= maxShots) {
        gameOver = true;
      }

      // Draw UI elements
      drawUI(s);

      // Draw messages on top of everything
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
      s.text("Game Over!", s.width / 2, s.height / 2 - 20);
      s.text(`Final Score: ${score}`, s.width / 2, s.height / 2 + 20);
    }
  };

  function drawBackground(s) {
    s.background(50, 50, 100); // Stadium atmosphere
    s.fill(100, 100, 100);
    s.rect(0, 0, s.width, 50); // Crowd area
    for (let x = 0; x < s.width; x += 10) {
      s.fill(s.random(100, 255), s.random(100, 255), s.random(100, 255));
      s.circle(x, s.random(10, 40), 5); // Crowd effect
    }
  }

  function drawAds(s) {
    if (adImage) {
      const adWidth = goalWidth * 1.5; // Slightly wider than goal (~160 pixels)
      const adHeight = adWidth * (192 / 192); // Maintain aspect ratio (~160 pixels)
      const adX = s.width / 2 - adWidth / 2; // Center behind goal
      const adY = 0; // At ground level, behind goal posts

      // Draw a background board for the ad
      s.fill(255, 255, 255, 200); // White board with slight transparency
      s.noStroke();
      s.rect(adX - 5, adY - 5, adWidth + 10, adHeight + 10); // Slight padding

      // Draw the ad image
      s.image(adImage, adX, adY, adWidth, adHeight);

      // Optional: Add a border to mimic a billboard
      s.noFill();
      s.stroke(0, 100);
      s.strokeWeight(2);
      s.rect(adX - 5, adY - 5, adWidth + 10, adHeight + 10);
    }
  }

  function drawField(s) {
    const stripeHeight = 20;
    for (let y = 0; y < s.height; y += stripeHeight * 2) {
      s.fill("#0aa116");
      s.noStroke();
      s.rect(0, y, s.width, stripeHeight);
      s.fill("#0ca618");
      s.rect(0, y + stripeHeight, s.width, stripeHeight);
    }

    s.fill(255);
    s.noStroke();
    s.rect(0, 0, s.width, 4);

    s.fill(255);
    s.noStroke();
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

    const netTopY = goalY + 8;
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
    s.fill(255);
    s.textSize(16);
    s.textAlign(s.LEFT, s.TOP);
    s.text(`Score: ${score}`, 10, 10);
    s.text(`Shots: ${shotsTaken}/${maxShots}`, 10, 30);
    s.text(`Aim Angle: ${Math.round(player.aimAngle)}°`, 10, 50);
    s.text(`Power: ${Math.round(player.kickPower * 100)}%`, 10, 70);

    const miniMapWidth = 100;
    const miniMapHeight = 100;
    const miniMapX = s.width - miniMapWidth - 10;
    const miniMapY = 10;
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
      s.rect(10, 90, player.kickPower * 100, 10);
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
    <div className="">
      {/* <LogoBanner /> */}
      <div ref={sketchRef} />
    </div>
  );
}
