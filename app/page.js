// app/page.jsx
"use client";
import { useRouter } from "next/navigation";
import IntroPage from "./soccer/components/IntroPage";

export default function Home() {
  const router = useRouter();

  const handleStartGame = (playerOneCountry, playerTwoCountry, mode) => {
    // Navigate to the game page with selected countries and mode
    const params = new URLSearchParams({
      p1: playerOneCountry,
      mode: mode,
    });
    if (playerTwoCountry) {
      params.append("p2", playerTwoCountry);
    }
    router.push(`/soccer?${params.toString()}`);
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-900">
      <main className="relative flex-1 w-full flex items-center justify-center">
        <IntroPage onStartGame={handleStartGame} />
      </main>
    </div>
  );
}
