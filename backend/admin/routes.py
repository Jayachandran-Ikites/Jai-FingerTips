from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, timedelta
from bson import ObjectId
from ..auth.utils import verify_token
from ..database import get_db
import logging
from ..routes.reviews import require_reviewer_or_admin
from collections import defaultdict
from ..socketio_instance import socketio

admin_bp = Blueprint("admin", __name__)

def is_admin(user_id):
    """Check if user is admin"""
    db = get_db()
    users = db["users"]
    user = users.find_one({"_id": ObjectId(user_id)})
    return user and user.get("role") == "admin"

def get_user_role(user_id):
    """Check if user is admin"""
    db = get_db()
    users = db["users"]
    user = users.find_one({"_id": ObjectId(user_id)})
    return user and user.get("role")

def admin_required(f):
    """Decorator to require admin access"""
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"error": "Missing token"}), 401
        
        token = auth_header.split(" ")[1]
        user_id = verify_token(token)
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 403
        
        if not is_admin(user_id):
            return jsonify({"error": "Admin access required"}), 403
        
        return f(user_id, *args, **kwargs)
    
    decorated_function.__name__ = f.__name__
    return decorated_function

@admin_bp.route("/dashboard", methods=["GET"])
@admin_required
def get_dashboard_stats(admin_user_id):
    """Get dashboard statistics"""
    try:
        db = get_db()
        users = db["users"]
        conversations = db["conversations"]
        notifications = db["notifications"]
        
        # Get date ranges
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        ninety_days_ago = today - timedelta(days=90)
        
        # User statistics
        total_users = users.count_documents({})
        new_users_today = users.count_documents({"created_at": {"$gte": today.timestamp()}})
        new_users_week = users.count_documents({"created_at": {"$gte": week_ago.timestamp()}})
        new_users_month = users.count_documents({"created_at": {"$gte": month_ago.timestamp()}})
        new_users_ninety_days = users.count_documents(
            {"created_at": {"$gte": ninety_days_ago.timestamp()}}
        )
        # Conversation statistics
        total_conversations = conversations.count_documents({})
        conversations_today = conversations.count_documents({"created_at": {"$gte": today}})
        conversations_week = conversations.count_documents({"created_at": {"$gte": week_ago}})
        conversations_month = conversations.count_documents({"created_at": {"$gte": month_ago}})
        conversations_ninety_days = conversations.count_documents({"created_at": {"$gte": ninety_days_ago}})
        # Message statistics
        total_messages = 0
        messages_today = 0
        messages_week = 0
        messages_month = 0
        messages_ninety_days = 0
        
        # Growth maps for charting
        conversation_growth_map = defaultdict(int)
        message_growth_map = defaultdict(int)
                
        for conv in conversations.find({}):
            # Conversation growth (based on created_at)
            conv_time = conv.get("created_at")
            if isinstance(conv_time, datetime) and conv_time >= ninety_days_ago:
                date_key = conv_time.strftime("%Y-%m-%d")
                conversation_growth_map[date_key] += 1
                
            messages = conv.get("messages", [])
            total_messages += len(messages)
            
            for msg in messages:
                msg_time = msg.get("timestamp", datetime.utcnow())
                if isinstance(msg_time, str):
                    continue
                date_key = msg_time.strftime("%Y-%m-%d")   
                if msg_time >= today:
                    messages_today += 1
                if msg_time >= week_ago:
                    messages_week += 1
                if msg_time >= month_ago:
                    messages_month += 1
                if msg_time >= ninety_days_ago:
                    messages_ninety_days += 1
                    message_growth_map[date_key] += 1

        # Notification statistics
        total_notifications = notifications.count_documents({})
        unread_notifications = notifications.count_documents({"read": False})
        
        # User growth data for chart (last 90 days)
        user_growth = []
        for i in range(90):
            date = today - timedelta(days=i)
            count = users.count_documents({"created_at": {"$gte": date.timestamp(), "$lt": (date + timedelta(days=1)).timestamp()}})
            user_growth.append({
                "date": date.strftime("%Y-%m-%d"),
                "count": count
            })
        user_growth.reverse()
        
        conversation_growth = []
        for i in range(90):
            date = today - timedelta(days=i)
            date_str = date.strftime("%Y-%m-%d")
            conversation_growth.append(
                {"date": date_str, "count": conversation_growth_map.get(date_str, 0)}
            )
        conversation_growth.reverse()
        
        # Message growth for last 90 days
        message_growth = []
        for i in range(90):
            date = today - timedelta(days=i)
            date_str = date.strftime("%Y-%m-%d")
            message_growth.append(
                {"date": date_str, "count": message_growth_map.get(date_str, 0)}
            )
        message_growth.reverse()
        
        return jsonify({
            "users": {
                "total": total_users,
                "today": new_users_today,
                "week": new_users_week,
                "month": new_users_month,
                "ninety_days": new_users_ninety_days,
                "growth": user_growth
            },
            "conversations": {
                "total": total_conversations,
                "today": conversations_today,
                "week": conversations_week,
                "month": conversations_month,
                "ninety_days": conversations_ninety_days,
                "growth": conversation_growth
            },
            "messages": {
                "total": total_messages,
                "today": messages_today,
                "week": messages_week,
                "month": messages_month,
                "ninety_days": messages_ninety_days,
                "growth": message_growth
            },
            "notifications": {
                "total": total_notifications,
                "unread": unread_notifications

            }
        })
    except Exception as e:
        logging.error(f"Dashboard stats error: {e}")
        return jsonify({"error": "Failed to fetch dashboard stats"}), 500

