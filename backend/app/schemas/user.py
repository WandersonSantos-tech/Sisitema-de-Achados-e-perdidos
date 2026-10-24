from __future__ import annotations

import datetime
import uuid
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from pydantic import field_validator
from app.core.cpf import limpar_cpf, validar_cpf


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    password: str = Field(..., min_length=8)
    cpf: str = Field(..., min_length=11, max_length=14)

    @field_validator("cpf")
    @classmethod
    def validar_cpf_usuario(cls, valor: str) -> str:
        cpf = limpar_cpf(valor)

        if not validar_cpf(cpf):
            raise ValueError("CPF inválido")

        return cpf


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: EmailStr
    phone: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime.datetime
    cpf: Optional[str] = None

    model_config = {"from_attributes": True}

