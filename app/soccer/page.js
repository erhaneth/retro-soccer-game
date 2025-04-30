// app/page.jsx
"use client";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import GameField from "./components/GameField";
import LoadingScreen from "./components/LoadingScreen";

export default function Game() {
  const searchParams = useSearchParams();
  const playerOneCountry = searchParams.get("p1");
  const playerTwoCountry = searchParams.get("p2");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Show loading screen for 2 seconds
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-900">
      {isLoading ? (
        <LoadingScreen />
      ) : (
        <div className="flex items-center justify-center w-full h-full">
          <GameField
            playerOneCountry={playerOneCountry}
            playerTwoCountry={playerTwoCountry}
          />
        </div>
      )}
    </div>
  );
}
