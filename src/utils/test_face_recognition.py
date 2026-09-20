from core.face_recognition import generate_embedding, find_matching_user, normalize_embeddings
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]

test_embedding = generate_embedding(str(ROOT_DIR / 'test_images' / 'teste.jpg'))
second_face_embedding = generate_embedding(str(ROOT_DIR / 'test_images' / 'teste_rosto_2.jpg'))

print('--- Comparing teste.jpg with itself ---')
same_photo_result = find_matching_user(
    new_embedding=test_embedding,
    normalized_known_matrix=normalize_embeddings([test_embedding]),
    user_ids=['test_user']
)
print(same_photo_result)

print('--- Comparing teste.jpg with teste_rosto_2.jpg ---')
different_photos_result = find_matching_user(
    new_embedding=second_face_embedding,
    normalized_known_matrix=normalize_embeddings([test_embedding]),
    user_ids=['test_user']
)
print(different_photos_result)
