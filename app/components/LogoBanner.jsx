// components/LogoBanner.jsx
"use client";

export default function LogoBanner() {
  return (
    <div
      className="absolute left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded flex space-x-4"
      style={{ top: "10px" }} // Adjust as needed to position the banner above the goal post
    >
      <img src="/icon-192x192.png" alt="Logo" className="w-10 h-10" />
      <img src="/icon-192x192.png" alt="Logo" className="w-10 h-10" />
      <img src="/icon-192x192.png" alt="Logo" className="w-10 h-10" />
      {/* Add more logos if necessary */}
    </div>
  );
}
