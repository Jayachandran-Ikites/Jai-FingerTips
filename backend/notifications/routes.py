from flask import Blueprint, request, jsonify
from datetime import datetime
from bson import ObjectId
from ..auth.utils import verify_token
from ..database import get_db
from ..socketio_instance import socketio
import logging

notifications_bp = Blueprint("notifications", __name__)


# 🔧 Optional: move to utils.py if reused often
def get_unread_count(user_id, db):
    return db["notifications"].count_documents(
        {
            "$or": [
                {"target": "all"},
                {"target": "user", "user_id": ObjectId(user_id)},
                {"target": "multiple", "user_ids": ObjectId(user_id)},
            ],
            "read_by": {"$ne": ObjectId(user_id)},
            "hidden_by": {"$ne": ObjectId(user_id)},
        }
    )


@notifications_bp.route("/notifications", methods=["GET"])
def get_user_notifications():
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

        query = {
            "$or": [
                {"target": "all"},
                {"target": "user", "user_id": ObjectId(user_id)},
                {"target": "multiple", "user_ids": ObjectId(user_id)},
            ],
            "hidden_by": {"$ne": ObjectId(user_id)},
        }

        if unread_only:
            query["read_by"] = {"$ne": ObjectId(user_id)}

        total = notifications.count_documents(query)
        unread_count = get_unread_count(user_id, db)

        skip = (page - 1) * limit
        notif_list = list(
            notifications.find(query).sort("created_at", -1).skip(skip).limit(limit)
        )

        for notif in notif_list:
            notif["_id"] = str(notif["_id"])
            notif["created_by"] = str(notif.get("created_by", ""))
            notif["user_id"] = str(notif.get("user_id", ""))
            notif["user_ids"] = [str(uid) for uid in notif.get("user_ids", [])]
            notif["read_by"] = [str(uid) for uid in notif.get("read_by", [])]
            notif["read"] = ObjectId(user_id) in notif.get("read_by", [])
            notif["hidden_by"] = [str(uid) for uid in notif.get("hidden_by", [])]
            if "created_at" in notif:
                notif["created_at"] = notif["created_at"].isoformat()

        return jsonify(
            {
                "notifications": notif_list,
                "total": total,
                "unread_count": unread_count,
                "page": page,
                "pages": (total + limit - 1) // limit,
            }
        )
    except Exception as e:
        logging.error(f"Get user notifications error: {e}")
        return jsonify({"error": "Failed to fetch notifications"}), 500


@notifications_bp.route("/notifications/<notification_id>/read", methods=["POST"])
def mark_notification_read(notification_id):
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

        notification = notifications.find_one({"_id": ObjectId(notification_id)})
        if not notification or not (
            notification["target"] == "all"
            or (
                notification["target"] == "user"
                and notification["user_id"] == ObjectId(user_id)
            )
            or (
                notification["target"] == "multiple"
                and ObjectId(user_id) in notification.get("user_ids", [])
            )
        ):
            return jsonify({"error": "Unauthorized"}), 403

        result = notifications.update_one(
            {"_id": ObjectId(notification_id)},
            {"$addToSet": {"read_by": ObjectId(user_id)}},
        )

        unread_count = get_unread_count(user_id, db)
        socketio.emit(f"notification_update_{user_id}", {"unread_count": unread_count})

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

        query = {
            "$or": [
                {"target": "all"},
                {"target": "user", "user_id": ObjectId(user_id)},
                {"target": "multiple", "user_ids": ObjectId(user_id)},
            ],
            "read_by": {"$ne": ObjectId(user_id)},
            "hidden_by": {"$ne": ObjectId(user_id)},
        }

        result = notifications.update_many(
            query, {"$addToSet": {"read_by": ObjectId(user_id)}}
        )

        unread_count = get_unread_count(user_id, db)
        socketio.emit(f"notification_update_{user_id}", {"unread_count": unread_count})

        return jsonify(
            {"message": f"Marked {result.modified_count} notifications as read"}
        )
    except Exception as e:
        logging.error(f"Mark all notifications read error: {e}")
        return jsonify({"error": "Failed to mark notifications as read"}), 500


@notifications_bp.route("/notifications/<notification_id>", methods=["DELETE"])
def delete_notification(notification_id):
    """Delete (or hide) a notification for the current user"""
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
        notification = notifications.find_one({"_id": ObjectId(notification_id)})

        if not notification:
            return jsonify({"error": "Notification not found"}), 404

        if notification["target"] == "user" and notification["user_id"] == ObjectId(
            user_id
        ):
            result = notifications.delete_one({"_id": ObjectId(notification_id)})
        elif notification["target"] in ["all", "multiple"]:
            # Soft delete for broadcasts
            result = notifications.update_one(
                {"_id": ObjectId(notification_id)},
                {"$addToSet": {"hidden_by": ObjectId(user_id)}},
            )
        else:
            return jsonify({"error": "Unauthorized"}), 403

        unread_count = get_unread_count(user_id, db)
        socketio.emit(f"notification_update_{user_id}", {"unread_count": unread_count})

        return jsonify({"message": "Notification deleted/hidden successfully"})
    except Exception as e:
        logging.error(f"Delete notification error: {e}")
        return jsonify({"error": "Failed to delete notification"}), 500
