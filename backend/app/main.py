import logging
import os
import time
from pathlib import Path

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.routers.generate import router as generate_router
from app.routers.health import router as health_router
from app.routers.login import router as login_router
from app.routers.registr import router as registration_router
from app.routers.users_me import router as users_me_router
from app.routers.passwords import router as password_router
from app.routers.forgot_password import router as forgot_password_router
from app.routers.verify_code import router as verify_code_router
from app.routers.reset_password import router as reset_password_router


load_dotenv()

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Password Generator API",
    version="0.1.0",
    description="Backend API for password generation MVP",
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Перевод ошибок валидации Pydantic на русский язык."""
    details = []
    for error in exc.errors():
        msg = error.get("msg")
        err_type = error.get("type")

        if err_type == "string_too_long":
            max_len = error.get("ctx", {}).get("max_length")
            msg = f"Текст слишком длинный. Максимум символов: {max_len}"
        elif err_type == "string_too_short":
            min_len = error.get("ctx", {}).get("max_length")
            msg = f"Текст слишком короткий. Минимум символов: {min_len}"
        elif err_type == "missing":
            msg = "Это поле обязательно для заполнения"

        details.append({
            "loc": error.get("loc"),
            "msg": msg,
            "type": err_type
        })

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": details},
    )

allowed_origins_raw = os.getenv(
    "CORS_ALLOW_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
)
allow_origins = [origin.strip() for origin in allowed_origins_raw.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000
    logger.info(
        "%s %s -> %s (%.2fms)",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response


app.include_router(health_router, tags=["health"])
app.include_router(generate_router, prefix="/api", tags=["password"])
app.include_router(login_router)
app.include_router(registration_router)
app.include_router(users_me_router)
app.include_router(password_router)
app.include_router(forgot_password_router)
app.include_router(verify_code_router)
app.include_router(reset_password_router)


@app.get("/")
def root() -> dict:
    return {"message": "Password Generator API is running"}
