from password import BaseModel

class VerifyCodeRequest(BaseModel):
    email : str
    code : str
