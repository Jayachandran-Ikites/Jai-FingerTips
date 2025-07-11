# backend/auth/utils.py
import jwt
from ..config import SECRET_KEY
import bcrypt
import time

def generate_token(user_id):
    # Use current timestamp to avoid clock sync issues
    current_time = int(time.time())
    payload = {
        'user_id': str(user_id),
        'iat': current_time,  # issued at
        'exp': current_time + (24 * 60 * 60)  # expires in 24 hours
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def verify_token(token):
    try:
        # Add leeway for clock synchronization issues
        decoded = jwt.decode(
            token, 
            SECRET_KEY, 
            algorithms=['HS256'],
            leeway=10  # Allow 10 seconds leeway for clock differences
        )
        return decoded["user_id"]
    except jwt.ExpiredSignatureError:
        print("Token has expired")
        return None
    except jwt.InvalidTokenError as e:
        print(f"Invalid token: {e}")
        return None

def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

def check_password(password, hashed):
    return bcrypt.checkpw(password.encode('utf-8'), hashed)