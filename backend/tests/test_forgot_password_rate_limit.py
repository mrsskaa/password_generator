from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock

from fastapi.testclient import TestClient

from app.dependencies import get_repository
from app.main import app


client = TestClient(app)


def test_forgot_password_limited_to_three_requests_per_hour():
    repository = MagicMock()
    email = "limited@example.com"
    repository.get_user_by_email.return_value = {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": email,
        "created_at": "2023-01-01T00:00:00",
        "session_version": 0,
    }
    repository.get_latest_reset_code_for_email.return_value = {
        "created_at": datetime.now(timezone.utc) - timedelta(minutes=5),
    }
    repository.count_password_reset_codes_for_email_since.return_value = 3

    app.dependency_overrides[get_repository] = lambda: repository
    try:
        response = client.post("/api/auth/forgot-password", json={"email": email})
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 429
    assert response.json()["detail"] == "Слишком много запросов. Можно запросить код восстановления максимум 3 раза в час"
    repository.create_password_reset_code.assert_not_called()
