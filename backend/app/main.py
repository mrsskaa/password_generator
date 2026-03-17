from fastapi import FastAPI
from app.routers import health
#from backend.

app = FastAPI()

app.include_router(health.router)