import time
import numpy as np
from core.face_recognition import generate_embedding, find_matching_user
from core import user_cache
from database.models import UserInDB
from database.repository import get_user_by_id
from utils.image_utils import resize_for_embedding

async def verify_face(photo_frame: np.ndarray) -> tuple[UserInDB, float] | None:
    resized_frame = resize_for_embedding(photo_frame)

    start_time = time.perf_counter()
    embedding = generate_embedding(resized_frame)
    elapsed = time.perf_counter() - start_time
    print(f'[PERF] generate_embedding via API: {elapsed:.3f}s, shape {resized_frame.shape}')

    if embedding is None:
        return None

    normalized_matrix, user_ids = await user_cache.get_known_users()
    result = find_matching_user(embedding, normalized_matrix, user_ids)

    if result is None:
        return None

    user_id, distance = result
    user = await get_user_by_id(user_id)

    return (user, distance) if user else None
