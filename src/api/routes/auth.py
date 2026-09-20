from fastapi import APIRouter, Depends, HTTPException, status
from api.dependencies import get_frame_from_upload, get_current_admin
from api.schemas.auth import VerifyResponse, LoginRequest, TokenResponse
from core import face_auth_service, admin_service
from core.security import create_access_token
from database.models import UserResponse, AdminInDB

router = APIRouter(prefix='/auth', tags=['auth'])

@router.post('/login', response_model=TokenResponse)
async def login(payload: LoginRequest):
    try:
        admin = await admin_service.authenticate_admin(payload.username, payload.password)
    except admin_service.InvalidCredentialsError as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(error))

    token = create_access_token(subject=admin.username)

    return TokenResponse(access_token=token)

@router.post('/verify', response_model=VerifyResponse)
async def verify_face(
    photo_frame=Depends(get_frame_from_upload),
    current_admin: AdminInDB = Depends(get_current_admin),
):
    result = await face_auth_service.verify_face(photo_frame)

    if result is None:
        return VerifyResponse(access_granted=False)

    user, distance = result

    return VerifyResponse(
        access_granted=True,
        user=UserResponse(
            id=str(user.id),
            name=user.name,
            document=user.document,
            created_at=user.created_at,
        ),
        distance=distance,
    )
