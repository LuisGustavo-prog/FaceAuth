from fastapi import HTTPException, status
from api.schemas.auth import VerifyResponse, TokenResponse
from core import face_auth_service, admin_service
from core.security import create_access_token
from database.models import UserResponse

async def admin_login(username, password):
    try:
        admin = await admin_service.authenticate_admin(username, password)
    except admin_service.InvalidCredentialsError as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(error))

    token = create_access_token(subject=admin.username)

    return TokenResponse(access_token=token)

async def verify_face(photo_frame):
    face_detected, user, distance = await face_auth_service.verify_face(photo_frame)

    if not face_detected or user is None:
        return VerifyResponse(access_granted=False, face_detected=face_detected)

    return VerifyResponse(
        access_granted=True,
        face_detected=True,
        user=UserResponse(
            id=str(user.id),
            name=user.name,
            document=user.document,
            created_at=user.created_at,
        ),
        distance=distance,
    )
