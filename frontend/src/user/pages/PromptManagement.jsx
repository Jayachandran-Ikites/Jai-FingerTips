import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext.jsx";
import {
  FiEdit3,
  FiSave,
  FiRotateCcw,
  FiClock,
  FiHome,
  FiCheck,
  FiX,
  FiInfo,
  FiAlertCircle,
} from "react-icons/fi";
import { HiOutlineFingerPrint } from "react-icons/hi";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { useToast } from "../components/ui/toast";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

const PromptManagement = () => {
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activePrompt, setActivePrompt] = useState(null);
  const [promptHistory, setPromptHistory] = useState([]);
  const [editedPrompt, setEditedPrompt] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("user");

  useEffect(() => {
    if (!token) {
      navigate("/auth");
      return;
    }
    
    getUserRole();
    loadActivePrompt();
    loadPromptHistory();
  }, [token, navigate]);

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
      setLoading(false);
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
      await loadPromptHistory();
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
      await loadPromptHistory();
    } catch (error) {
      console.error("Error resetting prompt:", error);
      toast.error("Failed to reset prompt");
    }
  };

  // Check if user can edit prompts
  const canEdit = userRole === "power_user" || userRole === "admin";

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex space-x-2 items-center justify-center mb-4">
            <div className="w-3 h-3 rounded-full bg-blue-300 animate-bounce"></div>
            <div className="w-3 h-3 rounded-full bg-purple-300 animate-bounce"></div>
            <div className="w-3 h-3 rounded-full bg-cyan-300 animate-bounce"></div>
          </div>
          <p className="text-gray-600">Loading prompt settings...</p>
        </div>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FiAlertCircle className="w-5 h-5 text-yellow-500" />
              Access Restricted
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              You need to be a Power User or Admin to access prompt management.
            </p>
            <Button
              onClick={() => navigate("/chat")}
              variant="gradient"
              className="w-full"
            >
              <FiHome className="w-4 h-4 mr-2" />
              Back to Chat
            </Button>
          </CardContent>
        </Card>
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
                  Prompt Management
                </h1>
                <p className="text-sm text-gray-600">Customize your AI assistant's behavior</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/chat")}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <FiHome className="w-4 h-4" />
                Back to Chat
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
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
              <div className="flex gap-2">
                {!isEditing ? (
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                  >
                    <FiEdit3 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
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
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      <FiSave className="w-4 h-4 mr-2" />
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                  </>
                )}
              </div>
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

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex items-center gap-2"
              >
                <FiRotateCcw className="w-4 h-4" />
                Reset to Default
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Version History */}
        {promptHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FiClock className="w-5 h-5" />
                Version History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {promptHistory.map((prompt) => (
                  <div
                    key={prompt._id}
                    className={`p-4 rounded-lg border ${
                      prompt.is_active 
                        ? "border-blue-200 bg-blue-50" 
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={prompt.is_active ? "info" : "secondary"}>
                          Version {prompt.version}
                        </Badge>
                        {prompt.is_active && (
                          <Badge variant="success" className="flex items-center gap-1">
                            <FiCheck className="w-3 h-3" />
                            Active
                          </Badge>
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
                            Revert to this version
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      Created: {new Date(prompt.created_at).toLocaleString()}
                    </div>
                    <div className="text-sm font-mono bg-white p-3 rounded border max-h-32 overflow-y-auto">
                      {prompt.prompt_text}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help and Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FiInfo className="w-5 h-5" />
              About Prompts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600">
                Prompts define how the AI assistant behaves and responds to your questions. 
                As a Power User, you can customize your prompt to better suit your needs.
              </p>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">Customization Tips</h4>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Be specific about the tone and style you want</li>
                  <li>Include any special instructions or constraints</li>
                  <li>Test your changes with a few questions</li>
                  <li>You can always revert to previous versions</li>
                </ul>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-medium text-yellow-800 mb-2">Important Notes</h4>
                <ul className="list-disc list-inside space-y-1 text-yellow-700">
                  <li>Changes only affect your conversations</li>
                  <li>Prompt changes take effect immediately</li>
                  <li>Complex prompts may affect response time</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PromptManagement;