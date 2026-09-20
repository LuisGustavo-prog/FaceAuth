import numpy as np
import cv2

def bytes_to_frame(data: bytes) -> np.ndarray | None:
    array = np.frombuffer(data, dtype=np.uint8)
    frame = cv2.imdecode(array, cv2.IMREAD_COLOR)

    return frame
