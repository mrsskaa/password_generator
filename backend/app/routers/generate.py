from fastapi import APIRouter, HTTPException

from app.core.exceptions import (
    EmptyCharacterPoolError,
    InvalidLengthError,
    PasswordGeneratorError,
)
from app.schemas.password import PasswordRequest, PasswordResponse
from app.services.password_generator import build_groups
from app.services.password_generator import generate_password as build_password
from app.services.password_recommendations import build_password_hints

router = APIRouter()

GUESSES_PER_SECOND = 200_000_000_000

DAY_SECONDS = 86_400
MONTH_SECONDS = 2_592_000
YEAR_SECONDS = 31_536_000


def calculate_crack_time_seconds(length: int, alphabet_size: int) -> float:
    combinations = alphabet_size ** length
    return combinations / (2 * GUESSES_PER_SECOND)


def _pluralize_ru(value: int, one: str, few: str, many: str) -> str:
    last_two = value % 100
    last_one = value % 10
    if 11 <= last_two <= 14:
        return many
    if last_one == 1:
        return one
    if 2 <= last_one <= 4:
        return few
    return many


def format_crack_time(seconds: float) -> str:
    if seconds < 1:
        return "меньше 1 секунды"
    if seconds < 60:
        value = int(seconds)
        return f"{value} {_pluralize_ru(value, 'секунда', 'секунды', 'секунд')}"
    if seconds < 3600:
        value = int(seconds // 60)
        return f"{value} {_pluralize_ru(value, 'минута', 'минуты', 'минут')}"
    if seconds < DAY_SECONDS:
        value = int(seconds // 3600)
        return f"{value} {_pluralize_ru(value, 'час', 'часа', 'часов')}"
    if seconds < YEAR_SECONDS:
        value = int(seconds // DAY_SECONDS)
        return f"{value} {_pluralize_ru(value, 'день', 'дня', 'дней')}"
    value = int(seconds // YEAR_SECONDS)
    return f"{value} {_pluralize_ru(value, 'год', 'года', 'лет')}"


def calculate_alphabet_size(
    use_lower: bool,
    use_upper: bool,
    use_digits: bool,
    use_symbols: bool,
) -> int:
    groups = build_groups(
        use_lower=use_lower,
        use_upper=use_upper,
        use_digits=use_digits,
        use_symbols=use_symbols,
    )
    return len(set("".join(groups)))


def get_strength_level(seconds: float, length: int) -> str:
    if length < 8:
        return "очень слабый"

    if seconds < 3600:
        return "очень слабый"
    if seconds < DAY_SECONDS:
        return "слабый"
    if seconds < MONTH_SECONDS:
        return "средний"
    if seconds < YEAR_SECONDS:
        return "сильный"
    return "очень сильный"


def get_crack_color(level: str) -> str:
    colors = {
        "очень слабый": "red",
        "слабый": "orange",
        "средний": "yellow",
        "сильный": "lightgreen",
        "очень сильный": "green",
    }
    return colors[level]


@router.post("/generate", response_model=PasswordResponse)
def generate(data: PasswordRequest) -> PasswordResponse:
    try:
        password = build_password(
            length=data.length,
            use_lower=data.use_lower,
            use_upper=data.use_upper,
            use_digits=data.use_digits,
            use_symbols=data.use_symbols,
            use_similar_symbols=data.use_similar_symbols,
        )

        alphabet_size = calculate_alphabet_size(
            use_lower=data.use_lower,
            use_upper=data.use_upper,
            use_digits=data.use_digits,
            use_symbols=data.use_symbols,
        )
        crack_time_seconds = calculate_crack_time_seconds(data.length, alphabet_size)
        crack_time_human = format_crack_time(crack_time_seconds)

        strength_level = get_strength_level(
            seconds=crack_time_seconds,
            length=data.length,
        )

        crack_color = get_crack_color(strength_level)
        hints = build_password_hints(
            length=data.length,
            use_lower=data.use_lower,
            use_upper=data.use_upper,
            use_digits=data.use_digits,
            use_symbols=data.use_symbols,
            use_similar_symbols=data.use_similar_symbols,
            strength_level=strength_level,
        )

        return PasswordResponse(
            password=password,
            length=data.length,
            used_lower=data.use_lower,
            used_upper=data.use_upper,
            used_digits=data.use_digits,
            used_symbols=data.use_symbols,
            use_similar_symbols=data.use_similar_symbols,
            crack_time_human=crack_time_human,
            crack_time_seconds=round(crack_time_seconds, 2),
            color=crack_color,
            strength_level=strength_level,
            hints=hints,
        )

    except (InvalidLengthError, EmptyCharacterPoolError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    except PasswordGeneratorError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Внутренняя ошибка сервера при генерации пароля",
        ) from exc
