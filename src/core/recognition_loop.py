import time
from src.core.camera import get_camera_stream, get_frame, release_camera
from src.core.face_recognition import generate_embedding, find_matching_user
from src.database.repository import get_all_users

PROCESS_EVERY_N_FRAMES = 10
CACHE_REFRESH_SECONDS = 30

def load_known_users_cache() -> tuple[list[list[float]], list[str]]:
    users = get_all_users()

    embeddings = [user.face_embedding for user in users]
    user_ids = [str(user.id) for user in users]

    return embeddings, user_ids

async def run_recognition_loop():
    capture = get_camera_stream()

    known_embeddings, user_ids = await load_known_users_cache()
    last_cache_refresh = time.time()

    frame_count = 0

    try:
        while True:
            frame = get_frame(capture)

            if frame is None:
                continue

            frame_count += 1

            if frame_count % PROCESS_EVERY_N_FRAMES != 0:
                continue

            if time.time() - last_cache_refresh > CACHE_REFRESH_SECONDS:
                known_embeddings, user_ids = await load_known_users_cache()
                last_cache_refresh = time.time()

            new_embedding = generate_embedding(frame)
            result = find_matching_user(new_embedding, known_embeddings, user_ids)

            if result:
                user_id, distance = result
                print(f'Acesso liberado: {user_id} (distância {distance})')
            else:
                print('Rosto não reconhecido')

    finally:
        release_camera(capture)
