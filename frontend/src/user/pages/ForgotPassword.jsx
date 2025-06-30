import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { FiMail, FiArrowLeft, FiCheck } from "react-icons/fi";
import { HiOutlineFingerPrint } from "react-icons/hi";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useToast } from "../components/ui/toast";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }

    setIsLoading(true);

    try {
      await api.post("/auth/forgot-password", { email });
      setIsSubmitted(true);
      toast.success("Reset link sent to your email");
    } catch (error) {
      console.error("Forgot password error:", error);
      toast.error("Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-blue-100 p-8 w-full max-w-md text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <FiCheck className="w-8 h-8 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Check Your Email
          </h1>

          <p className="text-gray-600 mb-6">
            We've sent a password reset link to <strong>{email}</strong>
          </p>

          <div className="space-y-3">
            <Button
              onClick={() => navigate("/auth")}
              variant="gradient"
              className="w-full"
            >
              Back to Sign In
            </Button>

            <Button
              onClick={() => {
                setIsSubmitted(false);
                setEmail("");
              }}
              variant="outline"
              className="w-full"
            >
              Try Different Email
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

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
            Forgot Password
          </h1>
          <p className="text-gray-600 text-sm">
            Enter your email address and we'll send you a link to reset your
            password
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiMail className="h-5 w-5 text-gray-600 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <Input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              required
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="gradient"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>

        {/* Back to Sign In */}
        <div className="mt-6 text-center">
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 hover:underline"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