@admin_bp.route("/users", methods=["GET"])
@require_reviewer_or_admin
def get_users(admin_user_id):
    """Get all users with pagination"""
    try:
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 20))
        search = request.args.get("search", "")
        
        db = get_db()
        users = db["users"]
        
        # Build query
        query = {}
        if search:
            query["$or"] = [
                {"email": {"$regex": search, "$options": "i"}},
                {"name": {"$regex": search, "$options": "i"}}
            ]
        
        # Get total count
        total = users.count_documents(query)
        
        # Get users with pagination
        skip = (page - 1) * limit
        user_list = list(users.find(query, {"password": 0}).sort("created_at", -1).skip(skip).limit(limit))
        
        # Convert ObjectId to string and format dates
        for user in user_list:
            user["_id"] = str(user["_id"])
            if "created_at" in user:
                user["created_at"] = datetime.fromtimestamp(user["created_at"]).isoformat()
            if "updated_at" in user:
                user["updated_at"] = datetime.fromtimestamp(user["updated_at"]).isoformat()
        
        return jsonify({
            "users": user_list,
            "total": total,
            "page": page,
            "pages": (total + limit - 1) // limit
        })
    except Exception as e:
        logging.error(f"Get users error: {e}")
        return jsonify({"error": "Failed to fetch users"}), 500

@admin_bp.route("/users/<user_id>", methods=["GET"])
@admin_required
def get_user_details(admin_user_id, user_id):
    """Get detailed user information"""
    try:
        db = get_db()
        users = db["users"]
        conversations = db["conversations"]
        
        # Get user
        user = users.find_one({"_id": ObjectId(user_id)}, {"password": 0})
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Get user's conversations
        user_conversations = list(conversations.find(
            {"user_id": ObjectId(user_id)},
            {"messages": 0}
        ).sort("updated_at", -1))
        
        # Count messages
        total_messages = 0
        for conv in conversations.find({"user_id": ObjectId(user_id)}):
            total_messages += len(conv.get("messages", []))
        
        # Format data
        user["_id"] = str(user["_id"])
        if "created_at" in user:
            user["created_at"] = user["created_at"]
        if "updated_at" in user:
            user["updated_at"] = user["updated_at"]
        
        for conv in user_conversations:
            conv["_id"] = str(conv["_id"])
            conv["user_id"] = str(conv["user_id"])
            if "created_at" in conv:
                conv["created_at"] = conv["created_at"].isoformat()
            if "updated_at" in conv:
                conv["updated_at"] = conv["updated_at"].isoformat()
        
        return jsonify({
            "user": user,
            "conversations": user_conversations,
            "total_conversations": len(user_conversations),
            "total_messages": total_messages
        })
    except Exception as e:
        logging.error(f"Get user details error: {e}")
        return jsonify({"error": "Failed to fetch user details"}), 500

