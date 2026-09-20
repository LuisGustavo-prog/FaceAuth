import numpy as np
from deepface import DeepFace
from deepface.modules.exceptions import FaceNotDetected

DISTANCE_THRESHOLD = 0.40

def generate_embedding(image) -> list[float] | None:
    try:
        result = DeepFace.represent(img_path=image, detector_backend='mtcnn')
        return result[0]['embedding']
    except FaceNotDetected:
        return None

def normalize_embeddings(embeddings: list[list[float]]) -> np.ndarray:
    matrix = np.array(embeddings)
    norms = np.linalg.norm(matrix, axis=1, keepdims=True)
    return matrix / norms

def find_matching_user(
    new_embedding: list[float],
    normalized_known_matrix: np.ndarray,
    user_ids: list[str],
) -> tuple[str, float] | None:
    if normalized_known_matrix is None or normalized_known_matrix.size == 0:
        return None

    new_vector = np.array(new_embedding)
    new_vector_normalized = new_vector / np.linalg.norm(new_vector)

    similarities = np.dot(normalized_known_matrix, new_vector_normalized)
    distances = 1 - similarities

    best_index = np.argmin(distances)
    best_distance = distances[best_index]

    if best_distance <= DISTANCE_THRESHOLD:
        return (user_ids[best_index], float(best_distance))

    return None
