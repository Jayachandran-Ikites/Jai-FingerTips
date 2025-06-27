import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../../user/context/AuthContext.jsx";
import {
  FiUsers,
  FiSearch,
  FiEdit3,
  FiTrash2,
  FiPlus,
  FiLogOut,
  FiHome,
  FiMail,
  FiShield,
} from "react-icons/fi";
import { HiOutlineFingerPrint } from "react-icons/hi";
import { Card, CardHeader, CardTitle, CardContent } from "../../user/components/ui/card";
import { Button } from "../../user/components/ui/button";
import { Input } from "../../user/components/ui/input";
import { Badge } from "../../user/components/ui/badge";
import { ToastProvider, useToast } from "../../user/components/ui/toast";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

const UserManagementContent = () => {
  const { token, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate("/auth");
      return;
    }
    loadUsers();
  }, [token, navigate]);

  const loadUsers = async (page = 1, search = "") => {
    try {
      setLoading(true);
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
      if (error.response?.status === 403) {
        navigate("/chat");
      }
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadUsers(1, searchTerm);
  };

  const handleRoleUpdate = async (userId, newRole) => {
    try {
      const token = localStorage.getItem("token");
      await api.post(`/admin/users/${userId}/role`, 
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success("User role updated successfully");
      loadUsers(currentPage, searchTerm);
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("Failed to update user role");
    }
  };

  const handleStatusUpdate = async (userId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      await api.patch(`/admin/users/${userId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success("User status updated successfully");
      loadUsers(currentPage, searchTerm);
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
      toast.error("Failed to load user details");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex space-x-2 items-center justify-center mb-4">
            <div className="w-3 h-3 rounded-full bg-blue-300 animate-bounce"></div>
            <div className="w-3 h-3 rounded-full bg-purple-300 animate-bounce"></div>
            <div className="w-3 h-3 rounded-full bg-cyan-300 animate-bounce"></div>
          </div>
          <p className="text-gray-600">Loading users...</p>
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
                  User Management
                </h1>
                <p className="text-sm text-gray-600">Manage user accounts and permissions</p>
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
        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="flex gap-4">
              <Input
                placeholder="Search users by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" variant="outline">
                <FiSearch className="w-4 h-4 mr-2" />
                Search
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FiUsers className="w-5 h-5" />
              Users ({users.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">User</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Auth Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Created</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                            {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {user.name || "No name"}
                            </p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant={user.auth_type === "google" ? "info" : "secondary"}>
                          {user.auth_type}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <select
                          value={user.role || "user"}
                          onChange={(e) => handleRoleUpdate(user._id, e.target.value)}
                          className="text-sm border border-gray-200 rounded px-2 py-1 bg-white"
                        >
                          <option value="user">User</option>
                          <option value="power_user">Power User</option>
                          <option value="reviewer">Reviewer</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="py-4 px-4">
                        <select
                          value={user.status || "active"}
                          onChange={(e) => handleStatusUpdate(user._id, e.target.value)}
                          className="text-sm border border-gray-200 rounded px-2 py-1 bg-white"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewUserDetails(user._id)}
                          >
                            <FiEdit3 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => loadUsers(currentPage - 1, searchTerm)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="px-4 py-2 text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => loadUsers(currentPage + 1, searchTerm)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">User Details</h2>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                    {selectedUser.user.name ? selectedUser.user.name[0].toUpperCase() : selectedUser.user.email[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">
                      {selectedUser.user.name || "No name"}
                    </h3>
                    <p className="text-gray-600 flex items-center gap-2">
                      <FiMail className="w-4 h-4" />
                      {selectedUser.user.email}
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                      <FiShield className="w-4 h-4" />
                      {selectedUser.user.role || "user"} • {selectedUser.user.auth_type}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{selectedUser.total_conversations}</p>
                    <p className="text-sm text-gray-600">Conversations</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{selectedUser.total_messages}</p>
                    <p className="text-sm text-gray-600">Messages</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {new Date(selectedUser.user.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">Joined</p>
                  </div>
                  <div className="text-center">
                    <Badge variant={selectedUser.user.status === "active" ? "success" : "secondary"}>
                      {selectedUser.user.status || "active"}
                    </Badge>
                    <p className="text-sm text-gray-600 mt-1">Status</p>
                  </div>
                </div>
              </div>

              {/* Recent Conversations */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Recent Conversations</h4>
                <div className="space-y-3">
                  {selectedUser.conversations.slice(0, 5).map((conv) => (
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
      )}
    </div>
  );
};

// Main component that wraps the content with ToastProvider
const UserManagement = () => {
  return (
    <ToastProvider>
      <UserManagementContent />
    </ToastProvider>
  );
};

export default UserManagement;