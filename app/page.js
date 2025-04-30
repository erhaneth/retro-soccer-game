// app/page.jsx
"use client";
import { useRouter } from "next/navigation";
import IntroPage from "./soccer/components/IntroPage";

export default function Home() {
  const router = useRouter();

  const handleStartGame = (playerOneCountry, playerTwoCountry) => {
    // Navigate to the game page with selected countries
    router.push(`/soccer?p1=${playerOneCountry}&p2=${playerTwoCountry}`);
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-900">
      <main className="relative flex-1 w-full flex items-center justify-center">
        <IntroPage onStartGame={handleStartGame} />
      </main>
    </div>
  );
}
