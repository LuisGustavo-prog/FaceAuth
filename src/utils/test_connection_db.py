import asyncio
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]

if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from src.database.connection import ping_database

async def main():
    ok = await ping_database()
    print('Conectado!' if ok else 'Falhou.')

if __name__ == "__main__":
    asyncio.run(main())
