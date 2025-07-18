import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import AppRouter from "./AppRouter.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./user/context/AuthContext.jsx";
import { ThemeProvider } from "./user/context/ThemeContext.jsx";
import { ToastProvider } from "./user/components/ui/toast.jsx"; // Import ToastProvider to use toasts globally

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  // <React.StrictMode>
  <GoogleOAuthProvider clientId={clientId}>
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <AppRouter />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  </GoogleOAuthProvider>
  // </React.StrictMode>
);
