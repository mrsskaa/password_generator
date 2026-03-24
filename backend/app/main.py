from fastapi import FastAPI
from backend.app.routers.health import health
from backend.app.routers.generate import generate_password

app = FastAPI()

app.include_router(health.router)
app.include_router(generate_password.router)