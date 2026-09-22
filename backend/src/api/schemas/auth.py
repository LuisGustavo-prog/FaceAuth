from pydantic import BaseModel
from database.models import UserResponse

class VerifyResponse(BaseModel):
    access_granted: bool
    face_detected: bool
    user: UserResponse | None = None
    distance: float | None = None

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = 'bearer'
