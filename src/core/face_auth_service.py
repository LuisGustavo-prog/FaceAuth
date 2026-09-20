import numpy as np
from core.face_recognition import generate_embedding, find_matching_user
from core import user_cache
from database.models import UserInDB
from database.repository import get_user_by_id

async def verify_face(photo_frame: np.ndarray) -> tuple[UserInDB, float] | None:
    embedding = generate_embedding(photo_frame)

    if embedding is None:
        return None

    normalized_matrix, user_ids = await user_cache.get_known_users()
    result = find_matching_user(embedding, normalized_matrix, user_ids)

    if result is None:
        return None

    user_id, distance = result
    user = await get_user_by_id(user_id)

    return (user, distance) if user else None
