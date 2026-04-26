from typing import List


def build_password_hints(
    *,
    length: int,
    use_lower: bool,
    use_upper: bool,
    use_digits: bool,
    use_symbols: bool,
    use_similar_symbols: bool,
    strength_level: str,
) -> List[str]:
    hints: List[str] = []

    if length < 12:
        hints.append("Увеличьте длину пароля минимум до 12 символов.")
    elif length < 16:
        hints.append("Используйте 16 и более символов для лучшей защиты.")

    if not use_lower:
        hints.append("Добавьте строчные буквы.")
    if not use_upper:
        hints.append("Добавьте заглавные буквы.")
    if not use_digits:
        hints.append("Добавьте цифры.")
    if not use_symbols:
        hints.append("Добавьте специальные символы.")
    if use_similar_symbols:
        hints.append("Отключите похожие символы для удобства чтения.")

    if strength_level in {"очень слабый", "слабый", "средний"}:
        hints.append("Сгенерируйте пароль повторно, пока не получите сильный или очень сильный.")

    if not hints:
        hints.append("Отличная настройка пароля. Сохраните его в менеджере паролей.")

    return hints
