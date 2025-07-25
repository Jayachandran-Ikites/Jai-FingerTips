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
  const [conversations, setConversations] = useState(
    initialConversations || []
  );
  const [loading, setLoading] = useState(initialLoading || false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [currentTotalPages, setCurrentTotalPages] = useState(totalPages || 1);
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
  // useEffect(() => {
  //   if (debouncedSearchTerm !== "") {
  //     // handleFilterChange();
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

  const loadConversations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await api.get("/admin/conversations", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page,
          limit: 15,
          user_id: userFilter || undefined,
          date: dateFilter || undefined,
          // search: debouncedSearchTerm || undefined,
        },
      });
      console.log("No. of conversations:", response.data.total);
      setConversations(response.data.conversations || []);
      setCurrentTotalPages(response.data.pages || 1);
      setLoading(false);
    } catch (error) {
      console.error("Error loading conversations:", error);
      setLoading(false);
    }
  };


  // Whenever page changes, load conversations
  useEffect(() => {
    loadConversations();
    setPage(1);
  }, [userFilter, dateFilter, debouncedSearchTerm]);

  useEffect(() => {
    loadConversations();
    setPage(page || 1);
  }, [page]);

  const handleClearFilters = () => {
    setUserFilter("");
    setDateFilter("");
    setSearchTerm("");
    // setDebouncedSearchTerm("");
    // setPage(1);
    // // setTimeout(() => {
    //   loadConversations();
    // // }, 0);
  };

  const handleViewConversation = (conversationId) => {
    navigate(`/admin/conversations/${conversationId}`);
  };

  const loadUserConversation = async (conversationId) => {
    try {
      
      const token = localStorage.getItem("token");

      // Load conversation details
      const conversationResponse = await api.get(
        `/admin/conversations/${conversationId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return conversationResponse.data;
    } catch (error) {
      console.error("Error loading conversation details:", error);
      toast.error("Failed to load conversation details");
    } 
  };

  // Helper: Convert JS Object to XML
  // Updated convertToXML with ignoreSources support
 

const escapeXml = (unsafe) => {
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

const generateXML = (obj, indent = "", ignoreSources = true) => {
  let xml = "";
  for (let key in obj) {
    if (ignoreSources && key === "sources") continue;

    if (Array.isArray(obj[key])) {
      obj[key].forEach((item) => {
        xml += `${indent}<${key}>\n${generateXML(
          item,
          indent + "  ",
          ignoreSources
        )}${indent}</${key}>\n`;
      });
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      xml += `${indent}<${key}>\n${generateXML(
        obj[key],
        indent + "  ",
        ignoreSources
      )}${indent}</${key}>\n`;
    } else {
      xml += `${indent}<${key}>${escapeXml(obj[key])}</${key}>\n`;
    }
  }
  return xml;
};

  // Helper to remove sources recursively from an object
  const removeSources = (obj) => {
    if (Array.isArray(obj)) {
      return obj.map(removeSources);
    } else if (typeof obj === "object" && obj !== null) {
      const newObj = {};
      for (let key in obj) {
        if (key === "sources") continue;
        newObj[key] = removeSources(obj[key]);
      }
      return newObj;
    }
    return obj;
  };

  // Trigger Download
  const downloadFile = (data, filename, type) => {
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Utility to sanitize filenames
  const sanitizeFilename = (title) => {
    return title.replace(/[<>:"/\\|?*\n\r]+/g, "").replace(/\s+/g, "_");
  };

  // Export handlers with title as filename
  const handleExportJSON = async (conversationId,ignoreSources = true) => {
    const obj = await loadUserConversation(conversationId);
    const exportObj = ignoreSources ? removeSources(obj) : obj;
    const fileTitle = sanitizeFilename(obj.title || "export");
    const json = JSON.stringify(exportObj, null, 2);
    downloadFile(json, `${fileTitle}.json`, "application/json");
    toast.success("Conversation exported as JSON");
  };
  
  const handleExportXML = async (conversationId,ignoreSources = true) => {
    const obj = await loadUserConversation(conversationId);
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
    const xmlBody = generateXML(
      ignoreSources ? removeSources(obj) : obj,
      "  ",
      ignoreSources
    );
    const fileTitle = sanitizeFilename(obj.title || "export");
    const xml = xmlHeader + `<response>\n${xmlBody}</response>`;
    downloadFile(xml, `${fileTitle}.xml`, "application/xml");
    toast.success("Conversation exported as XML");
  };
 


  return (
    <div className="space-y-6">
      {/* <div className="flex items-center justify-between">
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
      </div> */}

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
                Filter by Date
              </label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Export
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleExportXML(conv._id)}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            {/* <FiExternalLink className="w-3 h-3" /> */}
                            XML
                          </Button>
                          <Button
                            onClick={() => handleExportJSON(conv._id)}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            {/* <FiExternalLink className="w-3 h-3" /> */}
                            JSON
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
      {loading ? (
        <></>
      ) : (
        <>
          {currentTotalPages > 1 && (
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
                Page {page} of {currentTotalPages}
              </span>
              <Button
                onClick={() => {
                  const newPage = Math.min(currentTotalPages, page + 1);
                  setPage(newPage);
                  onPageChange(newPage);
                }}
                disabled={page === currentTotalPages || loading}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ConversationsManagement;