from fastapi import APIRouter, Depends, HTTPException, status
from api.dependencies import get_current_admin_optional, verify_setup_key
from api.schemas.admin import AdminCreateRequest
from core import admin_service
from database.models import AdminResponse, AdminInDB

router = APIRouter(prefix='/admins', tags=['admins'])

@router.post('', response_model=AdminResponse, status_code=status.HTTP_201_CREATED)
async def create_admin(
    payload: AdminCreateRequest,
    current_admin: AdminInDB | None = Depends(get_current_admin_optional),
    has_setup_key: bool = Depends(verify_setup_key),
):
    if current_admin is None and not has_setup_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Provide a valid admin token or the X-Setup-Key header to create the first admin',
        )

    try:
        return await admin_service.register_admin(payload.username, payload.password)
    except admin_service.DuplicateAdminError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))
