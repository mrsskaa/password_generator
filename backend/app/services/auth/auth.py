import os
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

import jwt
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash
from backend.app.repositories.user_repo import SQLAlchemyRepository

# SQLAlchemyRepository - класс для работы с орм sqlalchemy
class AuthService:
    def __init__(self, repository: SQLAlchemyRepository):
        self.repository = repository
        self.password_hash = PasswordHash.recommended()
        self.secret_key = os.getenv("SECRET_KEY")
        self.algorithm = os.getenv("ALGORITHM", "HS256")
        self.access_token_expire_minutes = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

    def get_password_hash(self, password: str) -> str:
        return self.password_hash.hash(password)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return self.password_hash.verify(plain_password, hashed_password)

    def create_access_token(self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=self.access_token_expire_minutes))
        to_encode.update({"exp": expire})
        token_bytes = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return token_bytes.decode('utf-8')

    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        try:
            return jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
        except InvalidTokenError:
            return None

    def authenticate_user(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        user = self.repository.get_user_by_username(username)
        if not user:
            return None
        if not self.verify_password(password, user.get("hashed_password", "")):
            return None
        return user
