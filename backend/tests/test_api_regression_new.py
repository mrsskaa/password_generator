import os
import pytest
import datetime
import uuid
from typing import Any
from unittest.mock import patch


from pydantic import BaseModel


class UserPublicMock(BaseModel):
    id: Any
    email: str | None = None
    created_at: Any

import app.schemas.auth
app.schemas.auth.UserPublic = UserPublicMock


DB_PATH = "test_api_regression_new.db"
os.environ["DATABASE_URL"] = f"sqlite:///{DB_PATH}"

from fastapi.testclient import TestClient
from app.main import app
from app.dependencies import get_repository
from app.repositories.user_repo import SQLAlchemyRepository


def patched_to_dict(user):
    return {
        "id": user.id,
        "hashed_password": user.hashed_password,
        "email": user.email,
        "email_verified": user.email_verified,
        "created_at": user.created_at.isoformat() if hasattr(user.created_at, "isoformat") else str(user.created_at),
    }
SQLAlchemyRepository._to_dict = staticmethod(patched_to_dict)

def make_aware(d):
    if isinstance(d, datetime.datetime) and d.tzinfo is None:
        return d.replace(tzinfo=datetime.timezone.utc)
    return d

def patch_dict(d):
    if not isinstance(d, dict): return d
    for k, v in d.items():
        d[k] = make_aware(v)
    return d

@pytest.fixture(scope="module", autouse=True)
def test_db():
    db_url = f"sqlite:///{DB_PATH}"
    repo = SQLAlchemyRepository(database_url=db_url)

    for attr_name in dir(repo):
        if not attr_name.startswith("_") and callable(getattr(repo, attr_name)):
            original_method = getattr(repo, attr_name)
            
            def wrapper(meth):
                def wrapped(*args, **kwargs):
                    res = meth(*args, **kwargs)
                    if isinstance(res, dict):
                        return patch_dict(res)
                    if isinstance(res, list):
                        return [patch_dict(x) for x in res]
                    return res
                return wrapped
                
            setattr(repo, attr_name, wrapper(original_method))
    
    def override_get_repository():
        return repo
        
    app.dependency_overrides[get_repository] = override_get_repository
    
    yield repo
    
    app.dependency_overrides.clear()
    
    if os.path.exists(DB_PATH):
        try:
            os.remove(DB_PATH)
        except OSError:
            pass

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

@pytest.fixture(autouse=True)
def mock_mailer():
    with patch("app.services.mailer._send_message"):
        yield

def test_health_check(client):
    """Test the health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "password-generator-backend"}

def test_root_endpoint(client):
    """Test the root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()

def test_complete_user_and_password_lifecycle(client, test_db):

    email = "regression_test@example.com"
    password = "RegressionPassword123!"

    reg_payload = {"email": email, "password": password}
    resp = client.post("/api/auth/register", json=reg_payload)
    assert resp.status_code == 201
    

    code_record = test_db.get_latest_registration_code_for_email(email)
    assert code_record is not None
    verify_payload = {"email": email, "code": code_record["code"]}
    resp = client.post("/api/auth/register/verify-code", json=verify_payload)
    assert resp.status_code == 200


    login_payload = {"email": email, "password": password}
    resp = client.post("/api/auth/login", json=login_payload)
    assert resp.status_code == 200
    assert "access_token" in resp.cookies


    resp = client.get("/api/users/me")
    assert resp.status_code == 200
    assert resp.json()["email"] == email


    gen_payload = {
        "length": 12,
        "use_lower": True,
        "use_upper": True,
        "use_digits": True,
        "use_symbols": True
    }
    resp = client.post("/api/generate", json=gen_payload)
    assert resp.status_code == 200
    generated_pass = resp.json()["password"]


    save_payload = {
        "password": generated_pass,
        "code_word": password,
        "description": "Regression test pass",
        "generation_settings": gen_payload,
    }
    resp = client.post("/api/passwords", json=save_payload)
    assert resp.status_code == 201
    password_id = resp.json()["id"]


    resp = client.get("/api/passwords")
    assert resp.status_code == 200
    assert any(p["id"] == password_id for p in resp.json()["items"])


    resp = client.post(f"/api/passwords/{password_id}/reveal", json={"code_word": password})
    assert resp.status_code == 200
    assert resp.json()["password"] == generated_pass


    resp = client.patch(f"/api/passwords/{password_id}", json={"description": "Updated description"})
    assert resp.status_code == 200
    assert resp.json()["description"] == "Updated description"


    resp = client.delete(f"/api/passwords/{password_id}")
    assert resp.status_code == 200


    resp = client.post("/api/auth/logout")
    assert resp.status_code == 200
    

    resp = client.get("/api/users/me")
    assert resp.status_code == 401

def test_password_recovery_flow(client, test_db):

    email = "recovery_test@example.com"
    old_password = "OldPassword123!"
    new_password = "NewPassword123!"

    client.post("/api/auth/register", json={"email": email, "password": old_password})
    code_record = test_db.get_latest_registration_code_for_email(email)
    client.post("/api/auth/register/verify-code", json={"email": email, "code": code_record["code"]})


    resp = client.post("/api/auth/forgot-password", json={"email": email})
    assert resp.status_code == 200


    recovery_code_record = test_db.get_latest_reset_code_for_email(email)
    assert recovery_code_record is not None
    resp = client.post("/api/auth/verify-code", json={"email": email, "code": recovery_code_record["code"]})
    assert resp.status_code == 200
    reset_token = resp.json()["reset_token"]


    headers = {"Authorization": f"Bearer {reset_token}"}
    resp = client.post("/api/auth/reset-password", json={"new_password": new_password}, headers=headers)
    assert resp.status_code == 200


    resp = client.post("/api/auth/login", json={"email": email, "password": new_password})
    assert resp.status_code == 200
    assert "access_token" in resp.cookies
