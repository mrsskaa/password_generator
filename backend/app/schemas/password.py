from pydantic import BaseModel


class PasswordRequest(BaseModel):
    length: int
    use_lower: bool
    use_upper: bool
    use_digits: bool
    use_symbols: bool


class PasswordResponse(BaseModel):
    password: str
    length: int

#Пока так, но надо обязательно будет сделать для рекомендации штуки