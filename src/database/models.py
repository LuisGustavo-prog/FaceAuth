from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError('ObjectId inválido')
        
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type='string')

class UserCreate(BaseModel):
    nome: str
    documento: str

class UserInDB(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias='_id')
    nome: str
    documento: str
    face_embedding: list[float]
    criado_em: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class UserResponse(BaseModel):
    id: str
    nome: str
    documento: str
    criado_em: datetime

    class Config:
        populate_by_name = True
