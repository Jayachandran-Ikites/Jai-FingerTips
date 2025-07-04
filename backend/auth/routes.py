from flask import Blueprint, request, Flask, jsonify, make_response
from ..models.user import create_user, get_user_by_email, verify_password, create_google_user, get_user_by_google_id, get_user_by_id, update_user_password
from ..auth.utils import generate_token
from ..auth.utils import verify_token
from ..admin.routes import get_user_role
from ..config import SECRET_KEY
import jwt
from jwt import ExpiredSignatureError, InvalidTokenError
from google.oauth2 import id_token
from google.auth.transport import requests
import os
import time
from dotenv import load_dotenv  
load_dotenv() 

# Google OAuth Configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_SECRET_KEY = os.getenv("GOOGLE_SECRET_KEY")

auth_bp = Blueprint("auth", __name__)

def get_cors_headers(origin=None):
    """Get appropriate CORS headers based on origin"""
    allowed_origins = [os.getenv("FRONTEND_ORIGIN")]
    
    if origin and origin in allowed_origins:
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Headers": "Authorization, Content-Type",
            "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        }
    else:
        # Default to localhost:3000 if no valid origin
        return {
            "Access-Control-Allow-Origin": os.getenv("FRONTEND_ORIGIN"),
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Headers": "Authorization, Content-Type",
            "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        }

@auth_bp.route("/signup", methods=["POST", "OPTIONS"])
def signup():
    origin = request.headers.get('Origin')
    
    if request.method == "OPTIONS":
        response = make_response()
        for key, value in get_cors_headers(origin).items():
            response.headers[key] = value
        return response, 200

    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if get_user_by_email(email):
        response = jsonify({"error": "User already exists"})
        for key, value in get_cors_headers(origin).items():
            response.headers[key] = value
        return response, 400

    create_user(email, password)

    # Fetch the created user
    user = get_user_by_email(email)

    # Generate token for the newly created user
    token = generate_token(user["_id"])
    if isinstance(token, bytes):
        token = token.decode("utf-8")
    
    # Send token in cookie and JSON
    response = jsonify({"token": token})
    response.set_cookie("token", token, httponly=True, samesite="Lax", secure=False)
    
    for key, value in get_cors_headers(origin).items():
        response.headers[key] = value
    
    print("Generated token after signup:", token)
    
    return response, 201

@auth_bp.route("/login", methods=["POST", "OPTIONS"])
def login():
    origin = request.headers.get('Origin')
    
    if request.method == "OPTIONS":
        response = make_response()
        for key, value in get_cors_headers(origin).items():
            response.headers[key] = value
        return response, 200

    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    print("Login attempt with email from backend:", email)
    user = get_user_by_email(email)
    print("User fetched from backend:", user)
    
    if not user or not verify_password(user["password"], password):
        response = jsonify({"error": "Invalid credentials"})
        for key, value in get_cors_headers(origin).items():
            response.headers[key] = value
        return response, 401

    token = generate_token(user["_id"])
    if isinstance(token, bytes):
        token = token.decode("utf-8")
    response = jsonify({"token": token})
    response.set_cookie("token", token, httponly=True, samesite="Lax", secure=False)
    
    for key, value in get_cors_headers(origin).items():
        response.headers[key] = value
    
    print("Generated token from backend:", token)
    return response, 200

@auth_bp.route("/google", methods=["POST", "OPTIONS"])
def google_auth():
    origin = request.headers.get('Origin')
    
    if request.method == "OPTIONS":
        response = make_response()
        for key, value in get_cors_headers(origin).items():
            response.headers[key] = value
        return response, 200

    try:
        data = request.get_json()
        credential = data.get("credential")
        
        if not credential:
            response = jsonify({"error": "No credential provided"})
            for key, value in get_cors_headers(origin).items():
                response.headers[key] = value
            return response, 400

        print(f"Received Google credential: {credential[:50]}...")

        # Verify the Google ID token with increased clock skew tolerance
        idinfo = id_token.verify_oauth2_token(
            credential, 
            requests.Request(), 
            GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=300  # Allow 5 minutes clock skew
        )

        # Extract user information from Google
        google_id = idinfo.get('sub')
        email = idinfo.get('email')
        name = idinfo.get('name')
        picture = idinfo.get('picture')
        
        if not google_id or not email:
            response = jsonify({"error": "Invalid Google token"})
            for key, value in get_cors_headers(origin).items():
                response.headers[key] = value
            return response, 400

        print(f"Google auth attempt: {email}, Google ID: {google_id}")

        # Check if user exists by Google ID first
        user = get_user_by_google_id(google_id)
        
        if not user:
            # Check if user exists by email (for linking accounts)
            existing_user = get_user_by_email(email)
            if existing_user:
                # Link Google account to existing email account
                from models.user import update_user_google_id
                update_user_google_id(existing_user['_id'], google_id, name, picture)
                user = get_user_by_email(email)
            else:
                # Create new Google user
                user = create_google_user(
                    email=email,
                    google_id=google_id,
                    name=name,
                    picture=picture
                )
        
        # Generate JWT token
        token = generate_token(user["_id"])
        if isinstance(token, bytes):
            token = token.decode("utf-8")
        
        # Create response
        response = jsonify({
            "token": token,
            "user": {
                "id": str(user["_id"]),
                "email": user["email"],
                "name": user.get("name", ""),
                "picture": user.get("picture", ""),
                "auth_type": "google"
            }
        })
        
        # Set HTTP-only cookie
        response.set_cookie("token", token, httponly=True, samesite="Lax", secure=False)
        
        # Add CORS headers
        for key, value in get_cors_headers(origin).items():
            response.headers[key] = value
        
        print("Generated token for Google user:", token)
        return response, 200
        
    except ValueError as e:
        print(f"Google token verification failed: {e}")
        response = jsonify({"error": f"Invalid Google token: {str(e)}"})
        for key, value in get_cors_headers(origin).items():
            response.headers[key] = value
        return response, 401
    except Exception as e:
        print(f"Google auth error: {e}")
        response = jsonify({"error": "Google authentication failed"})
        for key, value in get_cors_headers(origin).items():
            response.headers[key] = value
        return response, 500  

@auth_bp.route("/verify", methods=["GET", "OPTIONS"])
def verify():
    origin = request.headers.get('Origin')
    
    if request.method == "OPTIONS":
        response = make_response()
        for key, value in get_cors_headers(origin).items():
            response.headers[key] = value
        return response, 200

    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        response = jsonify({"success": False, "message": "Missing token"})
        for key, value in get_cors_headers(origin).items():
            response.headers[key] = value
        return response, 401
    
    try:
        # Use the updated verify_token function with leeway
        user_id = verify_token(token)
        if user_id:
            response = jsonify(
                {
                    "success": True,
                    "user_id": user_id,
                    "user_role": get_user_role(user_id),
                }
            )
            for key, value in get_cors_headers(origin).items():
                response.headers[key] = value
            return response, 200
        else:
            response = jsonify({"success": False, "message": "Invalid token"})
            for key, value in get_cors_headers(origin).items():
                response.headers[key] = value
            return response, 401
    except Exception as e:
        print(f"Token verification error: {e}")
        response = jsonify({"success": False, "message": "Token verification failed"})
        for key, value in get_cors_headers(origin).items():
            response.headers[key] = value
        return response, 401

@auth_bp.route("/logout", methods=["POST", "OPTIONS"])
def logout():
    origin = request.headers.get('Origin')
    
    if request.method == "OPTIONS":
        response = make_response()
        for key, value in get_cors_headers(origin).items():
            response.headers[key] = value
        return response, 200

    print("Logging out user from backend")
    response = jsonify({"message": "Logged out successfully from the server"})
    response.set_cookie("token", "", expires=0)  # Clear cookie if used
    
    for key, value in get_cors_headers(origin).items():
        response.headers[key] = value
    
    return response, 200

@auth_bp.route("/reset-password", methods=["POST", "OPTIONS"])
def reset_password():
    origin = request.headers.get('Origin')
    if request.method == "OPTIONS":
        response = make_response()
        for key, value in get_cors_headers(origin).items():
            response.headers[key] = value
        return response, 200

    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        response = jsonify({"success": False, "error": "Missing token"})
        for key, value in get_cors_headers(origin).items():
            response.headers[key] = value
        return response, 401

    try:
        user_id = verify_token(token)
        if not user_id:
            response = jsonify({"success": False, "error": "Invalid token"})
            for key, value in get_cors_headers(origin).items():
                response.headers[key] = value
            return response, 401
        from ..models.user import get_user_by_id, update_user_password
        user = get_user_by_id(user_id)
        if not user:
            response = jsonify({"success": False, "error": "User not found"})
            for key, value in get_cors_headers(origin).items():
                response.headers[key] = value
            return response, 404
        data = request.get_json()
        old_password = data.get("old_password")
        new_password = data.get("new_password")
        if not old_password or not new_password:
            response = jsonify({"success": False, "error": "Missing old or new password"})
            for key, value in get_cors_headers(origin).items():
                response.headers[key] = value
            return response, 400
        if not verify_password(user["password"], old_password):
            response = jsonify({"success": False, "error": "Old password is incorrect"})
            for key, value in get_cors_headers(origin).items():
                response.headers[key] = value
            return response, 400
        update_user_password(user_id, new_password)
        response = jsonify({"success": True, "message": "Password reset successful"})
        for key, value in get_cors_headers(origin).items():
            response.headers[key] = value
        return response, 200
    except Exception as e:
        print(f"Password reset error: {e}")
        response = jsonify({"success": False, "error": "Password reset failed"})
        for key, value in get_cors_headers(origin).items():
            response.headers[key] = value
        return response, 500

@auth_bp.route("/user/<user_id>", methods=["GET", "OPTIONS", "PATCH"])
def get_or_update_user_details(user_id):
    origin = request.headers.get('Origin')
    if request.method == "OPTIONS":
        response = make_response()
        for key, value in get_cors_headers(origin).items():
            response.headers[key] = value
        return response, 200

    from ..models.user import get_user_by_id
    if request.method == "GET":
        user = get_user_by_id(user_id)
        if not user:
            response = jsonify({"error": "User not found"})
            for key, value in get_cors_headers(origin).items():
                response.headers[key] = value
            return response, 404
        user.pop("password", None)
        if "_id" in user:
            user["_id"] = str(user["_id"])
        response = jsonify(user)
        for key, value in get_cors_headers(origin).items():
            response.headers[key] = value
        return response, 200

    elif request.method == "PATCH":
        from ..models.user import update_user_google_id
        from ..models.user import get_user_by_id
        db_update_fields = {}
        data = request.get_json()
        # Only allow updating certain fields
        allowed_fields = ["name", "picture", "email"]
        for field in allowed_fields:
            if field in data:
                db_update_fields[field] = data[field]
        if not db_update_fields:
            response = jsonify({"error": "No valid fields to update"})
            for key, value in get_cors_headers(origin).items():
                response.headers[key] = value
            return response, 400
        # Update user in DB
        from ..database import get_db
        from bson import ObjectId
        db = get_db()
        users_collection = db["users"]
        users_collection.update_one({"_id": ObjectId(user_id)}, {"$set": db_update_fields})
        user = get_user_by_id(user_id)
        user.pop("password", None)
        if "_id" in user:
            user["_id"] = str(user["_id"])
        response = jsonify(user)
        for key, value in get_cors_headers(origin).items():
            response.headers[key] = value
        return response, 200

