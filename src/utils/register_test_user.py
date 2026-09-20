from database.repository import create_user
from database.models import UserCreate
from core.face_recognition import generate_embedding
from pathlib import Path
import asyncio

ROOT_DIR = Path(__file__).resolve().parents[2]

async def main():
    image_path = str(ROOT_DIR / 'test_images' / 'teste.jpg')
    embedding = generate_embedding(image_path)

    user = UserCreate(name='Suil', document='000000000')
    created_user = await create_user(user, embedding)

    print(f'User created with id: {created_user.id}')

asyncio.run(main())
