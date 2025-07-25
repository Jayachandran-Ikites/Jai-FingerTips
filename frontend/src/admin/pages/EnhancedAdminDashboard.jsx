import { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../../user/context/AuthContext.jsx";
import {
  FiUsers,
  FiMessageSquare,
  FiMail,
  FiTrendingUp,
  FiEye,
  FiEdit3,
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
  FiPieChart,
  FiActivity,
  FiHome,
  FiMenu,
  FiBarChart2,
  FiUserCheck,
  FiFileText,
  FiTag,
  FiList,
  FiExternalLink,
} from "react-icons/fi";
import { HiOutlineFingerPrint } from "react-icons/hi";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../user/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "../../user/components/ui/card";
import { Button } from "../../user/components/ui/button";
import { Badge } from "../../user/components/ui/badge";
import { ToastProvider, useToast } from "../../user/components/ui/toast";
import AdminAnalytics from "../components/AdminAnalytics";
import DynamicCharts from "../components/DynamicCharts";
import MarkdownRenderer from "../../user/components/MarkdownRenderer.jsx";
import NotificationsManagement from "../components/NotificationsManagement";
import NotificationForm from "../components/NotificationForm";
import ConversationsManagement from "../components/ConversationsManagement";
import AdminLoader from "../components/AdminLoader.jsx";
import { use } from "react";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

// Main component that wraps the dashboard content with ToastProvider
const EnhancedAdminDashboard = () => {
  return (
    <ToastProvider>
      <EnhancedAdminDashboardContent />
    </ToastProvider>
  );
};

// Dashboard content component that uses the toast hook
const EnhancedAdminDashboardContent = () => {
  const { token, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(localStorage.getItem("tab") || "dashboard");
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
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [timeRange, setTimeRange] = useState("30");

  // Notification form state
  const [notificationForm, setNotificationForm] = useState({
    title: "",
    message: "",
    type: "info",
    target_type: "all",
    target_users: [],
  });

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

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
      console.log("Active Tab:", activeTab);
      localStorage.setItem("tab", activeTab);
      if (activeTab === "users") {
        await loadUsers();
      } else if (activeTab === "conversations") {
        await loadConversations();
      } else if (activeTab === "notifications") {
        await loadNotifications();
      }else if (activeTab === "dashboard") {
      // Load dashboard stats
      if(!dashboardStats) {
      const statsResponse = await api.get("/admin/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Dashboard Stats:", statsResponse.data);
      setDashboardStats(statsResponse.data);
    }
    }
      // Load initial data based on active tab
     
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      if (error.response?.status === 403) {
        navigate("/chat");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = useCallback(async (page = 1, search = "") => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get("/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit: 15, search },
      });
      setUsers(response.data.users);
      setTotalPages(response.data.pages);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  }, []);

  const loadConversations = async (page = 1, filters = {}) => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get("/admin/conversations", {
        headers: { Authorization: `Bearer ${token}` },
        params: { 
          page, 
          limit: 15,
          ...filters
        },
      });
      setConversations(response.data.conversations);
      setTotalPages(response.data.pages);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  };

  const loadNotifications = async (page = 1, filters = {}) => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get("/admin/notifications", {
        headers: { Authorization: `Bearer ${token}` },
        params: { 
          page, 
          limit: 15,
          ...filters
        },
      });
      setNotifications(response.data.notifications);
      setTotalPages(response.data.pages);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const handleTabChange = (tab) => {
    
    localStorage.setItem("tab", tab);
    setActiveTab(tab);
    setCurrentPage(1);
    setSearchTerm("");
    setDebouncedSearchTerm("");
    
    if (tab === "users") {
      loadUsers();
    } else if (tab === "conversations") {
      loadConversations();
    } else if (tab === "notifications") {
      loadNotifications();
    }
  };

  useEffect(() => {
    if (activeTab === "dashboard") {
    loadDashboardData();
    }
  },[activeTab]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (activeTab === "users") {
      loadUsers(1, debouncedSearchTerm);
    }
  };

  const handlePageChange = (page) => {
    if (activeTab === "users") {
      loadUsers(page, debouncedSearchTerm);
    } else if (activeTab === "conversations") {
      loadConversations(page);
    } else if (activeTab === "notifications") {
      loadNotifications(page);
    }else if(activeTab == "dashboard"){
      loadDashboardData();
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
      
      toast.success("Notification sent successfully!");
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("Failed to send notification");
    }
  };

  const handleUserRoleUpdate = async (userId, newRole) => {
    try {
      const token = localStorage.getItem("token");
      await api.post(`/admin/users/${userId}/role`, 
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      loadUsers(currentPage, debouncedSearchTerm);
      toast.success("User role updated successfully!");
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("Failed to update user role");
    }
  };

  const handleUserStatusUpdate = async (userId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      await api.patch(`/admin/users/${userId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      loadUsers(currentPage, debouncedSearchTerm);
      toast.success("User status updated successfully!");
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error("Failed to update user status");
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
    navigate(`/admin/conversations/${conversationId}`);
  };

  if (loading) {
    return (
      // <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 flex items-center justify-center">
      //   <div className="text-center">
      //     <div className="flex space-x-2 items-center justify-center mb-4">
      //       <div className="w-3 h-3 rounded-full bg-blue-300 animate-bounce"></div>
      //       <div className="w-3 h-3 rounded-full bg-purple-300 animate-bounce"></div>
      //       <div className="w-3 h-3 rounded-full bg-cyan-300 animate-bounce"></div>
      //     </div>
      //     <p className="text-gray-600">Loading admin dashboard...</p>
      //   </div>
      // </div>
      <AdminLoader text="Loading admin dashboard..." />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 flex">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-white/90 backdrop-blur-sm shadow-lg border-r border-blue-100 transition-all duration-300 flex flex-col h-screen sticky top-0`}
      >
        {/* Logo */}
        <div className="p-5 border-b border-blue-100 flex items-center justify-between">
          {sidebarOpen && (
          <div className="flex items-center gap-3">
            <>
              <HiOutlineFingerPrint className="w-8 h-8 text-blue-600" />

              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Admin Panel
              </h1>
            </>
        </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            // className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
            className="`w-full flex items-center px-3 py-3 rounded-lg transition-colors"
          >
            <FiMenu className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-2 space-y-1">
            <NavItem
              icon={FiBarChart2}
              label="Dashboard"
              isActive={activeTab === "dashboard"}
              onClick={() => handleTabChange("dashboard")}
              expanded={sidebarOpen}
            />
            <NavItem
              icon={FiPieChart}
              label="Analytics"
              isActive={activeTab === "analytics"}
              onClick={() => handleTabChange("analytics")}
              expanded={sidebarOpen}
            />
            <NavItem
              icon={FiUsers}
              label="Users"
              isActive={activeTab === "users"}
              onClick={() => handleTabChange("users")}
              expanded={sidebarOpen}
            />
            <NavItem
              icon={FiMessageSquare}
              label="Conversations"
              isActive={activeTab === "conversations"}
              onClick={() => handleTabChange("conversations")}
              expanded={sidebarOpen}
            />
            <NavItem
              icon={FiBell}
              label="Notifications"
              isActive={activeTab === "notifications"}
              onClick={() => handleTabChange("notifications")}
              expanded={sidebarOpen}
            />

            <div className="pt-4 mt-4 border-t border-gray-200">
              <NavItem
                icon={FiUserCheck}
                label="Reviewer Panel"
                onClick={() => navigate("/reviewer")}
                expanded={sidebarOpen}
              />
              {/* <NavItem
                icon={FiFileText}
                label="Feedback"
                onClick={() => navigate("/admin/feedback")}
                expanded={sidebarOpen}
              /> */}
            </div>
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-blue-100">
          <div className="flex flex-col gap-2">
            <NavItem
              icon={FiHome}
              label="Back to Chat"
              onClick={() => navigate("/chat")}
              expanded={sidebarOpen}
            />
            <NavItem
              icon={FiLogOut}
              label="Logout"
              onClick={() => {
                logout();
                navigate("/auth");
              }}
              expanded={sidebarOpen}
              className="text-red-600 hover:bg-red-50"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-blue-100 sticky top-0 z-30">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {activeTab === "dashboard" && "Dashboard Overview"}
                  {activeTab === "analytics" && "Analytics Dashboard"}
                  {activeTab === "users" && "User Management"}
                  {activeTab === "conversations" && "Conversations"}
                  {activeTab === "notifications" && "Notifications"}
                </h1>
                <p className="text-sm text-gray-600">
                  FingerTips Management Panel
                </p>
              </div>

              <div className="flex items-center gap-4">
                {activeTab === "notifications" && (
                  <Button
                    onClick={() => setShowNotificationModal(true)}
                    variant="gradient"
                    className="flex items-center gap-2"
                  >
                    <FiSend className="w-4 h-4" />
                    Send Notification
                  </Button>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
          {activeTab === "dashboard" && (
            <DashboardOverview
              stats={dashboardStats}
              onSendNotification={() => setShowNotificationModal(true)}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />
          )}

          {activeTab === "analytics" && <AdminAnalytics />}

          {activeTab === "users" && (
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
              loading={loading}
            />
          )}

          {activeTab === "conversations" && (
            <ConversationsManagement
              conversations={conversations}
              onViewConversation={viewConversationDetails}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              loading={loading}
            />
          )}

          {activeTab === "notifications" && (
            <NotificationsManagement
              notifications={notifications}
              onSendNotification={() => setShowNotificationModal(true)}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              loading={loading}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {showNotificationModal && (
        <NotificationForm
          form={notificationForm}
          setForm={setNotificationForm}
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
    </div>
  );
};

// Navigation Item Component
const NavItem = ({ icon: Icon, label, isActive, onClick, expanded, className = "" }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center ${expanded ? "" : "justify-center"} px-3 py-3 rounded-lg transition-colors ${
        isActive
          ? "bg-blue-50 text-blue-700"
          : `text-gray-700 hover:bg-gray-100 ${className}`
      }`}
    >
      <Icon className={`w-5 h-5 ${isActive ? "text-blue-600" : ""}`} />
      {expanded && <span className="ml-3 text-sm font-medium">{label}</span>}
    </button>
  );
};

// Dashboard Overview Component
const DashboardOverview = ({ stats, onSendNotification, timeRange, onTimeRangeChange }) => {
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
      {/* <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
        <Button
          onClick={onSendNotification}
          className="flex items-center gap-2"
          variant="gradient"
        >
          <FiSend className="w-4 h-4" />
          Send Notification
        </Button>
      </div> */}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card
            key={index}
            className="hover:shadow-lg transition-all duration-200 bg-white/80 backdrop-blur-sm"
          >
            <CardContent className="p-6 pt-6" >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
                </div>
                <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dynamic Chart */}
      <DynamicCharts 
        data={stats} 
        timeRange={timeRange}
        onTimeRangeChange={onTimeRangeChange}
      />
    </div>
  );
};

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
  loading
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Users Management</h2>
        
        <form onSubmit={onSearch} className="flex gap-2">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            />
          </div>
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>
      </div>

      {/* Users Table */}
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Auth Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th> */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                          {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name || "No name"}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
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
                        className="text-sm border border-gray-200 rounded px-2 py-1 bg-white text-gray-900"
                      >
                        <option value="user">User</option>
                        <option value="power_user">Power User</option>
                        <option value="reviewer">Reviewer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    {/* Using This */}
                    {/* <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.status || "active"}
                        onChange={(e) => onUpdateStatus(user._id, e.target.value)}
                        className="text-sm border border-gray-200 rounded px-2 py-1 bg-white text-gray-900"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </td> */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
        loading={loading}
      />
    </div>
  );
};

// Pagination Component
const Pagination = ({ currentPage, totalPages, onPageChange, loading }) => {
  if (totalPages <= 1) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex space-x-2 items-center justify-center mb-4">
            <div className="w-3 h-3 rounded-full bg-blue-300 animate-bounce"></div>
            <div className="w-3 h-3 rounded-full bg-purple-300 animate-bounce"></div>
            <div className="w-3 h-3 rounded-full bg-cyan-300 animate-bounce"></div>
          </div>
        
        </div>
      </div>
    );
  }

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
      
      <span className="px-4 py-2 text-sm text-gray-600">
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

// User Details Modal Component
const UserDetailsModal = ({ user, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-sm shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">User Details</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* User Info */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                {user.user.name ? user.user.name[0].toUpperCase() : user.user.email[0].toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800">
                  {user.user.name || "No name"}
                </h3>
                <p className="text-gray-600">{user.user.email}</p>
                <p className="text-sm text-gray-500">
                  Joined {new Date(user.user.created_at * 1000).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{user.total_conversations}</p>
                <p className="text-sm text-gray-600">Conversations</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{user.total_messages}</p>
                <p className="text-sm text-gray-600">Messages</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-cyan-600">{user.user.auth_type}</p>
                <p className="text-sm text-gray-600">Auth Type</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{user.user.role || "user"}</p>
                <p className="text-sm text-gray-600">Role</p>
              </div>
            </div>
          </div>

          {/* Recent Conversations */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Recent Conversations</h4>
            <div className="space-y-3">
              {user.conversations.slice(0, 5).map((conv) => (
                <div
                  key={conv._id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-gray-800">
                      {conv.title || "Untitled Chat"}
                    </h5>
                    <span className="text-sm text-gray-500">
                      {new Date(conv.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
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

export default EnhancedAdminDashboard;