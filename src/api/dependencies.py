import os
from dotenv import load_dotenv
from fastapi import UploadFile, File, Header, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from utils.image_utils import bytes_to_frame
from core.security import decode_access_token
from core import admin_service
from database.models import AdminInDB

load_dotenv()
ADMIN_SETUP_KEY = os.getenv('ADMIN_SETUP_KEY')

bearer_scheme = HTTPBearer(auto_error=False)

async def get_frame_from_upload(photo: UploadFile = File(...)) -> object:
    contents = await photo.read()
    frame = bytes_to_frame(contents)

    if frame is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Invalid or unreadable image file',
        )

    return frame

async def get_current_admin_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> AdminInDB | None:
    if credentials is None:
        return None

    username = decode_access_token(credentials.credentials)

    if username is None:
        return None

    return await admin_service.get_admin(username)

async def get_current_admin(
    admin: AdminInDB | None = Depends(get_current_admin_optional),
) -> AdminInDB:
    if admin is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid or missing authentication token',
            headers={'WWW-Authenticate': 'Bearer'},
        )

    return admin

def verify_setup_key(x_setup_key: str | None = Header(default=None)) -> bool:
    return bool(ADMIN_SETUP_KEY) and x_setup_key == ADMIN_SETUP_KEY
