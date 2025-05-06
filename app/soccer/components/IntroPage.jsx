import React, { useState } from "react";
import ReactFlagsSelect from "react-flags-select";

const IntroPage = ({ onStartGame }) => {
  const [playerOneCountry, setPlayerOneCountry] = useState("");
  const [playerTwoCountry, setPlayerTwoCountry] = useState("");
  const [mode, setMode] = useState("single"); // "single" or "two"

  const handleStartGame = () => {
    if (playerOneCountry && (mode === "single" || playerTwoCountry)) {
      onStartGame(
        playerOneCountry,
        mode === "single" ? null : playerTwoCountry,
        mode
      );
    }
  };

  return (
    <div className="w-[500px] p-10 bg-slate-800/90 rounded-2xl shadow-2xl backdrop-blur-sm">
      <h1 className="text-4xl font-bold text-white mb-12 text-center">
        Select Your Country and Game Mode
      </h1>

      <div className="space-y-8">
        {/* Mode Toggle */}
        <div className="bg-slate-700/50 p-4 rounded-xl backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-white mb-4">Game Mode</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setMode("single")}
              className={`flex-1 py-2 px-4 rounded-lg transition-all ${
                mode === "single"
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-600 text-slate-300 hover:bg-slate-500"
              }`}
            >
              Single Player
            </button>
            <button
              onClick={() => setMode("two")}
              className={`flex-1 py-2 px-4 rounded-lg transition-all ${
                mode === "two"
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-600 text-slate-300 hover:bg-slate-500"
              }`}
            >
              Two Players
            </button>
          </div>
        </div>

        <div className="bg-slate-700/50 p-8 rounded-xl backdrop-blur-sm relative z-20">
          <h2 className="text-2xl font-semibold text-white mb-4">Player One</h2>
          <ReactFlagsSelect
            selected={playerOneCountry}
            onSelect={setPlayerOneCountry}
            searchable
            searchPlaceholder="Search countries"
            placeholder="Select a country"
            className="menu-flags"
            selectButtonClassName="!bg-white !text-black !border-0 !rounded-lg !py-3"
            searchInputClassName="!bg-white !text-black"
          />
        </div>

        {/* Always render the Player Two box, but only show the picker if mode === 'two' */}
        <div
          className="bg-slate-700/50 p-8 rounded-xl backdrop-blur-sm relative z-10"
          style={{ minHeight: 120 }}
        >
          {mode === "two" ? (
            <>
              <h2 className="text-2xl font-semibold text-white mb-4">
                Player Two
              </h2>
              <ReactFlagsSelect
                selected={playerTwoCountry}
                onSelect={setPlayerTwoCountry}
                searchable
                searchPlaceholder="Search countries"
                placeholder="Select a country"
                className="menu-flags"
                selectButtonClassName="!bg-white !text-black !border-0 !rounded-lg !py-3"
                searchInputClassName="!bg-white !text-black"
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-4">
              <span className="text-2xl font-semibold text-white mb-2 flex items-center gap-2">
                <span role="img" aria-label="AI Bot" className="text-3xl">
                  🤖
                </span>{" "}
                AI Goalkeeper
              </span>
              <span className="text-slate-300 text-center text-base mt-2">
                You'll face off against our AI goalie!
              </span>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={handleStartGame}
        disabled={!playerOneCountry || (mode === "two" && !playerTwoCountry)}
        className={`mt-10 w-full py-4 px-6 rounded-xl text-xl font-semibold transition-all duration-200 
          ${
            playerOneCountry && (mode === "single" || playerTwoCountry)
              ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg hover:shadow-emerald-500/25"
              : "bg-slate-600/50 text-slate-400 cursor-not-allowed"
          }`}
      >
        Start Game
      </button>
    </div>
  );
};

export default IntroPage;

// Add this to your global CSS file (app/globals.css)
/*
.menu-flags button {
  @apply !text-black;
}
.menu-flags ul {
  @apply !bg-white !border-0 !shadow-lg !rounded-lg !mt-2;
}
.menu-flags li {
  @apply !text-black hover:!bg-slate-100;
}
.menu-flags input {
  @apply !border-0 !shadow-none !ring-0;
}
*/
