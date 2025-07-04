import { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../../user/context/AuthContext.jsx";
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
  FiMenu,
  FiActivity,
  FiList,
  FiChevronRight,
  FiChevronLeft,
  FiCheck,
  FiX,
  FiSend,
  FiCalendar,
  FiMessageCircle,
  FiChevronDown,
} from "react-icons/fi";
import { HiOutlineFingerPrint } from "react-icons/hi";
import { Button } from "../../user/components/ui/button";
import { Input } from "../../user/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../user/components/ui/card";
import { Badge } from "../../user/components/ui/badge";
import { Textarea } from "../../user/components/ui/textarea";
import { ToastProvider, useToast } from "../../user/components/ui/toast";
import MarkdownRenderer from "../../user/components/MarkdownRenderer.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../user/components/ui/select";
import AdminLoader from "../components/AdminLoader.jsx";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

const ReviewerDashboardContent = () => {
  const { token, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [reviewForm, setReviewForm] = useState({
    messageId: "",
    comment: "",
    rating: 0,
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [feedback, setFeedback] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeTab, setActiveTab] = useState("conversations");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [expandedFeedback, setExpandedFeedback] = useState({});
  const [expandedReviews, setExpandedReviews] = useState({});
  const modalRef = useRef(null);
  const bottomRef = useRef(null);

  // New filter states
  const [userFilter, setUserFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!token) {
      navigate("/auth");
      return;
    }

    loadConversations();
    loadUsers();
  }, [token, navigate]);

  useEffect(() => {
    // Close modal when clicking outside
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowReviewModal(false);
      }
    }

    if (showReviewModal) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showReviewModal]);

  useEffect(() => {
    // Scroll to bottom when new messages are loaded
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedConversation]);

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get("/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 100 }, // Get a large number of users for filtering
      });
      setUsers(response.data.users || []);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const loadConversations = async (page = 1, filters = {}) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Build query parameters
      const params = {
        page,
        limit: 20,
        search: searchTerm,
        ...filters,
      };

      // Add user_id filter if specified
      if (userFilter) {
        params.user_id = userFilter;
      }

      // Add date filter if specified
      if (dateFilter) {
        params.date = dateFilter;
      }

      const response = await api.get("/admin/conversations", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setConversations(response.data.conversations);
      setTotalPages(response.data.pages);
      setCurrentPage(page);
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

  const viewConversationDetails = async (conversationId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get(`/admin/conversations/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedConversation(response.data);

      // Load feedback for this conversation
      loadConversationFeedback(conversationId);

      // Load reviews for this conversation
      loadConversationReviews(conversationId);

      // Reset review form
      setReviewForm({
        messageId: "",
        comment: "",
        rating: 0,
      });
      setShowReviewModal(false);
    } catch (error) {
      console.error("Error loading conversation details:", error);
      toast.error("Failed to load conversation details");
    }
  };

  const loadConversationFeedback = async (conversationId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get(`/feedback/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFeedback(response.data.feedback || []);
    } catch (error) {
      console.error("Error loading conversation feedback:", error);
      setFeedback([]);
    }
  };

  const loadConversationReviews = async (conversationId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get(
        `/reviews/conversation/${conversationId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setReviews(response.data.reviews || []);
    } catch (error) {
      console.error("Error loading conversation reviews:", error);
      setReviews([]);
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
      
      // Check if review already exists for this message
      const existingReview = reviews.find(r => r.message_id === reviewForm.messageId);
      
      if (existingReview) {
        // Update existing review
        await api.put(
          `/reviews/${existingReview._id}`,
          {
            comment: reviewForm.comment,
            rating: reviewForm.rating || null,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        toast.success("Review updated successfully");
      } else {
        // Create new review
        await api.post(
          "/reviews",
          {
            conversation_id: selectedConversation._id,
            message_id: reviewForm.messageId,
            comment: reviewForm.comment,
            rating: reviewForm.rating || null,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        toast.success("Review submitted successfully");
      }
      
      setReviewForm({ messageId: "", comment: "", rating: 0 });
      setShowReviewModal(false);

      // Reload reviews
      loadConversationReviews(selectedConversation._id);
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review");
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadConversations(1, { search: searchTerm });
  };

  useEffect(() => {
    // Load conversations when user or date filter changes
    loadConversations(1, { user : userFilter});
  }, [userFilter]);

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

  const toggleFeedbackExpand = (messageId) => {
    setExpandedFeedback(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  const toggleReviewsExpand = (messageId) => {
    setExpandedReviews(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  const openReviewModal = (messageId) => {
    // Check if there's an existing review for this message
    const existingReview = reviews.find(r => r.message_id === messageId);
    
    if (existingReview) {
      // Pre-fill form with existing review data
      setReviewForm({
        messageId,
        comment: existingReview.comment || "",
        rating: existingReview.rating || 0,
      });
    } else {
      // Reset form for new review
      setReviewForm({
        messageId,
        comment: "",
        rating: 0,
      });
    }
    
    setShowReviewModal(true);
  };

  if (loading && !selectedConversation) {
    return <AdminLoader text="Loading reviewer dashboard..." />;
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
        <div className="p-4 border-b border-blue-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HiOutlineFingerPrint className="w-8 h-8 text-blue-600" />
            {sidebarOpen && (
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Reviewer Panel
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
              icon={FiMessageSquare}
              label="Conversations"
              isActive={activeTab === "conversations"}
              onClick={() => setActiveTab("conversations")}
              expanded={sidebarOpen}
            />
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
                  Reviewer Dashboard
                </h1>
                <p className="text-sm text-gray-600">
                  Review and comment on conversations
                </p>
              </div>

              <div className="border-b border-blue-100 px-6 py-3">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <FiFilter className="text-gray-500" />
                    <span className="text-sm text-gray-600">Filters:</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select
                      value={userFilter}
                      onValueChange={(value) => {
                        setUserFilter(value);
                      }}
                    >
                      <SelectTrigger className="w-48 h-9 gap-5 px-10 bg-[#fefeff]">
                        <SelectValue placeholder="Filter by user">
                          {userFilter
                            ? users.find((u) => u._id === userFilter)?.name ||
                              users.find((u) => u._id === userFilter)?.email
                            : null}
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
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex h-[calc(100vh-145px)]">
          {/* Conversations List */}
          <div className="w-1/3 border-r border-blue-100 overflow-y-auto ">
            <div className="p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Conversations
              </h2>

              <div className="space-y-2 ">
                {conversations.map((conv) => (
                  <div
                    key={conv._id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedConversation?._id === conv._id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white"
                    }`}
                    onClick={() => viewConversationDetails(conv._id)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-800 truncate">
                        {conv.title || "Untitled Chat"}
                      </h3>
                      <Badge variant="secondary">
                        {conv.message_count} messages
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <FiUser className="w-3 h-3" />
                        {conv.user.name || "Unknown"}
                      </div>
                      <div className="flex items-center gap-1">
                        <FiClock className="w-3 h-3" />
                        {new Date(conv.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {loading ? (
                <>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          loadConversations(currentPage - 1, {
                            user_id: userFilter,
                            date: dateFilter,
                          })
                        }
                        disabled={currentPage === 1}
                      >
                        <FiChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          loadConversations(currentPage + 1, {
                            user_id: userFilter,
                            date: dateFilter,
                          })
                        }
                        disabled={currentPage === totalPages}
                      >
                        <FiChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}{" "}
                </>
              ) : (
                <></>
              )}
            </div>
          </div>

          {/* Conversation Details */}
          <div className="w-2/3 overflow-y-auto">
            {selectedConversation ? (
              <div className="p-4 ">
                {/* Conversation Info */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    {selectedConversation.title || "Untitled Chat"}
                  </h2>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">User:</span>
                      <p className="font-medium">
                        {selectedConversation.user.email}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Messages:</span>
                      <p className="font-medium">
                        {selectedConversation.messages?.length || 0}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Created:</span>
                      <p className="font-medium">
                        {new Date(
                          selectedConversation.created_at
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Updated:</span>
                      <p className="font-medium">
                        {new Date(
                          selectedConversation.updated_at
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Messages
                </h3>
                <div className="space-y-6">
                  {selectedConversation.messages?.map((message, index) => (
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

                          {/* Feedback and Review Buttons for Assistant Messages */}
                          {message.sender === "bot" && (
                            <div className="mt-2 flex justify-between">
                              <div className="flex gap-2">
                                {getFeedbackForMessage(
                                  message.id || `msg-${index}`
                                ).length > 0 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleFeedbackExpand(
                                        message.id || `msg-${index}`
                                      );
                                    }}
                                    className="flex items-center gap-1 bg-[#fefeff]"
                                  >
                                    <FiMessageCircle className="w-3 h-3 mr-1" />
                                    Feedback
                                    <FiChevronDown
                                      className={`w-3 h-3 ml-1 transition-transform ${
                                        expandedFeedback[
                                          message.id || `msg-${index}`
                                        ]
                                          ? "rotate-180"
                                          : ""
                                      }`}
                                    />
                                  </Button>
                                )}

                                {getReviewsForMessage(
                                  message.id || `msg-${index}`
                                ).length > 0 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleReviewsExpand(
                                        message.id || `msg-${index}`
                                      );
                                    }}
                                    className="flex items-center gap-1 bg-[#fefeff]"
                                  >
                                    <FiEdit3 className="w-3 h-3 mr-1" />
                                    Reviews
                                    <FiChevronDown
                                      className={`w-3 h-3  ml-1 transition-transform ${
                                        expandedReviews[
                                          message.id || `msg-${index}`
                                        ]
                                          ? "rotate-180"
                                          : ""
                                      }`}
                                    />
                                  </Button>
                                )}
                              </div>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openReviewModal(message.id || `msg-${index}`);
                                }}
                                className="flex items-center gap-1 bg-[#fefeff]"
                              >
                                <FiEdit3 className="w-3 h-3 mr-1 " />
                                {getReviewsForMessage(
                                  message.id || `msg-${index}`
                                ).length > 0
                                  ? "Edit Review"
                                  : "Add Review"}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Feedback and Reviews for this message */}
                      {(message.id || message._id) && (
                        <div className="w-[80%] space-y-2">
                          {/* User Feedback */}
                          {expandedFeedback[message.id || `msg-${index}`] &&
                            getFeedbackForMessage(
                              message.id || message._id
                            ).map((item, idx) => (
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
                            ))}

                          {/* Reviewer Comments */}
                          {expandedReviews[message.id || `msg-${index}`] &&
                            getReviewsForMessage(message.id || message._id).map(
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
                                      {new Date(
                                        item.created_at
                                      ).toLocaleString()}
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
                  <div ref={bottomRef} />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <FiMessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a conversation to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            ref={modalRef}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fadeIn"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                {getReviewsForMessage(reviewForm.messageId).length > 0
                  ? "Edit Review"
                  : "Add Review"}
              </h2>
              <button
                onClick={() => setShowReviewModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-6">
              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Rating (optional)
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        setReviewForm((prev) => ({
                          ...prev,
                          rating: star,
                        }))
                      }
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

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comment
                </label>
                <Textarea
                  value={reviewForm.comment}
                  onChange={(e) =>
                    setReviewForm((prev) => ({
                      ...prev,
                      comment: e.target.value,
                    }))
                  }
                  placeholder="Enter your review comment..."
                  rows={4}
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1"
                >
                  <FiX className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit" variant="gradient" className="flex-1">
                  <FiSend className="w-4 h-4 mr-2" />
                  {getReviewsForMessage(reviewForm.messageId).length > 0
                    ? "Update Review"
                    : "Submit Review"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Navigation Item Component
const NavItem = ({
  icon: Icon,
  label,
  isActive,
  onClick,
  expanded,
  className = "",
}) => {
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
      {expanded && <span className="ml-3 text-sm font-medium">{label}</span>}
    </button>
  );
};

// Main component that wraps the content with ToastProvider
const ReviewerDashboard = () => {
  return (
    <ToastProvider>
      <ReviewerDashboardContent />
    </ToastProvider>
  );
};

export default ReviewerDashboard;