import os
import logging
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, errors
from fastapi_mail.email_utils import DefaultChecker
from pydantic import EmailStr, ValidationError
from dotenv import load_dotenv
from typing import Optional
from fastapi import HTTPException, status

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

def get_email_config():
    """Get email configuration with validation"""
    mail_username = os.getenv("MAIL_USERNAME")
    mail_password = os.getenv("MAIL_PASSWORD")
    
    if not mail_username or not mail_password:
        logger.warning("Email username or password not set in environment variables")
    
    return ConnectionConfig(
        MAIL_USERNAME=mail_username,
        MAIL_PASSWORD=mail_password,
        MAIL_FROM=os.getenv("MAIL_FROM", mail_username or "noreply@ccs-social.com"),
        MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
        MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.gmail.com"),
        MAIL_STARTTLS=True,
        MAIL_SSL_TLS=False,
        USE_CREDENTIALS=True,
        VALIDATE_CERTS=True,
        TIMEOUT=10  # 10 seconds timeout
    )

# Initialize config
conf = get_email_config()

async def send_verification_email(email: EmailStr, token: str) -> bool:
    """
    Send a verification email to the user.
    Returns True if successful, False otherwise.
    """
    try:
        # Validate email format
        try:
            email_str = str(email)
            if not email_str or "@" not in email_str:
                raise ValueError("Invalid email format")
        except (ValueError, ValidationError) as e:
            logger.error(f"Invalid email format: {email}")
            return False

        # Get frontend URL with fallback
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        verification_url = f"{frontend_url}/verify-email?token={token}&email={email}"


        message = MessageSchema(
            subject="Verify Your Email - CCS Social",
            recipients=[email],
            body=f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1a365d;">Welcome to CCS Social! 👋</h2>
                <p>Thank you for registering. To complete your registration, please verify your email address by clicking the button below:</p>
                <div style="margin: 25px 0;">
                    <a href="{verification_url}" 
                       style="background-color: #3182ce; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 4px; font-weight: bold;">
                        Verify Email Address
                    </a>
                </div>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #3182ce;">{verification_url}</p>
                <p>This link will expire in 24 hours.</p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                <p style="color: #718096; font-size: 0.9em;">
                    If you didn't create an account, you can safely ignore this email.
                </p>
            </div>
            """,
            subtype="html"
        )

        fm = FastMail(conf)
        await fm.send_message(message)
        logger.info(f"Verification email sent to {email}")
        return True
        
    except (errors.ConnectionErrors, errors.SMTPException) as e:
        logger.error(f"Connection error sending email to {email}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Email service is currently unavailable. Please try again later."
        )
    except Exception as e:
        logger.error(f"Error sending verification email to {email}: {str(e)}")
        return False
