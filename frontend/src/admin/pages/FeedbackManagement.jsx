import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../../user/context/AuthContext.jsx";
import {
  FiStar,
  FiMessageSquare,
  FiUser,
  FiClock,
  FiLogOut,
  FiHome,
  FiFilter,
} from "react-icons/fi";
import { HiOutlineFingerPrint } from "react-icons/hi";
import { Card, CardHeader, CardTitle, CardContent } from "../../user/components/ui/card";
import { Button } from "../../user/components/ui/button";
import { Badge } from "../../user/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../user/components/ui/select";
import { useToast } from "../../user/components/ui/toast";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

const FeedbackManagement = () => {
  const { token, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [feedbackStats, setFeedbackStats] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [ratingFilter, setRatingFilter] = useState("all");

  useEffect(() => {
    if (!token) {
      navigate("/auth");
      return;
    }
    loadFeedbackStats();
    loadConversations();
  }, [token, navigate]);

  const loadFeedbackStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get("/feedback/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFeedbackStats(response.data.stats);
    } catch (error) {
      console.error("Error loading feedback stats:", error);
      toast.error("Failed to load feedback statistics");
    }
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await api.get("/admin/conversations", {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 50 },
      });
      setConversations(response.data.conversations);
    } catch (error) {
      console.error("Error loading conversations:", error);
      if (error.response?.status === 403) {
        navigate("/chat");
      }
      toast.error("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  const loadConversationFeedback = async (conversationId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get(`/feedback/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFeedback(response.data.feedback);
    } catch (error) {
      console.error("Error loading conversation feedback:", error);
      toast.error("Failed to load feedback for this conversation");
    }
  };

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
    loadConversationFeedback(conversation._id);
  };

  const filteredFeedback = feedback.filter(item => {
    if (ratingFilter === "all") return true;
    return item.rating === parseInt(ratingFilter);
  });

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <FiStar
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
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
          <p className="text-gray-600">Loading feedback...</p>
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
                  Feedback Management
                </h1>
                <p className="text-sm text-gray-600">Monitor user satisfaction and feedback</p>
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
        {/* Feedback Stats */}
        {feedbackStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Average Rating</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold text-gray-800">
                        {feedbackStats.avg_rating}
                      </p>
                      <div className="flex">
                        {renderStars(Math.round(feedbackStats.avg_rating))}
                      </div>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-yellow-100">
                    <FiStar className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Feedback</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {feedbackStats.total_feedback}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-100">
                    <FiMessageSquare className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div>
                  <p className="text-sm text-gray-600 mb-3">Rating Distribution</p>
                  <div className="space-y-2">
                    {Object.entries(feedbackStats.rating_distribution || {}).map(([rating, count]) => (
                      <div key={rating} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span>{rating} stars</span>
                          <div className="flex">
                            {renderStars(parseInt(rating))}
                          </div>
                        </div>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Conversations List */}
          <Card>
            <CardHeader>
              <CardTitle>Conversations with Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {conversations.map((conv) => (
                  <div
                    key={conv._id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
                      selectedConversation?._id === conv._id 
                        ? "border-blue-500 bg-blue-50" 
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => handleConversationSelect(conv)}
                  >
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
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Feedback Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {selectedConversation ? "Feedback Details" : "Select a Conversation"}
                </CardTitle>
                {selectedConversation && (
                  <Select value={ratingFilter} onValueChange={setRatingFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Ratings</SelectItem>
                      <SelectItem value="5">5 Stars</SelectItem>
                      <SelectItem value="4">4 Stars</SelectItem>
                      <SelectItem value="3">3 Stars</SelectItem>
                      <SelectItem value="2">2 Stars</SelectItem>
                      <SelectItem value="1">1 Star</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {selectedConversation ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {filteredFeedback.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FiMessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No feedback found for this conversation</p>
                    </div>
                  ) : (
                    filteredFeedback.map((item) => (
                      <div
                        key={item._id}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {renderStars(item.rating)}
                            </div>
                            <span className="text-sm font-medium">
                              {item.rating}/5
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        {item.comment && (
                          <p className="text-sm text-gray-700 bg-white p-3 rounded border">
                            {item.comment}
                          </p>
                        )}
                        
                        <div className="mt-2 text-xs text-gray-500">
                          Message ID: {item.message_id}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FiMessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a conversation to view its feedback</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FeedbackManagement;