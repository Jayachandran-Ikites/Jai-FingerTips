import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FiUser, FiMail, FiLock } from "react-icons/fi";
import ChangePasswordForm from "../components/chat/ChangePasswordForm.jsx";


const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default function Profile() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchUserDetails() {
      setLoading(true);
      setError("");
      try {
        // Try to get user_id from auth context
        const userId = auth.userId 
        if (!userId) {
          setError("User ID not found");
          setLoading(false);
          return;
        }
        const token = localStorage.getItem("token");
        const res = await api.get(`/auth/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("res.data", res.data);
        setUserEmail(res.data.email || "");
      } catch (err) {
        setError("Failed to fetch user details");
      } finally {
        setLoading(false);
      }
    }
    fetchUserDetails();
  }, [auth.userId]);

  console.log("auth.userId", auth);

  return (
    <div
      className={`min-h-screen pt-0 pb-6 sm:px-2 sm:pt-10 sm:pb-10 ${
        window.innerWidth >= 640
          ? "flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-cyan-50"
          : ""
      }`}
    >
      <div
        className="w-full p-0
         sm:mx-auto
         sm:max-w-md sm:bg-white/90 sm:rounded-2xl sm:shadow-2xl sm:border sm:border-blue-100 sm:overflow-hidden
         md:max-w-lg md:rounded-3xl md:max-w-xl"
      >
        {/* Gradient header with avatar */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 sm:p-8 flex flex-col items-center justify-center">
          <div className="bg-white rounded-full p-1.5 sm:p-2 shadow-lg mb-2 sm:mb-3">
            <FiUser className="w-12 h-12 sm:w-16 sm:h-16 text-blue-600" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide mb-1">
            My Profile
          </h1>
          <p className="text-blue-100 text-xs sm:text-sm text-center">
            Manage your account information
          </p>
        </div>
        {/* Info section */}
        <div
          className={`px-5 py-6 sm:px-8 sm:py-8 md:py-10 ${
            window.innerWidth < 640 ? "bg-[white]" : ""
          }`}
        >
          <div className="mb-6 sm:mb-8">
            <h2 className="text-base sm:text-lg font-semibold text-blue-700 mb-3 sm:mb-4 flex items-center gap-2">
              <FiMail className="inline-block text-blue-400" /> Email
            </h2>
            <div className="bg-gray-50 rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-gray-800 font-medium border border-gray-100 flex items-center gap-2 text-sm sm:text-base break-all">
              {loading ? "Loading..." : error ? error : userEmail || "-"}
            </div>
            {auth.user?.registrationType && (
              <div className="mt-3 sm:mt-4">
                <h3 className="text-xs sm:text-sm font-semibold text-blue-700 mb-1">
                  Registration Type
                </h3>
                <div className="bg-gray-50 rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 text-gray-700 border border-gray-100 inline-block text-xs sm:text-base">
                  {auth.user.registrationType}
                </div>
              </div>
            )}
          </div>
          {/* Divider */}
          <div className="border-t border-dashed border-blue-100 my-6 sm:my-8"></div>
          {/* Change Password Section */}
          {(!auth.user?.registrationType ||
            auth.user?.registrationType === "email") && (
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-blue-700 mb-3 sm:mb-4 flex items-center gap-2">
                <FiLock className="inline-block text-blue-400" /> Change
                Password
              </h2>
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-blue-100 shadow-sm">
                <ChangePasswordForm />
              </div>
            </div>
          )}
          <button
            className="mt-8 sm:mt-10 w-full md:w-auto px-4 sm:px-6 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-lg hover:from-blue-700 hover:to-purple-700 transition text-base"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}

// function ChangePasswordForm() {
//   const [oldPassword, setOldPassword] = useState("");
//   const [newPassword, setNewPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");
//   const navigate = useNavigate();
//   const auth = useContext(AuthContext);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");
//     setSuccess("");
//     if (!oldPassword || !newPassword || !confirmPassword) {
//       setError("All fields are required.");
//       return;
//     }
//     if (newPassword !== confirmPassword) {
//       setError("New passwords do not match.");
//       return;
//     }
//     setLoading(true);
//     try {
//       const token = localStorage.getItem("token");
//       const res = await api.post(
//         "/auth/reset-password",
//         { old_password: oldPassword, new_password: newPassword },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       if (res.data.success) {
//         setSuccess("Password changed successfully. You will be logged out.");
//         setOldPassword("");
//         setNewPassword("");
//         setConfirmPassword("");
//         setTimeout(() => {
//           setSuccess("");
//           // Log out user and redirect to login
//           localStorage.removeItem("token");
//           localStorage.removeItem("convId");
//           localStorage.removeItem("chatHistory");
//           if (auth.logout) auth.logout();
//           navigate("/auth");
//         }, 2000);
//       } else {
//         setError(res.data.error || "Failed to change password.");
//       }
//     } catch (err) {
//       setError(
//         err.response?.data?.error ||
//           "Failed to change password. Please try again."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
//       <div>
//         <label className="block text-xs sm:text-sm text-blue-700 mb-1 font-medium">
//           Old Password
//         </label>
//         <input
//           type="password"
//           className="w-full border border-gray-200 rounded-lg px-3 sm:px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/80 shadow-sm text-sm sm:text-base"
//           value={oldPassword}
//           onChange={(e) => setOldPassword(e.target.value)}
//           required
//         />
//       </div>
//       <div>
//         <label className="block text-xs sm:text-sm text-blue-700 mb-1 font-medium">
//           New Password
//         </label>
//         <input
//           type="password"
//           className="w-full border border-gray-200 rounded-lg px-3 sm:px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/80 shadow-sm text-sm sm:text-base"
//           value={newPassword}
//           onChange={(e) => setNewPassword(e.target.value)}
//           required
//         />
//       </div>
//       <div>
//         <label className="block text-xs sm:text-sm text-blue-700 mb-1 font-medium">
//           Confirm New Password
//         </label>
//         <input
//           type="password"
//           className="w-full border border-gray-200 rounded-lg px-3 sm:px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/80 shadow-sm text-sm sm:text-base"
//           value={confirmPassword}
//           onChange={(e) => setConfirmPassword(e.target.value)}
//           required
//         />
//       </div>
//       {error && (
//         <div className="text-red-500 text-xs sm:text-sm font-medium">
//           {error}
//         </div>
//       )}
//       {success && (
//         <div className="text-green-600 text-xs sm:text-sm font-medium">
//           {success}
//         </div>
//       )}
//       <button
//         type="submit"
//         className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg font-semibold shadow hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-60 text-sm sm:text-base"
//         disabled={loading}
//       >
//         {loading ? "Changing..." : "Change Password"}
//       </button>
//     </form>
//   );
// }
