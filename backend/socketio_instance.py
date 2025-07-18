from flask_socketio import SocketIO
import os
from dotenv import load_dotenv

load_dotenv()

socketio = SocketIO(cors_allowed_origins=os.getenv("FRONTEND_ORIGIN"))
