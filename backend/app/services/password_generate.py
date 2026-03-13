import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

import secrets
from app.core.constans import DIGITS, LETTERS_HIGH, LETTERS_LOW, SPECIAL_CHARACTERS

def validate_str(res: str) -> bool:
    '''Функция проверяющая входную строку'''
    if res not in LETTERS_HIGH and res not in LETTERS_LOW and res not in SPECIAL_CHARACTERS and res not in DIGITS:
        return False
    return True

def validate_length(length: int) -> None:
    """
    Проверяет корректность длины пароля.
    """

    if length < 8 or length > 32:
        pass
        # Здесь будет raise об нарушении длины


def build_character_pool(
        use_lower: bool,
        use_upper: bool,
        use_digits: bool,
        use_symbols: bool
) -> str:
    """
    Формирует пул символов для генерации.
    """

    pool = ""

    if use_lower:
        pool += LETTERS_LOW

    if use_upper:
        pool += LETTERS_HIGH

    if use_digits:
        pool += DIGITS

    if use_symbols:
        pool += SPECIAL_CHARACTERS

    if not pool:
        pass
        # Здесь будет raise ошибка о пустом пуле

    return pool


def build_password(length: int, pool_symbols: str) -> str:
    '''Функция генерирующая пароль'''
    k = 0
    result = ''
    while k < length:
        result += secrets.choice(pool_symbols)
        k += 1
    return result

#ловлю ошибок, проверку на параметры, проверка исключений (0О и тд) (последовательности)
