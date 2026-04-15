import logging
import os
import time
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from backend.app.routers.generate import router as generate_router
from backend.app.routers.health import router as health_router
from backend.app.routers.login import router as login_router
from backend.app.routers.registr import router as registration_router
from backend.app.routers.users_me import router as users_me_router
from backend.app.routers.passwords import router as password_router
from backend.app.routers.forgot_password import router as forgot_password_router
from backend.app.routers.verify_code import router as verify_code_router
from backend.app.routers.reset_password import router as reset_password_router

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Password Generator API",
    version="0.2.0",
    description="Backend API for password generation with auth and db",
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
def root() -> dict[str, str]:
    return {"message": "Password Generator API is running"}
