from pydantic import BaseModel, Field

class AdminCreateRequest(BaseModel):
    username: str
    password: str

class AdminUpdateRequest(BaseModel):
    username: str | None = Field(default=None, examples=[None])
    password: str | None = Field(default=None, examples=[None])
