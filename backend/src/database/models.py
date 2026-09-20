from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, info=None):
        if not ObjectId.is_valid(v):
            raise ValueError('Invalid ObjectId')

        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type='string')

class UserCreate(BaseModel):
    name: str
    document: str

class UserInDB(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias='_id')
    name: str
    document: str
    face_embedding: list[float]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class UserResponse(BaseModel):
    id: str
    name: str
    document: str
    created_at: datetime

    class Config:
        populate_by_name = True

class AdminCreate(BaseModel):
    username: str
    password: str

class AdminInDB(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias='_id')
    username: str
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class AdminResponse(BaseModel):
    id: str
    username: str
    created_at: datetime

    class Config:
        populate_by_name = True
