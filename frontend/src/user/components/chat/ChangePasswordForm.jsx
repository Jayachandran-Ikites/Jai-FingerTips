import { useState } from "react";
import axios from "axios";
import { FiEye, FiEyeOff } from "react-icons/fi";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

const ChangePasswordForm = ({ onClose }) => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("All fields are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.post(
        "/auth/change-password",
        { oldPassword, newPassword, confirmPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setSuccess("Password changed successfully.");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          setSuccess("");
          onClose();
        }, 1500);
      } else {
        setError(res.data.error || "Failed to change password.");
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Failed to change password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* <h3 className="font-medium text-gray-800 mb-2">Change Password</h3> */}
      <div>
        <label className="block text-sm text-gray-700 mb-1">Old Password</label>
        <div className="relative">
          <input
            type={showOldPassword ? "text" : "password"}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 pr-10"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowOldPassword(!showOldPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-blue-500 hover:bg-gray-100 rounded-full z-10 transition-colors"
            tabIndex={-1}
            aria-label={showOldPassword ? 'Hide password' : 'Show password'}
          >
            {showOldPassword ? (
              <FiEyeOff className="w-5 h-5" />
            ) : (
              <FiEye className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-sm text-gray-700 mb-1">New Password</label>
        <div className="relative">
          <input
            type={showNewPassword ? "text" : "password"}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 pr-10"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-blue-500 hover:bg-gray-100 rounded-full z-10 transition-colors"
            tabIndex={-1}
            aria-label={showNewPassword ? 'Hide password' : 'Show password'}
          >
            {showNewPassword ? (
              <FiEyeOff className="w-5 h-5" />
            ) : (
              <FiEye className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-sm text-gray-700 mb-1">
          Confirm New Password
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 pr-10"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-blue-500 hover:bg-gray-100 rounded-full z-10 transition-colors"
            tabIndex={-1}
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
          >
            {showConfirmPassword ? (
              <FiEyeOff className="w-5 h-5" />
            ) : (
              <FiEye className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      {success && <div className="text-green-600 text-sm">{success}</div>}
      <button
        type="submit"
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg font-semibold shadow hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-60"
        disabled={loading}
      >
        {loading ? "Changing..." : "Change Password"}
      </button>
    </form>
  );
};

export default ChangePasswordForm; 