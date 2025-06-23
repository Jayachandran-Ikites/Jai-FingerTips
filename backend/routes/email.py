from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from bson import ObjectId
from ..auth.utils import verify_token
from ..database import get_db
from ..models.user import get_user_by_email, get_user_by_id
import secrets
import smtplib
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
import os
import logging

email_bp = Blueprint("email", __name__)

def send_email(to_email, subject, html_content):
    """Send email using SMTP"""
    try:
        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_username = os.getenv("SMTP_USERNAME")
        smtp_password = os.getenv("SMTP_PASSWORD")
        from_email = os.getenv("FROM_EMAIL", smtp_username)
        
        if not all([smtp_username, smtp_password]):
            logging.error("SMTP credentials not configured")
            return False
        
        msg = MimeMultipart()
        msg['From'] = from_email
        msg['To'] = to_email
        msg['Subject'] = subject
        
        msg.attach(MimeText(html_content, 'html'))
        
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_username, smtp_password)
        text = msg.as_string()
        server.sendmail(from_email, to_email, text)
        server.quit()
        
        return True
    except Exception as e:
        logging.error(f"Email sending failed: {e}")
        return False

@email_bp.route("/auth/forgot-password", methods=["POST"])
def forgot_password():
    """Send password reset email"""
    try:
        data = request.get_json()
        email = data.get("email")
        
        if not email:
            return jsonify({"error": "Email is required"}), 400
        
        user = get_user_by_email(email)
        if not user:
            # Don't reveal if email exists or not
            return jsonify({"message": "If the email exists, a reset link has been sent"}), 200
        
        # Generate reset token
        reset_token = secrets.token_urlsafe(32)
        reset_expires = datetime.utcnow() + timedelta(hours=1)
        
        # Save reset token to database
        db = get_db()
        users = db["users"]
        users.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "reset_token": reset_token,
                    "reset_expires": reset_expires,
                    "updated_at": int(datetime.utcnow().timestamp())
                }
            }
        )
        
        # Send email
        reset_url = f"{os.getenv('FRONTEND_ORIGIN')}/reset-password?token={reset_token}"
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">FingerTips</h1>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
                <h2 style="color: #333;">Password Reset Request</h2>
                <p>You requested a password reset for your FingerTips account.</p>
                <p>Click the button below to reset your password:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_url}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">Reset Password</a>
                </div>
                <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
                <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
            </div>
        </body>
        </html>
        """
        
        if send_email(email, "Reset Your FingerTips Password", html_content):
            return jsonify({"message": "If the email exists, a reset link has been sent"}), 200
        else:
            return jsonify({"error": "Failed to send email"}), 500
            
    except Exception as e:
        logging.error(f"Forgot password error: {e}")
        return jsonify({"error": "Failed to process request"}), 500

@email_bp.route("/auth/reset-password", methods=["POST"])
def reset_password():
    """Reset password using token"""
    try:
        data = request.get_json()
        token = data.get("token")
        new_password = data.get("password")
        
        if not all([token, new_password]):
            return jsonify({"error": "Token and password are required"}), 400
        
        db = get_db()
        users = db["users"]
        
        # Find user with valid reset token
        user = users.find_one({
            "reset_token": token,
            "reset_expires": {"$gt": datetime.utcnow()}
        })
        
        if not user:
            return jsonify({"error": "Invalid or expired reset token"}), 400
        
        # Hash new password
        from ..auth.utils import hash_password
        hashed_password = hash_password(new_password)
        
        # Update password and remove reset token
        users.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "password": hashed_password,
                    "updated_at": int(datetime.utcnow().timestamp())
                },
                "$unset": {
                    "reset_token": "",
                    "reset_expires": ""
                }
            }
        )
        
        return jsonify({"message": "Password reset successfully"}), 200
        
    except Exception as e:
        logging.error(f"Reset password error: {e}")
        return jsonify({"error": "Failed to reset password"}), 500

@email_bp.route("/auth/verify-email", methods=["POST"])
def verify_email():
    """Verify email address"""
    try:
        data = request.get_json()
        token = data.get("token")
        
        if not token:
            return jsonify({"error": "Verification token is required"}), 400
        
        db = get_db()
        users = db["users"]
        
        # Find user with verification token
        user = users.find_one({"verification_token": token})
        
        if not user:
            return jsonify({"error": "Invalid verification token"}), 400
        
        # Mark email as verified
        users.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "email_verified": True,
                    "updated_at": int(datetime.utcnow().timestamp())
                },
                "$unset": {
                    "verification_token": ""
                }
            }
        )
        
        return jsonify({"message": "Email verified successfully"}), 200
        
    except Exception as e:
        logging.error(f"Email verification error: {e}")
        return jsonify({"error": "Failed to verify email"}), 500

@email_bp.route("/auth/resend-verification", methods=["POST"])
def resend_verification():
    """Resend email verification"""
    try:
        data = request.get_json()
        email = data.get("email")
        
        if not email:
            return jsonify({"error": "Email is required"}), 400
        
        user = get_user_by_email(email)
        if not user:
            return jsonify({"message": "If the email exists, verification has been sent"}), 200
        
        if user.get("email_verified"):
            return jsonify({"message": "Email is already verified"}), 200
        
        # Generate new verification token
        verification_token = secrets.token_urlsafe(32)
        
        # Save verification token
        db = get_db()
        users = db["users"]
        users.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "verification_token": verification_token,
                    "updated_at": int(datetime.utcnow().timestamp())
                }
            }
        )
        
        # Send verification email
        verify_url = f"{os.getenv('FRONTEND_ORIGIN')}/verify-email?token={verification_token}"
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">FingerTips</h1>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
                <h2 style="color: #333;">Verify Your Email</h2>
                <p>Welcome to FingerTips! Please verify your email address to complete your registration.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{verify_url}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">Verify Email</a>
                </div>
                <p style="color: #666; font-size: 14px;">If you didn't create this account, please ignore this email.</p>
            </div>
        </body>
        </html>
        """
        
        if send_email(email, "Verify Your FingerTips Account", html_content):
            return jsonify({"message": "If the email exists, verification has been sent"}), 200
        else:
            return jsonify({"error": "Failed to send email"}), 500
            
    except Exception as e:
        logging.error(f"Resend verification error: {e}")
        return jsonify({"error": "Failed to resend verification"}), 500