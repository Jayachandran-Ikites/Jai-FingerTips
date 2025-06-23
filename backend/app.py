from flask import Flask
from flask_cors import CORS
from .auth.routes import auth_bp
from .chat.routes import chat_bp
from .admin.routes import admin_bp
from .notifications.routes import notifications_bp
import os
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)

# Fixed CORS configuration - no wildcards when using credentials
CORS(
    app,
    supports_credentials=True,
    resources={
        r"/*": {
            "origins": [os.getenv("FRONTEND_ORIGIN")],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
            "allow_headers": ["Content-Type", "Authorization"],
            "expose_headers": ["Content-Type", "Authorization"],
        }
    },
)


# Register blueprints
app.register_blueprint(auth_bp, url_prefix=os.getenv("BASE_URL")+"/auth")
app.register_blueprint(chat_bp, url_prefix=os.getenv("BASE_URL"))
app.register_blueprint(admin_bp, url_prefix=os.getenv("BASE_URL")+"/admin")
app.register_blueprint(notifications_bp, url_prefix=os.getenv("BASE_URL"))


# Health check route
@app.route(os.getenv("BASE_URL") + "/health", methods=["GET"])
def check_health():
    return {"status": "healthy"}, 200


if __name__ == "__main__":
    app.run(port=os.getenv("PORT"), debug=True)