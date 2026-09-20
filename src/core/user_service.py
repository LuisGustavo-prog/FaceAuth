import numpy as np
from core.face_recognition import generate_embedding
from core import user_cache
from database.models import UserCreate, UserInDB, UserResponse
from database.repository import (
    create_user,
    get_user_by_document,
    get_user_by_id,
    get_all_users,
    delete_user,
)

class DuplicateUserError(Exception):
    pass

class NoFaceDetectedError(Exception):
    pass

def _to_response(user: UserInDB) -> UserResponse:
    return UserResponse(
        id=str(user.id),
        name=user.name,
        document=user.document,
        created_at=user.created_at,
    )

async def register_user(name: str, document: str, photo_frame: np.ndarray) -> UserResponse:
    existing_user = await get_user_by_document(document)

    if existing_user:
        raise DuplicateUserError(f'A user with document {document} is already registered')

    embedding = generate_embedding(photo_frame)

    if embedding is None:
        raise NoFaceDetectedError('No face detected in the provided photo')

    created_user = await create_user(UserCreate(name=name, document=document), embedding)
    await user_cache.get_known_users(force_refresh=True)

    return _to_response(created_user)

async def list_users() -> list[UserResponse]:
    users = await get_all_users()

    return [_to_response(user) for user in users]

async def get_user(user_id: str) -> UserResponse | None:
    user = await get_user_by_id(user_id)

    return _to_response(user) if user else None

async def remove_user(user_id: str) -> bool:
    deleted = await delete_user(user_id)

    if deleted:
        await user_cache.get_known_users(force_refresh=True)

    return deleted
