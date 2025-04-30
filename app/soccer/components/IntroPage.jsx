import React, { useState } from "react";
import ReactFlagsSelect from "react-flags-select";

const IntroPage = ({ onStartGame }) => {
  const [playerOneCountry, setPlayerOneCountry] = useState("");
  const [playerTwoCountry, setPlayerTwoCountry] = useState("");

  const handleStartGame = () => {
    if (playerOneCountry && playerTwoCountry) {
      onStartGame(playerOneCountry, playerTwoCountry);
    }
  };

  return (
    <div className="w-[500px] p-10 bg-slate-800/90 rounded-2xl shadow-2xl backdrop-blur-sm">
      <h1 className="text-4xl font-bold text-white mb-12 text-center">
        Select Your Countries
      </h1>

      <div className="space-y-8">
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

        <div className="bg-slate-700/50 p-8 rounded-xl backdrop-blur-sm relative z-10">
          <h2 className="text-2xl font-semibold text-white mb-4">Player Two</h2>
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
        </div>
      </div>

      <button
        onClick={handleStartGame}
        disabled={!playerOneCountry || !playerTwoCountry}
        className={`mt-10 w-full py-4 px-6 rounded-xl text-xl font-semibold transition-all duration-200 
          ${
            playerOneCountry && playerTwoCountry
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
