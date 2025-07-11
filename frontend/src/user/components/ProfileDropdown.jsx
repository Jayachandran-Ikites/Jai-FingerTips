import React, { useState, useEffect, useContext, useRef } from "react";
import {
  FiUser,
  FiLock,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiAlertCircle,
  FiChevronDown,
  FiLogOut,
  FiChevronUp,
  FiEdit,
} from "react-icons/fi";
import { GrEdit } from "react-icons/gr";
import { CiEdit } from "react-icons/ci";
import axios from "axios";
import { AuthContext } from "../context/AuthContext.jsx";
import { useToast } from "./ui/toast";
import ReactDOM from "react-dom";
import SpinnerLoader from "./loaders/spinner-loader";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

export default function ProfileDropdown({ editDropdownRef, onLogout }) {
  const { userId, token, user } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(true);
  const [emailError, setEmailError] = useState("");

  const [oldPassword, setOldPassword] = useState("");
  const [oldPasswordStatus, setOldPasswordStatus] = useState("idle"); // idle | checking | valid | invalid | error
  const [oldPasswordMsg, setOldPasswordMsg] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameLoading, setNameLoading] = useState(false);

  const { toast } = useToast();

  const editBtnRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [authType, setAuthType] = useState("");

  // When opening the edit dropdown, calculate its position
  useEffect(() => {
    if (editingName && editBtnRef.current) {
      const rect = editBtnRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY + 6, // 6px gap
        left: rect.left + window.scrollX,
      });
    }
  }, [editingName]);

  // Close the edit dropdown on outside click
  useEffect(() => {
    if (!editingName) return;
    function handleClickOutside(event) {
      if (
        editDropdownRef.current &&
        !editDropdownRef.current.contains(event.target) &&
        editBtnRef.current &&
        !editBtnRef.current.contains(event.target)
      ) {
        setEditingName(false);
      }
    }
    // Use capture phase to ensure only the edit modal closes, not the parent dropdown
    window.addEventListener("mousedown", handleClickOutside, true);
    return () =>
      window.removeEventListener("mousedown", handleClickOutside, true);
  }, [editingName]);

  // Fetch user email and name on component mount or userId/token change
  useEffect(() => {
    async function fetchEmailAndName() {
      setLoadingEmail(true);
      setEmailError("");
      try {
        if (!userId || !token) {
          setEmailError("User not authenticated.");
          setLoadingEmail(false);
          return;
        }
        const res = await api.get(`/auth/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Data : ",res.data)
        setEmail(res?.data?.email || "-");
        setName(res?.data?.name || "");
        setAuthType(res?.data?.auth_type || "");
      } catch (err) {
        console.error("Failed to fetch email/name:", err);
        setEmailError("Failed to fetch email.");
      } finally {
        setLoadingEmail(false);
      }
    }
    fetchEmailAndName();
  }, [userId, token]);

  // Avatar and display name fallbacks
  const avatarUrl =
    user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user?.name || email || "User"
    )}&background=E0E7FF&color=4338CA`;
  const displayName = user?.name || email || "User";

  // Debounced check for old password validity
  useEffect(() => {
    if (!oldPassword) {
      setOldPasswordStatus("idle");
      setOldPasswordMsg("");
      return;
    }
    setOldPasswordStatus("checking");
    setOldPasswordMsg("");
    const handler = setTimeout(async () => {
      try {
        const res = await api.post(
          "/auth/verify-password",
          { user_id: userId, password: oldPassword },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.valid) {
          setOldPasswordStatus("valid");
          setOldPasswordMsg("");
        } else {
          setOldPasswordStatus("invalid");
          setOldPasswordMsg("Incorrect password");
        }
      } catch (err) {
        setOldPasswordStatus("error");
        setOldPasswordMsg("Error verifying password");
      }
    }, 600); // 600ms debounce
    return () => clearTimeout(handler);
  }, [oldPassword, userId, token]);

  // Handle password change submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("All password fields are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      // Example: enforce minimum password length
      setError("New password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(
        "/auth/reset-password",
        { old_password: oldPassword, new_password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success("Password changed successfully!");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setError(
          res.data.error || "Failed to change password. Please try again."
        );
      }
    } catch (err) {
      console.error("Password change error:", err);
      setError(
        err.response?.data?.error ||
          "Failed to change password. Please check your old password and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="absolute right-0 mt-5 w-full max-w-xs bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden animate-fadeIn"
      style={{ minWidth: 280 }}
    >
      {/* Top Section: Avatar and User Info */}
      <div className="flex items-center p-4 border-b border-gray-100 bg-blue-50/50">
        <img
          src={avatarUrl}
          alt="User Avatar"
          className="w-12 h-12 rounded-full object-cover border border-blue-200 shadow-sm"
        />
        <div className="ml-3 flex-grow" style={{ position: "relative" }}>
          {/* Name Field */}
          <div className="flex items-center gap-2 mt-0.5">
            <div
              className={`text-sm font-semibold text-gray-900 truncate ${
                !name ? "italic text-gray-400" : ""
              }`}
            >
              {name || "Add user name"}
            </div>
            <button
              type="button"
              className="text-blue-500 hover:text-blue-700 text-xs px-1 py-0.5 rounded ml-1"
              onClick={() => setEditingName(true)}
              title={name ? "Edit name" : "Add name"}
              disabled={editingName}
              ref={editBtnRef}
            >
              {name ? (<CiEdit className="w-5 h-5" />) : "Add"}
            </button>
          </div>
          {editingName &&
            ReactDOM.createPortal(
              <div
                ref={editDropdownRef}
                className="z-[9999] bg-white border border-gray-200 rounded-lg shadow-2xl p-4 w-65 min-w-[12rem] max-w-xs flex flex-col gap-2 animate-fadeIn"
                style={{
                  position: "absolute",
                  top: 90,
                  right: 30,
                }}
              >
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!name.trim()) {
                      toast.error("Name cannot be empty");
                      return;
                    }
                    setNameLoading(true);
                    try {
                      await api.patch(
                        `/auth/user/${userId}`,
                        { name },
                        { headers: { Authorization: `Bearer ${token}` } }
                      );
                      toast.success("Name updated successfully!");
                      setEditingName(false);
                    } catch (err) {
                      toast.error("Failed to update name");
                    } finally {
                      setNameLoading(false);
                    }
                  }}
                  className="flex flex-col gap-2"
                >
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Add user name"
                    className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
                    disabled={nameLoading}
                    autoFocus
                  />
                  <div className="flex gap-2 mt-1">
                    <button
                      type="submit"
                      className="text-blue-600 font-semibold text-xs px-3 py-1 rounded hover:bg-blue-50 border border-blue-100 disabled:opacity-50"
                      disabled={nameLoading}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="text-gray-400 hover:text-red-500 text-xs px-3 py-1 rounded border border-gray-100"
                      onClick={() => setEditingName(false)}
                      disabled={nameLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>,
              document.body
            )}
          {/* Email */}
          <div className="text-xs text-gray-500 truncate mt-0.5">
            {loadingEmail ? (
              "Loading email..."
            ) : emailError ? (
              <span className="text-red-500">{emailError}</span>
            ) : (
              email
            )}
          </div>
        </div>
      </div>

      {/* Password Change Form */}
      <div className="p-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Current Email Display Field */}
          {/* <div>
            <label
              htmlFor="current-email"
              className="block text-xs font-medium text-gray-700 mb-1"
            >
              Current Email
            </label>
            <input
              id="current-email"
              type="text"
              value={email}
              readOnly
              className="w-full border border-gray-200 rounded-md px-3 py-2 bg-gray-50 text-gray-700 text-xs focus:outline-none cursor-not-allowed"
            />
          </div> */}
          {authType == "email"? <h2
            className="text-sm font-bold text-blue-800 flex items-center gap-2 cursor-pointer select-none"
            onClick={() => setShowPasswordSection((v) => !v)}
          >
            <FiLock className="text-blue-500" />
            Change Password
            {showPasswordSection ? (
              <FiChevronUp className="ml-1" />
            ) : (
              <FiChevronDown className="ml-1" />
            )}
          </h2> : null}
          <div
            className={`overflow-hidden transition-all duration-300 ${
              showPasswordSection
                ? "max-h-[1000px] opacity-100"
                : "max-h-0 opacity-0 pointer-events-none"
            }`}
            style={{ willChange: "max-height, opacity" }}
          >
            <div className="flex flex-col gap-[0.5rem] pt-2">
              {/* Old Password Field */}
              <div>
                <label
                  htmlFor="old-password"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  Old Password
                </label>
                <div className="relative flex items-center justify-center">
                  <input
                    id="old-password"
                    type={showOld ? "text" : "password"}
                    className={`w-[98%] border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-800 text-xs focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 pr-10 margin-auto
                      ${oldPasswordStatus === "valid" ? "focus:ring-green-500 border-green-500" : ""}
                      ${oldPasswordStatus === "invalid" ? "focus:ring-red-500 border-red-500" : ""}
                    `}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors duration-200 focus:outline-none"
                    onClick={() => setShowOld((v) => !v)}
                    tabIndex={-1}
                    aria-label={
                      showOld ? "Hide old password" : "Show old password"
                    }
                  >
                    {showOld ? (
                      <FiEyeOff className="w-4 h-4" />
                    ) : (
                      <FiEye className="w-4 h-4" />
                    )}
                  </button>
                  {/* Password check status icon */}
                  {oldPasswordStatus === "checking" && (
                    <span className="absolute right-8 top-1/2 -translate-y-1/2">
                      <SpinnerLoader size="sm" />
                    </span>
                  )}
                  {oldPasswordStatus === "valid" && (
                    <FiCheckCircle className="w-4 h-4 text-green-500 absolute right-8 top-1/2 -translate-y-1/2" />
                  )}
                  {oldPasswordStatus === "invalid" && (
                    <FiAlertCircle className="w-4 h-4 text-red-500 absolute right-8 top-1/2 -translate-y-1/2" />
                  )}
                  {oldPasswordStatus === "error" && (
                    <FiAlertCircle className="w-4 h-4 text-yellow-500 absolute right-8 top-1/2 -translate-y-1/2" />
                  )}
                </div>
                {oldPasswordMsg && (
                  <div className="text-xs text-red-500 mt-1">
                    {oldPasswordMsg}
                  </div>
                )}
              </div>

              {/* New Password Field */}
              <div>
                <label
                  htmlFor="new-password"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  New Password
                </label>
                <div className="relative px-[0.1rem]">
                  <input
                    id="new-password"
                    type={showNew ? "text" : "password"}
                    className="w-[98%] border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors duration-200 focus:outline-none"
                    onClick={() => setShowNew((v) => !v)}
                    tabIndex={-1}
                    aria-label={
                      showNew ? "Hide new password" : "Show new password"
                    }
                  >
                    {showNew ? (
                      <FiEyeOff className="w-4 h-4" />
                    ) : (
                      <FiEye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm New Password Field */}
              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  Confirm New Password
                </label>
                <div className="relative px-[0.1rem]">
                  <input
                    id="confirm-password"
                    type={showConfirm ? "text" : "password"}
                    className="w-[98%] border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors duration-200 focus:outline-none"
                    onClick={() => setShowConfirm((v) => !v)}
                    tabIndex={-1}
                    aria-label={
                      showConfirm
                        ? "Hide confirmed password"
                        : "Show confirmed password"
                    }
                  >
                    {showConfirm ? (
                      <FiEyeOff className="w-4 h-4" />
                    ) : (
                      <FiEye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error and Success Messages */}
              {error && (
                <div
                  className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-md px-3 py-2 text-xs animate-fadeIn"
                  role="alert"
                >
                  <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-md font-semibold text-sm shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Changing...
                  </>
                ) : (
                  "Change Password"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
      {/* Logout Button */}
      {typeof onLogout === "function" && (
        <div className="px-4 pb-4">
          <button
            onClick={onLogout}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2.5 rounded-md font-semibold text-sm shadow-md transition-all duration-200 flex items-center justify-center gap-2"
          >
            <FiLogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      )}
    </div>
  );
}

// Add fadeIn animation to your global CSS or tailwind.config.js:
// .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
// @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
