"use client";

import React from "react";

export default function SpinnerLoader({ size = "md", text, className = "" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative">
        <div
          className={`${sizeClasses[size]} rounded-full border-2 border-t-blue-500 border-r-purple-500 border-b-cyan-500 border-l-transparent animate-spin`}
        ></div>
        <div
          className={`absolute inset-0 ${sizeClasses[size]} rounded-full border-2 border-t-transparent border-r-transparent border-b-transparent border-l-blue-300 animate-spin animate-delay-150`}
        ></div>
      </div>
      {text && <p className="mt-3 text-gray-600 text-sm">{text}</p>}
    </div>
  );
}
