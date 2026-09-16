from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class UserRegister(BaseModel):
    phone: str = Field(..., pattern=r"^\+?[1-9]\d{9,14}$")
    full_name: str = Field(..., min_length=2, max_length=150)
    password: str = Field(..., min_length=6)
    email: Optional[EmailStr] = None
    role: str = Field(default="patient", pattern="^(patient|doctor|clinic_admin|staff)$")

class UserLogin(BaseModel):
    phone: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    full_name: str
    phone: str

class UserProfile(BaseModel):
    id: str
    phone: str
    email: Optional[str] = None
    full_name: str
    role: str
    is_verified: bool
