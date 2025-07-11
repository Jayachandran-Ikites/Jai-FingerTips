import { useState, useEffect, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import { AuthContext } from "../context/AuthContext.jsx";
import {
  FiBell,
  FiX,
  FiCheck,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiXCircle,
  FiMoreVertical,
  FiTrash2,
  FiEye,
  FiFilter,
  FiList,
} from "react-icons/fi";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

const NotificationBell = () => {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (token && auth?.userId) {
      loadNotifications();
      // Initialize WebSocket connection
      initializeSocket();
      
      return () => {
        if (socket) {
          socket.disconnect();
        }
      };
    }
  }, [token, auth.userId]);
  
  // Initialize WebSocket connection
  const initializeSocket = () => {
    const newSocket = io(import.meta.env.VITE_API_URL, {
      transports: ['websocket'],
      auth: {
        token: `Bearer ${token}`
      }
    });
    
    newSocket.on('connect', () => {
      console.log('WebSocket connected for notifications');
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });
    
    newSocket.on(`notification_update_${auth?.userId}`, (data) => {
      console.log('Received notification update:', data);
      if (data && data.unread_count !== undefined) {
        setUnreadCount(data.unread_count);
      }
      loadNotifications();
    });
    
    newSocket.on(`new_notification_${auth?.userId}`, (data) => {
      console.log('Received new notification:', data);
      if (data) {
        loadNotifications();
      }
    });
    
    setSocket(newSocket);
  };
  
  const toIST = (utc) => {
    const date = new Date(utc);
    try {
      return date.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour12: true,
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error converting to IST:", error);
      return date.toLocaleString(); // Fallback to browser's locale
    }
  }

  
  const loadNotifications = async (pageNum = 1, reset = true) => {
    try {
      setLoading(true);
      const response = await api.get("/notifications", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          limit: 10,
          page: pageNum,
          unread_only: filter === "unread",
        },
      });

      if (reset) {
        setNotifications(response.data.notifications);
      } else {
        setNotifications((prev) => [...prev, ...response.data.notifications]);
      }

      setUnreadCount(response.data.unread_count);
      setHasMore(pageNum < response.data.pages);
      setPage(pageNum);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      loadNotifications(page + 1, false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("token");
      await api.post(
        `/notifications/${notificationId}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      await api.post(
        "/notifications/read-all",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem("token");
      await api.delete(`/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update local state
      const deletedNotif = notifications.find((n) => n._id === notificationId);
      setNotifications((prev) =>
        prev.filter((notif) => notif._id !== notificationId)
      );

      if (deletedNotif && !deletedNotif.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "success":
        return FiCheckCircle;
      case "warning":
        return FiAlertCircle;
      case "error":
        return FiXCircle;
      default:
        return FiInfo;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "success":
        return "text-green-600 bg-green-100";
      case "warning":
        return "text-yellow-600 bg-yellow-100";
      case "error":
        return "text-red-600 bg-red-100";
      default:
        return "text-blue-600 bg-blue-100";
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    // Convert to IST for display
    const istDate = new Date(date.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const handleViewAllClick = () => {
    setShowDropdown(false);
    navigate("/notifications");
  };

  if (!token) return null;

  return (
    <div className="relative">
      {/* Bell Icon */}
      <motion.button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <FiBell className="w-5 h-5 text-gray-600 " />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Enhanced Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowDropdown(false)}
            />

            {/* Dropdown Content */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[32rem] overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800 ">
                    Notifications
                  </h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <Button
                        onClick={markAllAsRead}
                        disabled={loading}
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                      >
                        <FiCheck className="w-3 h-3 mr-1" />
                        Mark all read
                      </Button>
                    )}
                    <button
                      onClick={() => setShowDropdown(false)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Filter */}
                <Select
                  value={filter}
                  onValueChange={(value) => {
                    setFilter(value);
                    setPage(1);
                    loadNotifications(1, true);
                  }}
                >
                  <SelectTrigger className="w-full h-8">
                    <SelectValue
                      placeholder={
                        filter === "all" ? "All notifications" : "Unread only"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All notifications</SelectItem>
                    <SelectItem value="unread">Unread only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notifications List */}
              <div className="max-h-80 overflow-y-auto">
                {loading && notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="flex space-x-2 items-center justify-center mb-2">
                      <div className="w-2 h-2 rounded-full bg-blue-300 animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-purple-300 animate-bounce delay-100"></div>
                      <div className="w-2 h-2 rounded-full bg-cyan-300 animate-bounce delay-200"></div>
                    </div>
                    <p className="text-gray-500 text-sm">Loading...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <FiBell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  <div>
                    <AnimatePresence>
                      {notifications.map((notification, index) => {
                        const Icon = getNotificationIcon(notification.type);
                        const iconColor = getNotificationColor(
                          notification.type
                        );

                        return (
                          <motion.div
                            key={notification._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: index * 0.05 }}
                            className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors group ${
                              !notification.read ? "bg-blue-50/50" : ""
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`p-1.5 rounded-full ${iconColor}`}
                              >
                                <Icon className="w-4 h-4" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-1">
                                  <h4
                                    className={`text-sm font-medium truncate ${
                                      !notification.read
                                        ? "text-gray-900"
                                        : "text-gray-700"
                                    }`}
                                  >
                                    {notification.title}
                                  </h4>

                                  <div className="flex items-center gap-1 ml-2">
                                    {!notification.read && (
                                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                                    )}

                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                      {!notification.read && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            markAsRead(notification._id);
                                          }}
                                          className="p-1 text-blue-600 hover:text-blue-700 rounded"
                                          title="Mark as read"
                                        >
                                          <FiEye className="w-3 h-3" />
                                        </button>
                                      )}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteNotification(notification._id);
                                        }}
                                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                                        title="Delete"
                                      >
                                        <FiTrash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  {notification.message || ""}
                                </p>

                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-400">
                                    {notification.created_at ? formatTimeAgo(notification.created_at) : ""}
                                  </span>

                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                    style={{
                                      backgroundColor:
                                        notification.type === "success"
                                          ? "#dcfce7"
                                          : notification.type === "warning"
                                          ? "#fef3c7"
                                          : notification.type === "error"
                                          ? "#fee2e2"
                                          : "#dbeafe",
                                      color:
                                        notification.type === "success"
                                          ? "#166534"
                                          : notification.type === "warning"
                                          ? "#92400e"
                                          : notification.type === "error"
                                          ? "#991b1b"
                                          : "#1e40af",
                                    }}
                                  >
                                    {notification.type}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>

                    {/* Load More */}
                    {hasMore && (
                      <div className="p-4 text-center border-t border-gray-200">
                        <Button
                          onClick={loadMore}
                          disabled={loading}
                          variant="ghost"
                          size="sm"
                          className="w-full"
                        >
                          {loading ? "Loading..." : "Load more"}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-3 border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={handleViewAllClick}
                    className="w-full flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-700 py-1"
                  >
                    <FiList className="w-4 h-4" />
                    View all notifications
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
