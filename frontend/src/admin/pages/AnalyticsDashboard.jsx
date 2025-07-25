import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../../user/context/AuthContext.jsx";
import {
  FiTrendingUp,
  FiClock,
  FiDollarSign,
  FiStar,
  FiDownload,
  FiLogOut,
  FiHome,
} from "react-icons/fi";
import { HiOutlineFingerPrint } from "react-icons/hi";
import { Card, CardHeader, CardTitle, CardContent } from "../../user/components/ui/card";
import { Button } from "../../user/components/ui/button";
import { ToastProvider, useToast } from "../../user/components/ui/toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import AdminLoader from "../components/AdminLoader.jsx";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

const AnalyticsDashboardContent = () => {
  const { token, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate("/auth");
      return;
    }
    loadAnalytics();
  }, [token, navigate]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await api.get("/analytics/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error("Error loading analytics:", error);
      if (error.response?.status === 403) {
        navigate("/chat");
      }
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (type) => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get("/analytics/export", {
        headers: { Authorization: `Bearer ${token}` },
        params: { type },
      });
      
      // Create and download CSV file
      const blob = new Blob([response.data.csv_data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.data.filename;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(`${type} data exported successfully`);
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("Failed to export data");
    }
  };

  if (loading) {
    return (
   <AdminLoader />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-blue-100 sticky top-0 z-30">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HiOutlineFingerPrint className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Analytics Dashboard
                </h1>
                <p className="text-sm text-gray-600">Performance metrics and insights</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/admin")}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <FiHome className="w-4 h-4" />
                Back to Dashboard
              </button>
              <button
                onClick={() => {
                  logout();
                  navigate("/auth");
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all"
              >
                <FiLogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {analytics?.latency_stats && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Avg Latency</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {analytics.latency_stats.avg_latency}ms
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-100">
                    <FiClock className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {analytics?.cost_stats && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Cost</p>
                    <p className="text-2xl font-bold text-gray-800">
                      ${analytics.cost_stats.total_cost}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-100">
                    <FiDollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {analytics?.feedback_stats && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Avg Rating</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {analytics.feedback_stats.avg_rating}/5
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-yellow-100">
                    <FiStar className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Queries</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {analytics?.latency_stats?.total_requests || 0}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-purple-100">
                  <FiTrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Latency Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Latency Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics?.trends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="avg_latency" stroke="#3B82F6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Request Volume */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.trends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="request_count" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Export Section */}
        <Card>
          <CardHeader>
            <CardTitle>Export Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button
                onClick={() => exportData("latency")}
                variant="outline"
                className="flex items-center gap-2"
              >
                <FiDownload className="w-4 h-4" />
                Export Latency Data
              </Button>
              <Button
                onClick={() => exportData("costs")}
                variant="outline"
                className="flex items-center gap-2"
              >
                <FiDownload className="w-4 h-4" />
                Export Cost Data
              </Button>
              <Button
                onClick={() => exportData("feedback")}
                variant="outline"
                className="flex items-center gap-2"
              >
                <FiDownload className="w-4 h-4" />
                Export Feedback Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Main component that wraps the content with ToastProvider
const AnalyticsDashboard = () => {
  return (
    <ToastProvider>
      <AnalyticsDashboardContent />
    </ToastProvider>
  );
};

export default AnalyticsDashboard;