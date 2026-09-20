from core.security import hash_password, verify_password
from database.models import AdminCreate, AdminInDB, AdminResponse
from database.repository import create_admin, get_admin_by_username

class DuplicateAdminError(Exception):
    pass

class InvalidCredentialsError(Exception):
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
