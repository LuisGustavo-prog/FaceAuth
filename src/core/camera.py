import os
import cv2
from dotenv import load_dotenv

load_dotenv()
CAMERA_URL = os.getenv('CAMERA_URL')

def get_camera_stream() -> cv2.VideoCapture:
    if not CAMERA_URL:
        raise ValueError('CAMERA_URL not found in .env')

    capture = cv2.VideoCapture(CAMERA_URL, cv2.CAP_FFMPEG)

    if not capture.isOpened():
        raise ConnectionError(f'Could not connect to the camera at {CAMERA_URL}')

    return capture

def get_frame(capture: cv2.VideoCapture):
    success, frame = capture.read()

    if not success:
        return None

    return frame

def release_camera(capture: cv2.VideoCapture) -> None:
    capture.release()
