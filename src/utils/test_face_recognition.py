from src.core.face_recognition import generate_embedding, find_matching_user
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]

embedding_teste = generate_embedding(str(ROOT_DIR / 'test_images' / 'teste.jpg'))
embedding_rosto_2 = generate_embedding(str(ROOT_DIR / 'test_images' / 'teste_rosto_2.jpg'))

print('--- Comparando teste.jpg com ele mesmo ---')
resultado_mesma_foto = find_matching_user(
    new_embedding=embedding_teste,
    known_embeddings=[embedding_teste],
    user_ids=['usuario_teste']
)
print(resultado_mesma_foto)

print('--- Comparando teste.jpg com teste_rosto_2.jpg ---')
resultado_fotos_diferentes = find_matching_user(
    new_embedding=embedding_rosto_2,
    known_embeddings=[embedding_teste],
    user_ids=['usuario_teste']
)
print(resultado_fotos_diferentes)
