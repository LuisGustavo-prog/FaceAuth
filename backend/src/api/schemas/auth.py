from pydantic import BaseModel
from database.models import UserResponse

# UserResponse is reused here as-is since it is a plain data shape, not a
# database access call; the layering rule (api never talks to database/
# directly) is about operations, not type definitions.

class VerifyResponse(BaseModel):
    access_granted: bool
    user: UserResponse | None = None
    distance: float | None = None

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = 'bearer'
