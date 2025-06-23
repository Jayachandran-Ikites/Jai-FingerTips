from flask import Blueprint, request, jsonify
from datetime import datetime
from bson import ObjectId
from ..auth.utils import verify_token
from ..database import get_db
from ..models.tags import (
    create_tag, get_all_tags, add_tag_to_conversation,
    remove_tag_from_conversation, get_conversation_tags,
    get_conversations_by_tag, delete_tag
)
import logging

tags_bp = Blueprint("tags", __name__)

def require_admin_or_reviewer(f):
    """Decorator to require admin or reviewer role"""
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
            return jsonify({"error": "Admin or reviewer access required"}), 403
        
        return f(user_id, *args, **kwargs)
    
    decorated_function.__name__ = f.__name__
    return decorated_function

@tags_bp.route("/tags", methods=["GET"])
@require_admin_or_reviewer
def get_tags(user_id):
    """Get all available tags"""
    try:
        tags = get_all_tags()
        
        # Format tags
        for tag in tags:
            tag["_id"] = str(tag["_id"])
            if tag.get("created_by"):
                tag["created_by"] = str(tag["created_by"])
            tag["created_at"] = tag["created_at"].isoformat()
            tag["updated_at"] = tag["updated_at"].isoformat()
        
        return jsonify({"tags": tags})
        
    except Exception as e:
        logging.error(f"Get tags error: {e}")
        return jsonify({"error": "Failed to get tags"}), 500

@tags_bp.route("/tags", methods=["POST"])
@require_admin_or_reviewer
def create_new_tag(user_id):
    """Create a new tag"""
    try:
        data = request.get_json()
        name = data.get("name")
        color = data.get("color", "#3B82F6")
        
        if not name:
            return jsonify({"error": "Tag name is required"}), 400
        
        tag_id = create_tag(name, color, user_id)
        
        return jsonify({
            "message": "Tag created successfully",
            "tag_id": str(tag_id)
        })
        
    except Exception as e:
        logging.error(f"Create tag error: {e}")
        return jsonify({"error": "Failed to create tag"}), 500

@tags_bp.route("/tags/<tag_id>", methods=["DELETE"])
@require_admin_or_reviewer
def delete_tag_endpoint(user_id, tag_id):
    """Delete a tag"""
    try:
        success = delete_tag(tag_id)
        
        if success:
            return jsonify({"message": "Tag deleted successfully"})
        else:
            return jsonify({"error": "Tag not found"}), 404
            
    except Exception as e:
        logging.error(f"Delete tag error: {e}")
        return jsonify({"error": "Failed to delete tag"}), 500

@tags_bp.route("/conversations/<conversation_id>/tags", methods=["GET"])
@require_admin_or_reviewer
def get_conversation_tags_endpoint(user_id, conversation_id):
    """Get tags for a conversation"""
    try:
        tags = get_conversation_tags(conversation_id)
        
        # Format tags
        for tag in tags:
            tag["tag_id"] = str(tag["tag_id"])
            tag["added_by"] = str(tag["added_by"])
            tag["added_at"] = tag["added_at"].isoformat()
        
        return jsonify({"tags": tags})
        
    except Exception as e:
        logging.error(f"Get conversation tags error: {e}")
        return jsonify({"error": "Failed to get conversation tags"}), 500

@tags_bp.route("/conversations/<conversation_id>/tags", methods=["POST"])
@require_admin_or_reviewer
def add_tag_to_conversation_endpoint(user_id, conversation_id):
    """Add tag to conversation"""
    try:
        data = request.get_json()
        tag_id = data.get("tag_id")
        
        if not tag_id:
            return jsonify({"error": "Tag ID is required"}), 400
        
        assignment_id = add_tag_to_conversation(conversation_id, tag_id, user_id)
        
        return jsonify({
            "message": "Tag added to conversation",
            "assignment_id": str(assignment_id)
        })
        
    except Exception as e:
        logging.error(f"Add tag to conversation error: {e}")
        return jsonify({"error": "Failed to add tag to conversation"}), 500

@tags_bp.route("/conversations/<conversation_id>/tags/<tag_id>", methods=["DELETE"])
@require_admin_or_reviewer
def remove_tag_from_conversation_endpoint(user_id, conversation_id, tag_id):
    """Remove tag from conversation"""
    try:
        success = remove_tag_from_conversation(conversation_id, tag_id)
        
        if success:
            return jsonify({"message": "Tag removed from conversation"})
        else:
            return jsonify({"error": "Tag assignment not found"}), 404
            
    except Exception as e:
        logging.error(f"Remove tag from conversation error: {e}")
        return jsonify({"error": "Failed to remove tag from conversation"}), 500

@tags_bp.route("/tags/<tag_id>/conversations", methods=["GET"])
@require_admin_or_reviewer
def get_conversations_by_tag_endpoint(user_id, tag_id):
    """Get conversations with a specific tag"""
    try:
        conversations = get_conversations_by_tag(tag_id)
        
        # Format conversations
        for conv in conversations:
            conv["conversation_id"] = str(conv["conversation_id"])
            conv["user_id"] = str(conv["user_id"])
            conv["created_at"] = conv["created_at"].isoformat()
            conv["updated_at"] = conv["updated_at"].isoformat()
            conv["tagged_at"] = conv["tagged_at"].isoformat()
        
        return jsonify({"conversations": conversations})
        
    except Exception as e:
        logging.error(f"Get conversations by tag error: {e}")
        return jsonify({"error": "Failed to get conversations by tag"}), 500