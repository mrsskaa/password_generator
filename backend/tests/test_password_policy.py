from app.core.password_policy import validate_password_policy
import pytest 
from pydantic_core import PydanticCustomError

def test_valid_pwd():
    assert validate_password_policy("Hi11111111!")=="Hi11111111!"

def test_pwd_min_length():
    with pytest.raises(PydanticCustomError) as exc:
        validate_password_policy(":3)")
    assert exc.value.type=="password_too_short"

def test_pwd_max_length():
    with pytest.raises(PydanticCustomError) as exc:
        validate_password_policy(":3)"*1000)
    assert exc.value.type=="password_too_long"  

def test_pwd_symbols():
    with pytest.raises(PydanticCustomError) as exc:
        validate_password_policy("Hi1111111111      $")
    assert exc.value.type=="password_invalid_chars"

def test_pwd_number():
    with pytest.raises(PydanticCustomError) as exc:
        validate_password_policy("Hiiiiiii)")
    assert exc.value.type=="password_missing_digit"

def test_pwd_specialsymb():
    with pytest.raises(PydanticCustomError) as exc:
        validate_password_policy("Hiiiiiiiiiiiiiiiiii1")
    assert exc.value.type=="password_missing_special"