# backend/app/main.py

from fastapi import FastAPI

app = FastAPI(title="Password Generator API")


@app.get("/")
def root():
    return {
        "message": "Password generator backend is running"
    }