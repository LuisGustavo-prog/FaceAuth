from pydantic import BaseModel

class AdminCreateRequest(BaseModel):
    username: str
    password: str
