from fastapi import APIRouter, HTTPException

from backend.app.core.exceptions import (
    EmptyCharacterPoolError,
    InvalidLengthError,
    PasswordGeneratorError,
)
from backend.app.schemas.password import PasswordRequest, PasswordResponse
from backend.app.services.password_generator import generate_password as build_password
from backend.app.services.password_recommendations import build_password_hints

router = APIRouter()

ALPHABET_SIZE = 94
GUESSES_PER_SECOND = 200_000_000_000

DAY_SECONDS = 86_400
MONTH_SECONDS = 2_592_000
YEAR_SECONDS = 31_536_000


def calculate_crack_time_seconds(length: int) -> float:
    combinations = ALPHABET_SIZE ** length
    return combinations / (2 * GUESSES_PER_SECOND)


def format_crack_time(seconds: float) -> str:
    if seconds < 1:
        return "меньше 1 секунды"
    if seconds < 60:
        return f"{int(seconds)} сек"
    if seconds < 3600:
        return f"{int(seconds // 60)} мин"
    if seconds < DAY_SECONDS:
        return f"{int(seconds // 3600)} ч"
    if seconds < YEAR_SECONDS:
        return f"{int(seconds // DAY_SECONDS)} дн"
    return f"{int(seconds // YEAR_SECONDS)} лет"


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

        crack_time_seconds = calculate_crack_time_seconds(data.length)
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
            detail="Internal server error while generating password",
        ) from exc