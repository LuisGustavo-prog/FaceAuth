from core.camera import get_camera_stream, get_frame, release_camera
import cv2

capture = get_camera_stream()

frame = get_frame(capture)

if frame is not None:
    cv2.imwrite('test_images/captured_frame.jpg', frame)
    print('Frame captured and saved successfully!')
else:
    print('Could not capture the frame.')

release_camera(capture)
