from typing import TypedDict

class EncryptedPassword(TypedDict):
    encrypted_password: str
    salt:str
    nonce:str