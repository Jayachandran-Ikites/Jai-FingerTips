from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from bson import ObjectId
from ..auth.utils import verify_token
from ..database import get_db
from ..models.review import (
    create_review_comment, get_reviews_by_conversation, 
    get_reviewer_activity, update_review_comment, delete_review_comment
)
import logging

reviews_bp = Blueprint("reviews", __name__)

def require_reviewer_or_admin(f):
    """Decorator to require reviewer or admin role"""
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"error": "Missing token"}), 401
        
        token = auth_header.split(" ")[1]
        user_id = verify_token(token)
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 403
        
        # Check user role
        db = get_db()
        users = db["users"]
        user = users.find_one({"_id": ObjectId(user_id)})
        user_role = user.get("role", "user")
        
        if user_role not in ["admin", "reviewer"]:
            return jsonify({"error": "Reviewer or admin access required"}), 403
        
        return f(user_id, *args, **kwargs)
    
    decorated_function.__name__ = f.__name__
    return decorated_function

@reviews_bp.route("/reviews", methods=["POST"])
@require_reviewer_or_admin
def create_review(reviewer_id):
    """Create a review comment for a message"""
    try:
        data = request.get_json()
        conversation_id = data.get("conversation_id")
        message_id = data.get("message_id")
        comment = data.get("comment")
        rating = data.get("rating")  # Optional
        
        if not all([conversation_id, message_id, comment]):
            return jsonify({"error": "Missing required fields"}), 400
        
        if rating and not (1 <= rating <= 5):
            return jsonify({"error": "Rating must be between 1 and 5"}), 400
        
        review_id = create_review_comment(reviewer_id, conversation_id, message_id, comment, rating)
        
        return jsonify({
            "message": "Review comment created successfully",
            "review_id": str(review_id)
        })
        
    except Exception as e:
        logging.error(f"Create review error: {e}")
        return jsonify({"error": "Failed to create review"}), 500

@reviews_bp.route("/reviews/conversation/<conversation_id>", methods=["GET"])
@require_reviewer_or_admin
def get_conversation_reviews(reviewer_id, conversation_id):
    """Get all review comments for a conversation"""
    try:
        reviews = get_reviews_by_conversation(conversation_id)
        
        # Format review data
        for review in reviews:
            review["_id"] = str(review["_id"])
            review["reviewer_id"] = str(review["reviewer_id"])
            review["conversation_id"] = str(review["conversation_id"])
            review["created_at"] = review["created_at"].isoformat()
            review["updated_at"] = review["updated_at"].isoformat()
        
        return jsonify({"reviews": reviews})
        
    except Exception as e:
        logging.error(f"Get conversation reviews error: {e}")
        return jsonify({"error": "Failed to get reviews"}), 500

@reviews_bp.route("/reviews/<review_id>", methods=["PUT"])
@require_reviewer_or_admin
def update_review(reviewer_id, review_id):
    """Update a review comment"""
    try:
        data = request.get_json()
        comment = data.get("comment")
        rating = data.get("rating")
        
        # Verify review belongs to reviewer (or user is admin)
        db = get_db()
        users = db["users"]
        reviews = db["reviews"]
        
        user = users.find_one({"_id": ObjectId(reviewer_id)})
        user_role = user.get("role", "user")
        
        review = reviews.find_one({"_id": ObjectId(review_id)})
        if not review:
            return jsonify({"error": "Review not found"}), 404
        
        # Only allow update if user is admin or owns the review
        if user_role != "admin" and str(review["reviewer_id"]) != reviewer_id:
            return jsonify({"error": "Cannot update other reviewer's comments"}), 403
        
        if rating and not (1 <= rating <= 5):
            return jsonify({"error": "Rating must be between 1 and 5"}), 400
        
        success = update_review_comment(review_id, comment, rating)
        
        if success:
            return jsonify({"message": "Review updated successfully"})
        else:
            return jsonify({"error": "Failed to update review"}), 500
            
    except Exception as e:
        logging.error(f"Update review error: {e}")
        return jsonify({"error": "Failed to update review"}), 500

@reviews_bp.route("/reviews/<review_id>", methods=["DELETE"])
@require_reviewer_or_admin
def delete_review(reviewer_id, review_id):
    """Delete a review comment"""
    try:
        # Verify review belongs to reviewer (or user is admin)
        db = get_db()
        users = db["users"]
        reviews = db["reviews"]
        
        user = users.find_one({"_id": ObjectId(reviewer_id)})
        user_role = user.get("role", "user")
        
        review = reviews.find_one({"_id": ObjectId(review_id)})
        if not review:
            return jsonify({"error": "Review not found"}), 404
        
        # Only allow deletion if user is admin or owns the review
        if user_role != "admin" and str(review["reviewer_id"]) != reviewer_id:
            return jsonify({"error": "Cannot delete other reviewer's comments"}), 403
        
        success = delete_review_comment(review_id)
        
        if success:
            return jsonify({"message": "Review deleted successfully"})
        else:
            return jsonify({"error": "Failed to delete review"}), 500
            
    except Exception as e:
        logging.error(f"Delete review error: {e}")
        return jsonify({"error": "Failed to delete review"}), 500

@reviews_bp.route("/reviews/activity", methods=["GET"])
@require_reviewer_or_admin
def get_reviewer_activity_log(reviewer_id):
    """Get activity log for the current reviewer"""
    try:
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        
        start_dt = None
        end_dt = None
        
        if start_date:
            start_dt = datetime.fromisoformat(start_date)
        if end_date:
            end_dt = datetime.fromisoformat(end_date)
        
        activity = get_reviewer_activity(reviewer_id, start_dt, end_dt)
        
        # Format activity data
        for item in activity:
            item["_id"] = str(item["_id"])
            item["created_at"] = item["created_at"].isoformat()
        
        return jsonify({"activity": activity})
        
    except Exception as e:
        logging.error(f"Get reviewer activity error: {e}")
        return jsonify({"error": "Failed to get activity log"}), 500

@reviews_bp.route("/reviews/all-activity", methods=["GET"])
@require_reviewer_or_admin
def get_all_reviewer_activity(current_user_id):
    """Get activity log for all reviewers (admin only)"""
    try:
        # Check if user is admin
        db = get_db()
        users = db["users"]
        user = users.find_one({"_id": ObjectId(current_user_id)})
        user_role = user.get("role", "user")
        
        if user_role != "admin":
            return jsonify({"error": "Admin access required"}), 403
        
        # Get all reviewers
        reviewers = list(users.find({"role": {"$in": ["reviewer", "admin"]}}))
        
        all_activity = []
        for reviewer in reviewers:
            activity = get_reviewer_activity(str(reviewer["_id"]))
            for item in activity:
                item["_id"] = str(item["_id"])
                item["created_at"] = item["created_at"].isoformat()
                item["reviewer_email"] = reviewer["email"]
                item["reviewer_name"] = reviewer.get("name", "")
            all_activity.extend(activity)
        
        # Sort by creation date
        all_activity.sort(key=lambda x: x["created_at"], reverse=True)
        
        return jsonify({"activity": all_activity})
        
    except Exception as e:
        logging.error(f"Get all reviewer activity error: {e}")
        return jsonify({"error": "Failed to get activity log"}), 500