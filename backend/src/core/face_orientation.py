import os
import cv2

DNN_CONFIDENCE_THRESHOLD = 0.5

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

def auto_orient(frame):
    """Retorna o frame na orientacao com maior confianca de deteccao de rosto.
    Se o pre-filtro DNN nao achar rosto em nenhuma rotacao, devolve o frame
    original sem alteracao, para o MTCNN ainda ter a chance de tentar."""
    upright_frame, _rotation, _face_box = find_upright_frame(frame)
    return upright_frame if upright_frame is not None else frame
