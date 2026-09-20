from fastapi import APIRouter, Depends, Form, HTTPException, status
from api.dependencies import (
    get_frame_from_upload,
    get_frame_from_optional_upload,
    get_current_admin,
)
from core import user_service
from database.models import UserResponse, AdminInDB

router = APIRouter(prefix='/users', tags=['users'])

@router.post('', response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    name: str = Form(...),
    document: str = Form(...),
    photo_frame=Depends(get_frame_from_upload),
    current_admin: AdminInDB = Depends(get_current_admin),
):
    try:
        return await user_service.register_user(name, document, photo_frame)
    except user_service.DuplicateUserError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))
    except user_service.NoFaceDetectedError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error))

@router.get('', response_model=list[UserResponse])
async def list_users(current_admin: AdminInDB = Depends(get_current_admin)):
    return await user_service.list_users()

@router.get('/document/{document}', response_model=UserResponse)
async def get_user_by_document(document: str, current_admin: AdminInDB = Depends(get_current_admin)):
    user = await user_service.get_user_by_document(document)

    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')

    return user

@router.patch('/document/{document}', response_model=UserResponse)
async def update_user_by_document(
    document: str,
    name: str | None = Form(default=None, examples=['']),
    new_document: str | None = Form(default=None, examples=['']),
    photo_frame=Depends(get_frame_from_optional_upload),
    current_admin: AdminInDB = Depends(get_current_admin),
):
    try:
        return await user_service.update_user_by_document(document, name, new_document, photo_frame)
    except user_service.UserNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    except user_service.DuplicateUserError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))
    except user_service.NoFaceDetectedError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error))

@router.delete('/document/{document}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_by_document(document: str, current_admin: AdminInDB = Depends(get_current_admin)):
    deleted = await user_service.remove_user_by_document(document)

    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')

@router.get('/{user_id}', response_model=UserResponse)
async def get_user(user_id: str, current_admin: AdminInDB = Depends(get_current_admin)):
    user = await user_service.get_user(user_id)

    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')

    return user

@router.patch('/{user_id}', response_model=UserResponse)
async def update_user(
    user_id: str,
    name: str | None = Form(default=None, examples=['']),
    document: str | None = Form(default=None, examples=['']),
    photo_frame=Depends(get_frame_from_optional_upload),
    current_admin: AdminInDB = Depends(get_current_admin),
):
    try:
        return await user_service.update_user(user_id, name, document, photo_frame)
    except user_service.UserNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    except user_service.DuplicateUserError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))
    except user_service.NoFaceDetectedError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error))

@router.delete('/{user_id}', status_code=status.HTTP_204_NO_CONTENT)
async def remove_user(user_id: str, current_admin: AdminInDB = Depends(get_current_admin)):
    deleted = await user_service.remove_user(user_id)

    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
