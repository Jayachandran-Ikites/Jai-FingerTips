import bcrypt
from ..database import get_db
from bson import ObjectId
import time

def create_user(email, password):
    """Create a new user with email and password"""
    db = get_db()
    users_collection = db["users"]
    hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    user = {
        "email": email, 
        "password": hashed_pw,
        "auth_type": "email",
        "created_at": int(time.time()),
        "updated_at": int(time.time())
    }
    result = users_collection.insert_one(user)
    return result.inserted_id

def create_google_user(email, google_id, name=None, picture=None):
    """Create a new user with Google OAuth"""
    db = get_db()
    users_collection = db["users"]
    
    user_data = {
        'email': email,
        'google_id': google_id,
        'name': name,
        'picture': picture,
        'auth_type': 'google',
        'created_at': int(time.time()),
        'updated_at': int(time.time())
    }
    
    # Insert the user
    result = users_collection.insert_one(user_data)
    
    # Return the created user
    return users_collection.find_one({'_id': result.inserted_id})

def get_user_by_email(email):
    db = get_db()
    users_collection = db["users"]
    return users_collection.find_one({"email": email})

def get_user_by_google_id(google_id):
    """Get user by Google ID"""
    db = get_db()
    users_collection = db["users"]
    return users_collection.find_one({'google_id': google_id})

def get_user_by_id(user_id):
    """Get user by MongoDB ObjectId"""
    db = get_db()
    users_collection = db["users"]
    try:
        return users_collection.find_one({'_id': ObjectId(user_id)})
    except:
        return None

def verify_password(stored_password, provided_password):
    return bcrypt.checkpw(provided_password.encode('utf-8'), stored_password)

def update_user_google_id(user_id, google_id, name=None, picture=None):
    """Link Google account to existing user"""
    db = get_db()
    users_collection = db["users"]
    
    update_data = {
        'google_id': google_id,
        'updated_at': int(time.time())
    }
    
    if name:
        update_data['name'] = name
    if picture:
        update_data['picture'] = picture
        
    return users_collection.update_one(
        {'_id': ObjectId(user_id)},
        {'$set': update_data}
    )

def find_or_create_google_user(email, google_id, name=None, picture=None):
    """Find existing user by email or create new Google user"""
    # First check if user exists with this Google ID
    user = get_user_by_google_id(google_id)
    if user:
        return user
    
    # Check if user exists with this email
    existing_user = get_user_by_email(email)
    if existing_user:
        # Link Google account to existing user
        update_user_google_id(existing_user['_id'], google_id, name, picture)
        return get_user_by_id(existing_user['_id'])
    
    # Create new Google user
    return create_google_user(email, google_id, name, picture)
