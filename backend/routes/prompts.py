from flask import Blueprint, request, jsonify
from datetime import datetime
from bson import ObjectId
from ..auth.utils import verify_token
from ..database import get_db
from ..models.prompt import (
    create_user_prompt, get_user_active_prompt, get_user_prompt_history,
    update_user_prompt, revert_to_prompt_version, delete_prompt_version,
    get_default_system_prompt
)
import logging

prompts_bp = Blueprint("prompts", __name__)

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

def require_power_user_or_admin(f):
    """Decorator to require power user or admin role"""
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
        
        if user_role not in ["admin", "power_user"]:
            return jsonify({"error": "Power user or admin access required"}), 403
        
        return f(user_id, *args, **kwargs)
    
    decorated_function.__name__ = f.__name__
    return decorated_function

@prompts_bp.route("/prompts/active", methods=["GET"])
@require_auth
def get_active_prompt(user_id):
    """Get the active prompt for the current user"""
    try:
        prompt = get_user_active_prompt(user_id)
        
        if not prompt:
            # Create default prompt for new users
            default_prompt = get_default_system_prompt()
            prompt_id = create_user_prompt(user_id, default_prompt, 1, True)
            prompt = get_user_active_prompt(user_id)
        
        if prompt:
            prompt["_id"] = str(prompt["_id"])
            prompt["user_id"] = str(prompt["user_id"])
            prompt["created_at"] = prompt["created_at"].isoformat()
            prompt["updated_at"] = prompt["updated_at"].isoformat()
        
        return jsonify({"prompt": prompt})
        
    except Exception as e:
        logging.error(f"Get active prompt error: {e}")
        return jsonify({"error": "Failed to get active prompt"}), 500

@prompts_bp.route("/prompts/history", methods=["GET"])
@require_power_user_or_admin
def get_prompt_history(user_id):
    """Get prompt version history for the current user"""
    try:
        history = get_user_prompt_history(user_id)
        
        # Format history data
        for prompt in history:
            prompt["_id"] = str(prompt["_id"])
            prompt["user_id"] = str(prompt["user_id"])
            prompt["created_at"] = prompt["created_at"].isoformat()
            prompt["updated_at"] = prompt["updated_at"].isoformat()
        
        return jsonify({"history": history})
        
    except Exception as e:
        logging.error(f"Get prompt history error: {e}")
        return jsonify({"error": "Failed to get prompt history"}), 500

@prompts_bp.route("/prompts", methods=["POST"])
@require_power_user_or_admin
def create_new_prompt(user_id):
    """Create/update user's prompt"""
    try:
        data = request.get_json()
        prompt_text = data.get("prompt_text")
        
        if not prompt_text:
            return jsonify({"error": "Prompt text is required"}), 400
        
        if len(prompt_text.strip()) < 10:
            return jsonify({"error": "Prompt text too short"}), 400
        
        prompt_id = update_user_prompt(user_id, prompt_text.strip())
        
        return jsonify({
            "message": "Prompt updated successfully",
            "prompt_id": str(prompt_id)
        })
        
    except Exception as e:
        logging.error(f"Create prompt error: {e}")
        return jsonify({"error": "Failed to create prompt"}), 500

@prompts_bp.route("/prompts/revert/<int:version>", methods=["POST"])
@require_power_user_or_admin
def revert_prompt(user_id, version):
    """Revert to a specific prompt version"""
    try:
        prompt_id = revert_to_prompt_version(user_id, version)
        
        if prompt_id:
            return jsonify({
                "message": f"Reverted to version {version}",
                "prompt_id": str(prompt_id)
            })
        else:
            return jsonify({"error": "Version not found"}), 404
            
    except Exception as e:
        logging.error(f"Revert prompt error: {e}")
        return jsonify({"error": "Failed to revert prompt"}), 500

@prompts_bp.route("/prompts/version/<int:version>", methods=["DELETE"])
@require_power_user_or_admin
def delete_prompt_version_endpoint(user_id, version):
    """Delete a specific prompt version (cannot delete active)"""
    try:
        success = delete_prompt_version(user_id, version)
        
        if success:
            return jsonify({"message": f"Version {version} deleted successfully"})
        else:
            return jsonify({"error": "Cannot delete active version or version not found"}), 400
            
    except Exception as e:
        logging.error(f"Delete prompt version error: {e}")
        return jsonify({"error": "Failed to delete prompt version"}), 500

@prompts_bp.route("/prompts/default", methods=["GET"])
@require_auth
def get_default_prompt(user_id):
    """Get the default system prompt"""
    try:
        default_prompt = get_default_system_prompt()
        return jsonify({"default_prompt": default_prompt})
        
    except Exception as e:
        logging.error(f"Get default prompt error: {e}")
        return jsonify({"error": "Failed to get default prompt"}), 500

@prompts_bp.route("/prompts/reset", methods=["POST"])
@require_power_user_or_admin
def reset_to_default(user_id):
    """Reset user's prompt to default"""
    try:
        default_prompt = get_default_system_prompt()
        prompt_id = update_user_prompt(user_id, default_prompt)
        
        return jsonify({
            "message": "Prompt reset to default",
            "prompt_id": str(prompt_id)
        })
        
    except Exception as e:
        logging.error(f"Reset prompt error: {e}")
        return jsonify({"error": "Failed to reset prompt"}), 500