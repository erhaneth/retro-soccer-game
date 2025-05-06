import React, { useState } from "react";
import ReactFlagsSelect from "react-flags-select";

const modeOptions = [
  {
    key: "single",
    label: "Single Player",
    icon: "🎮",
    description: "Play against our AI goalkeeper.",
  },
  {
    key: "two",
    label: "Two Players",
    icon: "👥",
    description: "Challenge a friend!",
  },
];

const cardBase =
  "bg-slate-700/60 rounded-2xl shadow-md p-6 flex flex-col items-center w-full";

const IntroPage = ({ onStartGame }) => {
  const [playerOneCountry, setPlayerOneCountry] = useState("");
  const [playerTwoCountry, setPlayerTwoCountry] = useState("");
  const [mode, setMode] = useState("single");

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
    <div className="max-w-md w-full mx-auto p-6 sm:p-10 bg-slate-800/90 rounded-3xl shadow-2xl backdrop-blur-md flex flex-col gap-8 mt-8 mb-8">
      {/* Header */}
      <header className="text-center mb-2">
        {/* <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-2 tracking-tight">
          Welcome to Retro Soccer!
        </h1> */}
        <p className="text-lg text-slate-300 font-medium max-w-xs mx-auto">
          Choose your game mode and countries to get started.
        </p>
      </header>

      {/* Game Mode Toggle */}
      <section className={cardBase + " py-4 gap-2"}>
        <span className="text-lg font-semibold text-white mb-2">Game Mode</span>
        <div className="flex w-full gap-4 justify-center">
          {modeOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setMode(opt.key)}
              className={`flex-1 flex flex-col items-center py-3 px-2 rounded-xl border-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-base font-semibold gap-1
                ${
                  mode === opt.key
                    ? "bg-emerald-500 border-emerald-500 text-white shadow-lg"
                    : "bg-slate-600 border-slate-500 text-slate-200 hover:bg-slate-500"
                }
              `}
              aria-pressed={mode === opt.key}
            >
              <span className="text-2xl mb-1" aria-hidden="true">
                {opt.icon}
              </span>
              {opt.label}
              <span className="text-xs text-slate-200 font-normal mt-1 opacity-80">
                {opt.description}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Player One Picker */}
      <section className={cardBase + " gap-2"}>
        <span className="text-xl font-semibold text-white mb-2 w-full text-left">
          Player One
        </span>
        <ReactFlagsSelect
          selected={playerOneCountry}
          onSelect={setPlayerOneCountry}
          searchable
          searchPlaceholder="Search countries"
          placeholder="Select a country"
          className="menu-flags w-full"
          selectButtonClassName="!bg-white !text-black !border-0 !rounded-lg !py-3 !w-full"
          searchInputClassName="!bg-white !text-black"
          aria-label="Select country for Player One"
        />
      </section>

      {/* Player Two or AI Card */}
      <section className={cardBase + " gap-2 min-h-[120px]"}>
        {mode === "two" ? (
          <>
            <span className="text-xl font-semibold text-white mb-2 w-full text-left">
              Player Two
            </span>
            <ReactFlagsSelect
              selected={playerTwoCountry}
              onSelect={setPlayerTwoCountry}
              searchable
              searchPlaceholder="Search countries"
              placeholder="Select a country"
              className="menu-flags w-full"
              selectButtonClassName="!bg-white !text-black !border-0 !rounded-lg !py-3 !w-full"
              searchInputClassName="!bg-white !text-black"
              aria-label="Select country for Player Two"
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-2 w-full">
            <span className="text-2xl font-semibold text-white mb-1 flex items-center gap-2">
              <span role="img" aria-label="AI Bot" className="text-3xl">
                🤖
              </span>{" "}
              AI Goalkeeper
            </span>
            <span className="text-slate-300 text-center text-base mt-1 max-w-xs">
              You'll face off against our smart AI goalie. Good luck!
            </span>
          </div>
        )}
      </section>

      {/* Start Button */}
      <button
        onClick={handleStartGame}
        disabled={!playerOneCountry || (mode === "two" && !playerTwoCountry)}
        className={`mt-2 w-full py-4 px-6 rounded-2xl text-xl font-bold transition-all duration-200 tracking-wide
          ${
            playerOneCountry && (mode === "single" || playerTwoCountry)
              ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg hover:shadow-emerald-500/25 focus:ring-2 focus:ring-emerald-400"
              : "bg-slate-600/50 text-slate-400 cursor-not-allowed"
          }`}
        aria-disabled={
          !playerOneCountry || (mode === "two" && !playerTwoCountry)
        }
      >
        {mode === "single"
          ? "Start Single Player Game"
          : "Start Two Player Game"}
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
