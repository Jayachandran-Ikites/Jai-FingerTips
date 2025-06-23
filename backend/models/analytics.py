from ..database import get_db
from bson import ObjectId
from datetime import datetime, timedelta
import time

def track_response_latency(conversation_id, message_id, start_time, end_time, token_count=None):
    """Track response latency for analytics"""
    db = get_db()
    analytics_collection = db["analytics"]
    
    latency_ms = (end_time - start_time) * 1000  # Convert to milliseconds
    
    analytics_data = {
        "conversation_id": ObjectId(conversation_id),
        "message_id": message_id,
        "latency_ms": latency_ms,
        "token_count": token_count,
        "timestamp": datetime.utcnow(),
        "date": datetime.utcnow().date().isoformat()
    }
    
    result = analytics_collection.insert_one(analytics_data)
    return result.inserted_id

def get_latency_stats(start_date=None, end_date=None):
    """Get latency statistics"""
    db = get_db()
    analytics_collection = db["analytics"]
    
    match_query = {}
    if start_date and end_date:
        match_query["timestamp"] = {"$gte": start_date, "$lte": end_date}
    
    pipeline = [
        {"$match": match_query},
        {
            "$group": {
                "_id": None,
                "avg_latency": {"$avg": "$latency_ms"},
                "min_latency": {"$min": "$latency_ms"},
                "max_latency": {"$max": "$latency_ms"},
                "total_requests": {"$sum": 1},
                "avg_tokens": {"$avg": "$token_count"}
            }
        }
    ]
    
    result = list(analytics_collection.aggregate(pipeline))
    return result[0] if result else None

def get_daily_latency_trends(days=30):
    """Get daily latency trends"""
    db = get_db()
    analytics_collection = db["analytics"]
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    pipeline = [
        {"$match": {"timestamp": {"$gte": start_date}}},
        {
            "$group": {
                "_id": "$date",
                "avg_latency": {"$avg": "$latency_ms"},
                "request_count": {"$sum": 1},
                "avg_tokens": {"$avg": "$token_count"}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    
    return list(analytics_collection.aggregate(pipeline))

def calculate_query_cost(token_count, model_type="gpt-4"):
    """Calculate cost based on token usage"""
    # Pricing per 1K tokens (example rates)
    pricing = {
        "gpt-4": {"input": 0.03, "output": 0.06},
        "gpt-3.5-turbo": {"input": 0.001, "output": 0.002}
    }
    
    if model_type not in pricing:
        model_type = "gpt-4"
    
    # Assuming 50/50 split between input and output tokens
    input_tokens = token_count * 0.5
    output_tokens = token_count * 0.5
    
    cost = (input_tokens / 1000 * pricing[model_type]["input"]) + \
           (output_tokens / 1000 * pricing[model_type]["output"])
    
    return round(cost, 6)

def track_query_cost(conversation_id, message_id, token_count, model_type="gpt-4"):
    """Track query cost"""
    db = get_db()
    costs_collection = db["costs"]
    
    cost = calculate_query_cost(token_count, model_type)
    
    cost_data = {
        "conversation_id": ObjectId(conversation_id),
        "message_id": message_id,
        "token_count": token_count,
        "model_type": model_type,
        "cost_usd": cost,
        "timestamp": datetime.utcnow(),
        "date": datetime.utcnow().date().isoformat()
    }
    
    result = costs_collection.insert_one(cost_data)
    return result.inserted_id

def get_cost_analytics(start_date=None, end_date=None):
    """Get cost analytics"""
    db = get_db()
    costs_collection = db["costs"]
    
    match_query = {}
    if start_date and end_date:
        match_query["timestamp"] = {"$gte": start_date, "$lte": end_date}
    
    pipeline = [
        {"$match": match_query},
        {
            "$group": {
                "_id": None,
                "total_cost": {"$sum": "$cost_usd"},
                "avg_cost_per_query": {"$avg": "$cost_usd"},
                "total_tokens": {"$sum": "$token_count"},
                "total_queries": {"$sum": 1}
            }
        }
    ]
    
    result = list(costs_collection.aggregate(pipeline))
    return result[0] if result else None