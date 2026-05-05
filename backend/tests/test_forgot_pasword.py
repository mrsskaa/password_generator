import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from datetime import datetime, timedelta, timezone

from app.main import app
from app.dependencies import get_repository
from app.routers.forgot_password import _with_debug_code_message, _validate_recovery_email, _create_reset_code
from fastapi import HTTPException

client=TestClient(app)

@pytest.fixture
def mock_repo():
    repo=MagicMock()
    app.dependency_overrides[get_repository]=lambda: repo
    yield repo 
    app.dependency_overrides.clear()

def test_debug_message_format():
    result=_with_debug_code_message("Код скоро придет", "123456")
    assert result=="Код скоро придет [DEV code: 123456]"

def test_validate_email_invalid_format():
    repo=MagicMock()
    payload=MagicMock()
    payload.email="not-email"
    with pytest.raises(HTTPException) as exc_info:
        _validate_recovery_email(payload,repo)
    assert exc_info.value.status_code==400

def test_validate_email_user_not_found():
    repo=MagicMock()
    repo.get_user_by_email.return_value=None
    payload=MagicMock()
    payload.email="notfound@test.com"
    with pytest.raises(HTTPException) as exc_info:
        _validate_recovery_email(payload,repo)
    assert exc_info.value.status_code==404

def test_create_reset_code_rate_limit():
    repo=MagicMock()
    repo.get_latest_reset_code_for_email.return_value={
        "created_at": datetime.now(timezone.utc) - timedelta(seconds=10)
    }
    with pytest.raises(HTTPException) as exc_info:
        _create_reset_code("user@test.com",repo)
    assert exc_info.value.status_code==429

def test_create_reset_code_ok():
    repo = MagicMock()
    repo.get_latest_reset_code_for_email.return_value = None
    repo.create_password_reset_code.return_value = {"code": "123456"}
    result = _create_reset_code("user@test.com", repo)
    assert result["code"] == "123456"
    repo.create_password_reset_code.assert_called_once()

def test_forgot_password_invalid_email(mock_repo):
    response = client.post("/api/auth/forgot-password", json={"email": "bad-email"})
    assert response.status_code == 400


def test_forgot_password_user_not_found(mock_repo):
    mock_repo.get_user_by_email.return_value = None
    response = client.post("/api/auth/forgot-password", json={"email": "no@test.com"})
    assert response.status_code == 404


def test_forgot_password_ok(mock_repo):
    mock_repo.get_user_by_email.return_value = {"id": 1}
    mock_repo.get_latest_reset_code_for_email.return_value = None
    mock_repo.create_password_reset_code.return_value = {"code": "123456"}

    with patch("app.routers.forgot_password.send_password_reset_code"):
        response = client.post("/api/auth/forgot-password", json={"email": "user@test.com"})

    assert response.status_code == 200
    assert "123456" in response.json()["message"]


def test_resend_code_rate_limited(mock_repo):
    mock_repo.get_user_by_email.return_value = {"id": 1}
    mock_repo.get_latest_reset_code_for_email.return_value = {
        "created_at": datetime.now(timezone.utc) - timedelta(seconds=5)
    }
    response = client.post("/api/auth/forgot-password/resend-code", json={"email": "user@test.com"})
    assert response.status_code == 429


def test_resend_code_ok(mock_repo):
    mock_repo.get_user_by_email.return_value = {"id": 1}
    mock_repo.get_latest_reset_code_for_email.return_value = None
    mock_repo.create_password_reset_code.return_value = {"code": "654321"}

    with patch("app.routers.forgot_password.send_password_reset_code"):
        response = client.post("/api/auth/forgot-password/resend-code", json={"email": "user@test.com"})

    assert response.status_code == 200
    assert "654321" in response.json()["message"]
