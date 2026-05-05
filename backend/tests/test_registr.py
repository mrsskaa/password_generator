import pytest
from unittest.mock import MagicMock, patch
from fastapi import HTTPException
from fastapi.testclient import TestClient
from datetime import datetime, timedelta, timezone

from app.main import app
from app.dependencies import get_repository, get_auth_service
from app.routers.registr import _validate_email, _create_registration_code, _with_debug_code_message

client = TestClient(app)


@pytest.fixture
def mock_repo():
    repo = MagicMock()
    app.dependency_overrides[get_repository] = lambda: repo
    yield repo
    app.dependency_overrides.clear()


@pytest.fixture
def mock_auth():
    auth = MagicMock()
    auth.get_password_hash.return_value = "hashed"
    app.dependency_overrides[get_auth_service] = lambda: auth
    yield auth
    app.dependency_overrides.clear()



def test_validate_email_ok():
    assert _validate_email("  User@Test.com  ") == "user@test.com"

def test_validate_email_invalid():
    with pytest.raises(HTTPException) as exc_info:
        _validate_email("not-an-email")
    assert exc_info.value.status_code == 400



def test_create_registration_code_ok():
    repo = MagicMock()
    repo.get_latest_registration_code_for_email.return_value = None
    repo.create_registration_code.return_value = {"code": "123456"}
    result = _create_registration_code("user@test.com", repo)
    assert result["code"] == "123456"

def test_create_registration_code_rate_limited():
    repo = MagicMock()
    repo.get_latest_registration_code_for_email.return_value = {
        "created_at": datetime.now(timezone.utc) - timedelta(seconds=10)
    }
    with pytest.raises(HTTPException) as exc_info:
        _create_registration_code("user@test.com", repo)
    assert exc_info.value.status_code == 429




def test_debug_message():
    result = _with_debug_code_message("Привет", "123456")
    assert result == "Привет [DEV code: 123456]"


# POST /register


# def test_register_no_email(mock_repo, mock_auth):
#     response = client.post("/api/auth/register", json={"email": "", "password": "pass123"})
#     assert response.status_code == 400

# def test_register_invalid_email(mock_repo, mock_auth):
#     response = client.post("/api/auth/register", json={"email": "bad-email", "password": "pass123"})
#     assert response.status_code == 400

# def test_register_user_already_verified(mock_repo, mock_auth):
#     mock_repo.get_user_by_username.return_value = {"id": 1, "email_verified": True}
#     mock_repo.get_user_by_email.return_value = {"id": 1, "email_verified": True}
#     response = client.post("/api/auth/register", json={"email": "user@test.com", "password": "pass123"})
#     assert response.status_code == 400

# def test_register_new_user_ok(mock_repo, mock_auth):
#     mock_repo.get_user_by_username.return_value = None
#     mock_repo.get_user_by_email.return_value = None
#     mock_repo.create_user.return_value = {
#         "id": 1, "username": "user@test.com", "email": "user@test.com",
#         "role": "user", "email_verified": False, "created_at": "2024-01-01T00:00:00"
#     }
#     mock_repo.get_latest_registration_code_for_email.return_value = None
#     mock_repo.create_registration_code.return_value = {"code": "111111"}

#     with patch("app.routers.registration.send_registration_code_email"), \
#          patch("app.routers.registration.send_welcome_email"):
#         response = client.post("/api/auth/register", json={"email": "user@test.com", "password": "pass123"})

#     assert response.status_code == 201
#     assert "111111" in response.json()["message"]


# POST /register/resend-code
def test_resend_code_user_not_found(mock_repo):
    mock_repo.get_user_by_email.return_value = None
    response = client.post("/api/auth/register/resend-code", json={"email": "no@test.com"})
    assert response.status_code == 404

# def test_resend_code_already_verified(mock_repo):
#     mock_repo.get_user_by_email.return_value = {"id": 1, "email_verified": True}
#     response = client.post("/api/auth/register/resend-code", json={"email": "user@test.com"})
#     assert response.status_code == 200
#     assert response.json()["message"] == "Email уже подтвержден"

# def test_resend_code_ok(mock_repo):
#     mock_repo.get_user_by_email.return_value = {"id": 1, "email_verified": False}
#     mock_repo.get_latest_registration_code_for_email.return_value = None
#     mock_repo.create_registration_code.return_value = {"code": "222222"}

    # with patch("app.routers.registration.send_registration_code_email"):
    #     response = client.post("/api/auth/register/resend-code", json={"email": "user@test.com"})

    # assert response.status_code == 200
    # assert "222222" in response.json()["message"]


# POST /register/verify-code

def test_verify_code_invalid_format(mock_repo):
    response = client.post("/api/auth/register/verify-code", json={"email": "user@test.com", "code": "abc"})
    assert response.status_code == 400

def test_verify_code_not_found(mock_repo):
    mock_repo.get_registration_code.return_value = None
    response = client.post("/api/auth/register/verify-code", json={"email": "user@test.com", "code": "123456"})
    assert response.status_code == 404

def test_verify_code_expired(mock_repo):
    mock_repo.get_registration_code.return_value = {
        "id": 1,
        "used_at": None,
        "expires_at": datetime.now(timezone.utc) - timedelta(hours=1)
    }
    response = client.post("/api/auth/register/verify-code", json={"email": "user@test.com", "code": "123456"})
    assert response.status_code == 410

def test_verify_code_ok(mock_repo):
    mock_repo.get_registration_code.return_value = {
        "id": 1,
        "used_at": None,
        "expires_at": datetime.now(timezone.utc) + timedelta(hours=1)
    }
    response = client.post("/api/auth/register/verify-code", json={"email": "user@test.com", "code": "123456"})
    assert response.status_code == 200
    assert response.json()["message"] == "Email успешно подтвержден"