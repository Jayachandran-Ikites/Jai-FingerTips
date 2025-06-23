from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from bson import ObjectId
from ..auth.utils import verify_token
from ..database import get_db
from ..models.analytics import (
    get_latency_stats, get_daily_latency_trends, 
    get_cost_analytics, track_response_latency, track_query_cost
)
import logging

analytics_bp = Blueprint("analytics", __name__)

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

@analytics_bp.route("/analytics/latency", methods=["GET"])
@require_admin_or_reviewer
def get_latency_analytics(user_id):
    """Get latency analytics"""
    try:
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        
        start_dt = None
        end_dt = None
        
        if start_date:
            start_dt = datetime.fromisoformat(start_date)
        if end_date:
            end_dt = datetime.fromisoformat(end_date)
        
        stats = get_latency_stats(start_dt, end_dt)
        
        if stats:
            stats["avg_latency"] = round(stats["avg_latency"], 2)
            stats["min_latency"] = round(stats["min_latency"], 2)
            stats["max_latency"] = round(stats["max_latency"], 2)
            if stats["avg_tokens"]:
                stats["avg_tokens"] = round(stats["avg_tokens"], 0)
        
        return jsonify({"latency_stats": stats})
        
    except Exception as e:
        logging.error(f"Get latency analytics error: {e}")
        return jsonify({"error": "Failed to get latency analytics"}), 500

@analytics_bp.route("/analytics/latency/trends", methods=["GET"])
@require_admin_or_reviewer
def get_latency_trends(user_id):
    """Get daily latency trends"""
    try:
        days = int(request.args.get("days", 30))
        trends = get_daily_latency_trends(days)
        
        # Format trends data
        for trend in trends:
            trend["avg_latency"] = round(trend["avg_latency"], 2)
            if trend["avg_tokens"]:
                trend["avg_tokens"] = round(trend["avg_tokens"], 0)
        
        return jsonify({"trends": trends})
        
    except Exception as e:
        logging.error(f"Get latency trends error: {e}")
        return jsonify({"error": "Failed to get latency trends"}), 500

@analytics_bp.route("/analytics/costs", methods=["GET"])
@require_admin_or_reviewer
def get_cost_analytics_data(user_id):
    """Get cost analytics"""
    try:
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        
        start_dt = None
        end_dt = None
        
        if start_date:
            start_dt = datetime.fromisoformat(start_date)
        if end_date:
            end_dt = datetime.fromisoformat(end_date)
        
        stats = get_cost_analytics(start_dt, end_dt)
        
        if stats:
            stats["total_cost"] = round(stats["total_cost"], 4)
            stats["avg_cost_per_query"] = round(stats["avg_cost_per_query"], 6)
        
        return jsonify({"cost_stats": stats})
        
    except Exception as e:
        logging.error(f"Get cost analytics error: {e}")
        return jsonify({"error": "Failed to get cost analytics"}), 500

@analytics_bp.route("/analytics/dashboard", methods=["GET"])
@require_admin_or_reviewer
def get_analytics_dashboard(user_id):
    """Get comprehensive analytics dashboard data"""
    try:
        # Get date range (default to last 30 days)
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=30)
        
        # Get all analytics
        latency_stats = get_latency_stats(start_date, end_date)
        cost_stats = get_cost_analytics(start_date, end_date)
        trends = get_daily_latency_trends(30)
        
        # Get feedback stats
        db = get_db()
        feedback_collection = db["feedback"]
        
        feedback_pipeline = [
            {"$match": {"created_at": {"$gte": start_date, "$lte": end_date}}},
            {
                "$group": {
                    "_id": None,
                    "avg_rating": {"$avg": "$rating"},
                    "total_feedback": {"$sum": 1},
                    "rating_distribution": {"$push": "$rating"}
                }
            }
        ]
        
        feedback_result = list(feedback_collection.aggregate(feedback_pipeline))
        feedback_stats = feedback_result[0] if feedback_result else None
        
        if feedback_stats:
            # Calculate rating distribution
            rating_dist = {}
            for rating in feedback_stats["rating_distribution"]:
                rating_dist[str(rating)] = rating_dist.get(str(rating), 0) + 1
            feedback_stats["rating_distribution"] = rating_dist
            feedback_stats["avg_rating"] = round(feedback_stats["avg_rating"], 2)
        
        # Format data
        if latency_stats:
            latency_stats["avg_latency"] = round(latency_stats["avg_latency"], 2)
            latency_stats["min_latency"] = round(latency_stats["min_latency"], 2)
            latency_stats["max_latency"] = round(latency_stats["max_latency"], 2)
            if latency_stats["avg_tokens"]:
                latency_stats["avg_tokens"] = round(latency_stats["avg_tokens"], 0)
        
        if cost_stats:
            cost_stats["total_cost"] = round(cost_stats["total_cost"], 4)
            cost_stats["avg_cost_per_query"] = round(cost_stats["avg_cost_per_query"], 6)
        
        for trend in trends:
            trend["avg_latency"] = round(trend["avg_latency"], 2)
            if trend["avg_tokens"]:
                trend["avg_tokens"] = round(trend["avg_tokens"], 0)
        
        return jsonify({
            "latency_stats": latency_stats,
            "cost_stats": cost_stats,
            "feedback_stats": feedback_stats,
            "trends": trends,
            "date_range": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            }
        })
        
    except Exception as e:
        logging.error(f"Get analytics dashboard error: {e}")
        return jsonify({"error": "Failed to get analytics dashboard"}), 500

