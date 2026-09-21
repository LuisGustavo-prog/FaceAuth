from fastapi import APIRouter, Depends
from api.dependencies import get_frame_from_upload
from api.schemas.auth import VerifyResponse, LoginRequest, TokenResponse
from controller import auth_controller

router = APIRouter(prefix='/auth', tags=['auth'])

@router.post('/admin/login', response_model=TokenResponse)
async def admin_login(payload: LoginRequest):
    return await auth_controller.admin_login(payload.username, payload.password)

@router.post('/verify', response_model=VerifyResponse)
async def verify_face(photo_frame=Depends(get_frame_from_upload)):
    return await auth_controller.verify_face(photo_frame)
