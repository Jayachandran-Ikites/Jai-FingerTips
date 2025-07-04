import { useState } from "react";
import { FiMessageSquare, FiEdit3, FiTrash2 } from "react-icons/fi";

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
      } ${disabled ? "opacity-70 pointer-events-none" : ""}`}
    >
      <div
        onClick={disabled ? undefined : onSelect}
        className="flex items-center gap-3"
      >
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
            setIsEditing(true);
          }}
          className="p-1 rounded hover:bg-white/80 text-gray-500 hover:text-blue-600"
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

export default ConversationItem; 