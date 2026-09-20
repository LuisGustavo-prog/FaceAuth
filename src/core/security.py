import os
import secrets
import hashlib
import hmac
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
JWT_ALGORITHM = os.getenv('JWT_ALGORITHM', 'HS256')
JWT_EXPIRE_MINUTES = int(os.getenv('JWT_EXPIRE_MINUTES', '60'))

if not JWT_SECRET_KEY:
    raise ValueError('JWT_SECRET_KEY not found in .env')

PBKDF2_ITERATIONS = 260_000

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    derived = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), bytes.fromhex(salt), PBKDF2_ITERATIONS)

    return f'{salt}${derived.hex()}'

def verify_password(password: str, hashed_password: str) -> bool:
    salt, _, stored_hash = hashed_password.partition('$')
    derived = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), bytes.fromhex(salt), PBKDF2_ITERATIONS)

    return hmac.compare_digest(derived.hex(), stored_hash)

def create_access_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)
    payload = {'sub': subject, 'exp': expire}

    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def decode_access_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload.get('sub')
    except JWTError:
        return None
