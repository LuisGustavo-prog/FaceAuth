import numpy as np
import cv2

MAX_FACE_DIMENSION = 400

def bytes_to_frame(data: bytes) -> np.ndarray | None:
    array = np.frombuffer(data, dtype=np.uint8)
    frame = cv2.imdecode(array, cv2.IMREAD_COLOR)

    return frame

def resize_for_embedding(frame: np.ndarray, max_dimension: int = MAX_FACE_DIMENSION) -> np.ndarray:
    height, width = frame.shape[:2]
    scale = max_dimension / max(height, width)

    if scale >= 1.0:
        return frame

    new_size = (int(width * scale), int(height * scale))

    return cv2.resize(frame, new_size, interpolation=cv2.INTER_AREA)
