import string

from pydantic_core import PydanticCustomError


MIN_PASSWORD_LENGTH = 8
MAX_PASSWORD_LENGTH = 128
ALLOWED_SPECIAL_CHARS = "!@#$%^&*?()"
ALLOWED_PASSWORD_CHARS = set(string.ascii_letters + string.digits + ALLOWED_SPECIAL_CHARS)


def validate_password_policy(password: str) -> str:
    if len(password) < MIN_PASSWORD_LENGTH:
        raise PydanticCustomError(
            "password_too_short",
            f"Пароль должен быть не короче {MIN_PASSWORD_LENGTH} символов",
        )
    if len(password) > MAX_PASSWORD_LENGTH:
        raise PydanticCustomError(
            "password_too_long",
            f"Пароль должен быть не длиннее {MAX_PASSWORD_LENGTH} символов",
        )
    if any(char not in ALLOWED_PASSWORD_CHARS for char in password):
        raise PydanticCustomError(
            "password_invalid_chars",
            f"Пароль может содержать только латинские буквы, цифры и спецсимволы: {ALLOWED_SPECIAL_CHARS}",
        )
    if not any(char.isdigit() for char in password):
        raise PydanticCustomError(
            "password_missing_digit",
            "Пароль должен содержать хотя бы одну цифру",
        )
    if not any(char in ALLOWED_SPECIAL_CHARS for char in password):
        raise PydanticCustomError(
            "password_missing_special",
            f"Пароль должен содержать хотя бы один спецсимвол: {ALLOWED_SPECIAL_CHARS}",
        )
    return password
