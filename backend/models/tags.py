from ..database import get_db
from bson import ObjectId
from datetime import datetime

def create_tag(name, color="#3B82F6", created_by=None):
    """Create a new tag"""
    db = get_db()
    tags_collection = db["tags"]
    
    tag = {
        "name": name,
        "color": color,
        "created_by": ObjectId(created_by) if created_by else None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = tags_collection.insert_one(tag)
    return result.inserted_id

def get_all_tags():
    """Get all available tags"""
    db = get_db()
    tags_collection = db["tags"]
    
    return list(tags_collection.find({}).sort("name", 1))

def add_tag_to_conversation(conversation_id, tag_id, added_by):
    """Add tag to conversation"""
    db = get_db()
    conversation_tags = db["conversation_tags"]
    
    # Check if tag already exists for this conversation
    existing = conversation_tags.find_one({
        "conversation_id": ObjectId(conversation_id),
        "tag_id": ObjectId(tag_id)
    })
    
    if existing:
        return existing["_id"]
    
    tag_assignment = {
        "conversation_id": ObjectId(conversation_id),
        "tag_id": ObjectId(tag_id),
        "added_by": ObjectId(added_by),
        "added_at": datetime.utcnow()
    }
    
    result = conversation_tags.insert_one(tag_assignment)
    return result.inserted_id

def remove_tag_from_conversation(conversation_id, tag_id):
    """Remove tag from conversation"""
    db = get_db()
    conversation_tags = db["conversation_tags"]
    
    result = conversation_tags.delete_one({
        "conversation_id": ObjectId(conversation_id),
        "tag_id": ObjectId(tag_id)
    })
    
    return result.deleted_count > 0

def get_conversation_tags(conversation_id):
    """Get all tags for a conversation"""
    db = get_db()
    conversation_tags = db["conversation_tags"]
    
    pipeline = [
        {"$match": {"conversation_id": ObjectId(conversation_id)}},
        {
            "$lookup": {
                "from": "tags",
                "localField": "tag_id",
                "foreignField": "_id",
                "as": "tag"
            }
        },
        {"$unwind": "$tag"},
        {
            "$project": {
                "tag_id": "$tag._id",
                "name": "$tag.name",
                "color": "$tag.color",
                "added_at": 1,
                "added_by": 1
            }
        }
    ]
    
    return list(conversation_tags.aggregate(pipeline))

def get_conversations_by_tag(tag_id):
    """Get all conversations with a specific tag"""
    db = get_db()
    conversation_tags = db["conversation_tags"]
    
    pipeline = [
        {"$match": {"tag_id": ObjectId(tag_id)}},
        {
            "$lookup": {
                "from": "conversations",
                "localField": "conversation_id",
                "foreignField": "_id",
                "as": "conversation"
            }
        },
        {"$unwind": "$conversation"},
        {
            "$project": {
                "conversation_id": "$conversation._id",
                "title": "$conversation.title",
                "user_id": "$conversation.user_id",
                "created_at": "$conversation.created_at",
                "updated_at": "$conversation.updated_at",
                "tagged_at": "$added_at"
            }
        }
    ]
    
    return list(conversation_tags.aggregate(pipeline))

def delete_tag(tag_id):
    """Delete a tag and all its assignments"""
    db = get_db()
    tags_collection = db["tags"]
    conversation_tags = db["conversation_tags"]
    
    # Remove all tag assignments
    conversation_tags.delete_many({"tag_id": ObjectId(tag_id)})
    
    # Remove the tag itself
    result = tags_collection.delete_one({"_id": ObjectId(tag_id)})
    return result.deleted_count > 0