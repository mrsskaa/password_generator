import pytest
import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.repositories.saved_password_repo import PasswordRepository
from app.models.user import Base

@pytest.fixture()
def password_repo():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(bind=engine)
    repository = PasswordRepository(session_factory=session_factory)
    return repository

def test_create_password(password_repo):
    new_pass = password_repo.create(
        user_id=1,
        encrypted_password="encrypted",
        salt="salt",
        nonce="nonce",
        description="My Google Acc",
        generation_settings={"length": 12},
        settings_preview="12 chars, symbols"
    )
    assert new_pass.id is not None
    assert isinstance(new_pass.id, uuid.UUID)
    assert new_pass.description == "My Google Acc"

def test_list_by_user(password_repo):
    user_id = 42
    password_repo.create(user_id, "encrypted1", "salt1", "nonce1", "desc1", {}, "p1")
    password_repo.create(user_id, "encrypted2", "salt2", "nonce2", "desc2", {}, "p2")
    password_repo.create(99, "encrypted3", "salt3", "nonce3", "desc3", {}, "p3")
    user_passwords = password_repo.list_by_user(user_id)
    assert len(user_passwords) == 2
    assert all(p.user_id == user_id for p in user_passwords)

def test_get_by_id_and_user(password_repo):
    user_id = 1
    created = password_repo.create(user_id, "encrypted", "salt", "nonce", "desc", {}, "pre")
    found = password_repo.get_by_id_and_user(created.id, user_id)
    assert found is not None
    assert found.id == created.id
    wrong_user = password_repo.get_by_id_and_user(created.id, user_id=999)
    assert wrong_user is None

def test_update_description(password_repo):
    user_id = 1
    created = password_repo.create(user_id, "encrypted", "salt", "nonce", "old desc", {}, "pre")
    updated = password_repo.update_description(created.id, user_id, "new desc")
    assert updated.description == "new desc"
    result = password_repo.update_description(created.id, user_id=2, new_description="hack")
    assert result is None

def test_delete_password(password_repo):
    user_id = 1
    created = password_repo.create(user_id, "encrypted", "salt", "nonce", "desc", {}, "pre")
    fail_delete = password_repo.delete(created.id, user_id=2)
    assert fail_delete is False
    success_delete = password_repo.delete(created.id, user_id)
    assert success_delete is True
    assert password_repo.get_by_id(created.id) is None
