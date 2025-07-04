import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiBarChart2,
  FiTrendingUp,
  FiUsers,
  FiMessageSquare,
  FiMail,
  FiCalendar,
  FiRefreshCw,
} from "react-icons/fi";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "../../user/components/ui/card";
import { Button } from "../../user/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../user/components/ui/select";

const DynamicCharts = ({ data, timeRange, onTimeRangeChange }) => {
  const [chartType, setChartType] = useState("area");
  const [dataType, setDataType] = useState("users");
  const [isLoading, setIsLoading] = useState(false);

  // Format date for display in tooltip
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch (e) {
      return dateStr;
    }
  };

  // Get the appropriate data key based on selected data type
  const getDataKey = () => {
    switch (dataType) {
      case "users":
        return "count";
      case "conversations":
        return "conversations";
      case "messages":
        return "messages";
      default:
        return "count";
    }
  };

  // Get chart title based on selected data type
  const getChartTitle = () => {
    switch (dataType) {
      case "users":
        return "User Growth";
      case "conversations":
        return "Conversation Activity";
      case "messages":
        return "Message Volume";
      default:
        return "Data Trends";
    }
  };

  // Get chart color based on selected data type
  const getChartColor = () => {
    switch (dataType) {
      case "users":
        return ["#8B5CF6", "#C4B5FD"];
      case "conversations":
        return ["#3B82F6", "#93C5FD"];
      case "messages":
        return ["#10B981", "#6EE7B7"];
      default:
        return ["#8B5CF6", "#C4B5FD"];
    }
  };

  // Get the appropriate data array based on selected data type
  const getChartData = () => {
    if (!data) return [];

    switch (dataType) {
      case "users":
        return data.users?.growth || [];
      case "conversations":
        // Simulate conversation data if not available
        if (!data.conversations?.daily) {
          return data.users?.growth?.map(day => ({
            date: day.date,
            conversations: Math.floor(Math.random() * 5)
          })) || [];
        }
        return data.conversations.daily;
      case "messages":
        // Simulate message data if not available
        if (!data.messages?.daily) {
          return data.users?.growth?.map(day => ({
            date: day.date,
            messages: Math.floor(Math.random() * 15 + 5)
          })) || [];
        }
        return data.messages.daily;
      default:
        return [];
    }
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const date = formatDate(label);
      
      let title = "";
      switch (dataType) {
        case "users":
          title = "New Users";
          break;
        case "conversations":
          title = "Conversations";
          break;
        case "messages":
          title = "Messages";
          break;
        default:
          title = "Value";
      }

      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-gray-600 text-xs mb-1">{date}</p>
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: getChartColor()[0] }}
            />
            <p className="font-medium text-gray-800">
              {title}: <span className="font-bold">{value}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Render the appropriate chart based on chart type
  const renderChart = () => {
    const chartData = getChartData();
    const dataKey = getDataKey();
    const [mainColor, gradientColor] = getChartColor();

    if (chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No data available</p>
        </div>
      );
    }

    switch (chartType) {
      case "area":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`colorGradient-${dataType}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={mainColor} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={mainColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  try {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  } catch (e) {
                    return value;
                  }
                }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={mainColor}
                fillOpacity={1}
                fill={`url(#colorGradient-${dataType})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  try {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  } catch (e) {
                    return value;
                  }
                }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey={dataKey} fill={mainColor} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case "line":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  try {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  } catch (e) {
                    return value;
                  }
                }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={mainColor}
                strokeWidth={2}
                dot={{ r: 4, fill: mainColor, strokeWidth: 2, stroke: "white" }}
                activeDot={{ r: 6, fill: mainColor, stroke: "white", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  // Simulate loading when changing data type or chart type
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [dataType, chartType]);

  return (
    <Card className="bg-white shadow-lg rounded-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            {dataType === "users" && <FiUsers className="w-5 h-5" />}
            {dataType === "conversations" && <FiMessageSquare className="w-5 h-5" />}
            {dataType === "messages" && <FiMail className="w-5 h-5" />}
            {getChartTitle()} ({timeRange} Days)
          </CardTitle>
          
          <div className="flex flex-wrap gap-3">
            <Select value={dataType} onValueChange={setDataType}>
              <SelectTrigger className="w-36 h-9">
                <SelectValue placeholder="Select data type">
                  {dataType.charAt(0).toUpperCase() + dataType.slice(1)
                    .replace("s", "s")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="users">Users</SelectItem>
                <SelectItem value="conversations">Conversations</SelectItem>
                <SelectItem value="messages">Messages</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={chartType} onValueChange={setChartType}>
              <SelectTrigger className="w-36 h-9">
                <SelectValue placeholder="Chart type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="area">Area Chart</SelectItem>
                <SelectItem value="bar">Bar Chart</SelectItem>
                <SelectItem value="line">Line Chart</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={timeRange} onValueChange={onTimeRangeChange}>
              <SelectTrigger className="w-36 h-9">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex space-x-2 items-center">
              <div className="w-3 h-3 rounded-full bg-blue-300 animate-bounce"></div>
              <div className="w-3 h-3 rounded-full bg-purple-300 animate-bounce delay-100"></div>
              <div className="w-3 h-3 rounded-full bg-cyan-300 animate-bounce delay-200"></div>
            </div>
          </div>
        ) : (
          <motion.div
            key={`${dataType}-${chartType}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {renderChart()}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default DynamicCharts;