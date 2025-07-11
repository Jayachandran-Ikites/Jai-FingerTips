from venv import logger
from flask import Blueprint, request, jsonify
from datetime import datetime
from bson import ObjectId
from ..database import get_db
import logging
from ..app import socketio
from ..auth.utils import verify_token

notifications_bp = Blueprint("notifications", __name__)

@notifications_bp.route("/notifications", methods=["GET"])
def get_user_notifications():
    logger.info("Fetching user notifications")
    """Get notifications for the current user"""
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return jsonify({"error": "Missing token"}), 401
    
    token = auth_header.split(" ")[1]
    user_id = verify_token(token)
    if not user_id:
        return jsonify({"error": "Invalid or expired token"}), 403
    
    try:
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 20))
        unread_only = request.args.get("unread_only", "false").lower() == "true"
        
        db = get_db()
        notifications = db["notifications"]
        
        # Build query
        query = {"user_id": ObjectId(user_id)}
        if unread_only:
            query["read"] = False
        
        # Get total count
        total = notifications.count_documents(query)
        unread_count = notifications.count_documents({"user_id": ObjectId(user_id), "read": False})
        
        # Get notifications with pagination
        skip = (page - 1) * limit
        notif_list = list(notifications.find(query).sort("created_at", -1).skip(skip).limit(limit))
        
        # Format data
        for notif in notif_list:
            notif["_id"] = str(notif["_id"])
            notif["user_id"] = str(notif["user_id"])
            notif["created_by"] = str(notif["created_by"])
            if "created_at" in notif:
                notif["created_at"] = notif["created_at"].isoformat()
        
        return jsonify({
            "notifications": notif_list,
            "total": total,
            "unread_count": unread_count,
            "page": page,
            "pages": (total + limit - 1) // limit
        })
    except Exception as e:
        logging.error(f"Get user notifications error: {e}")
        return jsonify({"error": "Failed to fetch notifications"}), 500

@notifications_bp.route("/notifications/subscribe", methods=["GET"])
def subscribe_to_notifications():
    """Subscribe to notifications via WebSocket"""
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return jsonify({"error": "Missing token"}), 401
    
    token = auth_header.split(" ")[1]
    user_id = verify_token(token)
    if not user_id:
        return jsonify({"error": "Invalid or expired token"}), 403
    
    return jsonify({"success": True, "user_id": user_id})

@notifications_bp.route("/notifications/poll", methods=["GET"])
def get_user_notifications_poll():
    """Get notifications for the current user (legacy polling method)"""
    logger.info("Fetching user notifications")
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return jsonify({"error": "Missing token"}), 401
    
    token = auth_header.split(" ")[1]
    user_id = verify_token(token)
    if not user_id:
        return jsonify({"error": "Invalid or expired token"}), 403
    
    try:
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 20))
        unread_only = request.args.get("unread_only", "false").lower() == "true"
        
        db = get_db()
        notifications = db["notifications"]
        
        # Build query
        query = {"user_id": ObjectId(user_id)}
        if unread_only:
            query["read"] = False
        
        # Get notifications with pagination
        skip = (page - 1) * limit
        total = notifications.count_documents(query)
        unread_count = notifications.count_documents({"user_id": ObjectId(user_id), "read": False})
        notif_list = list(notifications.find(query).sort("created_at", -1).skip(skip).limit(limit))
        
        # Format data
        for notif in notif_list:
            notif["_id"] = str(notif["_id"])
            notif["user_id"] = str(notif["user_id"])
            notif["created_by"] = str(notif["created_by"])
            if "created_at" in notif:
                notif["created_at"] = notif["created_at"].isoformat()
        
        return jsonify({
            "notifications": notif_list,
            "total": total,
            "unread_count": unread_count,
            "page": page,
            "pages": (total + limit - 1) // limit
        })
    except Exception as e:
        logging.error(f"Get user notifications error: {e}")
        return jsonify({"error": "Failed to fetch notifications"}), 500

@notifications_bp.route("/notifications/<notification_id>/read", methods=["POST"])
def mark_notification_read(notification_id):
    print("TEST")
    """Mark a notification as read"""
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return jsonify({"error": "Missing token"}), 401
    
    token = auth_header.split(" ")[1]
    user_id = verify_token(token)
    if not user_id:
        return jsonify({"error": "Invalid or expired token"}), 403
    
    try:
        db = get_db()
        notifications = db["notifications"]
        
        result = notifications.update_one(
            {"_id": ObjectId(notification_id), "user_id": ObjectId(user_id)},
            {"$set": {"read": True, "read_at": datetime.utcnow()}}
        )
        
        # Emit WebSocket event to update notification count
        if result.matched_count > 0:
            db = get_db()
            notifications = db["notifications"]
            unread_count = notifications.count_documents({"user_id": ObjectId(user_id), "read": False})
            socketio.emit(f'notification_update_{user_id}', {'unread_count': unread_count})
        
        if result.matched_count == 0:
            return jsonify({"error": "Notification not found"}), 404
        
        return jsonify({"message": "Notification marked as read"})
    except Exception as e:
        logging.error(f"Mark notification read error: {e}")
        return jsonify({"error": "Failed to mark notification as read"}), 500

@notifications_bp.route("/notifications/read-all", methods=["POST"])
def mark_all_notifications_read():
    """Mark all notifications as read for the current user"""
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return jsonify({"error": "Missing token"}), 401
    
    token = auth_header.split(" ")[1]
    user_id = verify_token(token)
    if not user_id:
        return jsonify({"error": "Invalid or expired token"}), 403
    
    try:
        db = get_db()
        notifications = db["notifications"]
        
        result = notifications.update_many(
            {"user_id": ObjectId(user_id), "read": False},
            {"$set": {"read": True, "read_at": datetime.utcnow()}}
        )
        
        # Emit WebSocket event to update notification count
        socketio.emit(f'notification_update_{user_id}', {'unread_count': 0})
        
        return jsonify({
            "message": f"Marked {result.modified_count} notifications as read"
        })
    except Exception as e:
        logging.error(f"Mark all notifications read error: {e}")
        return jsonify({"error": "Failed to mark notifications as read"}), 500

@notifications_bp.route("/notifications/<notification_id>", methods=["DELETE"])
def delete_notification(notification_id):
    """Delete a notification"""
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return jsonify({"error": "Missing token"}), 401
    
    token = auth_header.split(" ")[1]
    user_id = verify_token(token)
    if not user_id:
        return jsonify({"error": "Invalid or expired token"}), 403
    
    try:
        db = get_db()
        notifications = db["notifications"]
        
        result = notifications.delete_one({
            "_id": ObjectId(notification_id),
            "user_id": ObjectId(user_id)
        })
        
        if result.deleted_count == 0:
            return jsonify({"error": "Notification not found"}), 404
        
        # Emit WebSocket event to update notification count
        unread_count = notifications.count_documents({"user_id": ObjectId(user_id), "read": False})
        socketio.emit(f'notification_update_{user_id}', {'unread_count': unread_count})
        
        return jsonify({"message": "Notification deleted"})
    except Exception as e:
        logging.error(f"Delete notification error: {e}")
        return jsonify({"error": "Failed to delete notification"}), 500