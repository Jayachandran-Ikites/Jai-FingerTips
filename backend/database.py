# backend/database.py

from pymongo import MongoClient
from .config import MONGO_URI, DATABASE_NAME

client = MongoClient(MONGO_URI)

def get_db():
    print("Connecting to MongoDB at:", MONGO_URI)
    return client[DATABASE_NAME]