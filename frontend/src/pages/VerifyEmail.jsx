import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { FiCheck, FiX, FiMail } from "react-icons/fi";
import { HiOutlineFingerPrint } from "react-icons/hi";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/toast";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

const VerifyEmail = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setError("Invalid verification link");
      setIsVerifying(false);
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token) => {
    try {
      await api.post("/auth/verify-email", { token });
      setIsVerified(true);
      toast.success("Email verified successfully!");
    } catch (error) {
      console.error("Email verification error:", error);
      const message = error.response?.data?.error || "Verification failed";
      setError(message);
    } finally {
      setIsVerifying(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-blue-100 p-8 w-full max-w-md text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 mb-4">
            <HiOutlineFingerPrint className="w-8 h-8 text-white animate-pulse" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Verifying Email
          </h1>
          
          <p className="text-gray-600 mb-6">
            Please wait while we verify your email address...
          </p>
          
          <div className="flex justify-center">
            <div className="flex space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-300 animate-bounce"></div>
              <div className="w-3 h-3 rounded-full bg-purple-300 animate-bounce delay-100"></div>
              <div className="w-3 h-3 rounded-full bg-cyan-300 animate-bounce delay-200"></div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-blue-100 p-8 w-full max-w-md text-center"
      >
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
          isVerified ? "bg-green-100" : "bg-red-100"
        }`}>
          {isVerified ? (
            <FiCheck className="w-8 h-8 text-green-600" />
          ) : (
            <FiX className="w-8 h-8 text-red-600" />
          )}
        </div>
        
        <h1 className={`text-2xl font-bold mb-2 ${
          isVerified ? "text-green-800" : "text-red-800"
        }`}>
          {isVerified ? "Email Verified!" : "Verification Failed"}
        </h1>
        
        <p className="text-gray-600 mb-6">
          {isVerified 
            ? "Your email has been successfully verified. You can now sign in to your account."
            : error || "There was an error verifying your email address."
          }
        </p>
        
        <div className="space-y-3">
          <Button
            onClick={() => navigate("/auth")}
            variant="gradient"
            className="w-full"
          >
            {isVerified ? "Sign In" : "Back to Sign In"}
          </Button>
          
          {!isVerified && (
            <Button
              onClick={() => navigate("/resend-verification")}
              variant="outline"
              className="w-full"
            >
              <FiMail className="w-4 h-4 mr-2" />
              Resend Verification
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;