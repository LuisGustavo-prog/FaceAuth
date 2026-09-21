from fastapi import HTTPException, status
from core import admin_service

async def create_admin(payload, current_admin, has_setup_key):
    if current_admin is None and not has_setup_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Provide a valid admin token or the X-Setup-Key header to create the first admin',
        )

    try:
        return await admin_service.register_admin(payload.username, payload.password)
    except admin_service.DuplicateAdminError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))

async def list_admins():
    return await admin_service.list_admins()

async def get_admin(admin_id):
    admin = await admin_service.get_admin_by_id(admin_id)

    if admin is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Admin not found')

    return admin

async def update_admin(admin_id, username, password):
    try:
        return await admin_service.update_admin(admin_id, username, password)
    except admin_service.AdminNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    except admin_service.DuplicateAdminError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))

async def delete_admin(admin_id):
    try:
        deleted = await admin_service.remove_admin(admin_id)
    except admin_service.LastAdminError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))

    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Admin not found')
