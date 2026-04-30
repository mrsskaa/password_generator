import os
import base64
from typing import Optional

from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.exceptions import InvalidTag

from app.core.constants import PBKDF2_ITERATIONS, KEY_LENGTH_BYTES, SALT_LENGTH_BYTES, NONCE_LENGTH_BYTES
from app.models.encrypted_password import EncryptedPassword


class PasswordEncryptionService:
    def __init__(self, master_secret: str):
        self._master_secret = master_secret.encode("utf-8")

    def _derive_key(self, salt: bytes) -> bytes:
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=KEY_LENGTH_BYTES,
            salt=salt,
            iterations=PBKDF2_ITERATIONS,
            backend=default_backend(),
        )
        return kdf.derive(self._master_secret)

    def encrypt(self, password: str) -> EncryptedPassword:
        salt = os.urandom(SALT_LENGTH_BYTES)
        key = self._derive_key(salt)
        aesgcm = AESGCM(key)
        nonce = os.urandom(NONCE_LENGTH_BYTES)
        encrypted = aesgcm.encrypt(nonce, password.encode("utf-8"), None)
        return {
            "encrypted_password": base64.b64encode(encrypted).decode("utf-8"),
            "salt": base64.b64encode(salt).decode("utf-8"),
            "nonce": base64.b64encode(nonce).decode("utf-8"),
        }

    def decrypt(self, data: EncryptedPassword) -> Optional[str]:
        try:
            salt = base64.b64decode(data["salt"])
            nonce = base64.b64decode(data["nonce"])
            encrypted_password = base64.b64decode(data["encrypted_password"])
            key = self._derive_key(salt)
            aesgcm = AESGCM(key)
            decrypted = aesgcm.decrypt(nonce, encrypted_password, None)
            return decrypted.decode("utf-8")
        except InvalidTag:
            return None
        except Exception:
            return None
