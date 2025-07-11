import { FiEdit, FiMenu, FiSettings, FiUser } from "react-icons/fi";
import { HiOutlineFingerPrint } from "react-icons/hi";
import axios from "axios";
import { useState, useRef, useEffect } from "react";
import NotificationBell from "../NotificationBell";
import ProfileDropdown from "../ProfileDropdown";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

const Header = ({ sidebarOpen, setSidebarOpen, auth, navigate, userRole }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const profileIconRef = useRef(null);
  const dropdownRef = useRef(null);
  const editDropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      // If click is inside ProfileDropdown or edit modal, do not close
      if (
        (dropdownRef.current && dropdownRef.current.contains(event.target)) ||
        (editDropdownRef.current &&
          editDropdownRef.current.contains(event.target)) ||
        (profileIconRef.current &&
          profileIconRef.current.contains(event.target))
      ) {
        return;
      }
      setShowDropdown(false);
    }
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  // Handlers for dropdown actions
  const handleEditProfile = () => {
    setShowDropdown(false);
    navigate("/profile");
  };
  const handleSettings = () => {
    setShowDropdown(false);
    // navigate or open settings modal
  };
  const handleHelp = () => {
    setShowDropdown(false);
    // navigate or open help modal
  };
  const handleDisplay = () => {
    setShowDropdown(false);
    // toggle theme or open display settings
  };
  const handleLogout = async () => {
    setShowDropdown(false);
    try {
      const response = await api.post(
        "/auth/logout",
        {},
        {
          headers: {
            Authorization: `Bearer ${auth.user?.token}`,
          },
        }
      );
      if (response.status === 200) {
        auth.logout?.();
        localStorage.removeItem("token");
        localStorage.removeItem("convId");
        localStorage.removeItem("chatHistory");
        navigate("/auth");
      } else {
        console.error("Logout failed with status:", response.status);
      }
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  console.log("showDropdown", showDropdown);
  return (
    <header className="py-2 px-4 md:py-4 md:px-6 bg-white/80 backdrop-blur-sm shadow-sm border-b border-blue-100 sticky top-0 z-30 flex-shrink-0">
      <div className="flex items-center justify-between">
        {/* Left: Hamburger + Branding */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${
              sidebarOpen ? "lg:hidden" : ""
            }`}
          >
            <FiMenu className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-1 md:gap-2">
            <HiOutlineFingerPrint className="w-6 h-6 md:w-7 md:h-7 text-blue-600" />
            <span class="hidden sm:block">FingerTips</span>
          </h1>
        </div>

        {/* Right: Logout Button and Profile Icon */}
        <div className="flex items-center gap-0 sm:gap-0 md:gap-2 lg:gap-3 2xl:gap-3">
          {/* <ThemeToggleButton /> */}

          {/* Prompt Editor Button - Only show for power users and admins */}
          {/* {(userRole === "power_user" || userRole === "admin") && (
            <button
              onClick={() => navigate("/prompts")}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Prompt Management"
            >
              <FiEdit className="w-5 h-5 text-gray-600" />
            </button>
          )} */}

          <NotificationBell />
          {/* Admin Panel Button - Only show for admin users */}
          {(userRole === "admin" || userRole === "reviewer") && (
            <button
              onClick={() => navigate("/admin")}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Admin Panel"
            >
              <FiSettings className="w-5 h-5 text-gray-600" />
            </button>
          )}
          {/* Pathways Button */}
          <button
            onClick={() => navigate("/pathways")}
            className="p-2 rounded-lg hover:bg-blue-100 transition-colors"
            title="Pathways"
          >
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </button>
          <button
            onClick={() => setShowDropdown((prev) => !prev)}
            ref={profileIconRef}
            className="ml-2 p-2 rounded-full bg-gray-100 hover:bg-blue-100 text-blue-600 transition flex items-center justify-center"
            title="View Profile"
          >
            <FiUser className="w-5 h-5" />
          </button>
          {showDropdown && (
            <div ref={dropdownRef} style={{ marginLeft: "-0.75rem" }}>
              <ProfileDropdown
                user={auth.user}
                onEditProfile={handleEditProfile}
                onSettings={handleSettings}
                onHelp={handleHelp}
                onDisplay={handleDisplay}
                onLogout={handleLogout}
                editDropdownRef={editDropdownRef}
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
