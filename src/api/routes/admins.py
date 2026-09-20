from fastapi import APIRouter, Depends, HTTPException, status
from api.dependencies import get_current_admin, get_current_admin_optional, verify_setup_key
from api.schemas.admin import AdminCreateRequest, AdminUpdateRequest
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

@router.get('', response_model=list[AdminResponse])
async def list_admins(current_admin: AdminInDB = Depends(get_current_admin)):
    return await admin_service.list_admins()

@router.get('/{admin_id}', response_model=AdminResponse)
async def get_admin(admin_id: str, current_admin: AdminInDB = Depends(get_current_admin)):
    admin = await admin_service.get_admin_by_id(admin_id)

    if admin is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Admin not found')

    return admin

@router.patch('/{admin_id}', response_model=AdminResponse)
async def update_admin(
    admin_id: str,
    payload: AdminUpdateRequest,
    current_admin: AdminInDB = Depends(get_current_admin),
):
    try:
        return await admin_service.update_admin(admin_id, payload.username, payload.password)
    except admin_service.AdminNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    except admin_service.DuplicateAdminError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))

@router.delete('/{admin_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_admin(admin_id: str, current_admin: AdminInDB = Depends(get_current_admin)):
    try:
        deleted = await admin_service.remove_admin(admin_id)
    except admin_service.LastAdminError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))

    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Admin not found')
