import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiTag, FiPlus, FiX, FiEdit3, FiTrash2 } from "react-icons/fi";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { useToast } from "./ui/toast";
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

const TagManager = ({ conversationId, onTagsChange }) => {
  const [tags, setTags] = useState([]);
  const [conversationTags, setConversationTags] = useState([]);
  const [showCreateTag, setShowCreateTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#3B82F6");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const predefinedColors = [
    "#3B82F6", "#EF4444", "#10B981", "#F59E0B",
    "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"
  ];

  useEffect(() => {
    loadTags();
    if (conversationId) {
      loadConversationTags();
    }
  }, [conversationId]);

  const loadTags = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get("/tags", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTags(response.data.tags);
    } catch (error) {
      console.error("Error loading tags:", error);
    }
  };

  const loadConversationTags = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get(`/conversations/${conversationId}/tags`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversationTags(response.data.tags);
      onTagsChange?.(response.data.tags);
    } catch (error) {
      console.error("Error loading conversation tags:", error);
    }
  };

  const createTag = async () => {
    if (!newTagName.trim()) {
      toast.error("Tag name is required");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      await api.post("/tags", {
        name: newTagName.trim(),
        color: newTagColor
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Tag created successfully");
      setNewTagName("");
      setNewTagColor("#3B82F6");
      setShowCreateTag(false);
      await loadTags();
    } catch (error) {
      console.error("Error creating tag:", error);
      toast.error("Failed to create tag");
    } finally {
      setIsLoading(false);
    }
  };

  const addTagToConversation = async (tagId) => {
    if (!conversationId) return;

    try {
      const token = localStorage.getItem("token");
      await api.post(`/conversations/${conversationId}/tags`, {
        tag_id: tagId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Tag added to conversation");
      await loadConversationTags();
    } catch (error) {
      console.error("Error adding tag to conversation:", error);
      toast.error("Failed to add tag");
    }
  };

  const removeTagFromConversation = async (tagId) => {
    if (!conversationId) return;

    try {
      const token = localStorage.getItem("token");
      await api.delete(`/conversations/${conversationId}/tags/${tagId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Tag removed from conversation");
      await loadConversationTags();
    } catch (error) {
      console.error("Error removing tag from conversation:", error);
      toast.error("Failed to remove tag");
    }
  };

  const deleteTag = async (tagId) => {
    if (!window.confirm("Are you sure you want to delete this tag? It will be removed from all conversations.")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await api.delete(`/tags/${tagId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Tag deleted successfully");
      await loadTags();
      await loadConversationTags();
    } catch (error) {
      console.error("Error deleting tag:", error);
      toast.error("Failed to delete tag");
    }
  };

  const isTagAssigned = (tagId) => {
    return conversationTags.some(ct => ct.tag_id === tagId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FiTag className="w-5 h-5" />
          Tag Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Conversation Tags */}
        {conversationId && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Tags
            </h4>
            <div className="flex flex-wrap gap-2">
              {conversationTags.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No tags assigned</p>
              ) : (
                conversationTags.map((tag) => (
                  <Badge
                    key={tag.tag_id}
                    variant="secondary"
                    className="flex items-center gap-1"
                    style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                  >
                    {tag.name}
                    <button
                      onClick={() => removeTagFromConversation(tag.tag_id)}
                      className="ml-1 hover:bg-red-100 rounded-full p-0.5"
                    >
                      <FiX className="w-3 h-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
          </div>
        )}

        {/* Available Tags */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Available Tags
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateTag(true)}
            >
              <FiPlus className="w-4 h-4 mr-1" />
              New Tag
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <div key={tag._id} className="group relative">
                <Badge
                  variant={isTagAssigned(tag._id) ? "default" : "outline"}
                  className={`cursor-pointer transition-all ${
                    isTagAssigned(tag._id) 
                      ? "opacity-50" 
                      : "hover:scale-105"
                  }`}
                  style={
                    isTagAssigned(tag._id) 
                      ? {} 
                      : { borderColor: tag.color, color: tag.color }
                  }
                  onClick={() => {
                    if (!isTagAssigned(tag._id) && conversationId) {
                      addTagToConversation(tag._id);
                    }
                  }}
                >
                  {tag.name}
                </Badge>
                
                {/* Delete button for admins */}
                <button
                  onClick={() => deleteTag(tag._id)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <FiX className="w-2 h-2" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Create New Tag Modal */}
        <AnimatePresence>
          {showCreateTag && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
            >
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Create New Tag
              </h4>
              
              <div className="space-y-3">
                <Input
                  placeholder="Tag name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                />
                
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">
                    Color
                  </label>
                  <div className="flex gap-2">
                    {predefinedColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewTagColor(color)}
                        className={`w-6 h-6 rounded-full border-2 ${
                          newTagColor === color 
                            ? "border-gray-800 dark:border-gray-200" 
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateTag(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="gradient"
                    size="sm"
                    onClick={createTag}
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating..." : "Create Tag"}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default TagManager;