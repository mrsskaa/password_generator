import pytest
from unittest.mock import patch
from app.repositories.user_repo import SQLAlchemyRepository, Base
from datetime import datetime, timedelta, timezone

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

def test_get_user_by_username(repo):
    repo.create_user("find_me", "pass")
    user = repo.get_user_by_username("find_me")
    non_existent = repo.get_user_by_username("nobody")
    assert user is not None
    assert user["username"] == "find_me"
    assert non_existent is None


def test_set_user_role(repo):
    repo.create_user("admin_to_be", "pass")
    result = repo.set_user_role("admin_to_be", "admin")
    updated_user = repo.get_user_by_username("admin_to_be")
    assert result is True
    assert updated_user["role"] == "admin"


def test_get_user_by_id(repo):
    user_data = repo.create_user("id_user", "pass", "id@test.com")
    user_id = user_data["id"]
    found_user = repo.get_user_by_id(user_id)
    assert found_user is not None
    assert found_user["username"] == "id_user"
    assert repo.get_user_by_id(999) is None

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

def test_set_user_email_verified(repo):
    repo.create_user("verify_user", "pass", "verify@test.com")
    assert repo.set_user_email_verified("verify@test.com") is True
    assert repo.get_user_by_email("verify@test.com")["email_verified"] is True

def test_update_unverified_user_credentials(repo):
    user = repo.create_user("old_name", "old_pass", "old@test.com")
    updated = repo.update_unverified_user_credentials(user["id"], "new_name", "new@test.com", "new_pass")
    assert updated["username"] == "new_name"
    assert updated["email"] == "new@test.com"
    assert repo.update_unverified_user_credentials(999, "x", "x@x.com", "x") is None




@pytest.fixture()
def created_reset_code(repo,reset_email):
    expires=datetime.now(timezone.utc)+timedelta(minutes=10)
    return repo.create_password_reset_code(reset_email,"123456",expires)



@pytest.fixture()
def reg_email():
    return "reg@test.com"

@pytest.fixture()
def created_reg_code(repo, reg_email):
    expires = datetime.now(timezone.utc) + timedelta(minutes=10)
    return repo.create_registration_code(reg_email, "654321", expires)

def test_create_registration_code(created_reg_code):
    assert created_reg_code["code"] == "654321"
    assert created_reg_code["used_at"] is None

def test_get_registration_code(repo, reg_email, created_reg_code):
    found = repo.get_registration_code(reg_email, "654321")
    assert found["id"] == created_reg_code["id"]
    assert repo.get_registration_code(reg_email, "000000") is None

def test_mark_registration_code_used(repo, reg_email, created_reg_code):
    assert repo.mark_registration_code_used(created_reg_code["id"]) is True
    updated = repo.get_registration_code(reg_email, "654321")
    assert updated["used_at"] is not None

def test_get_latest_registration_code_for_email(repo, reg_email):
    repo.create_registration_code(reg_email, "aaa", datetime.now(timezone.utc))
    repo.create_registration_code(reg_email, "bbb", datetime.now(timezone.utc) + timedelta(hours=1))
    assert repo.get_latest_registration_code_for_email(reg_email)["code"] == "bbb"

def test_delete_registration_codes_for_email(repo, reg_email, created_reg_code):
    repo.delete_registration_codes_for_email(reg_email)
    assert repo.get_latest_registration_code_for_email(reg_email) is None

def test_delete_registration_code_by_id(repo, reg_email, created_reg_code):
    assert repo.delete_registration_code_by_id(created_reg_code["id"]) is True
    assert repo.get_registration_code(reg_email, "654321") is None