@admin_bp.route("/conversations", methods=["GET"])
def get_conversations():
    """Get all conversations with pagination"""
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"error": "Missing token"}), 401
        
        token = auth_header.split(" ")[1]
        user_id = verify_token(token)
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 403
        
        # Check if user is admin or reviewer
        user_role = get_user_role(user_id)
        if user_role not in ["admin", "reviewer"]:
            return jsonify({"error": "Admin or reviewer access required"}), 403
        
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 20))
        user_id_filter = request.args.get("user_id")
        date_filter = request.args.get("date")
        search = request.args.get("search", "")
        
        db = get_db()
        conversations = db["conversations"]
        users = db["users"]
        
        # Build query
        query = {}
        if user_id_filter:
            query["user_id"] = ObjectId(user_id_filter)
        
        if date_filter:
            date_obj = datetime.fromisoformat(date_filter)
            next_day = date_obj + timedelta(days=1)
            query["created_at"] = {"$gte": date_obj, "$lt": next_day}
        
        if search:
            query["title"] = {"$regex": search, "$options": "i"}
        
        # Get total count
        total = conversations.count_documents(query)
        
        # Get conversations with pagination
        skip = (page - 1) * limit
        conv_list = list(conversations.find(query).sort("updated_at", -1).skip(skip).limit(limit))
        
        # Enrich with user data
        for conv in conv_list:
            user = users.find_one({"_id": conv["user_id"]})
            conv["_id"] = str(conv["_id"])
            conv["user_id"] = str(conv["user_id"])
            
            # Get user info
            print("USER",user)
            conv["user"] = {
                # "email": user.get("email", "Unknown") if user else "Unknown",
                "name": user.get("name", "Unknown") if user else "Unknown",
            }
            
            # Count messages
            conv["message_count"] = len(conv.get("messages", []))
            
            # Format dates
            if "created_at" in conv:
                conv["created_at"] = conv["created_at"].isoformat()
            if "updated_at" in conv:
                conv["updated_at"] = conv["updated_at"].isoformat()
            
            # Remove messages for list view
            conv.pop("messages", None)
        
        return jsonify({
            "conversations": conv_list,
            "total": total,
            "page": page,
            "pages": (total + limit - 1) // limit
        })
    except Exception as e:
        logging.error(f"Get conversations error: {e}")
        return jsonify({"error": "Failed to fetch conversations"}), 500

@admin_bp.route("/conversations/<conversation_id>", methods=["GET"])
def get_conversation_details(conversation_id):
    """Get detailed conversation information"""
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"error": "Missing token"}), 401
        
        token = auth_header.split(" ")[1]
        user_id = verify_token(token)
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 403
        
        # Check if user is admin or reviewer
        user_role = get_user_role(user_id)
        if user_role not in ["admin", "reviewer"]:
            return jsonify({"error": "Admin or reviewer access required"}), 403
        
        db = get_db()
        conversations = db["conversations"]
        users = db["users"]
        
        # Get conversation
        conv = conversations.find_one({"_id": ObjectId(conversation_id)})
        if not conv:
            return jsonify({"error": "Conversation not found"}), 404
        
        # Get user info
        user = users.find_one({"_id": conv["user_id"]}, {"email": 1, "name": 1, "created_at": 1})
        
        # Format data
        conv["_id"] = str(conv["_id"])
        conv["user_id"] = str(conv["user_id"])
        conv["user"] = {
            "email": user.get("email", "Unknown") if user else "Unknown",
            "name": user.get("name", "") if user else "",
            "created_at": datetime.fromtimestamp(user.get("created_at", 0)).isoformat() if user and user.get("created_at") else None
        }
        
        # Format messages
        for msg in conv.get("messages", []):
            if "timestamp" in msg and msg["timestamp"]:
                msg["timestamp"] = msg["timestamp"].isoformat()
        
        # Format dates
        if "created_at" in conv:
            conv["created_at"] = conv["created_at"].isoformat()
        if "updated_at" in conv:
            conv["updated_at"] = conv["updated_at"].isoformat()
        
        return jsonify(conv)
    except Exception as e:
        logging.error(f"Get conversation details error: {e}")
        return jsonify({"error": "Failed to fetch conversation details"}), 500