@analytics_bp.route("/analytics/export", methods=["GET"])
@require_admin_or_reviewer
def export_analytics(user_id):
    """Export analytics data as CSV"""
    try:
        # Check if user is admin
        db = get_db()
        users = db["users"]
        user = users.find_one({"_id": ObjectId(user_id)})
        user_role = user.get("role", "user")
        
        if user_role != "admin":
            return jsonify({"error": "Admin access required"}), 403
        
        export_type = request.args.get("type", "latency")  # latency, costs, feedback
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        
        start_dt = None
        end_dt = None
        
        if start_date:
            start_dt = datetime.fromisoformat(start_date)
        if end_date:
            end_dt = datetime.fromisoformat(end_date)
        
        if export_type == "latency":
            # Export latency data
            analytics_collection = db["analytics"]
            match_query = {}
            if start_dt and end_dt:
                match_query["timestamp"] = {"$gte": start_dt, "$lte": end_dt}
            
            data = list(analytics_collection.find(match_query).sort("timestamp", -1))
            
            # Convert to CSV format
            csv_data = "conversation_id,message_id,latency_ms,token_count,timestamp\n"
            for item in data:
                csv_data += f"{item['conversation_id']},{item['message_id']},{item['latency_ms']},{item.get('token_count', '')},{item['timestamp'].isoformat()}\n"
        
        elif export_type == "costs":
            # Export cost data
            costs_collection = db["costs"]
            match_query = {}
            if start_dt and end_dt:
                match_query["timestamp"] = {"$gte": start_dt, "$lte": end_dt}
            
            data = list(costs_collection.find(match_query).sort("timestamp", -1))
            
            csv_data = "conversation_id,message_id,token_count,model_type,cost_usd,timestamp\n"
            for item in data:
                csv_data += f"{item['conversation_id']},{item['message_id']},{item['token_count']},{item['model_type']},{item['cost_usd']},{item['timestamp'].isoformat()}\n"
        
        elif export_type == "feedback":
            # Export feedback data
            feedback_collection = db["feedback"]
            match_query = {}
            if start_dt and end_dt:
                match_query["created_at"] = {"$gte": start_dt, "$lte": end_dt}
            
            data = list(feedback_collection.find(match_query).sort("created_at", -1))
            
            csv_data = "user_id,conversation_id,message_id,rating,comment,created_at\n"
            for item in data:
                comment = (item.get('comment', '') or '').replace(',', ';').replace('\n', ' ')
                csv_data += f"{item['user_id']},{item['conversation_id']},{item['message_id']},{item['rating']},\"{comment}\",{item['created_at'].isoformat()}\n"
        
        else:
            return jsonify({"error": "Invalid export type"}), 400
        
        return jsonify({
            "csv_data": csv_data,
            "filename": f"{export_type}_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
        })
        
    except Exception as e:
        logging.error(f"Export analytics error: {e}")
        return jsonify({"error": "Failed to export analytics"}), 500