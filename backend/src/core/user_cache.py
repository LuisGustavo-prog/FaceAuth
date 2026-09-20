import time
import numpy as np
from core.face_recognition import normalize_embeddings
from database.repository import get_all_users

CACHE_REFRESH_SECONDS = 30

_normalized_matrix: np.ndarray | None = None
_user_ids: list[str] = []
_last_refresh = 0.0

async def get_known_users(force_refresh: bool = False) -> tuple[np.ndarray | None, list[str]]:
    global _normalized_matrix, _user_ids, _last_refresh

    cache_expired = time.time() - _last_refresh > CACHE_REFRESH_SECONDS

    if force_refresh or cache_expired:
        users = await get_all_users()

        embeddings = [user.face_embedding for user in users]
        _user_ids = [str(user.id) for user in users]
        _normalized_matrix = normalize_embeddings(embeddings) if embeddings else None
        _last_refresh = time.time()

    return _normalized_matrix, _user_ids
