from pydantic import BaseModel, Field


class PasswordRequest(BaseModel):
    length: int = Field(..., example=12, ge=8, le=32)
    use_lower: bool = Field(default=True, example=True)
    use_upper: bool = Field(default=True, example=True)
    use_digits: bool = Field(default=True, example=True)
    use_symbols: bool = Field(default=True, example=True)
    use_similar_symbols: bool = Field(default=False, example=False)


class PasswordResponse(BaseModel):
    password: str = Field(..., example="Ab7!xP9@Lm2#")
    length: int = Field(..., example=12)
    used_lower: bool = Field(..., example=True)
    used_upper: bool = Field(..., example=True)
    used_digits: bool = Field(..., example=True)
    used_symbols: bool = Field(..., example=True)
    use_similar_symbols: bool = Field(...,example=True)
    crack_time_human: str = Field(..., example="1 меясц, 2 часа, 3 минуты")
    crack_time_seconds: float = Field(..., example=24547892.94)
    color: str = Field(..., example="yellow")
    strength_level: str = Field(..., example="хороший")

#Пока так, но надо обязательно будет сделать для рекомендации штуки