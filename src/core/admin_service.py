from core.security import hash_password, verify_password
from database.models import AdminCreate, AdminInDB, AdminResponse
from database.repository import (
    create_admin,
    get_admin_by_username,
    get_admin_by_id as db_get_admin_by_id,
    get_all_admins,
    update_admin as db_update_admin,
    delete_admin as db_delete_admin,
    count_admins,
)

class DuplicateAdminError(Exception):
    pass

class InvalidCredentialsError(Exception):
    pass

class AdminNotFoundError(Exception):
    pass

class LastAdminError(Exception):
    pass

def _to_response(admin: AdminInDB) -> AdminResponse:
    return AdminResponse(
        id=str(admin.id),
        username=admin.username,
        created_at=admin.created_at,
    )

async def register_admin(username: str, password: str) -> AdminResponse:
    existing_admin = await get_admin_by_username(username)

    if existing_admin:
        raise DuplicateAdminError(f'Admin with username {username} already exists')

    hashed_password = hash_password(password)
    created_admin = await create_admin(AdminCreate(username=username, password=password), hashed_password)

    return _to_response(created_admin)

async def authenticate_admin(username: str, password: str) -> AdminInDB:
    admin = await get_admin_by_username(username)

    if admin is None or not verify_password(password, admin.hashed_password):
        raise InvalidCredentialsError('Invalid username or password')

    return admin

async def get_admin(username: str) -> AdminInDB | None:
    return await get_admin_by_username(username)

async def list_admins() -> list[AdminResponse]:
    admins = await get_all_admins()

    return [_to_response(admin) for admin in admins]

async def get_admin_by_id(admin_id: str) -> AdminResponse | None:
    admin = await db_get_admin_by_id(admin_id)

    return _to_response(admin) if admin else None

async def update_admin(admin_id: str, username: str | None, password: str | None) -> AdminResponse:
    admin = await db_get_admin_by_id(admin_id)

    if admin is None:
        raise AdminNotFoundError('Admin not found')

    update_fields = {}

    if username and username != admin.username:
        existing_admin = await get_admin_by_username(username)

        if existing_admin:
            raise DuplicateAdminError(f'Admin with username {username} already exists')

        update_fields['username'] = username

    if password:
        update_fields['hashed_password'] = hash_password(password)

    updated_admin = await db_update_admin(admin_id, update_fields)

    return _to_response(updated_admin)

async def remove_admin(admin_id: str) -> bool:
    total_admins = await count_admins()

    if total_admins <= 1:
        raise LastAdminError('Cannot delete the last remaining admin')

    return await db_delete_admin(admin_id)
