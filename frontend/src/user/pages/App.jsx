import { useState, useEffect, useRef, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FiMenu, FiThumbsUp, FiThumbsDown, FiSettings, FiList } from "react-icons/fi";
import Sidebar from "../components/Sidebar.jsx";
import EnhancedNotificationBell from "../components/EnhancedNotificationBell.jsx";
import FeedbackModal from "../components/FeedbackModal.jsx";
import PromptEditor from "../components/PromptEditor.jsx";
import TagManager from "../components/TagManager.jsx";
import { ThemeToggleButton } from "../components/ThemeToggle.jsx";
import {
  FiSend,
  FiUser,
  FiMessageSquare,
  FiEdit3,
  FiTrash2,
} from "react-icons/fi";
import { HiOutlineLightBulb, HiOutlineFingerPrint } from "react-icons/hi";
import { AuthContext } from "../context/AuthContext.jsx";
import MarkdownRenderer from "../components/MarkdownRenderer.jsx";
import { ToastProvider } from "../components/ui/toast.jsx";

// Create an axios instance pointing to your Flask backend
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

// Update the ConversationItem component to handle disabled state
const ConversationItem = ({
  conversation,
  isActive,
  onSelect,
  onDelete,
  onRename,
  disabled,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(
    conversation.title || "Untitled Chat"
  );

  const handleRename = () => {
    if (editName.trim()) {
      onRename(editName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleRename();
    } else if (e.key === "Escape") {
      setEditName(conversation.title || "Untitled Chat");
      setIsEditing(false);
    }
  };

  return (
    <div
      className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 ${
        isActive
          ? "bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 dark:from-blue-900/20 dark:to-purple-900/20 dark:border-blue-700"
          : "hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent"
      } ${disabled ? "opacity-70 pointer-events-none" : ""}`}
    >
      <div
        onClick={disabled ? undefined : onSelect}
        className="flex items-center gap-3"
      >
        <FiMessageSquare
          className={`w-4 h-4 flex-shrink-0 ${
            isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"
          }`}
        />

        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={handleKeyPress}
            className="flex-1 bg-transparent border-b border-blue-300 dark:border-blue-600 focus:outline-none text-sm dark:text-white"
            autoFocus
            disabled={disabled}
          />
        ) : (
          <div className="flex-1 min-w-0">
            <h4
              className={`text-sm font-medium truncate ${
                isActive ? "text-blue-800 dark:text-blue-200" : "text-gray-800 dark:text-gray-200"
              }`}
            >
              {conversation.title || "Untitled Chat"}
            </h4>
            {conversation.lastMessage && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                {conversation.lastMessage}
              </p>
            )}
            {conversation.timestamp && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {new Date(conversation.timestamp).toLocaleDateString()}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
          className="p-1 rounded hover:bg-white/80 dark:hover:bg-gray-700 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
          title="Rename"
          disabled={disabled}
        >
          <FiEdit3 className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm("Delete this conversation?")) {
              onDelete();
            }
          }}
          className="p-1 rounded hover:bg-white/80 dark:hover:bg-gray-700 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
          title="Delete"
          disabled={disabled}
        >
          <FiTrash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default function App() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const { id: urlChatId } = useParams(); // Extract chat ID from URL

  const [convId, setConvId] = useState(urlChatId || null);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [userRole, setUserRole] = useState("user");
  const [showTagManager, setShowTagManager] = useState(false);
  
  // Feedback and prompt modals
  const [feedbackModal, setFeedbackModal] = useState({ isOpen: false, conversationId: null, messageId: null });
  const [promptEditorOpen, setPromptEditorOpen] = useState(false);

  const audioChunksRef = useRef([]);
  const mediaRecorderRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Convert backend message format to frontend format
  const convertMessagesToHistory = (messages) => {
    return messages.map((msg) => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.text,
      timestamp: msg.timestamp,
      id: msg.id || msg._id,
    }));
  };

  // Get user role
  const getUserRole = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get("/auth/verify", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.data.user_role) {
        setUserRole(response.data.user_role);
      }
    } catch (error) {
      console.error("Error getting user role:", error);
    }
  };

  // Improve the loadChatMessages function to handle errors better
  const loadChatMessages = async (chatId) => {
    if (!chatId) return;

    try {
      setIsLoadingMessages(true);
      const token = localStorage.getItem("token");
      const response = await api.get(`/chat/conversation/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const messages = response.data.messages || [];
      const convertedHistory = convertMessagesToHistory(messages);
      setHistory(convertedHistory);
      setConvId(chatId);

      // Update localStorage
      localStorage.setItem("convId", chatId);
      localStorage.setItem("chatHistory", JSON.stringify(convertedHistory));

      // Also update the conversation title in the conversations list if needed
      if (response.data.title) {
        setConversations((prevConversations) => {
          return prevConversations.map((conv) =>
            conv.conversation_id === chatId
              ? { ...conv, title: response.data.title }
              : conv
          );
        });
      }

      return convertedHistory;
    } catch (error) {
      console.error("Error loading chat messages:", error);
      // If chat not found, redirect to new chat
      if (error.response?.status === 404) {
        navigate("/chat");
      }
      return [];
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Improve the loadConversations function to handle errors better
  const loadConversations = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No token available for loading conversations");
        return [];
      }

      const response = await api.get("/chat/history", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const conversationsData = response.data || [];
      setConversations(conversationsData);
      return conversationsData;
    } catch (error) {
      console.error("Error loading conversations:", error);
      return [];
    }
  };

  // Effect to handle URL chat ID changes
  useEffect(() => {
    if (urlChatId && urlChatId !== convId) {
      loadChatMessages(urlChatId);
    } else if (!urlChatId) {
      // If no chat ID in URL, start fresh
      setConvId(null);
      setHistory([]);
      localStorage.removeItem("convId");
      localStorage.removeItem("chatHistory");
    }
  }, [urlChatId]);

  // Load from localStorage only if no URL chat ID
  useEffect(() => {
    if (!urlChatId) {
      const savedConvId = localStorage.getItem("convId");
      const savedHistory = localStorage.getItem("chatHistory");

      if (savedConvId) setConvId(savedConvId);
      if (savedHistory) setHistory(JSON.parse(savedHistory));
    }
  }, [urlChatId]);

  // Save to localStorage when history changes
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem("chatHistory", JSON.stringify(history));
    }
  }, [history]);

  // AUTHENTICATION VERIFICATION ON MOUNT
  useEffect(() => {
    const verifyToken = async () => {
      console.log("Verifying authentication token...");
      try {
        const token = localStorage.getItem("token");
        console.log("Retrieved token in App.js:", token);
        if (!token) {
          console.warn("No token found. Redirecting to login.");
          setIsVerifying(false);
          navigate("/auth");
          return;
        }
        console.log("Token found. Verifying...");
        const res = await api.get("/auth/verify", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        });
        console.log("Token verification response from App.js:", res);
        if (res.status === 200 && res.data.success) {
          console.log("Token valid. User authenticated.");
          setIsVerifying(false);

          // Get user role
          await getUserRole();

          // Load conversations immediately after authentication
          await loadConversations();

          // If there's a chat ID in the URL, load that chat's messages
          if (urlChatId) {
            await loadChatMessages(urlChatId);
          }
        } else {
          console.warn("Token invalid. Redirecting to login.");
          setIsVerifying(false);
          navigate("/auth");
        }
      } catch (err) {
        console.error("Token verification failed:", err);
        setIsVerifying(false);
        navigate("/auth");
      }
    };
    verifyToken();
  }, [navigate, urlChatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  // Load conversations after authentication
  useEffect(() => {
    if (!isVerifying && auth.user?.token) {
      loadConversations();
    }
  }, [isVerifying, auth.user?.token]);

  // Handle new chat
  const handleNewChat = () => {
    setConvId(null);
    setHistory([]);
    setSidebarOpen(false);
    navigate("/chat"); // Navigate to base chat route
  };

  // Handle conversation selection - FIXED
  const handleSelectConversation =  async (conversationData) => {
    try {
      const conversationId = conversationData?.conversation_id;

      if (!conversationId) {
        console.error(
          "No conversation_id found in conversation data:",
          conversationData
        );
        return;
      }

      setSidebarOpen(false);

      // Immediately load messages before navigation
      await loadChatMessages(conversationId);

      // Then navigate to the specific chat route
      navigate(`/chat/${conversationId}`);
    } catch (error) {
      console.error("Error selecting conversation:", error);
    }
  };

  // Handle conversation deletion - FIXED
  const handleDeleteConversation = async (conversationId) => {
    try {
      const token = localStorage.getItem("token");
      await api.delete(`/chat/conversation/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update conversations state immediately
      setConversations((prev) =>
        prev.filter((conv) => conv.conversation_id !== conversationId)
      );

      // If current conversation is deleted, start new chat
      if (convId === conversationId) {
        handleNewChat();
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  // Handle conversation rename - FIXED
  const handleRenameConversation = async (conversationId, newName) => {
    try {
      const token = localStorage.getItem("token");
      await api.patch(
        `/chat/conversation/${conversationId}`,
        { title: newName },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update conversations state immediately
      setConversations((prev) =>
        prev.map((conv) =>
          conv.conversation_id === conversationId
            ? { ...conv, title: newName }
            : conv
        )
      );
    } catch (error) {
      console.error("Error renaming conversation:", error);
    }
  };

  // Initialize or return existing recorder
  async function initRecorder() {
    if (!mediaRecorderRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (e) => {
          audioChunksRef.current.push(e.data);
        };
        recorder.onstop = handleRecordingStop;
        mediaRecorderRef.current = recorder;
      } catch (err) {
        console.error("Microphone access denied", err);
        return null;
      }
    }
    return mediaRecorderRef.current;
  }

  // When recording stops, send the audio
  function handleRecordingStop() {
    const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
    sendAudioMessage(blob);
  }

  // Send audio blob to backend via /chat
  async function sendAudioMessage(blob) {
    const tempUrl = URL.createObjectURL(blob);
    setHistory((prev) => [
      ...prev,
      { role: "user", type: "audio", content: tempUrl },
    ]);

    const form = new FormData();
    form.append("audio", blob, "recording.webm");
    form.append("conversation_id", convId);

    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const { data } = await api.post("/chat", form, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      const newConvId = data.conversation_id;

      // Reload messages and conversations
      if (newConvId) {
        await loadChatMessages(newConvId);
        await loadConversations(); // Refresh conversations list
        if (!convId) {
          navigate(`/chat/${newConvId}`);
        }
      }
    } catch (err) {
      console.error("Error sending audio:", err);
      setHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, there was an error sending your audio message.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  // Send text message - FIXED
  async function sendMessage(e) {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    try {
      setIsLoading(true);

      // Append user's message to UI immediately
      const newUserMessage = { role: "user", content: message };
      setHistory((prev) => [...prev, newUserMessage]);
      setMessage("");
      setTimeout(() => inputRef.current?.focus(), 0);

      const token = localStorage.getItem("token");
      console.log("Token being sent IN SEND MESSAGE:", token);

      const payload = convId
        ? { message, conversation_id: convId }
        : { message };

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };

      const { data } = await api.post("/chat", payload, config);

      const newConvId = data.conversation_id;

      // Reload messages and conversations
      if (newConvId) {
        await loadChatMessages(newConvId);
        await loadConversations(); // Refresh conversations list

        // Redirect to dynamic route if this was a new conversation
        if (!convId) {
          navigate(`/chat/${newConvId}`);
        }
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I encountered an error processing your request. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  // Handle feedback
  const handleFeedback = (messageId, type) => {
    if (type === "positive") {
      setFeedbackModal({
        isOpen: true,
        conversationId: convId,
        messageId: messageId,
      });
    } else {
      // For negative feedback, open with a default low rating
      setFeedbackModal({
        isOpen: true,
        conversationId: convId,
        messageId: messageId,
      });
    }
  };

  if (isVerifying) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-lg text-foreground">Verifying authentication...</div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="flex flex-col h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-br from-purple-200/30 to-blue-200/30 dark:from-purple-800/20 dark:to-blue-800/20 blur-3xl"></div>
          <div className="absolute top-1/3 -left-24 w-80 h-80 rounded-full bg-gradient-to-tr from-cyan-200/30 to-blue-300/30 dark:from-cyan-800/20 dark:to-blue-700/20 blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-gradient-to-r from-purple-200/20 to-pink-200/20 dark:from-purple-800/10 dark:to-pink-800/10 blur-3xl"></div>
        </div>

        {/* Header */}
        <header className="py-2 px-4 md:py-4 md:px-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-sm border-b border-blue-100 dark:border-gray-700 sticky top-0 z-30 flex-shrink-0">
          <div className="flex items-center justify-between">
            {/* Left: Hamburger + Branding */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                  sidebarOpen ? "lg:hidden" : ""
                }`}
              >
                <FiMenu className="w-5 h-5 text-foreground" />
              </button>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-1 md:gap-2">
                <HiOutlineFingerPrint className="w-6 h-6 md:w-7 md:h-7 text-blue-600 dark:text-blue-400" />
                <span>FingerTips</span>
              </h1>
            </div>

            {/* Right: Theme Toggle + Tag Manager + Prompt Editor + Notifications + Admin + Logout */}
            <div className="flex items-center gap-3">
              {/* <ThemeToggleButton /> */}
              
              {/* Tag Manager Button - Only show for admin and reviewers */}
              {(userRole === "admin" || userRole === "reviewer") && convId && (
                <button
                  onClick={() => setShowTagManager(!showTagManager)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  title="Tag Manager"
                >
                  <FiTag className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              )}

              {/* Prompt Editor Button - Only show for power users and admins */}
              {(userRole === "power_user" || userRole === "admin") && (
                <button
                  onClick={() => navigate("/prompts")}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  title="Prompt Management"
                >
                  <FiSettings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              )}

              <EnhancedNotificationBell />
              
              {/* Admin Panel Button - Only show for admin users */}
              {(userRole === "admin" || userRole === "reviewer") && (
                <button
                  onClick={() => navigate("/admin")}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  title="Admin Panel"
                >
                  <FiSettings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              )}

              <button
                onClick={async () => {
                  try {
                    const response = await api.post(
                      "/auth/logout",
                      {},
                      {
                        headers: {
                          Authorization: `Bearer ${auth.user?.token}`,
                        },
                      }
                    );
                    if (response.status === 200) {
                      auth.logout?.();
                      localStorage.removeItem("token");
                      localStorage.removeItem("convId");
                      localStorage.removeItem("chatHistory");
                      navigate("/auth");
                    } else {
                      console.error("Logout failed with status:", response.status);
                    }
                  } catch (err) {
                    console.error("Logout error:", err);
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-medium shadow hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Main layout container */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Sidebar - FIXED: Pass conversations as props */}
          <Sidebar
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            conversations={conversations}
            currentConvId={convId}
            onSelectConversation={handleSelectConversation}
            onNewChat={handleNewChat}
            onDeleteConversation={handleDeleteConversation}
            onRenameConversation={handleRenameConversation}
            ConversationItem={ConversationItem}
          />

          {/* Main content area */}
          <div
            className={`flex flex-col flex-1 overflow-hidden relative transition-all duration-300 ${
              sidebarOpen ? "lg:ml-0" : "lg:ml-0"
            }`}
          >
            {/* Tag Manager Panel */}
            {showTagManager && (userRole === "admin" || userRole === "reviewer") && (
              <div className="absolute right-3 md:right-6 top-2 w-[calc(100%-24px)] sm:w-80 z-20">
                <TagManager
                  conversationId={convId}
                  onTagsChange={(tags) => console.log("Tags updated:", tags)}
                />
              </div>
            )}

            {/* Info panel */}
            {showInfo && (
              <div className="absolute right-3 md:right-6 top-2 w-[calc(100%-24px)] sm:w-80 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-blue-100 dark:border-gray-700 rounded-xl shadow-lg p-4 z-20 animate-fadeIn">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200">
                    About FingerTips
                  </h3>
                  <button
                    onClick={() => setShowInfo(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  FingerTips provides instant, pathway-based answers to your
                  clinical queries, putting medical knowledge at your FingerTips.
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-400">Version 1.0.0</div>
              </div>
            )}

            {/* Chat content */}
            <main className="flex-1 overflow-hidden px-3 md:px-6 pt-3 md:pt-6 pb-[20px]">
              <div className="h-full overflow-y-auto rounded-xl md:rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border border-gray-200 dark:border-gray-700 p-3 md:p-6">
                {isLoadingMessages ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-3 md:p-6 text-gray-500 dark:text-gray-400">
                    <div className="flex space-x-2 items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-300 animate-bounce"></div>
                      <div className="w-3 h-3 rounded-full bg-purple-300 animate-bounce"></div>
                      <div className="w-3 h-3 rounded-full bg-cyan-300 animate-bounce"></div>
                    </div>
                    <p className="mt-4">Loading messages...</p>
                  </div>
                ) : history.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-3 md:p-6 text-gray-500 dark:text-gray-400">
                    <HiOutlineLightBulb className="w-12 h-12 text-blue-500 dark:text-blue-400 mb-4" />
                    <h3 className="text-lg md:text-xl font-medium text-gray-800 dark:text-gray-200 mb-2">
                      Welcome to FingerTips
                    </h3>
                    <p className="max-w-md text-gray-500 dark:text-gray-400 mb-4 text-sm">
                      Ask any medical or clinical question to get pathway-based
                      answers at your fingertips.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 md:space-y-6">
                    {history.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${
                          msg.role === "user" ? "justify-end" : "justify-start"
                        } animate-fadeIn`}
                      >
                        <div
                          className={`flex gap-2 md:gap-3 max-w-[85%] ${
                            msg.role === "user" ? "flex-row-reverse" : ""
                          }`}
                        >
                          <div
                            className={`h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              msg.role === "user"
                                ? "bg-gradient-to-br from-blue-500 to-purple-500 text-white"
                                : "bg-gradient-to-br from-blue-100 to-cyan-200 dark:from-blue-800 dark:to-cyan-700 text-blue-700 dark:text-blue-200"
                            }`}
                          >
                            {msg.role === "user" ? (
                              <FiUser className="w-4 h-4 md:w-5 md:h-5" />
                            ) : (
                              <HiOutlineFingerPrint className="w-4 h-4 md:w-5 md:h-5" />
                            )}
                          </div>
                          <div
                            className={`rounded-xl md:rounded-2xl px-3 py-2 md:px-4 md:py-3 shadow-sm ${
                              msg.role === "user"
                                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                                : "bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600"
                            }`}
                          >
                            <div
                              className={`prose prose-xs md:prose-sm max-w-none ${
                                msg.role === "user"
                                  ? "text-white"
                                  : "text-gray-800 dark:text-gray-200"
                              }`}
                            >
                              {msg.type === "audio" ? (
                                <audio
                                  controls
                                  src={msg.content}
                                  className="w-full mt-1"
                                />
                              ) : msg.role === "user" ? (
                                <p className="text-sm md:text-base">
                                  {msg.content}
                                </p>
                              ) : (
                                <MarkdownRenderer content={msg.content} />
                              )}
                            </div>
                            
                            {/* Feedback buttons for assistant messages */}
                            {msg.role === "assistant" && msg.id && (
                              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-100 dark:border-gray-600">
                                <button
                                  onClick={() => handleFeedback(msg.id, "positive")}
                                  className="p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/20 text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                                  title="Good response"
                                >
                                  <FiThumbsUp className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleFeedback(msg.id, "negative")}
                                  className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                  title="Poor response"
                                >
                                  <FiThumbsDown className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start animate-fadeIn">
                        <div className="flex gap-2 md:gap-3 max-w-[85%]">
                          <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-gradient-to-br from-blue-100 to-cyan-200 dark:from-blue-800 dark:to-cyan-700 text-blue-700 dark:text-blue-200 flex items-center justify-center">
                            <HiOutlineFingerPrint className="w-4 h-4 md:w-5 md:h-5" />
                          </div>
                          <div className="rounded-xl px-4 py-2 bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 shadow-sm">
                            <div className="flex space-x-2 items-center h-4 md:h-5">
                              <div className="w-2 h-2 rounded-full bg-blue-300 animate-bounce"></div>
                              <div className="w-2 h-2 rounded-full bg-purple-300 animate-bounce"></div>
                              <div className="w-2 h-2 rounded-full bg-cyan-300 animate-bounce"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>
            </main>

            {/* Fixed input area */}
            <div className="flex-shrink-0 bg-gradient-to-t from-blue-50/90 to-blue-50/70 dark:from-gray-800/90 dark:to-gray-800/70 backdrop-blur-sm py-2 md:py-3">
              <div className="px-3 md:px-6">
                <div className="relative rounded-xl md:rounded-2xl shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-blue-100 dark:border-gray-600 p-1.5 md:p-2">
                  <form onSubmit={sendMessage} className="relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your clinical question..."
                      className="w-full px-3 py-3 md:px-4 md:py-4 pr-12 md:pr-16 bg-transparent rounded-lg md:rounded-xl focus:outline-none transition-all text-sm md:text-base text-foreground placeholder:text-muted-foreground"
                      disabled={isLoading || isRecording || isLoadingMessages}
                    />
                    <div className="absolute right-1.5 md:right-2 top-1/2 -translate-y-1/2 flex items-center">
                      <button
                        type="submit"
                        disabled={isLoading || isLoadingMessages}
                        className="p-2 md:p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md hover:shadow-lg transform hover:scale-105 rounded-full transition-all duration-200"
                        aria-label="Send text message"
                      >
                        <FiSend className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                    </div>
                  </form>
                  <p className="text-[10px] md:text-xs text-center mt-1 md:mt-2 text-gray-500 dark:text-gray-400">
                    FingerTips provides medical information but is not a
                    substitute for professional medical advice.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        <FeedbackModal
          isOpen={feedbackModal.isOpen}
          onClose={() => setFeedbackModal({ isOpen: false, conversationId: null, messageId: null })}
          conversationId={feedbackModal.conversationId}
          messageId={feedbackModal.messageId}
        />
      </div>
    </ToastProvider>
  );
}