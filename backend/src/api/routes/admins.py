from fastapi import APIRouter, Depends, status
from api.dependencies import get_current_admin, get_current_admin_optional, verify_setup_key
from api.schemas.admin import AdminCreateRequest, AdminUpdateRequest
from controller import admin_controller
from database.models import AdminResponse, AdminInDB

router = APIRouter(prefix='/admins', tags=['admins'])

@router.post('', response_model=AdminResponse, status_code=status.HTTP_201_CREATED)
async def create_admin(
    payload: AdminCreateRequest,
    current_admin: AdminInDB | None = Depends(get_current_admin_optional),
    has_setup_key: bool = Depends(verify_setup_key),
):
    return await admin_controller.create_admin(payload, current_admin, has_setup_key)

@router.get('', response_model=list[AdminResponse])
async def list_admins(current_admin: AdminInDB = Depends(get_current_admin)):
    return await admin_controller.list_admins()

@router.get('/{admin_id}', response_model=AdminResponse)
async def get_admin(admin_id: str, current_admin: AdminInDB = Depends(get_current_admin)):
    return await admin_controller.get_admin(admin_id)

@router.patch('/{admin_id}', response_model=AdminResponse)
async def update_admin(
    admin_id: str,
    payload: AdminUpdateRequest,
    current_admin: AdminInDB = Depends(get_current_admin),
):
    return await admin_controller.update_admin(admin_id, payload.username, payload.password)

@router.delete('/{admin_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_admin(admin_id: str, current_admin: AdminInDB = Depends(get_current_admin)):
    await admin_controller.delete_admin(admin_id)
