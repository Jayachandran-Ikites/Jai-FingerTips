from ..database import get_db
from bson import ObjectId
from datetime import datetime

def create_review_comment(reviewer_id, conversation_id, message_id, comment, rating=None):
    """Create a review comment for a specific message"""
    db = get_db()
    reviews_collection = db["reviews"]
    users_collection = db["users"]
    
    # Get reviewer info to store name
    reviewer = users_collection.find_one({"_id": ObjectId(reviewer_id)})
    reviewer_name = reviewer.get("name", "") if reviewer else ""
    reviewer_email = reviewer.get("email", "") if reviewer else ""
    
    review = {
        "reviewer_id": ObjectId(reviewer_id),
        "reviewer_name": reviewer_name or reviewer_email,  # Store reviewer name or email
        "conversation_id": ObjectId(conversation_id),
        "message_id": message_id,
        "comment": comment,
        "rating": rating,  # Optional rating
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = reviews_collection.insert_one(review)
    return result.inserted_id

def get_reviews_by_conversation(conversation_id):
    """Get all review comments for a conversation"""
    db = get_db()
    reviews_collection = db["reviews"]
    users_collection = db["users"]
    
    pipeline = [
        {"$match": {"conversation_id": ObjectId(conversation_id)}},
        {
            "$lookup": {
                "from": "users",
                "localField": "reviewer_id",
                "foreignField": "_id",
                "as": "reviewer"
            }
        },
        {"$unwind": {"path": "$reviewer", "preserveNullAndEmptyArrays": True}},
        {
            "$project": {
                "message_id": 1,
                "comment": 1,
                "rating": 1,
                "created_at": 1,
                "updated_at": 1,
                "reviewer_id": 1,
                "reviewer_name": 1,
                "reviewer.email": 1,
                "reviewer.name": 1
            }
        },
        {"$sort": {"created_at": -1}}
    ]
    
    return list(reviews_collection.aggregate(pipeline))

def get_reviewer_activity(reviewer_id, start_date=None, end_date=None):
    """Get activity logs for a specific reviewer"""
    db = get_db()
    reviews_collection = db["reviews"]
    
    match_query = {"reviewer_id": ObjectId(reviewer_id)}
    if start_date and end_date:
        match_query["created_at"] = {"$gte": start_date, "$lte": end_date}
    
    pipeline = [
        {"$match": match_query},
        {
            "$lookup": {
                "from": "conversations",
                "localField": "conversation_id",
                "foreignField": "_id",
                "as": "conversation"
            }
        },
        {"$unwind": {"path": "$conversation", "preserveNullAndEmptyArrays": True}},
        {
            "$project": {
                "comment": 1,
                "rating": 1,
                "created_at": 1,
                "reviewer_name": 1,
                "conversation.title": 1,
                "conversation.user_id": 1
            }
        },
        {"$sort": {"created_at": -1}}
    ]
    
    return list(reviews_collection.aggregate(pipeline))

def update_review_comment(review_id, comment=None, rating=None):
    """Update an existing review comment"""
    db = get_db()
    reviews_collection = db["reviews"]
    
    update_data = {"updated_at": datetime.utcnow()}
    if comment is not None:
        update_data["comment"] = comment
    if rating is not None:
        update_data["rating"] = rating
    
    result = reviews_collection.update_one(
        {"_id": ObjectId(review_id)},
        {"$set": update_data}
    )
    
    return result.modified_count > 0

def delete_review_comment(review_id):
    """Delete a review comment"""
    db = get_db()
    reviews_collection = db["reviews"]
    
    result = reviews_collection.delete_one({"_id": ObjectId(review_id)})
    return result.deleted_count > 0