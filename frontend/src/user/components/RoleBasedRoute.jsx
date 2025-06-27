import { useContext, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

const RoleBasedRoute = ({ children, allowedRoles = [] }) => {
  const { token, logout } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const verifyTokenAndRole = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get("/auth/verify", {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        
        if (isMounted) {
          if (res.status === 200 && res.data.success) {
            console.log("Token verified successfully:", res.data);
            const role = res.data.user_role || "user";
            setUserRole(role);
            
            // Check if user has required role
            if (allowedRoles.length === 0 || allowedRoles.includes(role)) {
              setIsValid(true);
            } else {
              setIsValid(false);
            }
          } else {
            logout();
          }
          setLoading(false);
        }
      } catch (err) {
        console.error("Token verification error:", err);
        if (isMounted) {
          logout();
          setLoading(false);
        }
      }
    };

    verifyTokenAndRole();

    return () => {
      isMounted = false;
    };
  }, [token, logout, allowedRoles]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
        <div className="text-center">
          <div className="flex space-x-2 items-center justify-center mb-4">
            <div className="w-3 h-3 rounded-full bg-blue-300 animate-bounce"></div>
            <div className="w-3 h-3 rounded-full bg-purple-300 animate-bounce"></div>
            <div className="w-3 h-3 rounded-full bg-cyan-300 animate-bounce"></div>
          </div>
          <p className="text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!isValid) {
    // Redirect based on user role
    if (!token) {
      return <Navigate to="/auth" replace />;
    } else if (userRole === "reviewer") {
      return <Navigate to="/reviewer" replace />;
    } else {
      return <Navigate to="/chat" replace />;
    }
  }

  return children;
};

export default RoleBasedRoute;