from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
from .main import answer_medical_query, generate_conversation_title
from ..auth.utils import verify_token
from ..database import get_db 

chat_bp = Blueprint("chat", __name__)

@chat_bp.route("/chat", methods=["POST"])
def chat():
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return jsonify({"error": "Missing token"}), 401
    token = auth_header.split(" ")[1]
    user_id = verify_token(token)
    if not user_id:
        return jsonify({"error": "Invalid or expired token"}), 403

    data = request.get_json()
    user_message = data.get("message")
    conversation_id = data.get("conversation_id")
    if not user_message:
        return jsonify({"error": "Message is required"}), 400

    db = get_db()
    conversations = db["conversations"]

    # Create or load conversation
    if not conversation_id:
        title = generate_conversation_title(user_message)
        conversation_id = conversations.insert_one({
            "user_id": ObjectId(user_id),
            "messages": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "title": title
        }).inserted_id
        history = []
    else:
        convo = conversations.find_one({
            "_id": ObjectId(conversation_id),
            "user_id": ObjectId(user_id)
        })
        if not convo:
            return jsonify({"error": "Conversation not found"}), 404
        history = [
            {"role": "user" if m["sender"]=="user" else "assistant", "content": m["text"]}
            for m in convo.get("messages", [])
        ]

    bot_reply = answer_medical_query(user_message, history)

    # Save messages
    conversations.update_one(
        {"_id": ObjectId(conversation_id)},
        {
            "$push": {"messages": {"$each": [
                {"sender": "user", "text": user_message, "timestamp": datetime.utcnow()},
                {"sender": "bot",  "text": bot_reply,    "timestamp": datetime.utcnow()}
            ]}},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )

    updated = conversations.find_one({"_id": ObjectId(conversation_id)})
    history_resp = [
        {"role": "user" if m["sender"] == "user" else "assistant", "content": m["text"], "timestamp": m["timestamp"].isoformat()}
        for m in updated.get("messages", [])
    ]

    return jsonify({
        "reply": bot_reply,
        "conversation_id": str(conversation_id),
        "history": history_resp
    })


@chat_bp.route("/chat/new", methods=["POST"])
def new_chat():
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return jsonify({"error": "Missing token"}), 401

    token = auth_header.split(" ")[1]
    user_id = verify_token(token)
    if not user_id:
        return jsonify({"error": "Invalid or expired token"}), 403

    db = get_db()
    conversations = db["conversations"]

    conversation_id = conversations.insert_one({
        "user_id": ObjectId(user_id),
        "messages": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "title": "New Chat"  # Default title for new conversations
    }).inserted_id

    return jsonify({
        "message": "New conversation created",
        "conversation_id": str(conversation_id)
    })

@chat_bp.route("/chat/history", methods=["GET"])
def get_conversation_history():
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return jsonify({"error": "Missing token"}), 401

    token = auth_header.split(" ")[1]
    user_id = verify_token(token)
    if not user_id:
        return jsonify({"error": "Invalid or expired token"}), 403

    db = get_db()
    conversations = db["conversations"]

    history = conversations.find(
        {"user_id": ObjectId(user_id)},
        {"messages": 0}  # Exclude full messages
    ).sort("updated_at", -1)

    result = [{
        "conversation_id": str(conv["_id"]),
        "title": conv.get("title", "Untitled Chat"),
        "created_at": conv["created_at"].isoformat(),
        "updated_at": conv["updated_at"].isoformat()
    } for conv in history]

    return jsonify(result)

# Get previous messages in a conversation
@chat_bp.route("/chat/conversation/<conversation_id>", methods=["GET"])
def get_conversation_messages(conversation_id):
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return jsonify({"error": "Missing token"}), 401

    token = auth_header.split(" ")[1]
    print("Token received in chat route:", token)
    user_id = verify_token(token)
    if not user_id:
        return jsonify({"error": "Invalid or expired token"}), 403

    db = get_db()
    conversations = db["conversations"]

    conversation = conversations.find_one({
        "_id": ObjectId(conversation_id),
        "user_id": ObjectId(user_id)
    })

    if not conversation:
        return jsonify({"error": "Conversation not found"}), 404

    messages = conversation.get("messages", [])
    
    # Convert messages to frontend format
    history = []
    for msg in messages:
        history.append({
            "role": "user" if msg["sender"] == "user" else "assistant",
            "content": msg["text"],
            "timestamp": msg["timestamp"].isoformat() if msg["timestamp"] else None
        })
    
    return jsonify({
        "conversation_id": str(conversation["_id"]),
        "title": conversation.get("title", "Untitled Chat"),
        "messages": messages,  # Keep original format for backward compatibility
        "history": history     # Add converted format for frontend
    })

# Add endpoint to delete conversation
@chat_bp.route("/chat/conversation/<conversation_id>", methods=["DELETE"])
def delete_conversation(conversation_id):
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return jsonify({"error": "Missing token"}), 401

    token = auth_header.split(" ")[1]
    user_id = verify_token(token)
    if not user_id:
        return jsonify({"error": "Invalid or expired token"}), 403

    db = get_db()
    conversations = db["conversations"]

    # Verify the conversation belongs to this user before deleting
    result = conversations.delete_one({
        "_id": ObjectId(conversation_id),
        "user_id": ObjectId(user_id)
    })

    if result.deleted_count == 0:
        return jsonify({"error": "Conversation not found"}), 404

    return jsonify({"message": "Conversation deleted successfully"})

# Add endpoint to rename conversation
@chat_bp.route("/chat/conversation/<conversation_id>", methods=["PATCH"])
def rename_conversation(conversation_id):
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return jsonify({"error": "Missing token"}), 401

    token = auth_header.split(" ")[1]
    user_id = verify_token(token)
    if not user_id:
        return jsonify({"error": "Invalid or expired token"}), 403

    data = request.get_json()
    new_title = data.get("title")
    
    if not new_title:
        return jsonify({"error": "Title is required"}), 400

    db = get_db()
    conversations = db["conversations"]

    # Update the conversation title
    result = conversations.update_one(
        {
            "_id": ObjectId(conversation_id),
            "user_id": ObjectId(user_id)
        },
        {
            "$set": {
                "title": new_title,
                "updated_at": datetime.utcnow()
            }
        }
    )

    if result.matched_count == 0:
        return jsonify({"error": "Conversation not found"}), 404

    return jsonify({"message": "Conversation renamed successfully"})