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
  FiMenu,
  FiActivity,
  FiList,
} from "react-icons/fi";
import { HiOutlineFingerPrint } from "react-icons/hi";
import { Card, CardHeader, CardTitle, CardContent } from "../../user/components/ui/card";
import { Button } from "../../user/components/ui/button";
import { Badge } from "../../user/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../user/components/ui/select";
import { ToastProvider, useToast } from "../../user/components/ui/toast";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

const FeedbackManagementContent = () => {
  const { token, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [feedbackStats, setFeedbackStats] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [ratingFilter, setRatingFilter] = useState("all");
  const [conversationsWithFeedback, setConversationsWithFeedback] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
      // First load all conversations
      const token = localStorage.getItem("token");
      const allConversationsResponse = await api.get("/admin/conversations", {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 100 }, // Get more conversations to filter from
      });
      
      const allConversations = allConversationsResponse.data.conversations || [];
      setConversations(allConversations);
      
      // Then filter conversations with feedback
      const withFeedback = [];
      
      for (const conversation of allConversations) {
        try {
          const feedbackResponse = await api.get(`/feedback/${conversation._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (feedbackResponse.data.feedback && feedbackResponse.data.feedback.length > 0) {
            withFeedback.push({
              ...conversation,
              feedbackCount: feedbackResponse.data.feedback.length
            });
          }
        } catch (error) {
          // Skip conversations with errors fetching feedback
          console.error(`Error checking feedback for conversation ${conversation._id}:`, error);
        }
      }
      
      setConversationsWithFeedback(withFeedback);
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white/90 backdrop-blur-sm shadow-lg border-r border-blue-100 transition-all duration-300 flex flex-col h-screen sticky top-0`}>
        {/* Logo */}
        <div className="p-4 border-b border-blue-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HiOutlineFingerPrint className="w-8 h-8 text-blue-600" />
            {sidebarOpen && (
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Feedback Panel
              </h1>
            )}
          </div>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <FiMenu className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-2 space-y-1">
            <NavItem 
              icon={FiList} 
              label="Feedback" 
              isActive={true} 
              onClick={() => {}} 
              expanded={sidebarOpen}
            />
            {/* <NavItem 
              icon={FiMessageSquare} 
              label="Reviewer Panel" 
              isActive={false} 
              onClick={() => navigate("/reviewer")} 
              expanded={sidebarOpen}
            />
            <NavItem 
              icon={FiActivity} 
              label="Analytics" 
              isActive={false} 
              onClick={() => navigate("/admin/analytics")} 
              expanded={sidebarOpen}
            /> */}
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
                  Feedback Management
                </h1>
                <p className="text-sm text-gray-600">Monitor user satisfaction and feedback</p>
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
                  {conversationsWithFeedback.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FiMessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No conversations with feedback found</p>
                    </div>
                  ) : (
                    conversationsWithFeedback.map((conv) => (
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
                        <Badge variant="info" className="bg-blue-100 text-blue-800">
                          {conv.feedbackCount} {conv.feedbackCount === 1 ? 'feedback' : 'feedbacks'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <FiUser className="w-3 h-3" />
                          {conv.user.name || conv.user.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <FiClock className="w-3 h-3" />
                          {new Date(conv.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )))}
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
                                {renderStars(item.rating || 0)}
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
                            <div className="bg-white p-3 rounded border">
                              <div className="mb-3 pb-3 border-b border-gray-100">
                                <span className="text-xs text-gray-500">Message:</span>
                                {selectedConversation.messages?.find(m => m.id === item.message_id) ? (
                                  <p className="text-sm text-gray-800 mt-1">
                                    {selectedConversation.messages.find(m => m.id === item.message_id).text}
                                  </p>
                                ) : (
                                  <p className="text-sm text-gray-500 mt-1 italic">
                                    Message not found
                                  </p>
                                )}
                              </div>
                              <div>
                                <span className="text-xs text-gray-500">Feedback:</span>
                                <p className="text-sm text-gray-700 mt-1">
                                  {item.comment}
                                </p>
                              </div>
                            </div>
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
    </div>
  );
};

// Navigation Item Component
const NavItem = ({ icon: Icon, label, isActive, onClick, expanded, className = "" }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-3 py-3 rounded-lg transition-colors ${
        isActive 
          ? "bg-blue-50 text-blue-700" 
          : `text-gray-700 hover:bg-gray-100 ${className}`
      }`}
    >
      <Icon className={`w-5 h-5 ${isActive ? "text-blue-600" : ""}`} />
      {expanded && (
        <span className="ml-3 text-sm font-medium">{label}</span>
      )}
    </button>
  );
};

// Main component that wraps the content with ToastProvider
const FeedbackManagement = () => {
  return (
    <ToastProvider>
      <FeedbackManagementContent />
    </ToastProvider>
  );
};

export default FeedbackManagement;