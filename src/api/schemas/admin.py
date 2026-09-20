from pydantic import BaseModel

class AdminCreateRequest(BaseModel):
    username: str
    password: str

class AdminUpdateRequest(BaseModel):
    username: str | None = None
    password: str | None = None
