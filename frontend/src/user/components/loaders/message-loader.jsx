"use client";
import { HiOutlineFingerPrint } from "react-icons/hi";

export default function MessagesLoader() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-3 md:p-6">
      <div className="p-6 rounded-xl bg-white/90 backdrop-blur-sm shadow-md border border-blue-100 flex flex-col items-center">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-cyan-200 flex items-center justify-center">
            <HiOutlineFingerPrint className="w-6 h-6 text-blue-700" />
          </div>
          <div className="absolute w-20 h-20 rounded-full border-4 border-transparent border-t-blue-500 border-r-purple-500 animate-spin"></div>
        </div>
        <div className="mt-6 space-y-2">
          <div className="h-2 w-32 bg-gradient-to-r from-blue-200 to-purple-200 rounded animate-pulse"></div>
          <div className="h-2 w-40 bg-gradient-to-r from-blue-200 to-purple-200 rounded animate-pulse delay-150"></div>
          <div className="h-2 w-24 bg-gradient-to-r from-blue-200 to-purple-200 rounded animate-pulse delay-300"></div>
        </div>
        <p className="mt-4 text-gray-600">Loading messages...</p>
      </div>
    </div>
  );
}
