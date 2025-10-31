from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, validator, EmailStr
from enum import Enum
import re


class UserRole(str, Enum):
    STUDENT = "student"
    ADMIN = "admin"


class UserBase(BaseModel):
    username: str
    email: EmailStr
    student_number: Optional[str] = None
    program: Optional[str] = None
    bio: Optional[str] = ""
    profile_pic: Optional[str] = ""
    is_verified: bool = False
    role: UserRole = UserRole.STUDENT
    created_at: datetime = datetime.utcnow()


class UserCreate(UserBase):
    password: str

    @validator('password')
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v

    @validator("student_number")
    def validate_student_number(cls, v):
        # Accepts formats like "22-29871"
        if not re.match(r"^\d{2}-\d{5}$", v):
            raise ValueError("Student number must be in format YY-XXXXX")
        return v


class UserInDB(UserBase):
    id: str
    hashed_password: str


class UserResponse(UserBase):
    id: str

    class Config:
        from_attributes = True
