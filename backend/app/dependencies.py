from functools import lru_cache

from backend.app.repositories.user_repo import SQLAlchemyRepository
from backend.app.services.auth.auth import AuthService


@lru_cache
def get_repository() -> SQLAlchemyRepository:
    return SQLAlchemyRepository()


def get_auth_service() -> AuthService:
    return AuthService(get_repository())
