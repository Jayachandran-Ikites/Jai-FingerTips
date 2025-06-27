import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";
import { GoogleLogin } from "@react-oauth/google";
import {
  HiOutlineFingerPrint,
  HiOutlineEye,
  HiOutlineEyeOff,
} from "react-icons/hi";
import { FiMail, FiLock, FiCheck, FiX } from "react-icons/fi";

// Create axios instance with proper configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Password validation
  const [passwordErrors, setPasswordErrors] = useState({
    minLength: false,
    hasLower: false,
    hasUpper: false,
    hasNumber: false,
    hasSpecial: false,
  });

  const isStrongPassword = (password) => {
    const minLength = password.length >= 8;
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*()\-_+=]/.test(password);

    return minLength && hasLower && hasUpper && hasNumber && hasSpecial;
  };

  const handlePasswordChange = (e) => {
    const password = e.target.value;
    setFormData((prev) => ({ ...prev, password }));

    setPasswordErrors({
      minLength: password.length >= 8,
      hasLower: /[a-z]/.test(password),
      hasUpper: /[A-Z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*()\-_+=]/.test(password),
    });
  };

  const handleInputChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Google OAuth Success Handler
  const handleGoogleSuccess = async (credentialResponse) => {
    const loadingToast = toast.loading("Signing in with Google...");

    try {
      console.log("Sending Google credential to backend...");
      const res = await api.post("/auth/google", {
        credential: credentialResponse.credential,
      });

      console.log("Google auth response:", res.data);
      login(res.data);
      toast.success("Welcome to Fingertip!");
      navigate("/chat");
    } catch (err) {
      console.error("Google auth error:", err);
      const msg = err.response?.data?.error || "Google authentication failed";
      toast.error(msg);
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  // Google OAuth Error Handler
  const handleGoogleError = () => {
    console.error("Google authentication failed");
    toast.error("Google authentication failed");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSignup && !isStrongPassword(formData.password)) {
      toast.error("Password doesn't meet all requirements");
      return;
    }

    const loadingToast = toast.loading(
      isSignup ? "Creating account..." : "Logging in..."
    );
    const endpoint = isSignup ? "/auth/signup" : "/auth/login";
    const payload = isSignup
      ? {
          registrationType: "email",
          email: formData.email,
          password: formData.password,
        }
      : {
          authType: "email",
          email: formData.email,
          password: formData.password,
        };

    try {
      const res = await api.post(endpoint, payload);
      login(res.data);
      toast.success(isSignup ? "Welcome to Fingertip!" : "Welcome back!");
      navigate("/chat");
    } catch (err) {
      console.error("Auth error:", err);
      const code = err.response?.status;
      const msg =
        code === 401
          ? "Invalid credentials"
          : code === 404
          ? "User not found"
          : code === 400
          ? "Invalid input"
          : "Something went wrong";
      toast.error(msg);
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 bg-fixed p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-br from-purple-200/30 to-blue-200/30 blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 -left-24 w-80 h-80 rounded-full bg-gradient-to-tr from-cyan-200/30 to-blue-300/30 blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-gradient-to-r from-purple-200/20 to-pink-200/20 blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Main form container */}
      <div className="relative w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-blue-100 p-8 transform transition-all duration-500 hover:shadow-3xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 mb-4 shadow-lg">
              <HiOutlineFingerPrint className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
              Welcome to Fingertips
            </h1>
            <p className="text-gray-600 text-sm">
              {isSignup
                ? "Create your account to get started"
                : "Sign in to access your medical assistant"}
            </p>
          </div>

          {/* Google Sign In Button */}
          <div className="mb-6">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="outline"
              size="large"
              width="380"
              text={isSignup ? "signup_with" : "signin_with"}
              shape="rectangular"
            />
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white/80 text-gray-500">
                Or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiMail className="h-5 w-5 text-gray-600 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="email"
                name="email"
                placeholder="Email address"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm placeholder-gray-500"
              />
            </div>

            {/* Password Input */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="h-5 w-5 font-bold text-gray-800 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handlePasswordChange}
                required
                className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm placeholder-gray-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <HiOutlineEyeOff className="h-5 w-5" />
                ) : (
                  <HiOutlineEye className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Password Requirements (Signup only) */}
            {isSignup && (
              <div className="bg-gray-50/80 backdrop-blur-sm rounded-xl p-4 animate-fadeIn">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Password Requirements:
                </h4>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  {[
                    { key: "minLength", text: "At least 8 characters" },
                    { key: "hasLower", text: "One lowercase letter" },
                    { key: "hasUpper", text: "One uppercase letter" },
                    { key: "hasNumber", text: "One number" },
                    { key: "hasSpecial", text: "One special character" },
                  ].map(({ key, text }) => (
                    <div key={key} className="flex items-center space-x-2">
                      <div
                        className={`flex items-center justify-center w-4 h-4 rounded-full transition-all duration-200 ${
                          passwordErrors[key]
                            ? "bg-green-500 text-white"
                            : "bg-gray-200 text-gray-400"
                        }`}
                      >
                        {passwordErrors[key] ? (
                          <FiCheck className="w-3 h-3" />
                        ) : (
                          <FiX className="w-3 h-3" />
                        )}
                      </div>
                      <span
                        className={
                          passwordErrors[key]
                            ? "text-green-600"
                            : "text-gray-500"
                        }
                      >
                        {text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isSignup ? "Create Account" : "Sign In"}
            </button>
          </form>

          {/* Toggle between Login/Signup */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 text-sm">
              {isSignup ? "Already have an account?" : "Don't have an account?"}
            </p>
            <button
              type="button"
              onClick={() => {
                setIsSignup(!isSignup);
                setFormData({ email: "", password: "", username: "" });
                setPasswordErrors({
                  minLength: false,
                  hasLower: false,
                  hasUpper: false,
                  hasNumber: false,
                  hasSpecial: false,
                });
              }}
              className="mt-2 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 hover:underline"
            >
              {isSignup ? "Sign in instead" : "Create an account"}
            </button>
          </div>

          {/* Footer disclaimer */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs text-center text-gray-500">
              By continuing, you agree to our terms of service
              and{" "}
              <span 
                onClick={() => navigate('/privacy-policy')}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 hover:underline cursor-pointer"
              >
                privacy policy
              </span>
            </p>
          </div>
        </div>

        {/* Floating elements for extra visual appeal */}
        <div className="absolute -top-6 -right-6 w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 opacity-20 animate-bounce delay-1000"></div>
        <div className="absolute -bottom-4 -left-4 w-8 h-8 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 opacity-30 animate-bounce delay-700"></div>
      </div>
    </div>
  );
}

export default Login;