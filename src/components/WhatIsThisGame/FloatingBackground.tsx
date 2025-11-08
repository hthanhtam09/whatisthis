"use client";

export const FloatingBackground = () => {
  return (
    <div className="absolute inset-0 z-0">
      {/* Top-left corner: Large circle */}
      <div
        className="absolute h-48 w-48 sm:h-56 sm:w-56 rounded-full opacity-60 -top-12 -left-12 animate-float-slow"
        style={{ backgroundColor: "#FFB5A7" }}
      ></div>
      {/* Top-right: Medium square */}
      <div
        className="absolute h-32 w-32 sm:h-40 sm:w-40 rounded-2xl opacity-55 top-8 right-8 animate-float rotate-12"
        style={{ backgroundColor: "#F4D1AE" }}
      ></div>
      {/* Left-middle: Small circle */}
      <div
        className="absolute h-24 w-24 sm:h-28 sm:w-28 rounded-full opacity-50 left-8 top-1/2 -translate-y-1/2 animate-float-fast"
        style={{ backgroundColor: "#E6D3F0" }}
      ></div>
      {/* Right-middle: Medium square */}
      <div
        className="absolute h-36 w-36 sm:h-44 sm:w-44 rounded-xl opacity-55 right-12 top-1/2 -translate-y-1/2 animate-float-slow -rotate-12"
        style={{ backgroundColor: "#B5E5CF" }}
      ></div>
      {/* Bottom-left: Medium circle */}
      <div
        className="absolute h-40 w-40 sm:h-48 sm:w-48 rounded-full opacity-60 bottom-12 left-12 animate-float"
        style={{ backgroundColor: "#FFE5B4" }}
      ></div>
      {/* Bottom-right corner: Large square */}
      <div
        className="absolute h-44 w-44 sm:h-52 sm:w-52 rounded-2xl opacity-55 -bottom-12 -right-12 animate-float-slow rotate-45"
        style={{ backgroundColor: "#FF9FCA" }}
      ></div>
      {/* Top-center: Small square */}
      <div
        className="absolute h-20 w-20 sm:h-24 sm:w-24 rounded-lg opacity-50 top-16 right-[30%] -translate-x-1/2 animate-float-fast rotate-20"
        style={{ backgroundColor: "#FFB6C1" }}
      ></div>
      {/* Center: Medium circle */}
      <div
        className="absolute h-32 w-32 sm:h-36 sm:w-36 rounded-full opacity-50 left-[30%] top-1/2 -translate-x-1/2 -translate-y-1/2 animate-float"
        style={{ backgroundColor: "#B0E0E6" }}
      ></div>
    </div>
  );
};
