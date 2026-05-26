import pytest
from unittest.mock import patch
from app.repositories.user_repo import SQLAlchemyRepository, Base
from datetime import datetime, timedelta, timezone
import uuid

@pytest.fixture()
def repo():
    test_db_url="sqlite:///:memory:"
    repository=SQLAlchemyRepository(database_url=test_db_url)
    Base.metadata.create_all(bind=repository.engine)
    yield repository
    Base.metadata.drop_all(bind=repository.engine)


def test_create_user(repo):
    user=repo.create_user(
        username="test_user",
        hashed_password="hashed_123",
        email="test@test.com"
    )
    assert user["id"] is not None 
    assert user["username"] == "test_user"
    assert user["role"] == "user"
    assert user["email"] == "test@test.com"

def test_get_user_by_username(repo):
    repo.create_user("find_me", "pass","test@test.com")
    user = repo.get_user_by_username("find_me")
    non_existent = repo.get_user_by_username("nobody")
    assert user is not None
    assert user["username"] == "find_me"
    assert non_existent is None


def test_set_user_role(repo):
    repo.create_user("admin_to_be", "pass","test@test.com")
    result = repo.set_user_role("admin_to_be", "admin")
    updated_user = repo.get_user_by_username("admin_to_be")
    assert result is True
    assert updated_user["role"] == "admin"


def test_get_user_by_id(repo):
    user_data = repo.create_user("id_user", "pass", "id@test.com")
    user_id = user_data["id"]
    found_user = repo.get_user_by_id(user_id)
    assert found_user is not None
    assert repo.get_user_by_id(uuid.uuid4()) is None

def test_get_user_by_email(repo):
    email = "unique@test.com"
    repo.create_user("email_user", "pass", email)
    found = repo.get_user_by_email(email)
    assert found is not None
    assert found["email"] == email
    assert repo.get_user_by_email("wrong@test.com") is None

def test_update_user_password_by_email(repo):
    email = "update@test.com"
    repo.create_user("update_user", "old_hash", email)
    result = repo.update_user_password_by_email(email, "new_hash")
    user = repo.get_user_by_email(email)
    assert result is True
    assert user["hashed_password"] == "new_hash"
    assert repo.update_user_password_by_email("not_found@test.com", "hash") is False

def test_password_reset_code_flow(repo):
    email = "reset@test.com"
    code = "123456"
    expires = datetime.now(timezone.utc) + timedelta(minutes=10)
    created = repo.create_password_reset_code(email, code, expires)
    assert created["code"] == code
    assert created["used_at"] is None
    found = repo.get_password_reset_code(email, code)
    assert found is not None
    assert found["id"] == created["id"]
    mark_result = repo.mark_password_reset_code_used(created["id"])
    updated_code = repo.get_password_reset_code(email, code)
    assert mark_result is True
    assert updated_code["used_at"] is not None

def test_get_latest_reset_code_for_email(repo):
    email = "latest@test.com"
    repo.create_password_reset_code(email, "code1", datetime.now(timezone.utc))
    repo.create_password_reset_code(email, "code2", datetime.now(timezone.utc) + timedelta(hours=1))
    latest = repo.get_latest_reset_code_for_email(email)
    assert latest["code"] == "code2"

def test_delete_reset_codes_for_email(repo):
    email = "cleanup@test.com"
    repo.create_password_reset_code(email, "000", datetime.now(timezone.utc))
    repo.delete_reset_codes_for_email(email)
    assert repo.get_latest_reset_code_for_email(email) is None