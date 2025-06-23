from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from bson import ObjectId
from ..auth.utils import verify_token
from ..database import get_db
from ..models.feedback import create_feedback, get_feedback_by_conversation, get_feedback_stats, update_feedback
import logging

feedback_bp = Blueprint("feedback", __name__)

def require_auth(f):
    """Decorator to require authentication"""
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"error": "Missing token"}), 401
        
        token = auth_header.split(" ")[1]
        user_id = verify_token(token)
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 403
        
        return f(user_id, *args, **kwargs)
    
    decorated_function.__name__ = f.__name__
    return decorated_function

@feedback_bp.route("/feedback", methods=["POST"])
@require_auth
def submit_feedback(user_id):
    """Submit feedback for a message"""
    try:
        data = request.get_json()
        conversation_id = data.get("conversation_id")
        message_id = data.get("message_id")
        rating = data.get("rating")
        comment = data.get("comment")
        
        if not all([conversation_id, message_id, rating]):
            return jsonify({"error": "Missing required fields"}), 400
        
        if not (1 <= rating <= 5):
            return jsonify({"error": "Rating must be between 1 and 5"}), 400
        
        # Verify user owns the conversation
        db = get_db()
        conversations = db["conversations"]
        conversation = conversations.find_one({
            "_id": ObjectId(conversation_id),
            "user_id": ObjectId(user_id)
        })
        
        if not conversation:
            return jsonify({"error": "Conversation not found"}), 404
        
        feedback_id = create_feedback(user_id, conversation_id, message_id, rating, comment)
        
        return jsonify({
            "message": "Feedback submitted successfully",
            "feedback_id": str(feedback_id)
        })
        
    except Exception as e:
        logging.error(f"Submit feedback error: {e}")
        return jsonify({"error": "Failed to submit feedback"}), 500

@feedback_bp.route("/feedback/<conversation_id>", methods=["GET"])
@require_auth
def get_conversation_feedback(user_id, conversation_id):
    """Get feedback for a conversation"""
    try:
        # Verify user owns the conversation or is admin/reviewer
        db = get_db()
        users = db["users"]
        conversations = db["conversations"]
        
        user = users.find_one({"_id": ObjectId(user_id)})
        user_role = user.get("role", "user")
        
        if user_role not in ["admin", "reviewer"]:
            conversation = conversations.find_one({
                "_id": ObjectId(conversation_id),
                "user_id": ObjectId(user_id)
            })
            if not conversation:
                return jsonify({"error": "Conversation not found"}), 404
        
        feedback_list = get_feedback_by_conversation(conversation_id)
        
        # Format feedback data
        for feedback in feedback_list:
            feedback["_id"] = str(feedback["_id"])
            feedback["user_id"] = str(feedback["user_id"])
            feedback["conversation_id"] = str(feedback["conversation_id"])
            feedback["created_at"] = feedback["created_at"].isoformat()
            feedback["updated_at"] = feedback["updated_at"].isoformat()
        
        return jsonify({"feedback": feedback_list})
        
    except Exception as e:
        logging.error(f"Get conversation feedback error: {e}")
        return jsonify({"error": "Failed to get feedback"}), 500

@feedback_bp.route("/feedback/<feedback_id>", methods=["PUT"])
@require_auth
def update_user_feedback(user_id, feedback_id):
    """Update user's own feedback"""
    try:
        data = request.get_json()
        rating = data.get("rating")
        comment = data.get("comment")
        
        # Verify feedback belongs to user
        db = get_db()
        feedback_collection = db["feedback"]
        feedback = feedback_collection.find_one({
            "_id": ObjectId(feedback_id),
            "user_id": ObjectId(user_id)
        })
        
        if not feedback:
            return jsonify({"error": "Feedback not found"}), 404
        
        if rating and not (1 <= rating <= 5):
            return jsonify({"error": "Rating must be between 1 and 5"}), 400
        
        success = update_feedback(feedback_id, rating, comment)
        
        if success:
            return jsonify({"message": "Feedback updated successfully"})
        else:
            return jsonify({"error": "Failed to update feedback"}), 500
            
    except Exception as e:
        logging.error(f"Update feedback error: {e}")
        return jsonify({"error": "Failed to update feedback"}), 500

@feedback_bp.route("/feedback/stats", methods=["GET"])
@require_auth
def get_feedback_statistics(user_id):
    """Get feedback statistics (admin/reviewer only)"""
    try:
        # Check if user is admin or reviewer
        db = get_db()
        users = db["users"]
        user = users.find_one({"_id": ObjectId(user_id)})
        user_role = user.get("role", "user")
        
        if user_role not in ["admin", "reviewer"]:
            return jsonify({"error": "Insufficient permissions"}), 403
        
        stats = get_feedback_stats()
        
        if stats:
            # Calculate rating distribution
            rating_dist = {}
            for rating in stats["rating_distribution"]:
                rating_dist[str(rating)] = rating_dist.get(str(rating), 0) + 1
            
            stats["rating_distribution"] = rating_dist
            stats["avg_rating"] = round(stats["avg_rating"], 2)
        
        return jsonify({"stats": stats})
        
    except Exception as e:
        logging.error(f"Get feedback stats error: {e}")
        return jsonify({"error": "Failed to get feedback statistics"}), 500