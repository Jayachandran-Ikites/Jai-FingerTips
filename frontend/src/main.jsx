import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import AppRouter from "./AppRouter.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./user/context/AuthContext.jsx";

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  // <React.StrictMode>
  <GoogleOAuthProvider clientId={clientId}>
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  </GoogleOAuthProvider>
  // </React.StrictMode>
);
