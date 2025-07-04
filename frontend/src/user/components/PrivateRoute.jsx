import { useContext, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import axios from "axios";
import AuthVerificationLoader from "./loaders/auth-verification-loader.jsx";

const PrivateRoute = ({ children }) => {
  const { token, logout, setUserId } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const verifyToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        console.log("Verifying token protected route access");
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/auth/verify`,
          {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          }
        );

        if (isMounted) {
          if (res.status === 200 && res.data.success) {
            setIsValid(true);
            setUserId(res?.data?.user_id);
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

    verifyToken();

    return () => {
      isMounted = false;
    };
  }, [token, logout]);

  if (loading) {
    return <AuthVerificationLoader />;
  }

  if (!isValid) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

export default PrivateRoute;
