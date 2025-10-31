from fastapi import APIRouter, HTTPException, Depends, status, Form, BackgroundTasks
from pydantic import BaseModel, EmailStr
from uuid import uuid4
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import os
from dotenv import load_dotenv

from app.core.database import db
from app.core.security import (
    create_access_token,
    get_password_hash,
    verify_password,
    get_current_user,
    oauth2_scheme,
)
from app.core.config import settings
from app.services.email_service import send_verification_email
from app.models.user import UserCreate, UserResponse, UserInDB
from fastapi.security import OAuth2PasswordBearer

load_dotenv()


SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = os.getenv("JWT_ALGORITHM")

router = APIRouter(prefix="/auth", tags=["Auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# -------------------- Schemas --------------------
class LoginRequest(BaseModel):
    username: str
    password: str

class TokenData(BaseModel):
    email: str
    exp: datetime

class EmailVerificationToken(BaseModel):
    token: str

# -------------------- UTILS --------------------
def create_verification_token(email: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode = {"sub": email, "exp": expire}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# -------------------- REGISTER --------------------
@router.post("/register", response_model=dict)
async def register(
    user: UserCreate, 
    background_tasks: BackgroundTasks
):
    with db.get_session() as session:
        # Check for existing user
        existing = session.run(
            """
            MATCH (u:User) 
            WHERE u.email = $email OR u.username = $username 
            RETURN u
            """,
            email=user.email,
            username=user.username
        ).single()

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email or username already registered"
            )

        # Create new user
        user_id = str(uuid4())
        hashed_pw = get_password_hash(user.password)
        created_at = datetime.utcnow().isoformat()

        session.run(
            """
            CREATE (u:User {
                id: $id,
                username: $username,
                email: $email,
                password: $password,
                student_number: $student_number,
                program: $program,
                bio: $bio,
                is_verified: false,
                role: $role,
                created_at: $created_at
            })
            """,
            id=user_id,
            username=user.username,
            email=user.email,
            password=hashed_pw,
            student_number=user.student_number,
            program=user.program,
            bio=user.bio,
            role=user.role.value,
            created_at=created_at
        )

        # Generate verification token and send email
        verification_token = create_verification_token(user.email)
        
        # Send verification email in background
        background_tasks.add_task(
            send_verification_email,
            email=user.email,
            token=verification_token
        )

    return {
        "message": "Registration successful! Please check your email to verify your account.",
        "user_id": user_id
    }

# -------------------- VERIFY EMAIL --------------------
@router.post("/verify-email", status_code=status.HTTP_200_OK)
async def verify_email(token_data: EmailVerificationToken):
    try:
        payload = jwt.decode(token_data.token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification token"
            )
            
        with db.get_session() as session:
            # Update user as verified
            result = session.run(
                """
                MATCH (u:User {email: $email})
                SET u.is_verified = true
                RETURN u
                """,
                email=email
            ).single()
            
            if not result:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
                
            return {"message": "Email verified successfully! You can now log in."}
            
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )

# -------------------- RESEND VERIFICATION --------------------
class ResendVerificationRequest(BaseModel):
    email: EmailStr

@router.post("/resend-verification", status_code=status.HTTP_200_OK)
async def resend_verification(
    data: ResendVerificationRequest,
    background_tasks: BackgroundTasks
):
    with db.get_session() as session:
        user = session.run(
            "MATCH (u:User {email: $email}) RETURN u",
            email=data.email
        ).single()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No account found with this email"
            )

        if user["u"].get("is_verified", False):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already verified"
            )

        # Generate new verification token
        verification_token = create_verification_token(user["u"]["email"])

        # Send email in background
        background_tasks.add_task(
            send_verification_email,
            email=user["u"]["email"],
            token=verification_token
        )

        return {
            "message": f"📩 Verification email sent to {user['u']['email']}. Please check your inbox or spam folder."
        }

# -------------------- LOGIN (JSON for frontend) --------------------
@router.post("/login-with-username")
def login_json(payload: LoginRequest):
    username = payload.username
    password = payload.password

    with db.get_session() as session:
        record = session.run(
            "MATCH (u:User {username:$username}) RETURN u",
            username=username
        ).single()

        if not record or not verify_password(password, record["u"]["password"]):
            raise HTTPException(status_code=400, detail="Invalid username or password")

        # Check if email is verified
        if not record['u'].get('is_verified', False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Please verify your email address before logging in. Check your email for the verification link or request a new one.",
            )

        token = create_access_token({"sub": username})
        return {"access_token": token, "token_type": "bearer"}

# -------------------- CURRENT USER --------------------
@router.get("/users/me")
def current_user(current_user: dict = Depends(get_current_user)):
    current_user.pop("password", None)
    return current_user
