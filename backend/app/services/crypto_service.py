"""Криптосервис для шифрования и дешифрования паролей

Ключевые принципы:
- Ключ шифрования не хранится в БД, а каждый раз вычисляется из master_secret + salt
- Для записи пароля в БД достаточно хранить:
  encrypted_password, nonce, salt, description, user_id, created_at
- Для работы алгоритма извне:
  1) при шифровании нужен: открытый пароль + master_secret (кодовое слово)
  2) при дешифровке нужен: master_secret + encrypted_password + salt + nonce
- master_secret не сохраняется в БД и должен вводиться пользователем
"""

from __future__ import annotations

import os
from typing import TypedDict

from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC


PBKDF2_ITERATIONS = 100_000
KEY_LENGTH_BYTES = 32
SALT_LENGTH_BYTES = 16
NONCE_LENGTH_BYTES = 12


class EncryptedPayload(TypedDict):
    encrypted_password: bytes
    salt: bytes
    nonce: bytes


def derive_key(master_secret: str, salt: bytes) -> bytes:
    """Derive a 256-bit key from master_secret and salt."""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=KEY_LENGTH_BYTES,
        salt=salt,
        iterations=PBKDF2_ITERATIONS,
        backend=default_backend(),
    )
    return kdf.derive(master_secret.encode("utf-8"))


def encrypt_password(password: str, master_secret: str) -> EncryptedPayload:
    """Encrypt password using AES-GCM with a derived key."""
    salt = os.urandom(SALT_LENGTH_BYTES)
    key = derive_key(master_secret, salt)

    aesgcm = AESGCM(key)
    nonce = os.urandom(NONCE_LENGTH_BYTES)
    encrypted = aesgcm.encrypt(nonce, password.encode("utf-8"), None)

    return {
        "encrypted_password": encrypted,
        "salt": salt,
        "nonce": nonce,
    }


def decrypt_password(
    encrypted_password: bytes,
    master_secret: str,
    salt: bytes,
    nonce: bytes,
) -> str:
    """Decrypt password using AES-GCM with a re-derived key."""
    key = derive_key(master_secret, salt)
    aesgcm = AESGCM(key)

    decrypted = aesgcm.decrypt(nonce, encrypted_password, None)
    return decrypted.decode("utf-8")
