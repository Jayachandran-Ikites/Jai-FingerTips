import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { FiLock, FiEye, FiEyeOff, FiCheck, FiX } from "react-icons/fi";
import { HiOutlineFingerPrint } from "react-icons/hi";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useToast } from "../components/ui/toast";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState("");

  // Password validation
  const [passwordErrors, setPasswordErrors] = useState({
    minLength: false,
    hasLower: false,
    hasUpper: false,
    hasNumber: false,
    hasSpecial: false,
  });

  useEffect(() => {
    const resetToken = searchParams.get("token");
    if (!resetToken) {
      toast.error("Invalid reset link");
      navigate("/auth");
      return;
    }
    setToken(resetToken);
  }, [searchParams, navigate, toast]);

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);

    setPasswordErrors({
      minLength: newPassword.length >= 8,
      hasLower: /[a-z]/.test(newPassword),
      hasUpper: /[A-Z]/.test(newPassword),
      hasNumber: /\d/.test(newPassword),
      hasSpecial: /[!@#$%^&*()\-_+=]/.test(newPassword),
    });
  };

  const isStrongPassword = (password) => {
    const minLength = password.length >= 8;
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*()\-_+=]/.test(password);

    return minLength && hasLower && hasUpper && hasNumber && hasSpecial;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isStrongPassword(password)) {
      toast.error("Password doesn't meet all requirements");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    setIsLoading(true);

    try {
      await api.post("/auth/reset-password", {
        token,
        password
      });

      toast.success("Password reset successfully!");
      navigate("/auth");
    } catch (error) {
      console.error("Reset password error:", error);
      const message = error.response?.data?.error || "Failed to reset password";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-br from-purple-200/30 to-blue-200/30 blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 -left-24 w-80 h-80 rounded-full bg-gradient-to-tr from-cyan-200/30 to-blue-300/30 blur-3xl animate-pulse delay-1000"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-blue-100 p-8 w-full max-w-md relative"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 mb-4 shadow-lg">
            <HiOutlineFingerPrint className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Reset Password
          </h1>
          <p className="text-gray-600 text-sm">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Password Input */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiLock className="h-5 w-5 text-gray-600 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="New password"
              value={password}
              onChange={handlePasswordChange}
              className="pl-10 pr-12"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? (
                <FiEyeOff className="h-5 w-5" />
              ) : (
                <FiEye className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Confirm Password Input */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiLock className="h-5 w-5 text-gray-600 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <Input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 pr-12"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showConfirmPassword ? (
                <FiEyeOff className="h-5 w-5" />
              ) : (
                <FiEye className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Password Requirements */}
          <div className="bg-gray-50/80 backdrop-blur-sm rounded-xl p-4">
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

          {/* Password Match Indicator */}
          {confirmPassword && (
            <div className="flex items-center space-x-2 text-xs">
              <div
                className={`flex items-center justify-center w-4 h-4 rounded-full transition-all duration-200 ${
                  password === confirmPassword
                    ? "bg-green-500 text-white"
                    : "bg-red-500 text-white"
                }`}
              >
                {password === confirmPassword ? (
                  <FiCheck className="w-3 h-3" />
                ) : (
                  <FiX className="w-3 h-3" />
                )}
              </div>
              <span
                className={
                  password === confirmPassword
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                Passwords {password === confirmPassword ? "match" : "don't match"}
              </span>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant="gradient"
            className="w-full"
            disabled={isLoading || !isStrongPassword(password) || password !== confirmPassword}
          >
            {isLoading ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPassword;