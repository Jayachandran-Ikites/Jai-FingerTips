import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext.jsx";
import EnhancedAdminDashboard from "./EnhancedAdminDashboard.jsx";

const AdminDashboard = () => {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is admin
    if (!token) {
      navigate("/auth");
      return;
    }
    
    const verifyAdmin = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/auth/verify`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        if (response.data.user_role !== "admin") {
          navigate("/chat");
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error verifying admin:", error);
        navigate("/chat");
      }
    };
    
    verifyAdmin();
  }, [token, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex space-x-2 items-center justify-center mb-4">
            <div className="w-3 h-3 rounded-full bg-blue-300 animate-bounce"></div>
            <div className="w-3 h-3 rounded-full bg-purple-300 animate-bounce"></div>
            <div className="w-3 h-3 rounded-full bg-cyan-300 animate-bounce"></div>
          </div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return <EnhancedAdminDashboard />;
};

export default AdminDashboard;