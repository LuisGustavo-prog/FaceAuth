import os
import threading
import cv2
from dotenv import load_dotenv

load_dotenv()
CAMERA_URL = os.getenv('CAMERA_URL')

class CameraStream:
    def __init__(self, url: str):
        self.capture = cv2.VideoCapture(url, cv2.CAP_FFMPEG)

        if not self.capture.isOpened():
            raise ConnectionError(f'Could not connect to the camera at {url}')

        self._latest_frame = None
        self._lock = threading.Lock()
        self._running = True
        self._thread = threading.Thread(target=self._update, daemon=True)
        self._thread.start()

    def _update(self):
        while self._running:
            try:
                success, frame = self.capture.read()
            except cv2.error:
                break

            if success:
                with self._lock:
                    self._latest_frame = frame

    def read(self):
        with self._lock:
            return self._latest_frame

    def release(self):
        self._running = False
        self._thread.join(timeout=1)
        self.capture.release()

def get_camera_stream() -> CameraStream:
    if not CAMERA_URL:
        raise ValueError('CAMERA_URL not found in .env')

    return CameraStream(CAMERA_URL)

def get_frame(camera_stream: CameraStream):
    return camera_stream.read()

def release_camera(camera_stream: CameraStream) -> None:
    camera_stream.release()
