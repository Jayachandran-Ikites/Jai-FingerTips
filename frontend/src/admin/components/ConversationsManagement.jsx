import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiMessageSquare,
  FiEye,
  FiSearch,
  FiFilter,
  FiUser,
  FiClock,
  FiX,
  FiExternalLink,
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

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

const ConversationsManagement = ({
  conversations: initialConversations,
  onViewConversation,
  currentPage,
  totalPages,
  onPageChange,
  loading: initialLoading,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [conversations, setConversations] = useState(initialConversations || []);
  const [loading, setLoading] = useState(initialLoading || false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(currentPage || 1);

  useEffect(() => {
    setConversations(initialConversations || []);
    setLoading(initialLoading || false);
    setPage(currentPage || 1);
  }, [initialConversations, initialLoading, currentPage]);

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
  useEffect(() => {
    if (debouncedSearchTerm !== "") {
      handleFilterChange();
    }
  }, [debouncedSearchTerm]);

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

  const loadConversations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await api.get("/admin/conversations", {
        headers: { Authorization: `Bearer ${token}` },
        params: { 
          page,
          limit: 20,
          user_id: userFilter || undefined,
          date: dateFilter || undefined,
          search: debouncedSearchTerm || undefined
        },
      });
      setConversations(response.data.conversations || []);
      setLoading(false);
    } catch (error) {
      console.error("Error loading conversations:", error);
      setLoading(false);
    }
  };

  const handleFilterChange = useCallback(() => {
    setPage(1);
    loadConversations();
  }, [userFilter, dateFilter, debouncedSearchTerm]);

  const handleClearFilters = () => {
    setUserFilter("");
    setDateFilter("");
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setPage(1);
    setTimeout(() => {
      loadConversations();
    }, 0);
  };

  const handleViewConversation = (conversationId) => {
    navigate(`/admin/conversations/${conversationId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">
          Conversations Management
        </h2>

        <div className="flex gap-2">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            />
          </div>
        </div>
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
                  handleFilterChange();
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
                Filter by Date
              </label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  handleFilterChange();
                }}
              />
            </div>
          </div>

          {(userFilter || dateFilter || searchTerm) && (
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

      <Card className="bg-white/80 backdrop-blur-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-300 animate-bounce"></div>
                <div className="w-3 h-3 rounded-full bg-purple-300 animate-bounce delay-100"></div>
                <div className="w-3 h-3 rounded-full bg-cyan-300 animate-bounce delay-200"></div>
              </div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12">
              <FiMessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                No conversations found
              </h3>
              <p className="text-gray-600">
                {userFilter || dateFilter || searchTerm
                  ? "Try adjusting your filters or search terms"
                  : "There are no conversations to display"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Messages
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Updated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {conversations.map((conv) => (
                    <tr key={conv._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {conv.title || "Untitled Chat"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {conv.user?.name || conv.user?.email || "Unknown"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {conv.message_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(conv.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(conv.updated_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleViewConversation(conv._id)}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            <FiExternalLink className="w-3 h-3" />
                            View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
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
    </div>
  );
};

export default ConversationsManagement;