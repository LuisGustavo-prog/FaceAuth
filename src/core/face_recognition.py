import numpy as np
from deepface import DeepFace

DISTANCE_THRESHOLD = 0.40

def generate_embedding(image_path: str) -> list[float]:
    result = DeepFace.represent(img_path=image_path, detector_backend='mtcnn')
    return result[0]['embedding']

def find_matching_user(new_embedding: list[float], known_embeddings: list[list[float]], user_ids: list[str]) -> tuple[str, float] | None:
    if not known_embeddings:
        return None

    new_vector = np.array(new_embedding)
    known_matrix = np.array(known_embeddings)

    new_norm = new_vector / np.linalg.norm(new_vector)
    known_norms = known_matrix / np.linalg.norm(known_matrix, axis=1, keepdims=True)

    similarities = np.dot(known_norms, new_norm)
    distances = 1 - similarities

    best_index = np.argmin(distances)
    best_distance = distances[best_index]

    if best_distance <= DISTANCE_THRESHOLD:
        return (user_ids[best_index], float(best_distance))

    return None
