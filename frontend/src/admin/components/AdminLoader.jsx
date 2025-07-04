"use client";
import { HiOutlineFingerPrint } from "react-icons/hi";

export default function AdminLoader({text = "Loading..."}) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
      <div className="p-8 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100 flex flex-col items-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-cyan-200 flex items-center justify-center">
            <HiOutlineFingerPrint className="w-8 h-8 text-blue-700" />
          </div>
          <div className="absolute inset-0 rounded-full border-4 border-blue-500/30 animate-ping"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
        </div>
        <h2 className="mt-6 text-xl font-medium bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          FingerTips
        </h2>
        <p className="mt-3 text-gray-600">{text}</p>
      </div>
    </div>
  );
}