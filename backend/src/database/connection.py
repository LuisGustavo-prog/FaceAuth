import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()
MONGO_URI = os.getenv('MONGO_URI')

if not MONGO_URI:
    raise ValueError('MONGO_URI not found in .env')

client: AsyncIOMotorClient = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=5000)
database = client.get_default_database()

async def ping_database() -> bool:
    try:
        await client.admin.command('ping')
        return True
    except Exception as e:
        print(f'Error connecting to MongoDB: {e}')
        return False

def get_database():
    return database
