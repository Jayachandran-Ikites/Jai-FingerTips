// src/AppRouter.jsx
import React, { useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import App from "./user/pages/App.jsx";
import Auth from "./user/pages/Auth.jsx";
import PrivacyPolicy from "./user/pages/PrivacyPolicy.jsx";
import PrivateRoute from "./user/components/PrivateRoute.jsx";
import { AuthContext } from "./user/context/AuthContext.jsx";
import Profile from "./user/pages/Profile.jsx";
import TermOfService from "./user/pages/TermsOfService.jsx";
import Pathways from "./user/pages/Pathways.jsx";
import DocumentViewer from "./user/pages/DocumentViewer.jsx";
import AdminDashboard from "./admin/pages/AdminDashboard.jsx";
import ReviewerDashboard from "./admin/pages/ReviewerDashboard.jsx";
import AnalyticsDashboard from "./admin/pages/AnalyticsDashboard.jsx";
import UserManagement from "./admin/pages/UserManagement.jsx";
import FeedbackManagement from "./admin/pages/FeedbackManagement.jsx";
import ForgotPassword from "./user/pages/ForgotPassword.jsx";
import ResetPassword from "./user/pages/ResetPassword.jsx";
import VerifyEmail from "./user/pages/VerifyEmail.jsx";
import AllNotifications from "./user/pages/AllNotifications.jsx";
import PromptManagement from "./user/pages/PromptManagement.jsx";
import RoleBasedRoute from "./user/components/RoleBasedRoute.jsx";
import { ThemeProvider } from "./user/components/ui/theme-provider.jsx";
import ConversationDetailPage from "./admin/components/ConversationDetailPage.jsx";

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
    <Router basename={import.meta.env.VITE_BASE_URL}>
      <Routes>
        {/* If logged in, go straight to chat; otherwise show Auth */}
        <Route
          path="/auth"
          element={user ? <Navigate to="/chat" replace /> : <Auth />}
        />

        {/* Privacy Policy Route */}
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermOfService />} />
        {/* Protected chat routes */}
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
        {/* Protected profile route */}
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />

        {/* Protected pathways routes */}
        <Route
          path="/pathways"
          element={
            <PrivateRoute>
              <Pathways />
            </PrivateRoute>
          }
        />
        <Route
          path="/document/:documentId"
          element={
            <PrivateRoute>
              <DocumentViewer />
            </PrivateRoute>
          }
        />

        {/* Fallback: redirect based on auth status */}
        {/* Notifications Page */}
        <Route
          path="/notifications"
          element={
            <PrivateRoute>
              <AllNotifications />
            </PrivateRoute>
          }
        />
        {/* Prompt Management Page */}
        <Route
          path="/prompts"
          element={
            <PrivateRoute>
              <PromptManagement />
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
        {/* <Route
          path="/admin/feedback"
          element={
            <RoleBasedRoute allowedRoles={["admin", "reviewer"]}>
              <FeedbackManagement />
            </RoleBasedRoute>
          }
        /> */}
        {/* Conversation Detail Page */}
        <Route
          path="/admin/conversations/:conversationId"
          element={
            <RoleBasedRoute allowedRoles={["admin", "reviewer"]}>
              <ConversationDetailPage />
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
  );
};

export default AppRouter;
