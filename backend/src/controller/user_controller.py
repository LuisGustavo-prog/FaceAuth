from fastapi import HTTPException, status
from core import user_service

async def register_user(name, document, photo_frame):
    try:
        return await user_service.register_user(name, document, photo_frame)
    except user_service.DuplicateUserError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))
    except user_service.NoFaceDetectedError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error))

async def list_users():
    return await user_service.list_users()

async def get_user_by_document(document):
    user = await user_service.get_user_by_document(document)

    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')

    return user

async def update_user_by_document(document, name, new_document, photo_frame):
    try:
        return await user_service.update_user_by_document(document, name, new_document, photo_frame)
    except user_service.UserNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    except user_service.DuplicateUserError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))
    except user_service.NoFaceDetectedError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error))

async def delete_user_by_document(document):
    deleted = await user_service.remove_user_by_document(document)

    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')

async def get_user(user_id):
    user = await user_service.get_user(user_id)

    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')

    return user

async def update_user(user_id, name, document, photo_frame):
    try:
        return await user_service.update_user(user_id, name, document, photo_frame)
    except user_service.UserNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    except user_service.DuplicateUserError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))
    except user_service.NoFaceDetectedError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error))

async def remove_user(user_id):
    deleted = await user_service.remove_user(user_id)

    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
    