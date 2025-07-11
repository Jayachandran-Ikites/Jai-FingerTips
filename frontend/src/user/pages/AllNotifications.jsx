import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import { AuthContext } from "../context/AuthContext.jsx";
import {
  FiBell,
  FiCheck,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiXCircle,
  FiTrash2,
  FiEye,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiHome,
  FiSearch,
  FiCalendar,
} from "react-icons/fi";
import { HiOutlineFingerPrint } from "react-icons/hi";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { ToastProvider, useToast } from "../components/ui/toast";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

// Create a wrapper component that uses the toast hook
const AllNotificationsContent = () => {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate("/auth");
      return;
    }
    loadNotifications();
    initializeSocket();
    
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [token, filter, currentPage]);
  
  // Initialize WebSocket connection
  const initializeSocket = () => {
    try {
      const newSocket = io(import.meta.env.VITE_API_URL, {
        transports: ["websocket"],
        auth: {
          token: `Bearer ${token}`
        }
      });
      
      newSocket.on('connect', () => {
        console.log('WebSocket connected for notifications page');
      });
      
      newSocket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
      });
      
      // Get userId from localStorage or context
      const userId = localStorage.getItem("userId") || auth?.userId;
      
      if (userId) {
        newSocket.on(`notification_update_${userId}`, (data) => {
          console.log('Received notification update:', data);
          if (data && data.unread_count !== undefined) {
            setUnreadCount(data.unread_count);
          }
          loadNotifications();
        });
        
        newSocket.on(`new_notification_${userId}`, (data) => {
          console.log('Received new notification:', data);
          loadNotifications();
          toast.success("New notification received!");
        });
      }
      
      setSocket(newSocket);
    } catch (error) {
      console.error("Error initializing socket:", error);
    }
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await api.get("/notifications", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          limit: 20,
          page: currentPage,
          unread_only: filter === "unread",
          search: searchTerm,
        },
      });

      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unread_count);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error("Error loading notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadNotifications();
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
      toast.success("Notification marked as read");
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to mark notification as read");
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
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error("Failed to mark all notifications as read");
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

      toast.success("Notification deleted");
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
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

  const formatDate = (utc) => {
    // Convert UTC to IST
    if (!utc) return "";
    try {
      const date = new Date(utc);
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
      return new Date(utc).toLocaleString(); // Fallback
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex space-x-2 items-center justify-center mb-4">
            <div className="w-3 h-3 rounded-full bg-blue-300 animate-bounce"></div>
            <div className="w-3 h-3 rounded-full bg-purple-300 animate-bounce"></div>
            <div className="w-3 h-3 rounded-full bg-cyan-300 animate-bounce"></div>
          </div>
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
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
                  Notifications
                </h1>
                <p className="text-sm text-gray-600">
                  View and manage your notifications
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/chat")}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <FiHome className="w-4 h-4" />
                Back to Chat
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Filters and Search */}
        <Card>
          <CardContent className="p-6 bg-white rounded-lg">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex items-center gap-4">
                <Select
                  value={filter}
                  onValueChange={(value) => {
                    setFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-80 px-5 gap-3">
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

                {unreadCount > 0 && (
                  <Button
                    onClick={markAllAsRead}
                    variant="outline"
                    className="flex items-center gap-2"
                    disabled={loading}
                  >
                    <FiCheck className="w-4 h-4" />
                    Mark all as read
                  </Button>
                )}
              </div>

              {/* <form
                onSubmit={handleSearch}
                className="flex gap-2 w-full md:w-auto"
              >
                <Input
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full md:w-64"
                />
                <Button type="submit" variant="outline">
                  <FiSearch className="w-4 h-4" />
                </Button>
              </form> */}
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center bg-white rounded-lg">
                <FiBell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  No notifications found
                </h3>
                <p className="text-gray-500">
                  {filter === "unread"
                    ? "You have no unread notifications"
                    : searchTerm
                    ? "No notifications match your search"
                    : "You don't have any notifications yet"}
                </p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              const iconColor = getNotificationColor(notification.type);

              return (
                <Card
                  key={notification._id}
                  className={`hover:shadow-md transition-all ${
                    !notification.read ? "bg-blue-50/50 border-blue-200" : ""
                  }`}
                >
                  <CardContent className="p-6 bg-white rounded-lg">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${iconColor}`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {notification.title}
                          </h3>
                          <div className="flex items-center gap-3">
                            {!notification.read && (
                              <Badge
                                variant="info"
                                className="bg-blue-100 text-blue-800"
                              >
                                New
                              </Badge>
                            )}
                            <div className="flex items-center gap-2">
                              {!notification.read && (
                                <Button
                                  onClick={() => markAsRead(notification._id)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <FiEye className="w-4 h-4 mr-1" />
                                  Mark read
                                </Button>
                              )}
                              <Button
                                onClick={() =>
                                  deleteNotification(notification._id)
                                }
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <FiTrash2 className="w-4 h-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>

                        <p className="text-gray-600 mb-4">
                          {notification.message}
                        </p>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <FiCalendar className="w-4 h-4" />
                            {formatDate(notification.created_at)} (IST)
                          </div>
                          <Badge
                            variant="secondary"
                            className={iconColor.replace(
                              "bg-",
                              "bg-opacity-20 "
                            )}
                          >
                            {notification.type.charAt(0).toUpperCase() +
                              notification.type.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {loading ? <></> : (
          <>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1 || loading}
                  variant="outline"
                  size="sm"
                >
                  <FiChevronLeft className="w-4 h-4" />
                </Button>

                <span className="px-4 py-2 text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>

                <Button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages || loading}
                  variant="outline"
                  size="sm"
                >
                  <FiChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Main component that wraps the content with ToastProvider
const AllNotifications = () => {
  return (
    <ToastProvider>
      <AllNotificationsContent />
    </ToastProvider>
  );
};

export default AllNotifications;