from ..database import get_db
from bson import ObjectId
from datetime import datetime
import time

def create_feedback(user_id, conversation_id, message_id, rating, comment=None):
    """Create feedback for a specific message"""
    db = get_db()
    feedback_collection = db["feedback"]
    
    feedback = {
        "user_id": ObjectId(user_id),
        "conversation_id": ObjectId(conversation_id),
        "message_id": message_id,
        "rating": rating,  # 1-5 stars
        "comment": comment,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = feedback_collection.insert_one(feedback)
    return result.inserted_id

def get_feedback_by_conversation(conversation_id):
    """Get all feedback for a conversation"""
    db = get_db()
    feedback_collection = db["feedback"]
    
    return list(feedback_collection.find({"conversation_id": ObjectId(conversation_id)}))

def get_feedback_stats():
    """Get overall feedback statistics"""
    db = get_db()
    feedback_collection = db["feedback"]
    
    pipeline = [
        {
            "$group": {
                "_id": None,
                "avg_rating": {"$avg": "$rating"},
                "total_feedback": {"$sum": 1},
                "rating_distribution": {
                    "$push": "$rating"
                }
            }
        }
    ]
    
    result = list(feedback_collection.aggregate(pipeline))
    return result[0] if result else None

def update_feedback(feedback_id, rating=None, comment=None):
    """Update existing feedback"""
    db = get_db()
    feedback_collection = db["feedback"]
    
    update_data = {"updated_at": datetime.utcnow()}
    if rating is not None:
        update_data["rating"] = rating
    if comment is not None:
        update_data["comment"] = comment
    
    result = feedback_collection.update_one(
        {"_id": ObjectId(feedback_id)},
        {"$set": update_data}
    )
    
    return result.modified_count > 0