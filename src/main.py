from fastapi import FastAPI
from api.routes import users, auth, admins

app = FastAPI(title='FaceAuth API')

app.include_router(users.router)
app.include_router(auth.router)
app.include_router(admins.router)

@app.get('/health')
async def health_check():
    return {'status': 'ok'}
