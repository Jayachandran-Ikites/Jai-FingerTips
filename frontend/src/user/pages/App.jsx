import { useState, useEffect, useRef, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiMenu,
  FiThumbsUp,
  FiThumbsDown,
  FiSettings,
  FiList,
} from "react-icons/fi";
import Sidebar from "../components/Sidebar.jsx";
import NotificationBell from "../components/NotificationBell.jsx";
import PromptEditor from "../components/PromptEditor.jsx";

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
import AuthVerificationLoader from "../components/loaders/auth-verification-loader.jsx";
import { Toaster } from "react-hot-toast";
import Header from "../components/chat/Header.jsx";
import ChatInterface from "../components/chat/ChatInterface.jsx";
import InputArea from "../components/chat/InputArea.jsx";
import FeedbackModal from "../components/chat/FeedbackModal.jsx";
import { ToastProvider } from "../components/ui/toast.jsx";

// Create an axios instance pointing to your Flask backend
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

export default function App() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const { id: urlChatId } = useParams(); // Extract chat ID from URL
  const [userRole, setUserRole] = useState("user"); // Default to 'user'
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
  const [conversationsLoaded, setConversationsLoaded] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState({
    isOpen: false,
    conversationId: null,
    messageId: null,
  });

  const [promptEditorOpen, setPromptEditorOpen] = useState(false);

  const audioChunksRef = useRef([]);
  const mediaRecorderRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const [dummyQA, setDummyQA] = useState([
    {
      role: "user",
      content: "What are the symptoms of diabetes?",
      timestamp: "Wed, 11 Jun 2025 22:00:00 GMT",
    },
    {
      role: "user",
      content: "How to cure viral fever ?",
      timestamp: "Wed, 11 Jun 2025 22:00:00 GMT",
    },
    {
      role: "user",
      content: "How to treat a mild fever?",
      timestamp: "Wed, 11 Jun 2025 22:02:00 GMT",
    },
    {
      role: "user",
      content: "How to prevent cough and cold in winters ?",
      timestamp: "Wed, 11 Jun 2025 22:02:00 GMT",
    },
    {
      role: "user",
      content: "Provide prevention of  stroke.",
      timestamp: "Wed, 11 Jun 2025 22:02:00 GMT",
    },
    {
      role: "user",
      content: "How to cure pneumonia?",
      timestamp: "Wed, 11 Jun 2025 22:02:00 GMT",
    },
  ]);

  console.log(history);

  // Convert backend message format to frontend format
  // TODO
  const convertMessagesToHistory = (messages) => {
    return messages.map((msg) => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.text,
      timestamp: msg.timestamp,
      id: msg.id || msg._id,
      sources: msg.sender == "bot" ? msg.sources : [],
    }));
  };

  // Improve the loadChatMessages function to handle errors better
  const loadChatMessages = async (chatId) => {
    if (!chatId || isLoadingMessages) return;

    try {
      setIsLoadingMessages(true);
      const token = localStorage.getItem("token");
      const response = await api.get(`/chat/conversation/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("***TEST***");
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
    if (conversationsLoaded) return conversations;

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
      setConversationsLoaded(true);
      return conversationsData;
    } catch (error) {
      console.error("Error loading conversations:", error);
      return [];
    }
  };

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
          auth?.setUserId(res?.data?.user_id);
          if (res.data.user_role) {
            setUserRole(res.data.user_role);
          } else {
            console.error("Error getting user role:", error);
          }
          // Load conversations immediately after authentication
          await loadConversations();

          // If there's a chat ID in the URL, load that chat's messages
          if (urlChatId) {
            await loadChatMessages(urlChatId);
          } else {
            // Load from localStorage only if no URL chat ID
            const savedConvId = localStorage.getItem("convId");
            const savedHistory = localStorage.getItem("chatHistory");

            if (savedConvId) setConvId(savedConvId);
            if (savedHistory) setHistory(JSON.parse(savedHistory));
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

  // Effect to handle URL chat ID changes (only after authentication)
  useEffect(() => {
    if (!isVerifying && urlChatId && urlChatId !== convId) {
      loadChatMessages(urlChatId);
    } else if (!isVerifying && !urlChatId) {
      // If no chat ID in URL, start fresh
      setConvId(null);
      setHistory([]);
      localStorage.removeItem("convId");
      localStorage.removeItem("chatHistory");
    }
  }, [urlChatId, isVerifying, convId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  // Handle new chat
  const handleNewChat = () => {
    setConvId(null);
    setHistory([]);
    setSidebarOpen(false);
    setConversationsLoaded(false); // Reset to allow refresh
    navigate("/chat"); // Navigate to base chat route
  };

  // Handle conversation selection - FIXED
  const handleSelectConversation = async (conversationData) => {
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

      // Navigate first, let the useEffect handle loading
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
      setConversationsLoaded(false); // Reset to allow refresh

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
      setConversationsLoaded(false); // Reset to allow refresh
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

  // Handle mic button click: start/stop recording
  // async function handleMicClick() {
  //   const recorder = await initRecorder()
  //   if (!recorder) return

  //   if (!isRecording) {
  //     audioChunksRef.current = []
  //     recorder.start()
  //     setIsRecording(true)
  //   } else {
  //     recorder.stop()
  //     setIsRecording(false)
  //   }
  // }

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
        setConversationsLoaded(false); // Reset to allow refresh
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
        setConversationsLoaded(false); // Reset to allow refresh
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

  if (isVerifying) {
    return <AuthVerificationLoader />;
  }

  console.log("history", history);
  return (
    <>
      <ToastProvider>
        <Toaster position="top-right" reverseOrder={false} />
        <div className="flex flex-col h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-br from-purple-200/30 to-blue-200/30 blur-3xl"></div>
            <div className="absolute top-1/3 -left-24 w-80 h-80 rounded-full bg-gradient-to-tr from-cyan-200/30 to-blue-300/30 blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-gradient-to-r from-purple-200/20 to-pink-200/20 blur-3xl"></div>
          </div>

          {/* Header */}
          <Header
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            auth={auth}
            navigate={navigate}
            userRole={userRole}
          />

          {/* Main layout container */}
          <div className="flex flex-1 overflow-hidden relative">
            {/* Sidebar */}
            <Sidebar
              isOpen={sidebarOpen}
              onToggle={() => setSidebarOpen(!sidebarOpen)}
              conversations={conversations}
              currentConvId={convId}
              onSelectConversation={handleSelectConversation}
              onNewChat={handleNewChat}
              onDeleteConversation={handleDeleteConversation}
              onRenameConversation={handleRenameConversation}
            />

            {/* Main content area */}
            <div
              className={`flex flex-col flex-1 overflow-hidden relative transition-all duration-300 ${
                sidebarOpen ? "lg:ml-0" : "lg:ml-0"
              }`}
            >
              {/* Info panel */}
              {showInfo && (
                <div className="absolute right-3 md:right-6 top-2 w-[calc(100%-24px)] sm:w-80 bg-white/90 backdrop-blur-sm border border-blue-100 rounded-xl shadow-lg p-4 z-20 animate-fadeIn">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-blue-800">
                      About FingerTips
                    </h3>
                    <button
                      onClick={() => setShowInfo(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    FingerTips provides instant, pathway-based answers to your
                    clinical queries, putting medical knowledge at your
                    FingerTips.
                  </p>
                  <div className="text-xs text-gray-500">Version 1.0.0</div>
                </div>
              )}

              {/* Chat Interface */}
              <ChatInterface
                history={history}
                isLoading={isLoading}
                isLoadingMessages={isLoadingMessages}
                dummyQA={dummyQA}
                convId={convId}
                feedbackModal={feedbackModal}
                setFeedbackModal={setFeedbackModal}
                bottomRef={bottomRef}
                inputValue={message}
                setInputValue={setMessage}
              />

              {/* Input Area */}
              <InputArea
                message={message}
                setMessage={setMessage}
                sendMessage={sendMessage}
                isLoading={isLoading}
                isLoadingMessages={isLoadingMessages}
              />
            </div>
          </div>

          {/* Feedback Modal */}
          {/* <FeedbackModal
          open={feedbackModal.open}
          onClose={() => setFeedbackModal({ open: false, msgIndex: null })}
          onSubmit={handleFeedbackSubmit}
          rating={feedback.rating}
          setRating={(r) => setFeedback((f) => ({ ...f, rating: r }))}
          text={feedback.text}
          setText={(t) => setFeedback((f) => ({ ...f, text: t }))}
        /> */}
          <FeedbackModal
            isOpen={feedbackModal.isOpen}
            onClose={() =>
              setFeedbackModal({
                isOpen: false,
                conversationId: null,
                messageId: null,
              })
            }
            conversationId={feedbackModal.conversationId}
            messageId={feedbackModal.messageId}
          />
        </div>
      </ToastProvider>
    </>
  );
}
