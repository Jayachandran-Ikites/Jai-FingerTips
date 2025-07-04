import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiStar, FiX } from "react-icons/fi";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { useToast } from "../ui/toast";
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

const FeedbackModal = ({ isOpen, onClose, conversationId, messageId }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState(null);
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    console.log("Inside FeedbackModal.jsx");
    e.preventDefault();

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      if (existingFeedback) {
        // PATCH if feedback exists
        await api.patch(
          `/feedback/${conversationId}/${messageId}`,
          {
            rating,
            comment: comment.trim() || null,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        toast.success("Feedback updated!");
      } else {
        console.log("Submitting new feedback", {
          conversation_id: conversationId,
          message_id: messageId,
          rating,
          comment: comment.trim() || null,
        });
        // POST if feedback does not exist
        await api.post(
          "/feedback",
          {
            conversation_id: conversationId,
            message_id: messageId,
            rating,
            comment: comment.trim() || null,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        toast.success("Thank you for your feedback!");
      }
      onClose();
      setRating(0);
      setComment("");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchFeedback = async () => {
      if (!isOpen || !conversationId || !messageId) return;
      try {
        const token = localStorage.getItem("token");
        const res = await api.get(`/feedback/${conversationId}/${messageId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const feedback = res.data.feedback || res.data; // support both formats
        console.log("Feedback API response:", feedback);
        if (feedback && feedback.rating) {
          setExistingFeedback(feedback);
          setRating(feedback.rating);
          setComment(feedback.comment || "");
        } else {
          setExistingFeedback(null);
          setRating(0);
          setComment("");
        }
      } catch (err) {
        setExistingFeedback(null);
        setRating(0);
        setComment("");
      }
    };
    fetchFeedback();
  }, [isOpen, conversationId, messageId]);
  
 
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        key={messageId}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Rate this response
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form key={messageId} onSubmit={handleSubmit} className="space-y-6">
          {/* Star Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              How helpful was this response?
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 transition-colors"
                >
                  <FiStar
                    className={`w-8 h-8 ${
                      star <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300 hover:text-yellow-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional comments (optional)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us more about your experience..."
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gradient"
              className="flex-1"
              disabled={isSubmitting || rating === 0}
            >
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default FeedbackModal;
