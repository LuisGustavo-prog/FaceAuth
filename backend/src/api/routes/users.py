from fastapi import APIRouter, Depends, Form, status
from api.dependencies import (
    get_frame_from_upload,
    get_frame_from_optional_upload,
    get_current_admin,
)
from controller import user_controller
from database.models import UserResponse, AdminInDB

router = APIRouter(prefix='/users', tags=['users'])

@router.post('', response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    name: str = Form(...),
    document: str = Form(...),
    photo_frame=Depends(get_frame_from_upload),
    current_admin: AdminInDB = Depends(get_current_admin),
):
    return await user_controller.register_user(name, document, photo_frame)

@router.get('', response_model=list[UserResponse])
async def list_users(current_admin: AdminInDB = Depends(get_current_admin)):
    return await user_controller.list_users()

@router.get('/document/{document}', response_model=UserResponse)
async def get_user_by_document(document: str, current_admin: AdminInDB = Depends(get_current_admin)):
    return await user_controller.get_user_by_document(document)

@router.patch('/document/{document}', response_model=UserResponse)
async def update_user_by_document(
    document: str,
    name: str | None = Form(default=None, examples=['']),
    new_document: str | None = Form(default=None, examples=['']),
    photo_frame=Depends(get_frame_from_optional_upload),
    current_admin: AdminInDB = Depends(get_current_admin),
):
    return await user_controller.update_user_by_document(document, name, new_document, photo_frame)

@router.delete('/document/{document}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_by_document(document: str, current_admin: AdminInDB = Depends(get_current_admin)):
    await user_controller.delete_user_by_document(document)

@router.get('/{user_id}', response_model=UserResponse)
async def get_user(user_id: str, current_admin: AdminInDB = Depends(get_current_admin)):
    return await user_controller.get_user(user_id)

@router.patch('/{user_id}', response_model=UserResponse)
async def update_user(
    user_id: str,
    name: str | None = Form(default=None, examples=['']),
    document: str | None = Form(default=None, examples=['']),
    photo_frame=Depends(get_frame_from_optional_upload),
    current_admin: AdminInDB = Depends(get_current_admin),
):
    return await user_controller.update_user(user_id, name, document, photo_frame)

@router.delete('/{user_id}', status_code=status.HTTP_204_NO_CONTENT)
async def remove_user(user_id: str, current_admin: AdminInDB = Depends(get_current_admin)):
    await user_controller.remove_user(user_id)
