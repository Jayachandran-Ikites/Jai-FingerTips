import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FiPlus,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiXCircle,
  FiFilter,
  FiUser,
  FiCalendar,
  FiSearch,
  FiX,
} from "react-icons/fi";
import { Card, CardHeader, CardTitle, CardContent } from "../../user/components/ui/card";
import { Button } from "../../user/components/ui/button";
import { Badge } from "../../user/components/ui/badge";
import { Input } from "../../user/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../user/components/ui/select";
import { useToast } from "../../user/components/ui/toast";
import axios from "axios";
import NotificationForm from "./NotificationForm";
import { use } from "react";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

const NotificationsManagement = ({
  notifications: initialNotifications,
  onSendNotification,
  currentPage,
  totalPages,
  onPageChange,
  loading: initialLoading,
}) => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState(initialNotifications || []);
  const [loading, setLoading] = useState(initialLoading || false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationForm, setNotificationForm] = useState({
    title: "",
    message: "",
    type: "info",
    target_type: "all",
    target_users: [],
  });
  
  // Filters
  const [userFilter, setUserFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setNotifications(initialNotifications || []);
    setLoading(initialLoading || false);
  }, [initialNotifications, initialLoading]);

  useEffect(() => {
    loadUsers();
  }, []);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Apply search when debounced term changes
  // useEffect(() => {
  //   if (debouncedSearchTerm !== "") {
     
  //   }
  // }, [debouncedSearchTerm]);

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get("/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 100 },
      });
      setUsers(response.data.users || []);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await api.get("/admin/notifications", {
        headers: { Authorization: `Bearer ${token}` },
        params: { 
          page,
          limit: 20,
          user_id: userFilter || undefined,
          type: typeFilter || undefined,
          search: debouncedSearchTerm || undefined
        },
      });
      setNotifications(response.data.notifications || []);
      setLoading(false);
    } catch (error) {
      console.error("Error loading notifications:", error);
      setLoading(false);
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      await api.post("/admin/notifications", notificationForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setShowNotificationModal(false);
      setNotificationForm({
        title: "",
        message: "",
        type: "info",
        target_type: "all",
        target_users: [],
      });
      
      toast.success("Notification sent successfully!");
      loadNotifications();
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("Failed to send notification");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = useCallback(() => {
   
    loadNotifications();
  }, [userFilter, typeFilter, debouncedSearchTerm]);

  useEffect(() => {
    loadNotifications();  
    setPage(1);
  }, [userFilter, typeFilter, debouncedSearchTerm]);

  useEffect(() => {
    if (currentPage) {
      setPage(currentPage);
    }
  }, [currentPage]);


  const handleClearFilters = () => {
    setUserFilter("");
    setTypeFilter("");
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setPage(1);
    setTimeout(() => {
      loadNotifications();
    }, 0);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "success": return FiCheckCircle;
      case "warning": return FiAlertCircle;
      case "error": return FiXCircle;
      default: return FiInfo;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "success": return "text-green-600 bg-green-100";
      case "warning": return "text-yellow-600 bg-yellow-100";
      case "error": return "text-red-600 bg-red-100";
      default: return "text-blue-600 bg-blue-100";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">
          Notifications Management
        </h2>
        <Button
          onClick={() => setShowNotificationModal(true)}
          variant="gradient"
          className="flex items-center gap-2"
        >
          <FiPlus className="w-4 h-4" />
          Send Notification
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-white/80 backdrop-blur-sm relative z-50">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by User
              </label>
              <Select
                value={userFilter}
                onValueChange={(value) => {
                  setUserFilter(value);
               
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All users">
                    {userFilter
                      ? users.find((u) => u._id === userFilter)?.name ||
                        users.find((u) => u._id === userFilter)?.email ||
                        "Selected user"
                      : "All users"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All users</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user._id} value={user._id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Type
              </label>
              <Select
                value={typeFilter}
                onValueChange={(value) => {
                  setTypeFilter(value);
                  
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types">
                    {typeFilter
                      ? typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)
                      : "All types"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Button  variant="outline">
                  <FiSearch className="w-4 h-4" />
                </Button>
              </div>
            </div> */}
          </div>

          {(userFilter || typeFilter || searchTerm) && (
            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleClearFilters}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <FiX className="w-3 h-3 mr-1" />
                Clear filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="flex space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-300 animate-bounce"></div>
              <div className="w-3 h-3 rounded-full bg-purple-300 animate-bounce delay-100"></div>
              <div className="w-3 h-3 rounded-full bg-cyan-300 animate-bounce delay-200"></div>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <FiInfo className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                No notifications found
              </h3>
              <p className="text-gray-600 mb-6">
                {userFilter || typeFilter || searchTerm
                  ? "Try adjusting your filters or search terms"
                  : "Start by sending a notification to users"}
              </p>
              <Button
                onClick={() => setShowNotificationModal(true)}
                variant="gradient"
              >
                <FiPlus className="w-4 h-4 mr-2" />
                Send First Notification
              </Button>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type);
            const colorClass = getNotificationColor(notification.type);

            // Find user info
            const targetUser = users.find(
              (u) => u._id === notification.user_id
            );
            const creatorUser = users.find(
              (u) => u._id === notification.created_by
            );

            return (
              <motion.div
                key={notification._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-white/80 backdrop-blur-sm hover:shadow-md transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${colorClass}`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {notification.title}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{notification.read ? "Read" : "Unread"}</span>
                            <span>•</span>
                            <span>
                              {new Date(
                                notification.created_at
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <p className="text-gray-600 mb-3">
                          {notification.message}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <FiUser className="w-4 h-4" />
                            <span>
                              To:{" "}
                              {targetUser?.name ||
                                targetUser?.email ||
                                notification.user?.email ||
                                "Unknown"}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <FiCalendar className="w-4 h-4" />
                            <span>
                              {new Date(
                                notification.created_at
                              ).toLocaleTimeString()}
                            </span>
                          </div>

                          <Badge variant="secondary" className={colorClass}>
                            {notification.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {loading ? <>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            onClick={() => {
              const newPage = Math.max(1, page - 1);
              setPage(newPage);
              onPageChange(newPage);
            }}
            disabled={page === 1 || loading}
            variant="outline"
            size="sm"
          >
            Previous
          </Button>
          <span className="px-4 py-2 text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <Button
            onClick={() => {
              const newPage = Math.min(totalPages, page + 1);
              setPage(newPage);
              onPageChange(newPage);
            }}
            disabled={page === totalPages || loading}
            variant="outline"
            size="sm"
          >
            Next
          </Button>
        </div>
      )}
      </>:<></>}

      {/* Notification Modal */}
      {showNotificationModal && (
        <NotificationForm
        form={notificationForm}
        setForm={setNotificationForm}
          onSubmit={handleSendNotification}
          onClose={() => setShowNotificationModal(false)}
        />
      )}
    </div>
  );
};

export default NotificationsManagement;