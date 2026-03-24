class PasswordGeneratorError(Exception):
    """Базовая ошибка генератора"""
    pass


class InvalidLengthError(PasswordGeneratorError):
    """Некорректная длина пароля"""
    pass


class EmptyCharacterPoolError(PasswordGeneratorError):
    """Не выбран ни один набор символов"""
    pass
