import { useState, useEffect } from "react";
import { FiX, FiSearch, FiUsers, FiUser, FiUserCheck } from "react-icons/fi";
import { Button } from "../../user/components/ui/button";
import { Input } from "../../user/components/ui/input";
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

const NotificationForm = ({ form, setForm, onSubmit, onClose }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    setForm(prev => ({
      ...prev,
      target_users: selectedUsers
    }));
  }, [selectedUsers, setForm]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Apply search when debounced term changes
  useEffect(() => {
    if (debouncedSearchTerm !== "") {
      loadUsers();
    }
  }, [debouncedSearchTerm]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await api.get("/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 100, search: debouncedSearchTerm }
      });
      setUsers(response.data.users || []);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelection = (userId) => {
    if (form.target_type === "single") {
      setSelectedUsers([userId]);
    } else {
      setSelectedUsers(prev => 
        prev.includes(userId)
          ? prev.filter(id => id !== userId)
          : [...prev, userId]
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">Send Notification</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <Input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            >
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target
            </label>
            <select
              value={form.target_type}
              onChange={(e) => {
                setForm({ ...form, target_type: e.target.value });
                setSelectedUsers([]);
              }}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            >
              <option value="all">All Users</option>
              <option value="single">Single User</option>
              <option value="multiple">Multiple Users</option>
            </select>
          </div>

          {(form.target_type === "single" || form.target_type === "multiple") && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Select Users
                </label>
                <div className="text-xs text-gray-500">
                  {selectedUsers.length} selected
                </div>
              </div>
              
              <div className="flex gap-2 mb-3">
                <Input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={loadUsers}
                >
                  <FiSearch className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-white">
                {loading ? (
                  <div className="flex justify-center py-4">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 rounded-full bg-blue-300 animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-purple-300 animate-bounce delay-100"></div>
                      <div className="w-2 h-2 rounded-full bg-cyan-300 animate-bounce delay-200"></div>
                    </div>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <FiUsers className="w-6 h-6 mx-auto mb-2 opacity-50" />
                    <p>No users found</p>
                  </div>
                ) : (
                  users.map((user) => (
                    <label
                      key={user._id}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type={form.target_type === "single" ? "radio" : "checkbox"}
                        name="selectedUser"
                        checked={selectedUsers.includes(user._id)}
                        onChange={() => handleUserSelection(user._id)}
                      />
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                          {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{user.name || "No name"}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </label>
                  ))
                )}
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
              disabled={
                !form.title || 
                !form.message || 
                ((form.target_type === "single" || form.target_type === "multiple") && selectedUsers.length === 0)
              }
            >
              Send Notification
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NotificationForm;