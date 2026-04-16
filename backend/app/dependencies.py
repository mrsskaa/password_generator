from functools import lru_cache

from backend.app.repositories.saved_password_repo import PasswordRepository
from backend.app.repositories.user_repo import SQLAlchemyRepository
from backend.app.services.auth.auth import AuthService
from backend.app.services.password_service.password_service import PasswordService


@lru_cache
def get_repository() -> SQLAlchemyRepository:
    return SQLAlchemyRepository()


def get_auth_service() -> AuthService:
    return AuthService(get_repository())


def get_password_service() -> PasswordService:
    repository = get_repository()
    password_repo = PasswordRepository(repository.SessionLocal)
    return PasswordService(password_repo)
