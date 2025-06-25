import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext.jsx";
import {
  FiUsers,
  FiMessageSquare,
  FiMail,
  FiTrendingUp,
  FiEye,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiFilter,
  FiDownload,
  FiPlus,
  FiSend,
  FiX,
  FiCheck,
  FiAlertCircle,
  FiInfo,
  FiCheckCircle,
  FiXCircle,
  FiBell,
  FiSettings,
  FiLogOut,
  FiChevronLeft,
  FiChevronRight,
  FiBarChart3,
  FiPieChart,
  FiActivity,
} from "react-icons/fi";
import { HiOutlineFingerPrint } from "react-icons/hi";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import AdminAnalytics from "../components/AdminAnalytics";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

const EnhancedAdminDashboard = () => {
  const { token, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showConversationModal, setShowConversationModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Notification form state
  const [notificationForm, setNotificationForm] = useState({
    title: "",
    message: "",
    type: "info",
    target_type: "all",
    target_users: [],
  });

  useEffect(() => {
    if (!token) {
      navigate("/auth");
      return;
    }
    
    loadDashboardData();
  }, [token, navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      // Load dashboard stats
      const statsResponse = await api.get("/admin/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDashboardStats(statsResponse.data);
      
      // Load initial data based on active tab
      if (activeTab === "users") {
        await loadUsers();
      } else if (activeTab === "conversations") {
        await loadConversations();
      } else if (activeTab === "notifications") {
        await loadNotifications();
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      if (error.response?.status === 403) {
        navigate("/chat");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async (page = 1, search = "") => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get("/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit: 20, search },
      });
      setUsers(response.data.users);
      setTotalPages(response.data.pages);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const loadConversations = async (page = 1) => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get("/admin/conversations", {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit: 20 },
      });
      setConversations(response.data.conversations);
      setTotalPages(response.data.pages);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  };

  const loadNotifications = async (page = 1) => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get("/admin/notifications", {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit: 20 },
      });
      setNotifications(response.data.notifications);
      setTotalPages(response.data.pages);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearchTerm("");
    
    if (tab === "users") {
      loadUsers();
    } else if (tab === "conversations") {
      loadConversations();
    } else if (tab === "notifications") {
      loadNotifications();
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (activeTab === "users") {
      loadUsers(1, searchTerm);
    }
  };

  const handlePageChange = (page) => {
    if (activeTab === "users") {
      loadUsers(page, searchTerm);
    } else if (activeTab === "conversations") {
      loadConversations(page);
    } else if (activeTab === "notifications") {
      loadNotifications(page);
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    try {
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
      
      if (activeTab === "notifications") {
        loadNotifications();
      }
      
      alert("Notification sent successfully!");
    } catch (error) {
      console.error("Error sending notification:", error);
      alert("Failed to send notification");
    }
  };

  const handleUserRoleUpdate = async (userId, newRole) => {
    try {
      const token = localStorage.getItem("token");
      await api.patch(`/admin/users/${userId}/role`, 
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      loadUsers(currentPage, searchTerm);
      alert("User role updated successfully!");
    } catch (error) {
      console.error("Error updating user role:", error);
      alert("Failed to update user role");
    }
  };

  const handleUserStatusUpdate = async (userId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      await api.patch(`/admin/users/${userId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      loadUsers(currentPage, searchTerm);
      alert("User status updated successfully!");
    } catch (error) {
      console.error("Error updating user status:", error);
      alert("Failed to update user status");
    }
  };

  const viewUserDetails = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get(`/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedUser(response.data);
      setShowUserModal(true);
    } catch (error) {
      console.error("Error loading user details:", error);
    }
  };

  const viewConversationDetails = async (conversationId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get(`/admin/conversations/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedConversation(response.data);
      setShowConversationModal(true);
    } catch (error) {
      console.error("Error loading conversation details:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="flex space-x-2 items-center justify-center mb-4">
            <div className="w-3 h-3 rounded-full bg-blue-300 animate-bounce"></div>
            <div className="w-3 h-3 rounded-full bg-purple-300 animate-bounce"></div>
            <div className="w-3 h-3 rounded-full bg-cyan-300 animate-bounce"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-sm border-b border-blue-100 dark:border-gray-700 sticky top-0 z-30">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HiOutlineFingerPrint className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">FingerTips Management Panel</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/chat")}
                className="px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                Back to Chat
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

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <FiTrendingUp className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <FiBarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <FiUsers className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="conversations" className="flex items-center gap-2">
              <FiMessageSquare className="w-4 h-4" />
              Conversations
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <FiBell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardOverview 
              stats={dashboardStats} 
              onSendNotification={() => setShowNotificationModal(true)}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <AdminAnalytics />
          </TabsContent>
          
          <TabsContent value="users">
            <UsersManagement
              users={users}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onSearch={handleSearch}
              onViewUser={viewUserDetails}
              onUpdateRole={handleUserRoleUpdate}
              onUpdateStatus={handleUserStatusUpdate}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </TabsContent>
          
          <TabsContent value="conversations">
            <ConversationsManagement
              conversations={conversations}
              onViewConversation={viewConversationDetails}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </TabsContent>
          
          <TabsContent value="notifications">
            <NotificationsManagement
              notifications={notifications}
              onSendNotification={() => setShowNotificationModal(true)}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      {showNotificationModal && (
        <NotificationModal
          form={notificationForm}
          setForm={setNotificationForm}
          users={users}
          onSubmit={handleSendNotification}
          onClose={() => setShowNotificationModal(false)}
        />
      )}

      {showUserModal && selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => setShowUserModal(false)}
        />
      )}

      {showConversationModal && selectedConversation && (
        <ConversationDetailsModal
          conversation={selectedConversation}
          onClose={() => setShowConversationModal(false)}
        />
      )}
    </div>
  );
};

// Dashboard Overview Component (same as before but with dark mode support)
const DashboardOverview = ({ stats, onSendNotification }) => {
  if (!stats) return <div>Loading stats...</div>;

  const statCards = [
    {
      title: "Total Users",
      value: stats.users.total,
      change: `+${stats.users.today} today`,
      icon: FiUsers,
      color: "blue",
    },
    {
      title: "Conversations",
      value: stats.conversations.total,
      change: `+${stats.conversations.today} today`,
      icon: FiMessageSquare,
      color: "purple",
    },
    {
      title: "Messages",
      value: stats.messages.total,
      change: `+${stats.messages.today} today`,
      icon: FiMail,
      color: "cyan",
    },
    {
      title: "Notifications",
      value: stats.notifications.total,
      change: `${stats.notifications.unread} unread`,
      icon: FiBell,
      color: "green",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Dashboard Overview</h2>
        <Button
          onClick={onSendNotification}
          className="flex items-center gap-2"
          variant="gradient"
        >
          <FiSend className="w-4 h-4" />
          Send Notification
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card
            key={index}
            className="hover:shadow-lg transition-all duration-200 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{stat.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{stat.change}</p>
                </div>
                <div className={`p-3 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/20`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* User Growth Chart */}
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-gray-800 dark:text-gray-200">User Growth (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between space-x-1">
            {stats.users.growth.map((day, index) => (
              <div
                key={index}
                className="bg-gradient-to-t from-blue-500 to-purple-500 rounded-t flex-1 min-h-[4px]"
                style={{ height: `${Math.max(4, (day.count / Math.max(...stats.users.growth.map(d => d.count))) * 100)}%` }}
                title={`${day.date}: ${day.count} users`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Keep the other components (UsersManagement, ConversationsManagement, etc.) the same
// but add dark mode classes where needed

// Users Management Component
const UsersManagement = ({
  users,
  searchTerm,
  setSearchTerm,
  onSearch,
  onViewUser,
  onUpdateRole,
  onUpdateStatus,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Users Management</h2>
        
        <form onSubmit={onSearch} className="flex gap-2">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>
      </div>

      {/* Users Table */}
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Auth Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                          {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {user.name || "No name"}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={user.auth_type === "google" ? "info" : "secondary"}>
                        {user.auth_type}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.role || "user"}
                        onChange={(e) => onUpdateRole(user._id, e.target.value)}
                        className="text-sm border border-gray-200 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="user">User</option>
                        <option value="power_user">Power User</option>
                        <option value="reviewer">Reviewer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.status || "active"}
                        onChange={(e) => onUpdateStatus(user._id, e.target.value)}
                        className="text-sm border border-gray-200 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button
                        onClick={() => onViewUser(user._id)}
                        variant="ghost"
                        size="sm"
                      >
                        <FiEye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
};

// Conversations Management Component (similar updates for dark mode)
const ConversationsManagement = ({
  conversations,
  onViewConversation,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Conversations Management</h2>

      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Messages
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {conversations.map((conv) => (
                  <tr key={conv._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {conv.title || "Untitled Chat"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">{conv.user.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {conv.message_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(conv.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(conv.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button
                        onClick={() => onViewConversation(conv._id)}
                        variant="ghost"
                        size="sm"
                      >
                        <FiEye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
};

// Notifications Management Component (similar updates)
const NotificationsManagement = ({
  notifications,
  onSendNotification,
  currentPage,
  totalPages,
  onPageChange,
}) => {
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
      case "success": return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20";
      case "warning": return "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20";
      case "error": return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20";
      default: return "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Notifications Management</h2>
        <Button
          onClick={onSendNotification}
          variant="gradient"
          className="flex items-center gap-2"
        >
          <FiPlus className="w-4 h-4" />
          Send Notification
        </Button>
      </div>

      <div className="space-y-4">
        {notifications.map((notification) => {
          const Icon = getNotificationIcon(notification.type);
          const colorClass = getNotificationColor(notification.type);
          
          return (
            <Card
              key={notification._id}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-md transition-all"
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        {notification.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>{notification.read ? "Read" : "Unread"}</span>
                        <span>•</span>
                        <span>{new Date(notification.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-300 mb-3">{notification.message}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>To: {notification.user.email}</span>
                      <span>•</span>
                      <span>From: {notification.creator.email}</span>
                      <span>•</span>
                      <Badge variant="secondary" className={colorClass}>
                        {notification.type}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
};

// Pagination Component
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        variant="outline"
        size="sm"
      >
        <FiChevronLeft className="w-4 h-4" />
      </Button>
      
      <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
        Page {currentPage} of {totalPages}
      </span>
      
      <Button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        variant="outline"
        size="sm"
      >
        <FiChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
};

// Keep the modal components the same but add dark mode support
const NotificationModal = ({ form, setForm, users, onSubmit, onClose }) => {
  const [selectedUsers, setSelectedUsers] = useState([]);

  const handleUserSelection = (userId) => {
    const newSelection = selectedUsers.includes(userId)
      ? selectedUsers.filter(id => id !== userId)
      : [...selectedUsers, userId];
    
    setSelectedUsers(newSelection);
    setForm({ ...form, target_users: newSelection });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Send Notification</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Message
            </label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target
            </label>
            <select
              value={form.target_type}
              onChange={(e) => setForm({ ...form, target_type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Users</option>
              <option value="single">Single User</option>
              <option value="multiple">Multiple Users</option>
            </select>
          </div>

          {(form.target_type === "single" || form.target_type === "multiple") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Users
              </label>
              <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700">
                {users.map((user) => (
                  <label
                    key={user._id}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-600 rounded cursor-pointer"
                  >
                    <input
                      type={form.target_type === "single" ? "radio" : "checkbox"}
                      name="selectedUser"
                      checked={selectedUsers.includes(user._id)}
                      onChange={() => handleUserSelection(user._id)}
                    />
                    <span className="text-sm text-gray-900 dark:text-gray-100">{user.email}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gradient"
              className="flex-1"
            >
              Send Notification
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// User Details Modal Component (add dark mode support)
const UserDetailsModal = ({ user, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">User Details</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* User Info */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                {user.user.name ? user.user.name[0].toUpperCase() : user.user.email[0].toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  {user.user.name || "No name"}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{user.user.email}</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Joined {new Date(user.user.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{user.total_conversations}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Conversations</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{user.total_messages}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Messages</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{user.user.auth_type}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Auth Type</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{user.user.role || "user"}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Role</p>
              </div>
            </div>
          </div>

          {/* Recent Conversations */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Recent Conversations</h4>
            <div className="space-y-3">
              {user.conversations.slice(0, 5).map((conv) => (
                <div
                  key={conv._id}
                  className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-gray-800 dark:text-gray-200">
                      {conv.title || "Untitled Chat"}
                    </h5>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(conv.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Created {new Date(conv.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Conversation Details Modal Component (add dark mode support)
const ConversationDetailsModal = ({ conversation, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Conversation Details</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Conversation Info */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
              {conversation.title || "Untitled Chat"}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">User</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{conversation.user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Messages</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{conversation.messages?.length || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Created</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{new Date(conversation.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Updated</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{new Date(conversation.updated_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Messages</h4>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {conversation.messages?.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] p-4 rounded-lg ${
                      message.sender === "user"
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p className={`text-xs mt-2 ${
                      message.sender === "user" ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
                    }`}>
                      {new Date(message.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAdminDashboard;