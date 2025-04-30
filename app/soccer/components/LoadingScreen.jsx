import React from "react";

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-slate-900 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="inline-block mb-8">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h2 className="text-2xl text-white font-semibold animate-pulse">
          Game is starting...
        </h2>
      </div>
    </div>
  );
};

export default LoadingScreen;
