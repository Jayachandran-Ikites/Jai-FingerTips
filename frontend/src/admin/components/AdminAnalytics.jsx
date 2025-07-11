import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FiTrendingUp,
  FiClock,
  FiDollarSign,
  FiStar,
  FiDownload,
  FiCalendar,
  FiActivity,
  FiUsers,
  FiMessageSquare,
} from "react-icons/fi";
import { Card, CardHeader, CardTitle, CardContent } from "../../user/components/ui/card";
import { Button } from "../../user/components/ui/button";
import { Badge } from "../../user/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../user/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import axios from "axios";
import AdminLoader from "./AdminLoader";


const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");
  const [activeMetric, setActiveMetric] = useState("latency");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadAnalytics = useCallback(async () => {
    console.log("Loading analytics for time range:", timeRange);
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await api.get("/analytics/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
        params: { days: timeRange },
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [timeRange, debouncedSearchTerm]);

  const exportData = async (type) => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get("/analytics/export", {
        headers: { Authorization: `Bearer ${token}` },
        params: { type },
      });
      
      const blob = new Blob([response.data.csv_data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.data.filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting data:", error);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
    }).format(value);
  };

  const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

  if (loading) {
    return (
      // <div className="space-y-6">
      //   {[...Array(4)].map((_, i) => (
      //     <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
      //   ))}
      // </div>
      <div className="flex items-center justify-center h-screen w-full">
        <div className="flex space-x-2 items-center">
          <div className="w-3 h-3 rounded-full bg-blue-300 animate-bounce"></div>
          <div className="w-3 h-3 rounded-full bg-purple-300 animate-bounce delay-100"></div>
          <div className="w-3 h-3 rounded-full bg-cyan-300 animate-bounce delay-200"></div>
        </div>
      </div>

      // <AdminLoader />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Analytics Dashboard
          </h2>
          <p className="text-gray-600">Performance metrics and insights</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32 bg-[#fefeff] text-gray-800 border border-gray-300 hover:border-gray-400 transition-colors">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* <Button
            onClick={() => exportData(activeMetric)}
            variant="outline"
            className="flex items-center gap-2 bg-[#fefeff] text-gray-800 hover:bg-gray-100 transition-colors"
          >
            <FiDownload className="w-4 h-4" />
            Export
          </Button> */}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {analytics?.latency_stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow bg-[#fefeff] rounded-lg shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      Avg Response Time
                    </p>
                    <p className="text-2xl font-bold text-gray-800">
                      {analytics.latency_stats.avg_latency?.toFixed(0)}ms
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {/* <Badge variant="secondary" className="text-xs">
                        Min: {analytics.latency_stats.min_latency?.toFixed(0)}ms
                      </Badge> */}
                      <Badge variant="secondary" className="text-xs">
                        Max: {analytics.latency_stats.max_latency?.toFixed(0)}ms
                      </Badge>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-100">
                    <FiClock className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {analytics?.cost_stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="hover:shadow-lg transition-shadow bg-[#fefeff] rounded-lg shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Cost</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {formatCurrency(analytics.cost_stats.total_cost)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Avg per query:{" "}
                      {formatCurrency(analytics.cost_stats.avg_cost_per_query)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-100">
                    <FiDollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {analytics?.feedback_stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="hover:shadow-lg transition-shadow bg-[#fefeff] rounded-lg shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      User Satisfaction
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold text-gray-800">
                        {analytics.feedback_stats.avg_rating?.toFixed(1)}
                      </p>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <FiStar
                            key={i}
                            className={`w-4 h-4 ${
                              i <
                              Math.round(analytics.feedback_stats.avg_rating)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {analytics.feedback_stats.total_feedback} total reviews
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-yellow-100">
                    <FiStar className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="hover:shadow-lg transition-shadow bg-[#fefeff] rounded-lg shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Queries</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {analytics?.latency_stats?.total_requests?.toLocaleString() ||
                      0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Avg tokens:{" "}
                    {analytics?.latency_stats?.avg_tokens?.toFixed(0) || 0}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-purple-100">
                  <FiActivity className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response Time Trends */}
        <Card className="hover:shadow-lg transition-shadow bg-[#fefeff] rounded-lg shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FiTrendingUp className="w-5 h-5" />
              Response Time Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics?.trends || []}>
                <defs>
                  <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="_id"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    try {
                      return new Date(value).toLocaleDateString();
                    } catch (e) {
                      return value;
                    }
                  }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  labelFormatter={(value) => {
                    try {
                      return new Date(value).toLocaleDateString();
                    } catch (e) {
                      return value;
                    }
                  }}
                  formatter={(value) => [
                    `${value?.toFixed(2)}ms`,
                    "Avg Latency",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="avg_latency"
                  stroke="#3B82F6"
                  fillOpacity={1}
                  fill="url(#colorLatency)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Daily Query Volume */}
        <Card className="hover:shadow-lg transition-shadow bg-[#fefeff] rounded-lg shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FiMessageSquare className="w-5 h-5" />
              Daily Query Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.trends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="_id"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    try {
                      return new Date(value).toLocaleDateString();
                    } catch (e) {
                      return value;
                    }
                  }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  labelFormatter={(value) => {
                    try {
                      return new Date(value).toLocaleDateString();
                    } catch (e) {
                      return value;
                    }
                  }}
                  formatter={(value) => [value, "Queries"]}
                />
                <Bar
                  dataKey="request_count"
                  fill="#8B5CF6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      {/* Feedback Distribution */}
      {analytics?.feedback_stats?.rating_distribution && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow bg-[#fefeff] rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle>Rating Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={Object.entries(
                      analytics.feedback_stats.rating_distribution
                    ).map(([rating, count]) => ({
                      name: `${rating} Stars`,
                      value: count,
                      rating: parseInt(rating),
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {Object.entries(
                      analytics.feedback_stats.rating_distribution
                    ).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow bg-[#fefeff] rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FiClock className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">Response Time</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">
                      {analytics?.latency_stats?.avg_latency?.toFixed(0)}ms
                    </p>
                    <p className="text-xs text-gray-500">Average</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FiDollarSign className="w-5 h-5 text-green-600" />
                    <span className="font-medium">Cost Efficiency</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      {formatCurrency(
                        analytics?.cost_stats?.avg_cost_per_query || 0
                      )}
                    </p>
                    <p className="text-xs text-gray-500">Per Query</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FiStar className="w-5 h-5 text-yellow-600" />
                    <span className="font-medium">User Satisfaction</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-yellow-600">
                      {analytics?.feedback_stats?.avg_rating?.toFixed(1) || 0}/5
                    </p>
                    <p className="text-xs text-gray-500">Average Rating</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FiUsers className="w-5 h-5 text-purple-600" />
                    <span className="font-medium">Total Queries</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-purple-600">
                      {analytics?.latency_stats?.total_requests?.toLocaleString() ||
                        0}
                    </p>
                    <p className="text-xs text-gray-500">
                      Last {timeRange} days
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Export Section */}
      <Card className="hover:shadow-lg transition-shadow bg-[#fefeff] rounded-lg shadow-sm">
        <CardHeader>
          <CardTitle>Data Export</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => exportData("latency")}
              variant="outline"
              className="flex items-center gap-2 h-12"
            >
              <FiDownload className="w-4 h-4" />
              <div className="text-left">
                <p className="font-medium">Latency Data</p>
                <p className="text-xs text-gray-500">
                  Response times & performance
                </p>
              </div>
            </Button>

            <Button
              onClick={() => exportData("costs")}
              variant="outline"
              className="flex items-center gap-2 h-12"
            >
              <FiDownload className="w-4 h-4" />
              <div className="text-left">
                <p className="font-medium">Cost Data</p>
                <p className="text-xs text-gray-500">Usage costs & billing</p>
              </div>
            </Button>

            <Button
              onClick={() => exportData("feedback")}
              variant="outline"
              className="flex items-center gap-2 h-12"
            >
              <FiDownload className="w-4 h-4" />
              <div className="text-left">
                <p className="font-medium">Feedback Data</p>
                <p className="text-xs text-gray-500">User ratings & comments</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalytics;