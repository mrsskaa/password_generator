from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.routers.generate import router as generate_router
from backend.app.routers.health import router as health_router

app = FastAPI(
    title="Password Generator API",
    version="0.1.0",
    description="Backend API for password generation MVP",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, tags=["health"])
app.include_router(generate_router, prefix="/api", tags=["password"])


@app.get("/")
def root() -> dict:
    return {"message": "Password Generator API is running"}
