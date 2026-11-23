from pydantic import BaseModel, EmailStr, Field

class CustomerRegister(BaseModel):
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    password: str = Field(min_length=12, max_length=256)

class CustomerLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=256)

class RecoveryRequest(BaseModel):
    email: EmailStr

class CustomerOut(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    phone: str | None = None
    marketing_opt_in: bool = False
