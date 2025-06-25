// src/AppRouter.jsx
import React, { useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import App from "./components/App.jsx";
import Auth from "./pages/Auth.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import ReviewerDashboard from "./pages/ReviewerDashboard.jsx";
import AnalyticsDashboard from "./pages/AnalyticsDashboard.jsx";
import UserManagement from "./pages/UserManagement.jsx";
import FeedbackManagement from "./pages/FeedbackManagement.jsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import RoleBasedRoute from "./components/RoleBasedRoute.jsx";
import { AuthContext } from "./context/AuthContext.jsx";
import { ThemeProvider } from "./components/ui/theme-provider.jsx";

const AppRouter = () => {
  const { loading, user } = useContext(AuthContext);
  console.log("API URL:", import.meta.env.VITE_API_URL);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex space-x-2 items-center justify-center mb-4">
            <div className="w-3 h-3 rounded-full bg-blue-300 animate-bounce"></div>
            <div className="w-3 h-3 rounded-full bg-purple-300 animate-bounce"></div>
            <div className="w-3 h-3 rounded-full bg-cyan-300 animate-bounce"></div>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider defaultTheme="system" storageKey="fingertips-ui-theme">
      <Router basename={import.meta.env.VITE_BASE_URL}>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/auth"
            element={user ? <Navigate to="/chat" replace /> : <Auth />}
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />

          {/* Protected Chat Routes */}
          <Route
            path="/chat/:id"
            element={
              <PrivateRoute>
                <App />
              </PrivateRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <PrivateRoute>
                <App />
              </PrivateRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <RoleBasedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <RoleBasedRoute allowedRoles={["admin"]}>
                <UserManagement />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <RoleBasedRoute allowedRoles={["admin", "reviewer"]}>
                <AnalyticsDashboard />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/admin/feedback"
            element={
              <RoleBasedRoute allowedRoles={["admin", "reviewer"]}>
                <FeedbackManagement />
              </RoleBasedRoute>
            }
          />

          {/* Reviewer Routes */}
          <Route
            path="/reviewer"
            element={
              <RoleBasedRoute allowedRoles={["admin", "reviewer"]}>
                <ReviewerDashboard />
              </RoleBasedRoute>
            }
          />

          {/* Fallback Routes */}
          <Route
            path="*"
            element={
              user ? (
                <Navigate to="/chat" replace />
              ) : (
                <Navigate to="/auth" replace />
              )
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default AppRouter;