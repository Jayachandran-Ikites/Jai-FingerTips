import { useState, useEffect, useRef } from "react";
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
import AdminLoader from "./AdminLoader.jsx";

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
  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [conversation]);

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
      // try {
      //   const feedbackResponse = await api.get(`/feedback/${conversationId}`, {
      //     headers: { Authorization: `Bearer ${token}` },
      //   });
      //   setFeedback(feedbackResponse.data.feedback || []);
      // } catch (error) {
      //   console.error("Error loading feedback:", error);
      //   setFeedback([]);
      // }
      
      // Load reviews for this conversation
      // try {
      //   const reviewsResponse = await api.get(`/reviews/conversation/${conversationId}`, {
      //     headers: { Authorization: `Bearer ${token}` },
      //   });
      //   setReviews(reviewsResponse.data.reviews || []);
      // } catch (error) {
      //   console.error("Error loading reviews:", error);
      //   setReviews([]);
      // }
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
      // <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 flex items-center justify-center">
      //   <div className="text-center">
      //     <div className="flex space-x-2 items-center justify-center mb-4">
      //       <div className="w-3 h-3 rounded-full bg-blue-300 animate-bounce"></div>
      //       <div className="w-3 h-3 rounded-full bg-purple-300 animate-bounce"></div>
      //       <div className="w-3 h-3 rounded-full bg-cyan-300 animate-bounce"></div>
      //     </div>
      //     <p className="text-gray-600">Loading conversation details...</p>
      //   </div>
      // </div>
      <AdminLoader text="Loading conversation details..." />
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
      <header className="bg-white backdrop-blur-sm shadow-sm border-b border-blue-100 sticky top-0 z-30">
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
                <p className="text-lg font-semibold text-gray-900">
                  {conversation.title || "Untitled Chat"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">User</h3>
                <p className="text-lg font-semibold text-gray-900">
                  {conversation.user?.name ||
                    conversation.user?.email ||
                    "Unknown"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Created</h3>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(conversation.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Messages</h3>
                <p className="text-lg font-semibold text-gray-900">
                  {conversation.messages?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        {/* <Card className="bg-white/80 backdrop-blur-sm">
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

              
                  {(message.id || message._id) && (
                    <div className="ml-8 space-y-2">
            
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
        </Card> */}
        <main className="flex-1 overflow-auto px-3 md:px-6 pt-3 md:pt-6 pb-[20px]">
          <div className="space-y-4 md:space-y-6" ref={containerRef}>
            {conversation.messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.sender === "user"
                    ? "justify-end"
                    : "justify-start pb-[3rem]"
                } animate-fadeIn`}
              >
                <div
                  className={`flex gap-2 md:gap-3 max-w-[85%] ${
                    msg.sender === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className={`h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.sender === "user"
                        ? "bg-gradient-to-br from-blue-500 to-purple-500 text-white"
                        : "bg-gradient-to-br from-blue-100 to-cyan-200 text-blue-700"
                    }`}
                  >
                    {msg.sender === "user" ? (
                      <FiUser className="w-4 h-4 md:w-5 md:h-5" />
                    ) : (
                      <HiOutlineFingerPrint className="w-4 h-4 md:w-5 md:h-5" />
                    )}
                  </div>
                  <div
                    className={`relative rounded-xl md:rounded-2xl px-3 py-2 md:px-4 md:py-3 shadow-sm max-w-[calc(100%-3rem)] ${
                      msg.sender === "user"
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                        : "bg-white border border-gray-100"
                    }`}
                  >
                    <div
                      className={`prose prose-xs md:prose-sm max-w-none ${
                        msg.sender === "user" ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {msg.type === "audio" ? (
                        <audio
                          controls
                          src={msg.content}
                          className="w-full mt-1"
                        />
                      ) : msg.sender === "user" ? (
                        <p className="text-sm md:text-base">{msg.text}</p>
                      ) : (
                        <MarkdownRenderer content={msg.text} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* <div ref={bottomRef} /> */}
        </main>
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