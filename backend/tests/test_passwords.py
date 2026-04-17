import pytest
from pydantic import ValidationError
from app.schemas.password import PasswordRequest, PasswordResponse

def test_password_request_valid():
    data = {
        "length": 12,
        "use_lower": True,
        "use_upper": True,
        "use_digits": True,
        "use_symbols": True,
        "use_similar_symbols": False
    }
    request = PasswordRequest(**data)
    assert request.length == 12
    assert request.use_lower is True

def test_password_request_invalid_length():
    with pytest.raises(ValidationError):
        PasswordRequest(length=7)
    with pytest.raises(ValidationError):
        PasswordRequest(length=33)

def test_password_response_serialization():
    data = {
        "password": "hashed_pass",
        "length": 12,
        "used_lower": True,
        "used_upper": True,
        "used_digits": True,
        "used_symbols": True,
        "use_similar_symbols": True,
        "crack_time_human": "10 лет",
        "crack_time_seconds": 123456.0,
        "color": "green",
        "strength_level": "strong",
        "hints": ["Good job"]
    }
    response = PasswordResponse(**data)
    assert response.strength_level == "strong"