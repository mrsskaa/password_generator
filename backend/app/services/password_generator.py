import secrets

from backend.app.core.constants import (
    LETTERS_LOW,
    LETTERS_HIGH,
    DIGITS,
    SPECIAL_CHARACTERS,
    SIMILAR_CHARACTERS
)

from backend.app.core.exceptions import (
    InvalidLengthError,
    EmptyCharacterPoolError
)


def validate_length(length: int) -> None:
    """Проверка длины пароля"""

    if length < 8 or length > 32:
        raise InvalidLengthError(
            "Password length must be between 8 and 32"
        )


def build_groups(
        use_lower: bool,
        use_upper: bool,
        use_digits: bool,
        use_symbols: bool
) -> list:
    """Формирование списка активных групп"""

    groups = []

    if use_lower:
        groups.append(LETTERS_LOW)

    if use_upper:
        groups.append(LETTERS_HIGH)

    if use_digits:
        groups.append(DIGITS)

    if use_symbols:
        groups.append(SPECIAL_CHARACTERS)

    if not groups:
        raise EmptyCharacterPoolError(
            "At least one character group must be selected"
        )

    return groups


def contains_similar_characters(password: str) -> bool:
    """Проверка похожих символов"""

    chars = set(password)

    for a, b in SIMILAR_CHARACTERS:
        if a in chars and b in chars:
            return True

    return False


def generate_password(
        length: int,
        use_lower: bool = True,
        use_upper: bool = True,
        use_digits: bool = True,
        use_symbols: bool = True,
        max_attempts: int = 100
) -> str:
    """
    Основная функция генерации пароля
    """

    validate_length(length)

    groups = build_groups(
        use_lower,
        use_upper,
        use_digits,
        use_symbols
    )

    pool = "".join(groups)

    for attempt in range(max_attempts):

        password_chars = []

        for group in groups:
            password_chars.append(secrets.choice(group))

        for _ in range(length - len(password_chars)):
            password_chars.append(secrets.choice(pool))

        secrets.SystemRandom().shuffle(password_chars)

        password = "".join(password_chars)

        if contains_similar_characters(password):
            continue

        return password

    raise RuntimeError(
        f"Failed to generate password after {max_attempts} attempts"
    )


if __name__ == "__main__":
    '''python3 -m backend.app.services.password_generator'''
    print(generate_password(12))
