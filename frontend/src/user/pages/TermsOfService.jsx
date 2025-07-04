import React, { useEffect, useState } from "react";
import animationData from "../components/animation.json";
import cloudsBg from "../assets/clouds.png";
import { HiOutlineFingerPrint } from "react-icons/hi";
// import styles from '../styles/PrivacyPolicy.module.css';
import construction from "../assets/construction.svg"; 

function TermOfService() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      className="min-h-screen w-full flex flex-col bg-[#f6fbff] relative overflow-x-hidden"
      style={{
        backgroundImage: `url(${cloudsBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Header: Logo and App Name */}
      <header className="flex items-center gap-3 px-4 sm:px-10 pt-8 pb-2">
        <HiOutlineFingerPrint className="w-6 h-6 md:w-7 md:h-7 text-blue-600" />
        <span className="text-xl sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent tracking-wide">
          FINGERTIPS
        </span>
      </header>

      {/* Main Content */}
      <div
        style={isMobile ? { justifyContent: "flex-start", gap: "3rem" } : {}}
        className="flex flex-1 flex-col md:flex-row items-center gap-4 md:gap-8 justify-between px-4 sm:px-10 md:px-24 py-8 md:py-0"
      >
        {/* Left: Text */}
        <div className="max-w-xl text-center md:text-left">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
            TERMS OF SERVICE
          </h1>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-6">
            UNDER CONSTRUCTION
          </h2>
          <p className="text-base sm:text-lg text-gray-700 mb-2">
            We are currently drafting our terms of service to ensure the best
            user experience and protection.
          </p>
          <p className="text-base sm:text-lg text-gray-700">
            The page will be available soon. Thank you for your understanding.
          </p>
        </div>

        {/* Right: Animation/Illustration */}
        <div className="w-full sm:w-4/5 md:w-2/5 flex justify-center md:justify-end">
          {/* <Lottie animationData={animationData} loop /> */}
          <img src={construction} alt="Under Construction" />
        </div>
      </div>
    </div>
  );
}

export default TermOfService;
