from __future__ import annotations

import enum


class UserRole(str, enum.Enum):
    USER = "USER"
    ADMIN = "ADMIN"


class ItemType(str, enum.Enum):
    PERDIDO = "PERDIDO"
    ENCONTRADO = "ENCONTRADO"


class ItemStatus(str, enum.Enum):
    PERDIDO = "PERDIDO"
    ENCONTRADO = "ENCONTRADO"
    EM_NEGOCIACAO = "EM_NEGOCIACAO"
    DEVOLVIDO = "DEVOLVIDO"
    CANCELADO = "CANCELADO"


class ClaimStatus(str, enum.Enum):
    PENDENTE = "PENDENTE"
    APROVADA = "APROVADA"
    REJEITADA = "REJEITADA"


class NotificationType(str, enum.Enum):
    MATCH_FOUND = "MATCH_FOUND"
    CLAIM_RECEIVED = "CLAIM_RECEIVED"
    CLAIM_UPDATED = "CLAIM_UPDATED"
    NEW_MESSAGE = "NEW_MESSAGE"
