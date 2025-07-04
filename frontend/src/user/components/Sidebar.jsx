"use client";
import { useState } from "react";
import { FiMessageSquare, FiPlus, FiTrash2, FiEdit3 } from "react-icons/fi";
import { toast } from "react-hot-toast";

const Sidebar = ({
  isOpen,
  onToggle,
  conversations, // Now received as props from parent
  currentConvId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
}) => {
  // Add loading state for better UX
  const [isLoading, setIsLoading] = useState(false);

  const handleConversationClick = async (conv) => {
    console.log("Clicked conversation:", conv);
    setIsLoading(true);
    const conversationId = conv?.conversation_id;

    if (!conversationId) {
      console.error("Invalid conversation: no conversation_id present", conv);
      setIsLoading(false);
      return;
    }

    try {
      // Pass the entire conversation object to parent
      await onSelectConversation(conv);
    } catch (error) {
      console.error("Error selecting conversation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      <div
        className={`
          fixed lg:relative left-0 top-0 h-full bg-white/95 backdrop-blur-sm border-r border-blue-100
          shadow-xl z-50 transform transition-all duration-300 ease-in-out flex flex-col
          ${
            isOpen
              ? "translate-x-0 w-80"
              : "-translate-x-full lg:translate-x-0 lg:w-16"
          }
        `}
      >
        {isOpen && (
          <div
            onClick={onToggle}
            className="h-[35px] w-[35px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-gray-600 hover:bg-gray-100 transition-colors absolute top-3 flex items-center justify-center rounded-tl-[50%] rounded-bl-[50%] right-0"
            title="Collapse sidebar"
          >
            <span className="text-lg text-white">←</span>
          </div>
        )}
        <div className="flex justify-end p-2 lg:hidden">
          <button
            onClick={onToggle}
            className="p-1 rounded-lg hover:bg-gray-100"
          >
            ✕
          </button>
        </div>
        {!isOpen && (
          <div className="hidden lg:flex flex-col items-center py-4 space-y-4 mt-[1.6rem]">
            <div
              onClick={onToggle}
              className="h-[35px] w-[35px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-gray-600 hover:bg-gray-100 transition-colors absolute top-3 flex items-center justify-center rounded-tr-[50%] rounded-br-[50%] left-0"
              title="Expand sidebar"
            >
              <span className="text-lg text-white">→</span>
            </div>
            <button
              onClick={onNewChat}
              className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
              title="New Chat"
              disabled={isLoading}
            >
              <FiPlus className="w-5 h-5" />
            </button>

            <div className="flex-1 overflow-y-auto w-full px-2">
              <div className="space-y-2">
                {conversations && conversations.length > 0 ? (
                  conversations.slice(0, 5).map((conv, index) => (
                    <button
                      key={conv.conversation_id || `conv-${index}`}
                      onClick={() => handleConversationClick(conv)}
                      className={`w-full p-2 rounded-lg transition-all duration-200 ${
                        conv.conversation_id === currentConvId
                          ? "bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200"
                          : "hover:bg-gray-50"
                      }`}
                      title={conv.title || "Untitled Chat"}
                      disabled={isLoading}
                    >
                      <FiMessageSquare
                        className={`w-4 h-4 mx-auto ${
                          conv.conversation_id === currentConvId
                            ? "text-blue-600"
                            : "text-gray-400"
                        }`}
                      />
                    </button>
                  ))
                ) : (
                  <div className="py-2 flex justify-center">
                    <div className="w-4 h-4 rounded-full bg-gray-200 animate-pulse"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {isOpen && (
          <>
            <div className="p-4 flex-shrink-0 lg:mt-[2.7rem]">
              <button
                onClick={onNewChat}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
                disabled={isLoading}
              >
                <FiPlus className="w-5 h-5" />
                <span className="font-medium">New Chat</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <div className="space-y-2">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 rounded-full bg-blue-300 animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-purple-300 animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-cyan-300 animate-bounce"></div>
                    </div>
                  </div>
                ) : !conversations || conversations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FiMessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No conversations yet</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <ConversationItem
                      key={conv.conversation_id}
                      conversation={conv}
                      isActive={conv.conversation_id === currentConvId}
                      onSelect={() => handleConversationClick(conv)}
                      onDelete={() =>
                        onDeleteConversation(conv.conversation_id)
                      }
                      onRename={(newName) =>
                        onRenameConversation(conv.conversation_id, newName)
                      }
                      disabled={isLoading}
                    />
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

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
          ? "bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200"
          : "hover:bg-gray-50 border border-transparent"
      }`}
    >
      <div onClick={onSelect} className="flex items-center gap-3">
        <FiMessageSquare
          className={`w-4 h-4 flex-shrink-0 ${
            isActive ? "text-blue-600" : "text-gray-400"
          }`}
        />

        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={handleKeyPress}
            className="flex-1 bg-transparent border-b border-blue-300 focus:outline-none text-sm"
            autoFocus
            disabled={disabled}
          />
        ) : (
          <div className="flex-1 min-w-0">
            <h4
              className={`text-sm font-medium truncate ${
                isActive ? "text-blue-800" : "text-gray-800"
              }`}
            >
              {conversation.title || "Untitled Chat"}
            </h4>
            {conversation.lastMessage && (
              <p className="text-xs text-gray-500 truncate mt-1">
                {conversation.lastMessage}
              </p>
            )}
            {conversation.timestamp && (
              <p className="text-xs text-gray-400 mt-1">
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
            console.log("Trash button clicked"); // Debugging log
            toast.custom((t) => {
              return (
                <div
                  className="fixed top-[4rem] left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white shadow-lg rounded-lg p-4 flex flex-col gap-2 w-72 text-sm z-[9999]"
                  style={{ minWidth: 288 }}
                >
                  <span>
                    Are you sure you want to delete this conversation?
                  </span>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => toast.dismiss(t.id)}
                      className="px-3 py-1 text-sm rounded border hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        console.log("Delete confirmed"); // Debugging log
                        onDelete();
                        toast.dismiss(t.id);
                        toast.success("Conversation deleted successfully.");
                      }}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            });
          }}
          className="p-1 rounded hover:bg-white/80 text-gray-500 hover:text-red-600"
          title="Delete"
          disabled={disabled}
        >
          <FiTrash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
