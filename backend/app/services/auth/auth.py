import logging
import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import jwt
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash

from app.repositories.user_repo import SQLAlchemyRepository

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(self, repository: SQLAlchemyRepository):
        self.repository = repository
        self.password_hash = PasswordHash.recommended()
        self.secret_key = os.getenv("SECRET_KEY", "dev-secret-key-change-me")
        self.algorithm = os.getenv("ALGORITHM", "HS256")
        self.access_token_expire_minutes = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
        self.refresh_token_expire_days = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "14"))
        self.reset_token_expire_minutes = int(os.getenv("RESET_TOKEN_EXPIRE_MINUTES", "15"))

        if self.secret_key == "dev-secret-key-change-me":
            logger.warning("Using default SECRET_KEY. Set SECRET_KEY in env for production.")

    def get_password_hash(self, password: str) -> str:
        return self.password_hash.hash(password)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return self.password_hash.verify(plain_password, hashed_password)

    def _create_token(
        self,
        data: Dict[str, Any],
        token_type: str,
        expires_delta: timedelta,
    ) -> str:
        to_encode = data.copy()
        now = datetime.now(timezone.utc)
        to_encode.update({"exp": now + expires_delta, "iat": now, "token_type": token_type})
        return jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)

    def create_access_token(
        self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None
    ) -> str:
        return self._create_token(
            data=data,
            token_type="access",
            expires_delta=expires_delta or timedelta(minutes=self.access_token_expire_minutes),
        )

    def create_refresh_token(
        self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None
    ) -> str:
        return self._create_token(
            data=data,
            token_type="refresh",
            expires_delta=expires_delta or timedelta(days=self.refresh_token_expire_days),
        )

    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        try:
            return jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
        except InvalidTokenError:
            return None

    def verify_token_type(self, token: str, token_type: str) -> Optional[Dict[str, Any]]:
        payload = self.verify_token(token)
        if not payload or payload.get("token_type") != token_type:
            return None
        return payload

    def verify_access_token(self, token: str) -> Optional[Dict[str, Any]]:
        return self.verify_token_type(token, "access")

    def verify_refresh_token(self, token: str) -> Optional[Dict[str, Any]]:
        return self.verify_token_type(token, "refresh")

    def user_matches_token_session(self, user: Dict[str, Any], payload: Dict[str, Any]) -> bool:
        try:
            token_session_version = int(payload.get("session_version", -1))
            current_session_version = int(user.get("session_version", 0))
        except (TypeError, ValueError):
            return False
        return token_session_version == current_session_version

    def create_reset_token(self, email: str) -> str:
        user = self.repository.get_user_by_email(email)
        return self._create_token(
            data={
                "sub": email,
                "session_version": int(user.get("session_version", 0)) if user else 0,
            },
            token_type="reset",
            expires_delta=timedelta(minutes=self.reset_token_expire_minutes),
        )

    def verify_reset_token(self, token: str) -> Optional[str]:
        payload = self.verify_token_type(token, "reset")
        if not payload:
            return None
        email = payload.get("sub")
        if not isinstance(email, str):
            return None
        user = self.repository.get_user_by_email(email)
        if not user or not self.user_matches_token_session(user, payload):
            return None
        return email

    def authenticate_user(self, email: str, password: str) -> Optional[Dict[str, Any]]:
        user = self.repository.get_user_by_email(email)
        if not user:
            return None
        if not self.verify_password(password, user.get("hashed_password", "")):
            return None
        return user
