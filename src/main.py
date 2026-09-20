import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from api.routes import users, auth, admins
from database.connection import ping_database

DB_RETRY_INTERVAL_SECONDS = 2

@asynccontextmanager
async def lifespan(app: FastAPI):
    while not await ping_database():
        print(f'MongoDB not reachable yet, retrying in {DB_RETRY_INTERVAL_SECONDS}s...')
        await asyncio.sleep(DB_RETRY_INTERVAL_SECONDS)

    print('MongoDB connection OK')

    yield

app = FastAPI(title='FaceAuth API', lifespan=lifespan)

app.include_router(users.router)
app.include_router(auth.router)
app.include_router(admins.router)

@app.get('/health')
async def health_check():
    return {'status': 'ok'}