@admin_bp.route("/notifications", methods=["POST"])
@admin_required
def send_notification(admin_user_id):
    """Send a notification to users (all, user, or multiple)."""
    try:
        data = request.get_json()
        title = data.get("title")
        message = data.get("message")
        notification_type = data.get("type", "info")  # info, warning, success, error
        target_type = data.get("target_type", "all")  # all, user, multiple
        target_users = data.get("target_users", [])

        if not title or not message:
            return jsonify({"error": "Title and message are required"}), 400

        db = get_db()
        notifications = db["notifications"]
        users = db["users"]

        admin = users.find_one({"_id": ObjectId(admin_user_id)})
        admin_name = admin.get("name", "") if admin else ""
        admin_email = admin.get("email", "") if admin else ""

        # Create base notification document
        notification = {
            "title": title,
            "message": message,
            "type": notification_type,
            "target": target_type,
            "created_by": ObjectId(admin_user_id),
            "created_by_name": admin_name or admin_email,
            "created_at": datetime.utcnow(),
            "read_by": [],
            "hidden_by": [],
        }

        # Assign target users
        if target_type == "all":
            pass
        elif target_type == "user" and len(target_users) == 1:
            notification["user_id"] = ObjectId(target_users[0])
        elif target_type == "multiple" and target_users:
            notification["user_ids"] = [ObjectId(uid) for uid in target_users]
        else:
            return jsonify({"error": "Invalid target configuration"}), 400

        result = notifications.insert_one(notification)

        # Emit via socket
        if target_type == "all":
            for user in users.find({}, {"_id": 1}):
                uid = str(user["_id"])
                socketio.emit(
                    f"new_notification_{uid}",
                    {
                        "title": title,
                        "message": message,
                        "type": notification_type,
                        "created_at": notification["created_at"].isoformat(),
                        "unread_count": None,  # Optionally compute
                    },
                )

        else:
            target_ids = (
                [ObjectId(target_users[0])]
                if target_type == "user"
                else [ObjectId(uid) for uid in target_users]
            )
            for user_id in target_ids:
                socketio.emit(
                    f"new_notification_{str(user_id)}",
                    {
                        "title": title,
                        "message": message,
                        "type": notification_type,
                        "created_at": notification["created_at"].isoformat(),
                        "unread_count": None,
                    },
                )

        return jsonify(
            {
                "message": "Notification sent successfully",
                "notification_id": str(result.inserted_id),
            }
        )

    except Exception as e:
        logging.error(f"Send notification error: {e}")
        return jsonify({"error": "Failed to send notification"}), 500
    
@admin_bp.route("/notifications", methods=["GET"])
@admin_required
def get_notifications(admin_user_id):
    """Fetch notifications with pagination and optional filters."""
    try:
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 20))
        filter_user_id = request.args.get("user_id", "")
        notif_type = request.args.get("type", "")

        db = get_db()
        notifications = db["notifications"]
        users = db["users"]

        query = {}

        # Optional: Filter by user ID
        if filter_user_id:
            user_obj_id = ObjectId(filter_user_id)
            query["$or"] = [
                {"target": "all"},
                {"target": "user", "user_id": user_obj_id},
                {"target": "multiple", "user_ids": user_obj_id},
            ]

        if notif_type:
            query["type"] = notif_type

        skip = (page - 1) * limit
        notif_cursor = (
            notifications.find(query).sort("created_at", -1).skip(skip).limit(limit)
        )
        notif_list = list(notif_cursor)

        total = notifications.count_documents(query)

        # Enhance each notification
        for notif in notif_list:
            notif["_id"] = str(notif["_id"])
            notif["created_by"] = str(notif["created_by"])
            notif["user_id"] = str(notif.get("user_id", ""))
            notif["user_ids"] = [str(uid) for uid in notif.get("user_ids", [])]
            notif["read_by"] = [str(uid) for uid in notif.get("read_by", [])]
            notif["hidden_by"] = [str(uid) for uid in notif.get("hidden_by", [])]
            if "created_at" in notif:
                notif["created_at"] = notif["created_at"].isoformat()

            # Add creator info
            creator = users.find_one(
                {"_id": ObjectId(notif["created_by"])}, {"email": 1, "name": 1}
            )
            notif["creator"] = {
                "email": creator.get("email", "Unknown") if creator else "Unknown",
                "name": creator.get("name", "") if creator else "",
            }
            # Add target user(s) info
            if notif["target"] == "user" and notif.get("user_id"):
                user = users.find_one(
                    {"_id": ObjectId(notif["user_id"])}, {"name": 1}
                )
                notif["user"] = user["name"] if user else "Unknown"

            elif notif["target"] == "multiple" and notif.get("user_ids"):
                user_objs = users.find({"_id": {"$in": [ObjectId(uid) for uid in notif["user_ids"]]}}, {"name": 1})
                notif["users"] = [u.get("name", "Unknown") for u in user_objs]

        print("Notification",notif)
        return jsonify(
            {
                "notifications": notif_list,
                "total": total,
                "page": page,
                "pages": (total + limit - 1) // limit,
            }
        )

    except Exception as e:
        logging.error(f"Get notifications error: {e}")
        return jsonify({"error": "Failed to fetch notifications"}), 500

