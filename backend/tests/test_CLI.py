import pytest 
from app.services.password_generator import generate_password, build_groups, contains_similar_characters, validate_repetitive
from unittest.mock import patch
from app.CLI import run_cli
from app.core.exceptions import EmptyCharacterPoolError
def test_cli_correct_input():
    inputs=[
        "generate",
        "12",
        "да",
        "да",
        "да",
        "да",
        "exit"
    ]
    with patch("builtins.input",side_effect=inputs):
        run_cli()
    
def test_cli_incorrect_input():
    inputs=[
        "No",
        "exit"
    ]
    with patch("builtins.input",side_effect=inputs),patch("builtins.print") as mock_print:
        run_cli()
        mock_print.assert_any_call('Введена несуществующая команда')
    
def test_cli_another_variants():
    inputs=[
        "generate",
        "12",
        "0",
        "0",
        "0",
        "0",
        "exit"
    ]
    with patch("builtins.input",side_effect=inputs):
        with pytest.raises(EmptyCharacterPoolError):
            run_cli()
