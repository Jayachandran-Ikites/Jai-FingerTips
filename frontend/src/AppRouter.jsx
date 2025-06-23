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
import PrivacyPolicy from "./pages/PrivacyPolicy.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import { AuthContext } from "./context/AuthContext.jsx";

const AppRouter = () => {
  const { loading, user } = useContext(AuthContext);
  console.log("API URL:", import.meta.env.VITE_API_URL);

  if (loading) {
    return <div>Loading...</div>;
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

        {/* Admin Dashboard Route */}
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <AdminDashboard />
            </PrivateRoute>
          }
        />

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

        {/* Fallback: redirect based on auth status */}
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