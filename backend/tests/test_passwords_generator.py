import pytest 
from app.services.password_generator import generate_password, build_groups, contains_similar_characters, validate_repetitive
from unittest.mock import patch
import runpy

def test_generate_password_length():
    password=generate_password(12)
    assert len(password)==12

def test_generate_password_min_length():
    with pytest.raises(Exception):
        generate_password(5)

def test_validate_repetitive():
    example=validate_repetitive('111')
    assert example==False

def test_build_groups():
    with pytest.raises(Exception):
        build_groups(0,0,0,0)

def test_contains_similar_characters():
    charr=contains_similar_characters('102345678sdf')
    assert charr==False

def test_contains_similar_characters2():
    charr=contains_similar_characters('1|lo0jfka')
    assert charr==True

def test_generate_password_validate_repetetive():
    with patch("app.services.password_generator.contains_similar_characters",return_value=True):
        with pytest.raises(RuntimeError):
            generate_password(8,use_lower=True,use_upper=True,use_digits=True,use_symbols=True,max_attempts=3)

def test_generate_password_contains_characters():
    with patch("app.services.password_generator.validate_repetitive",return_value=False):
        with pytest.raises(RuntimeError):
            generate_password(10,max_attempts=4)

def test_main_execution():
    with patch("builtins.print") as mock_print:
        runpy.run_module("app.services.password_generator", run_name="__main__")
        mock_print.assert_called_once()