import asyncio
import time
import cv2
from core.camera import get_camera_stream, get_frame, release_camera
from core.face_recognition import generate_embedding, find_matching_user, normalize_embeddings
from database.repository import get_all_users

CACHE_REFRESH_SECONDS = 30
IDLE_SLEEP_SECONDS = 0.01

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

ROTATIONS = [
    None,
    cv2.ROTATE_90_CLOCKWISE,
    cv2.ROTATE_180,
    cv2.ROTATE_90_COUNTERCLOCKWISE,
]

async def load_known_users_cache() -> tuple[cv2.Mat | None, list[str]]:
    users = await get_all_users()

    embeddings = [user.face_embedding for user in users]
    user_ids = [str(user.id) for user in users]
    normalized_matrix = normalize_embeddings(embeddings) if embeddings else None

    return normalized_matrix, user_ids

def detect_faces(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    return face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(80, 80))

def find_upright_frame(frame, last_working_rotation=None):
    ordered_rotations = ROTATIONS
    if last_working_rotation is not None:
        ordered_rotations = [last_working_rotation] + [r for r in ROTATIONS if r != last_working_rotation]

    for rotation in ordered_rotations:
        candidate = cv2.rotate(frame, rotation) if rotation is not None else frame

        if len(detect_faces(candidate)) > 0:
            return candidate, rotation

    return None, None

async def run_recognition_loop():
    capture = get_camera_stream()

    normalized_known_matrix, user_ids = await load_known_users_cache()
    last_cache_refresh = time.time()
    already_processed = False
    last_working_rotation = None

    try:
        while True:
            frame = get_frame(capture)

            if frame is None:
                await asyncio.sleep(IDLE_SLEEP_SECONDS)
                continue

            upright_frame, last_working_rotation = find_upright_frame(frame, last_working_rotation)

            if upright_frame is None:
                already_processed = False
                await asyncio.sleep(IDLE_SLEEP_SECONDS)
                continue

            if already_processed:
                await asyncio.sleep(IDLE_SLEEP_SECONDS)
                continue

            if time.time() - last_cache_refresh > CACHE_REFRESH_SECONDS:
                normalized_known_matrix, user_ids = await load_known_users_cache()
                last_cache_refresh = time.time()

            new_embedding = generate_embedding(upright_frame)

            if new_embedding is None:
                print('Face detected by the pre-filter, but mtcnn could not confirm it')
                continue

            already_processed = True

            result = find_matching_user(new_embedding, normalized_known_matrix, user_ids)

            if result:
                user_id, distance = result
                print(f'Access granted: {user_id} (distance {distance})')
            else:
                print('Face not recognized')

    finally:
        release_camera(capture)

if __name__ == '__main__':
    asyncio.run(run_recognition_loop())
