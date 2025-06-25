import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext.jsx";
import {
  FiMessageSquare,
  FiEye,
  FiEdit3,
  FiSearch,
  FiFilter,
  FiUser,
  FiClock,
  FiStar,
  FiLogOut,
  FiHome,
} from "react-icons/fi";
import { HiOutlineFingerPrint } from "react-icons/hi";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { useToast } from "../components/ui/toast";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

const ReviewerDashboard = () => {
  const { token, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    messageId: "",
    comment: "",
    rating: 0,
  });

  useEffect(() => {
    if (!token) {
      navigate("/auth");
      return;
    }
    loadConversations();
  }, [token, navigate]);

  const loadConversations = async (page = 1, search = "") => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await api.get("/admin/conversations", {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit: 20, search },
      });
      setConversations(response.data.conversations);
      setTotalPages(response.data.pages);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error loading conversations:", error);
      if (error.response?.status === 403) {
        navigate("/chat");
      }
    } finally {
      setLoading(false);
    }
  };

  const viewConversationDetails = async (conversationId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get(`/admin/conversations/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedConversation(response.data);
    } catch (error) {
      console.error("Error loading conversation details:", error);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    
    if (!reviewForm.comment.trim()) {
      toast.error("Comment is required");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await api.post("/reviews", {
        conversation_id: selectedConversation._id,
        message_id: reviewForm.messageId,
        comment: reviewForm.comment,
        rating: reviewForm.rating || null,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Review submitted successfully");
      setShowReviewModal(false);
      setReviewForm({ messageId: "", comment: "", rating: 0 });
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review");
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadConversations(1, searchTerm);
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
          <p className="text-gray-600">Loading reviewer dashboard...</p>
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
                  Reviewer Dashboard
                </h1>
                <p className="text-sm text-gray-600">Review and comment on conversations</p>
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

      <div className="flex">
        {/* Conversations List */}
        <div className="w-1/2 p-6 border-r border-blue-100">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Conversations</h2>
              
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
                <Button type="submit" variant="outline">
                  <FiSearch className="w-4 h-4" />
                </Button>
              </form>
            </div>

            <div className="space-y-3">
              {conversations.map((conv) => (
                <Card
                  key={conv._id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedConversation?._id === conv._id ? "ring-2 ring-blue-500" : ""
                  }`}
                  onClick={() => viewConversationDetails(conv._id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-800 truncate">
                        {conv.title || "Untitled Chat"}
                      </h3>
                      <Badge variant="secondary">
                        {conv.message_count} messages
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <FiUser className="w-3 h-3" />
                        {conv.user.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <FiClock className="w-3 h-3" />
                        {new Date(conv.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Conversation Details */}
        <div className="w-1/2 p-6">
          {selectedConversation ? (
            <div className="space-y-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  {selectedConversation.title || "Untitled Chat"}
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">User:</span>
                    <p className="font-medium">{selectedConversation.user.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Messages:</span>
                    <p className="font-medium">{selectedConversation.messages?.length || 0}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Created:</span>
                    <p className="font-medium">{new Date(selectedConversation.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Updated:</span>
                    <p className="font-medium">{new Date(selectedConversation.updated_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-800">Messages</h4>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {selectedConversation.messages?.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className="max-w-[80%]">
                        <div
                          className={`p-4 rounded-lg ${
                            message.sender === "user"
                              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                              : "bg-white border border-gray-200"
                          }`}
                        >
                          <p className="text-sm">{message.text}</p>
                          <p className={`text-xs mt-2 ${
                            message.sender === "user" ? "text-blue-100" : "text-gray-500"
                          }`}>
                            {new Date(message.timestamp).toLocaleString()}
                          </p>
                        </div>
                        
                        {/* Review Button for Assistant Messages */}
                        {message.sender === "bot" && (
                          <div className="mt-2 flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setReviewForm({
                                  messageId: message.id || `msg-${index}`,
                                  comment: "",
                                  rating: 0,
                                });
                                setShowReviewModal(true);
                              }}
                            >
                              <FiEdit3 className="w-3 h-3 mr-1" />
                              Review
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <FiMessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a conversation to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Add Review</h2>
              <button
                onClick={() => setShowReviewModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating (optional)
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                      className="p-1"
                    >
                      <FiStar
                        className={`w-6 h-6 ${
                          star <= reviewForm.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comment
                </label>
                <Textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Enter your review comment..."
                  rows={4}
                  required
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gradient"
                  className="flex-1"
                >
                  Submit Review
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewerDashboard;