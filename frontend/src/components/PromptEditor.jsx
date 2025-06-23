import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiEdit3, FiSave, FiX, FiRotateCcw, FiClock, FiTrash2 } from "react-icons/fi";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { useToast } from "./ui/toast";
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

const PromptEditor = ({ isOpen, onClose, userRole }) => {
  const [activePrompt, setActivePrompt] = useState(null);
  const [promptHistory, setPromptHistory] = useState([]);
  const [editedPrompt, setEditedPrompt] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Check if user can edit prompts
  const canEdit = userRole === "power_user" || userRole === "admin";

  useEffect(() => {
    if (isOpen) {
      loadActivePrompt();
      if (canEdit) {
        loadPromptHistory();
      }
    }
  }, [isOpen, canEdit]);

  const loadActivePrompt = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get("/prompts/active", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setActivePrompt(response.data.prompt);
      setEditedPrompt(response.data.prompt?.prompt_text || "");
    } catch (error) {
      console.error("Error loading active prompt:", error);
      toast.error("Failed to load prompt");
    } finally {
      setIsLoading(false);
    }
  };

  const loadPromptHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get("/prompts/history", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPromptHistory(response.data.history);
    } catch (error) {
      console.error("Error loading prompt history:", error);
    }
  };

  const handleSave = async () => {
    if (!editedPrompt.trim()) {
      toast.error("Prompt cannot be empty");
      return;
    }

    setIsSaving(true);
    
    try {
      const token = localStorage.getItem("token");
      await api.post("/prompts", {
        prompt_text: editedPrompt.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Prompt updated successfully!");
      setIsEditing(false);
      await loadActivePrompt();
      if (canEdit) {
        await loadPromptHistory();
      }
    } catch (error) {
      console.error("Error saving prompt:", error);
      toast.error("Failed to save prompt");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevert = async (version) => {
    try {
      const token = localStorage.getItem("token");
      await api.post(`/prompts/revert/${version}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`Reverted to version ${version}`);
      await loadActivePrompt();
      await loadPromptHistory();
    } catch (error) {
      console.error("Error reverting prompt:", error);
      toast.error("Failed to revert prompt");
    }
  };

  const handleReset = async () => {
    try {
      const token = localStorage.getItem("token");
      await api.post("/prompts/reset", {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Prompt reset to default");
      await loadActivePrompt();
      if (canEdit) {
        await loadPromptHistory();
      }
    } catch (error) {
      console.error("Error resetting prompt:", error);
      toast.error("Failed to reset prompt");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Prompt Management</h2>
              <p className="text-sm text-gray-600 mt-1">
                {canEdit ? "Customize your AI assistant's behavior" : "View current prompt configuration"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-300 animate-bounce"></div>
                <div className="w-3 h-3 rounded-full bg-purple-300 animate-bounce"></div>
                <div className="w-3 h-3 rounded-full bg-cyan-300 animate-bounce"></div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Current Prompt */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      Current Prompt
                      {activePrompt && (
                        <Badge variant="info">
                          Version {activePrompt.version}
                        </Badge>
                      )}
                    </CardTitle>
                    {canEdit && (
                      <div className="flex gap-2">
                        {!isEditing ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditing(true)}
                          >
                            <FiEdit3 className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setIsEditing(false);
                                setEditedPrompt(activePrompt?.prompt_text || "");
                              }}
                            >
                              <FiX className="w-4 h-4 mr-2" />
                              Cancel
                            </Button>
                            <Button
                              variant="gradient"
                              size="sm"
                              onClick={handleSave}
                              disabled={isSaving}
                            >
                              <FiSave className="w-4 h-4 mr-2" />
                              {isSaving ? "Saving..." : "Save"}
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Textarea
                      value={editedPrompt}
                      onChange={(e) => setEditedPrompt(e.target.value)}
                      rows={12}
                      className="font-mono text-sm resize-none"
                      placeholder="Enter your custom prompt..."
                    />
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap">
                      {activePrompt?.prompt_text || "No prompt configured"}
                    </div>
                  )}
                  
                  {activePrompt && (
                    <div className="mt-4 text-xs text-gray-500">
                      Last updated: {new Date(activePrompt.updated_at).toLocaleString()}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              {canEdit && (
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={handleReset}
                        className="flex-1"
                      >
                        <FiRotateCcw className="w-4 h-4 mr-2" />
                        Reset to Default
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Prompt History */}
              {canEdit && promptHistory.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FiClock className="w-5 h-5" />
                      Version History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {promptHistory.map((prompt) => (
                        <div
                          key={prompt._id}
                          className={`p-4 rounded-lg border ${
                            prompt.is_active 
                              ? "border-blue-200 bg-blue-50" 
                              : "border-gray-200 bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant={prompt.is_active ? "info" : "secondary"}>
                                Version {prompt.version}
                              </Badge>
                              {prompt.is_active && (
                                <Badge variant="success">Active</Badge>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {!prompt.is_active && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRevert(prompt.version)}
                                >
                                  <FiRotateCcw className="w-3 h-3 mr-1" />
                                  Revert
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 mb-2">
                            Created: {new Date(prompt.created_at).toLocaleString()}
                          </div>
                          <div className="text-sm font-mono bg-white p-2 rounded border max-h-20 overflow-y-auto">
                            {prompt.prompt_text.substring(0, 200)}
                            {prompt.prompt_text.length > 200 && "..."}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Help Text */}
              <Card>
                <CardHeader>
                  <CardTitle>About Prompts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600 space-y-2">
                    <p>
                      Prompts define how the AI assistant behaves and responds to your questions.
                    </p>
                    {canEdit ? (
                      <>
                        <p>
                          As a Power User, you can customize your prompt to better suit your needs.
                          Changes only affect your conversations.
                        </p>
                        <p>
                          <strong>Tips:</strong>
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>Be specific about the tone and style you want</li>
                          <li>Include any special instructions or constraints</li>
                          <li>Test your changes with a few questions</li>
                          <li>You can always revert to previous versions</li>
                        </ul>
                      </>
                    ) : (
                      <p>
                        Contact an administrator to upgrade to Power User for prompt editing capabilities.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default PromptEditor;