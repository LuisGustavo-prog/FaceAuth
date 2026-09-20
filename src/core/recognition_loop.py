import os
import time
import asyncio
import cv2
from core.camera import get_camera_stream, get_frame, release_camera
from core.face_recognition import generate_embedding, get_closest_match, DISTANCE_THRESHOLD
from core import user_cache
from utils.image_utils import resize_for_embedding

IDLE_SLEEP_SECONDS = 0.01
DNN_CONFIDENCE_THRESHOLD = 0.5
FACE_CROP_PADDING_RATIO = 0.3

MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')
PROTOTXT_PATH = os.path.join(MODEL_DIR, 'deploy.prototxt')
CAFFEMODEL_PATH = os.path.join(MODEL_DIR, 'res10_300x300_ssd_iter_140000_fp16.caffemodel')

face_net = cv2.dnn.readNetFromCaffe(PROTOTXT_PATH, CAFFEMODEL_PATH)

ROTATIONS = [
    None,
    cv2.ROTATE_90_CLOCKWISE,
    cv2.ROTATE_180,
    cv2.ROTATE_90_COUNTERCLOCKWISE,
]

def detect_faces(frame):
    height, width = frame.shape[:2]
    blob = cv2.dnn.blobFromImage(cv2.resize(frame, (300, 300)), 1.0, (300, 300), (104.0, 177.0, 123.0))

    face_net.setInput(blob)
    detections = face_net.forward()

    faces = []

    for i in range(detections.shape[2]):
        confidence = detections[0, 0, i, 2]

        if confidence > DNN_CONFIDENCE_THRESHOLD:
            box = detections[0, 0, i, 3:7] * [width, height, width, height]
            faces.append((float(confidence), box.astype('int')))

    faces.sort(key=lambda item: item[0], reverse=True)

    return faces

def find_upright_frame(frame):
    best_candidate = None
    best_rotation = None
    best_box = None
    best_confidence = -1.0

    for rotation in ROTATIONS:
        candidate = cv2.rotate(frame, rotation) if rotation is not None else frame
        faces = detect_faces(candidate)

        if faces:
            confidence, box = faces[0]

            if confidence > best_confidence:
                best_confidence = confidence
                best_candidate = candidate
                best_rotation = rotation
                best_box = box

    if best_candidate is None:
        return None, None, None

    return best_candidate, best_rotation, best_box

def crop_face(frame, box, padding_ratio=FACE_CROP_PADDING_RATIO):
    height, width = frame.shape[:2]
    x1, y1, x2, y2 = box

    pad_x = int((x2 - x1) * padding_ratio)
    pad_y = int((y2 - y1) * padding_ratio)

    x1 = max(0, x1 - pad_x)
    y1 = max(0, y1 - pad_y)
    x2 = min(width, x2 + pad_x)
    y2 = min(height, y2 + pad_y)

    return frame[y1:y2, x1:x2]

async def run_recognition_loop():
    capture = get_camera_stream()

    already_processed = False

    try:
        while True:
            frame = get_frame(capture)

            if frame is None:
                await asyncio.sleep(IDLE_SLEEP_SECONDS)
                continue

            upright_frame, rotation, face_box = find_upright_frame(frame)

            if upright_frame is None:
                already_processed = False
                await asyncio.sleep(IDLE_SLEEP_SECONDS)
                continue

            if already_processed:
                await asyncio.sleep(IDLE_SLEEP_SECONDS)
                continue

            cropped_face = crop_face(upright_frame, face_box)
            resized_face = resize_for_embedding(cropped_face)
            blur_score = cv2.Laplacian(cv2.cvtColor(resized_face, cv2.COLOR_BGR2GRAY), cv2.CV_64F).var()

            start_time = time.perf_counter()
            new_embedding = generate_embedding(resized_face)
            elapsed = time.perf_counter() - start_time
            print(f'[PERF] generate_embedding via camera: {elapsed:.3f}s, shape {resized_face.shape} (recorte original {cropped_face.shape})')

            if new_embedding is None:
                print(f'Face detected by the pre-filter, but mtcnn could not confirm it (crop {resized_face.shape}, blur {blur_score:.1f})')
                continue

            already_processed = True

            normalized_known_matrix, user_ids = await user_cache.get_known_users()
            closest_match = get_closest_match(new_embedding, normalized_known_matrix, user_ids)

            if closest_match is None:
                print('Face not recognized (no users registered in cache)')
            else:
                user_id, distance = closest_match

                if distance <= DISTANCE_THRESHOLD:
                    print(f'Access granted: {user_id} (distance {distance:.4f})')
                else:
                    print(f'Face not recognized (closest: {user_id}, distance {distance:.4f}, threshold {DISTANCE_THRESHOLD}, blur {blur_score:.1f})')

    finally:
        release_camera(capture)

if __name__ == '__main__':
    asyncio.run(run_recognition_loop())
