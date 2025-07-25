import { useState, useEffect, useContext, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
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
import { DateTime } from "luxon";
import { io } from "socket.io-client";
import { useToast } from "./ui/toast.jsx";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});
const toIST = (utcDateString) => {
  return DateTime.fromISO(utcDateString, { zone: "utc" })
    .setZone("Asia/Kolkata")
    .toFormat("dd-MMM-yyyy hh:mm:ss a");
};

const NotificationBell = () => {
  const { token, userId } = useContext(AuthContext);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const socketRef = useRef(null);
 

  useEffect(() => {
    if (!token) {
      navigate("/auth");
      return;
    }
    console.log("UserId :",userId)
    loadNotifications();
    initializeSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        console.log("WebSocket disconnected");
      }
    };
  }, [token, filter]);

  const initializeSocket = () => {
    const newSocket = io(import.meta.env.VITE_WS_URL, {
      transports: ["websocket"],
      auth: {
        token: `Bearer ${token}`,
      },
    });

    newSocket.on("connect", () => {
      console.log("WebSocket connected for notifications page");
    });

    newSocket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
    });

    newSocket.on(`notification_update_${userId}`, (data) => {
      console.log("Received notification update:", data);
      if (data.unread_count !== undefined) {
        setUnreadCount(data.unread_count);
      }
      loadNotifications();
    });

    newSocket.on(`new_notification_${userId}`, (data) => {
      console.log("Received new notification:", data);
      loadNotifications();
      toast.success("New notification received!");
    });

    socketRef.current = newSocket;
  };
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
          notif._id === notificationId
            ? { ...notif, read_by: [...(notif.read_by || []), userId] }
            : notif
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

      setNotifications((prev) =>
        prev.map((notif) =>
          notif.read_by?.includes(userId)
            ? notif
            : { ...notif, read_by: [...(notif.read_by || []), userId] }
        )
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

    if (
      deletedNotif &&
      (!notification.read_by?.includes(userId) ||
        deletedNotif.read_by.length === 0)
    ) {
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
              className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 z-50 max-h-[32rem] overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
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
                        className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <FiCheck className="w-3 h-3 mr-1" />
                        Mark all read
                      </Button>
                    )}
                    <button
                      onClick={() => setShowDropdown(false)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
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
                  <SelectTrigger className="w-full h-8 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                    <SelectValue
                      placeholder={
                        filter === "all" ? (
                          <span className="text-gray-700 dark:text-gray-200">
                            All notifications
                          </span>
                        ) : (
                          <span className="text-gray-700 dark:text-gray-200">
                            Unread only
                          </span>
                        )
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:text-gray-200">
                    <SelectItem value="all" className="dark:text-gray-200">
                      All notifications
                    </SelectItem>
                    <SelectItem value="unread" className="dark:text-gray-200">
                      Unread only
                    </SelectItem>
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
                            className={`p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors group ${
                              !!notification.read_by?.includes(userId)
                                ? "bg-blue-50/50 dark:bg-slate-800"
                                : "dark:bg-gray-900"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`p-1.5 rounded-full ${iconColor} dark:bg-blue-900/60 dark:text-blue-400`}
                              >
                                <Icon className="w-4 h-4" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-1">
                                  <h4
                                    className={`text-sm font-medium truncate ${
                                      !notification.read_by?.includes(userId)
                                        ? "text-gray-900 dark:text-white"
                                        : "text-gray-700 dark:text-gray-200"
                                    }`}
                                  >
                                    {notification.title}
                                  </h4>

                                  <div className="flex items-center gap-1 ml-2">
                                    {!notification.read_by?.includes(
                                      userId
                                    ) && (
                                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                                    )}

                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                      {!notification.read_by?.includes(
                                        userId
                                      ) && (
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

                                <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                                  {notification.message}
                                </p>

                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-400 dark:text-gray-400">
                                    {formatTimeAgo(
                                      toIST(notification.created_at)
                                    )}
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
                <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
                  <button
                    onClick={handleViewAllClick}
                    className="w-full flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 py-1"
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

export { NotificationBell, toIST };
