from typing import Optional
from bson import ObjectId
from src.database.connection import get_database
from src.database.models import UserCreate, UserInDB

database = get_database()
collection = database['users']

async def create_user(user: UserCreate, face_embedding: list[float]) -> UserInDB:
    user_dict = user.model_dump()
    user_dict['face_embedding'] = face_embedding

    result = await collection.insert_one(user_dict)
    created_user = await collection.find_one({'_id': result.inserted_id})

    return UserInDB(**created_user)

async def get_user_by_document(documento: str) -> Optional[UserInDB]:
    user_data = await collection.find_one({'documento': documento})

    if user_data:
        return UserInDB(**user_data)

    return None

async def get_user_by_id(user_id: str) -> Optional[UserInDB]:
    if not ObjectId.is_valid(user_id):
        return None

    user_data = await collection.find_one({'_id': ObjectId(user_id)})

    if user_data:
        return UserInDB(**user_data)

    return None

async def get_all_users() -> list[UserInDB]:
    users = []
    cursor = collection.find({})

    async for user_data in cursor:
        users.append(UserInDB(**user_data))

    return users

async def delete_user(user_id: str) -> bool:
    if not ObjectId.is_valid(user_id):
        return False

    result = await collection.delete_one({'_id': ObjectId(user_id)})

    return result.deleted_count > 0