@admin_bp.route("/notifications/<notification_id>", methods=["DELETE"])
@admin_required
def delete_admin_notification(admin_user_id, notification_id):
    """Admin deletes a notification"""
    try:
        db = get_db()
        notifications = db["notifications"]

        notification = notifications.find_one({"_id": ObjectId(notification_id)})

        if not notification:
            return jsonify({"error": "Notification not found"}), 404

        # Delete the notification
        result = notifications.delete_one({"_id": ObjectId(notification_id)})

        # Notify affected users via socket
        users = db["users"]

        if notification["target"] == "all":
            user_ids = [str(user["_id"]) for user in users.find({}, {"_id": 1})]
        elif notification["target"] == "user":
            user_ids = [str(notification.get("user_id"))]
        elif notification["target"] == "multiple":
            user_ids = [str(uid) for uid in notification.get("user_ids", [])]
        else:
            user_ids = []

        # Emit WebSocket to all affected users to refresh their notifications
        for uid in user_ids:
            unread_count = notifications.count_documents(
                {
                    "$or": [
                        {"target": "all"},
                        {"target": "user", "user_id": ObjectId(uid)},
                        {"target": "multiple", "user_ids": ObjectId(uid)},
                    ],
                    "read_by": {"$ne": ObjectId(uid)},
                }
            )
            socketio.emit(f"notification_update_{uid}", {"unread_count": unread_count})

        return jsonify({"message": "Notification deleted successfully"})

    except Exception as e:
        logging.error(f"Admin delete notification error: {e}")
        return jsonify({"error": "Failed to delete notification"}), 500


@admin_bp.route("/users/<user_id>/role", methods=["POST"])
@admin_required
def update_user_role(admin_user_id, user_id):
    """Update user role"""
    try:
        data = request.get_json()
        new_role = data.get("role")

        if new_role not in ["user","power_user","reviewer", "admin"]:
            return jsonify({"error": "Invalid role"}), 400
        
        db = get_db()
        users = db["users"]
        
        result = users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"role": new_role, "updated_at": int(datetime.utcnow().timestamp())}}
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "User not found"}), 404
        
        return jsonify({"message": f"User role updated to {new_role}"})
    except Exception as e:
        logging.error(f"Update user role error: {e}")
        return jsonify({"error": "Failed to update user role"}), 500

@admin_bp.route("/users/<user_id>/status", methods=["PATCH"])
@admin_required
def update_user_status(admin_user_id, user_id):
    """Update user status (active/inactive)"""
    try:
        data = request.get_json()
        status = data.get("status")
        
        if status not in ["active", "inactive"]:
            return jsonify({"error": "Invalid status"}), 400
        
        db = get_db()
        users = db["users"]
        
        result = users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"status": status, "updated_at": int(datetime.utcnow().timestamp())}}
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "User not found"}), 404
        
        return jsonify({"message": f"User status updated to {status}"})
    except Exception as e:
        logging.error(f"Update user status error: {e}")
        return jsonify({"error": "Failed to update user status"}), 500