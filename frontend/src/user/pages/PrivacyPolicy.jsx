import React from "react";
import Lottie from "lottie-react";
import animationData from "../components/animation.json";
import cloudsBg from "../assets/clouds.png";
import logo from "../assets/logo.png";
// import styles from '../styles/PrivacyPolicy.module.css';

function PrivacyPolicy() {
  return (
    <div
      className="min-h-screen w-full flex flex-col bg-[#f6fbff] relative"
      style={{
        backgroundImage: `url(${cloudsBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Header: Logo and App Name */}
      <header className="flex items-center gap-3 px-10 pt-8 pb-2">
        <img src={logo} alt="Logo" className="w-12 h-12" />
        <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent tracking-wide">
          FINGERTIPS
        </span>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 items-center justify-between px-10 md:px-24 py-8 md:py-0">
        {/* Left: Text */}
        <div className="max-w-xl">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
            PRIVACY POLICY
          </h1>
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-6">
            UNDER CONSTRUCTION
          </h2>
          <p className="text-lg text-gray-700 mb-2">
            We are currently updating our privacy policy and adding some new
            cool features.
          </p>
          <p className="text-lg text-gray-700">
            We will be back shortly. Thank you for your patience.
          </p>
        </div>
        {/* Right: Animation/Illustration */}
        <div className="hidden md:flex w-2/5 justify-end">
          <Lottie animationData={animationData} loop />
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
