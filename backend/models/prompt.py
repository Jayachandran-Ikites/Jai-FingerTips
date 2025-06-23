from ..database import get_db
from bson import ObjectId
from datetime import datetime

def create_user_prompt(user_id, prompt_text, version=1, is_active=True):
    """Create a new prompt for a user"""
    db = get_db()
    prompts_collection = db["user_prompts"]
    
    # Deactivate previous prompts if this is the new active one
    if is_active:
        prompts_collection.update_many(
            {"user_id": ObjectId(user_id), "is_active": True},
            {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
        )
    
    prompt = {
        "user_id": ObjectId(user_id),
        "prompt_text": prompt_text,
        "version": version,
        "is_active": is_active,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = prompts_collection.insert_one(prompt)
    return result.inserted_id

def get_user_active_prompt(user_id):
    """Get the active prompt for a user"""
    db = get_db()
    prompts_collection = db["user_prompts"]
    
    return prompts_collection.find_one({
        "user_id": ObjectId(user_id),
        "is_active": True
    })

def get_user_prompt_history(user_id):
    """Get all prompts for a user (version history)"""
    db = get_db()
    prompts_collection = db["user_prompts"]
    
    return list(prompts_collection.find(
        {"user_id": ObjectId(user_id)}
    ).sort("version", -1))

def update_user_prompt(user_id, prompt_text):
    """Update user's active prompt and create new version"""
    db = get_db()
    prompts_collection = db["user_prompts"]
    
    # Get current active prompt to determine next version
    current_prompt = get_user_active_prompt(user_id)
    next_version = (current_prompt["version"] + 1) if current_prompt else 1
    
    # Create new version
    return create_user_prompt(user_id, prompt_text, next_version, True)

def revert_to_prompt_version(user_id, version):
    """Revert to a specific prompt version"""
    db = get_db()
    prompts_collection = db["user_prompts"]
    
    # Get the specific version
    target_prompt = prompts_collection.find_one({
        "user_id": ObjectId(user_id),
        "version": version
    })
    
    if not target_prompt:
        return None
    
    # Deactivate current active prompt
    prompts_collection.update_many(
        {"user_id": ObjectId(user_id), "is_active": True},
        {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
    )
    
    # Create new version with the reverted content
    current_max = prompts_collection.find_one(
        {"user_id": ObjectId(user_id)},
        sort=[("version", -1)]
    )
    next_version = (current_max["version"] + 1) if current_max else 1
    
    return create_user_prompt(user_id, target_prompt["prompt_text"], next_version, True)

def delete_prompt_version(user_id, version):
    """Delete a specific prompt version (cannot delete active)"""
    db = get_db()
    prompts_collection = db["user_prompts"]
    
    result = prompts_collection.delete_one({
        "user_id": ObjectId(user_id),
        "version": version,
        "is_active": False
    })
    
    return result.deleted_count > 0

def get_default_system_prompt():
    """Get the default system prompt for new users"""
    return """You are a medical assistant. Given a user query and a disease markdown, first determine if that markdown contains information that directly answers the query. 
• If it does NOT, respond with {"answer": null, "context": null, "source": null}. 
• If it DOES, extract three things:  
  1) "answer": the minimal excerpt that directly answers the query,  
  2) "context": one or two sentences of surrounding text for additional context,  
  3) "source": the name of the pathway section from which you pulled this.  
Always return valid JSON with exactly these keys: "answer", "context", and "source"."""