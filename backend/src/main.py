import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import users, auth, admins
from database.connection import ping_database
from core.face_recognition import warm_up

DB_RETRY_INTERVAL_SECONDS = 2

@asynccontextmanager
async def lifespan(app: FastAPI):
    while not await ping_database():
        print(f'MongoDB not reachable yet, retrying in {DB_RETRY_INTERVAL_SECONDS}s...')
        await asyncio.sleep(DB_RETRY_INTERVAL_SECONDS)

    print('MongoDB connection OK')

    print('Warming up face recognition models (mtcnn + VGG-Face)...')
    await asyncio.to_thread(warm_up)
    print('Face recognition models ready')

    yield

app = FastAPI(title='FaceAuth API', lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(users.router)
app.include_router(auth.router)
app.include_router(admins.router)

@app.get('/health')
async def health_check():
    return {'status': 'ok'}
