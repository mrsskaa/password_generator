import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.dependencies import get_auth_service

client=TestClient(app)

@pytest.fixture
def mock_auth_service():
    service = MagicMock()
    service.access_token_expire_minutes = 30
    app.dependency_overrides[get_auth_service] = lambda: service
    yield service
    app.dependency_overrides.clear()

def test_login_success(mock_auth_service):
    fake_user = {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": "test@test.com",
        "created_at": "2023-01-01T00:00:00",
        "password": "hashed_password"
    }
    mock_auth_service.authenticate_user.return_value = fake_user
    mock_auth_service.create_access_token.return_value = "fake-jwt-token"
    payload = {"email": "test@test.com", "password": "correct_password"}
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code == 200
    assert response.json()["message"] == "Вход выполнен"
    assert response.json()["user"]["email"] == "test@test.com"
    assert "access_token" in response.cookies
    assert response.cookies["access_token"] == "fake-jwt-token"

def test_login_invalid_credentials(mock_auth_service):
    mock_auth_service.authenticate_user.return_value = None
    payload = {"email": "test@test.com", "password": "wrong_password"}
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code == 401
    assert response.json()["detail"] == "Неверное имя пользователя или пароль"
    assert "access_token" not in response.cookies

def test_logout(mock_auth_service):
    response = client.post("/api/auth/logout")
    assert response.status_code == 200
    assert response.json()["message"] == "Выход выполнен"
    assert response.cookies.get("access_token") is None
