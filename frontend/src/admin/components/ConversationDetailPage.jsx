import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiArrowLeft,
  FiMessageSquare,
  FiUser,
  FiClock,
  FiStar,
  FiEdit3,
  FiTrash2,
} from "react-icons/fi";
import { HiOutlineFingerPrint } from "react-icons/hi";
import { Card, CardHeader, CardTitle, CardContent } from "../../user/components/ui/card";
import { Button } from "../../user/components/ui/button";
import { Badge } from "../../user/components/ui/badge";
import { ToastProvider, useToast } from "../../user/components/ui/toast";
import MarkdownRenderer from "../../user/components/MarkdownRenderer.jsx";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

const ConversationDetailPageContent = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState([]);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    if (!conversationId) {
      navigate("/admin");
      return;
    }
    
    loadConversationDetails();
  }, [conversationId, navigate]);

  const loadConversationDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      // Load conversation details
      const conversationResponse = await api.get(`/admin/conversations/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversation(conversationResponse.data);
      
      // Load feedback for this conversation
      try {
        const feedbackResponse = await api.get(`/feedback/${conversationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFeedback(feedbackResponse.data.feedback || []);
      } catch (error) {
        console.error("Error loading feedback:", error);
        setFeedback([]);
      }
      
      // Load reviews for this conversation
      try {
        const reviewsResponse = await api.get(`/reviews/conversation/${conversationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setReviews(reviewsResponse.data.reviews || []);
      } catch (error) {
        console.error("Error loading reviews:", error);
        setReviews([]);
      }
    } catch (error) {
      console.error("Error loading conversation details:", error);
      toast.error("Failed to load conversation details");
      navigate("/admin");
    } finally {
      setLoading(false);
    }
  };

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

  const getFeedbackForMessage = (messageId) => {
    return feedback.filter((item) => item.message_id === messageId);
  };

  const getReviewsForMessage = (messageId) => {
    return reviews.filter((item) => item.message_id === messageId);
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
          <p className="text-gray-600">Loading conversation details...</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <FiMessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Conversation Not Found</h2>
          <p className="text-gray-600 mb-6">The conversation you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button onClick={() => navigate("/admin")} variant="gradient">
            Back to Dashboard
          </Button>
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
                  Conversation Details
                </h1>
                <p className="text-sm text-gray-600">
                  Viewing conversation: {conversation.title || "Untitled Chat"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/admin")}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <FiArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Conversation Info */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Conversation Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Title</h3>
                <p className="text-lg font-semibold text-gray-900">{conversation.title || "Untitled Chat"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">User</h3>
                <p className="text-lg font-semibold text-gray-900">{conversation.user?.email || "Unknown"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Created</h3>
                <p className="text-lg font-semibold text-gray-900">{new Date(conversation.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Messages</h3>
                <p className="text-lg font-semibold text-gray-900">{conversation.messages?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {conversation.messages?.map((message, index) => (
                <div key={index} className="space-y-2">
                  <div
                    className={`flex ${
                      message.sender === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div className="max-w-[80%]">
                      <div
                        className={`p-4 rounded-lg ${
                          message.sender === "user"
                            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                            : "bg-white border border-gray-200"
                        }`}
                      >
                        <MarkdownRenderer content={message.text} />
                        <p
                          className={`text-xs mt-2 ${
                            message.sender === "user"
                              ? "text-blue-100"
                              : "text-gray-500"
                          }`}
                        >
                          {new Date(message.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Feedback and Reviews for this message */}
                  {(message.id || message._id) && (
                    <div className="ml-8 space-y-2">
                      {/* User Feedback */}
                      {getFeedbackForMessage(message.id || message._id).map(
                        (item, idx) => (
                          <div
                            key={`feedback-${idx}`}
                            className="bg-blue-50 rounded-lg p-3 border border-blue-100"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  {item.user_name || "User"}
                                </span>
                                <Badge variant="info">User</Badge>
                                <div className="flex">
                                  {renderStars(item.rating)}
                                </div>
                              </div>
                              <span className="text-xs text-gray-500">
                                {new Date(item.created_at).toLocaleString()}
                              </span>
                            </div>
                            {item.comment && (
                              <p className="text-sm text-gray-700 mt-1">
                                {item.comment}
                              </p>
                            )}
                          </div>
                        )
                      )}

                      {/* Reviewer Comments */}
                      {getReviewsForMessage(message.id || message._id).map(
                        (item, idx) => (
                          <div
                            key={`review-${idx}`}
                            className="bg-purple-50 rounded-lg p-3 border border-purple-100"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  {item.reviewer_name ||
                                    item.reviewer?.name ||
                                    item.reviewer?.email ||
                                    "Unknown"}
                                </span>
                                <Badge
                                  variant="secondary"
                                  className="bg-purple-100 text-purple-800"
                                >
                                  Reviewer
                                </Badge>

                                {item.rating > 0 && (
                                  <div className="flex">
                                    {renderStars(item.rating)}
                                  </div>
                                )}
                              </div>
                              <span className="text-xs text-gray-500">
                                {new Date(item.created_at).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mt-1">
                              {item.comment}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Main component that wraps the content with ToastProvider
const ConversationDetailPage = () => {
  return (
    <ToastProvider>
      <ConversationDetailPageContent />
    </ToastProvider>
  );
};

export default ConversationDetailPage;