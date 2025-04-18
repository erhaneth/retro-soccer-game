// app/page.jsx
"use client";
import GameField from "@/app/components/GameField";
import LogoBanner from "./components/LogoBanner";
export default function Home() {
  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-900">
      <main className="relative flex-1 w-full flex items-center justify-center">
        {/* <LogoBanner /> */}
        <GameField />
      </main>
    </div>
  );
}
