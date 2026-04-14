from fastapi.testclient import TestClient
from app.main import app 
import pytest
from unittest.mock import patch

client=TestClient(app)

def test_health():
    response=client.get("/health")
    assert response.status_code==200
    assert response.json()["status"]=="ok"

def test_gen_password_Excepion():
    with patch("app.routers.generate.pwd_generate") as mock_func:
        mock_func.side_effect=Exception("UwU")
        response=client.post("/api/generate", json={
            "length": 12,
            "use_lower": True,
            "use_upper": True,
            "use_digits": True,
            "use_symbols": True
        })
    assert response.status_code==500

def test_gen_password_ValueError():
    with patch("app.routers.generate.pwd_generate") as mock_func:
        mock_func.side_effect=ValueError("boom")
        response=client.post("/api/generate", json={
            "length": 12,
            "use_lower": True,
            "use_upper": True,
            "use_digits": True,
            "use_symbols": True
        })
    assert response.status_code==400

def test_gen_password_ok():
    response=client.post("/api/generate", json={
            "length": 12,
            "use_lower": True,
            "use_upper": True,
            "use_digits": True,
            "use_symbols": True
        })
    assert response.status_code == 200