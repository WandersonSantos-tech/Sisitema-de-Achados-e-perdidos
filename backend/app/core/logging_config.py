"""Configuração de logging estruturado em JSON com auditoria."""
from __future__ import annotations

import json
import logging
import sys
from json import JSONDecodeError
from pathlib import Path
from pythonjsonlogger import jsonlogger
from typing import Any


class CustomJsonFormatter(jsonlogger.JsonFormatter):
    """Formatador JSON customizado com campos de auditoria obrigatórios."""

    def add_fields(self, log_record: dict[str, Any], record: logging.LogRecord, message_dict: dict[str, Any]) -> None:
        """
        Adiciona campos adicionais ao log estruturado.

        Campos obrigatórios:
        - timestamp: ISO 8601 UTC
        - level: Nível do log
        - logger_name: Nome do logger
        - message: Descrição do evento
        - context: Objeto com dados adicionais (user_id, item_id, action, status_code, client_ip, etc.)
        """
        super().add_fields(log_record, record, message_dict)

        # Timestamp em ISO 8601 UTC
        if "timestamp" not in log_record:
            log_record["timestamp"] = self.formatTime(record, self.datefmt)

        # Nível do log
        log_record["level"] = record.levelname

        # Logger name
        log_record["logger_name"] = record.name

        # File and line
        log_record["file_line"] = f"{record.filename}:{record.lineno}"

        # Extrair contexto se existir
        if hasattr(record, "context"):
            log_record["context"] = record.context
        else:
            log_record["context"] = {}

        # Remover campos duplicados que já foram processados
        log_record.pop("filename", None)
        log_record.pop("lineno", None)
        log_record.pop("name", None)
        log_record.pop("processName", None)
        log_record.pop("process", None)


def setup_logging(
    log_level: str = "INFO",
    log_file: str | None = None,
) -> None:
    """
    Configura logging estruturado em JSON para toda aplicação.

    Args:
        log_level: Nível de logging (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: Caminho do arquivo de logs. Se None, escreve em stdout.
    """
    # Root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)

    # Limpar handlers existentes
    root_logger.handlers = []

    # Criar formatter JSON
    json_formatter = CustomJsonFormatter(
        fmt="%(timestamp)s %(level)s %(logger_name)s %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
    )

    # Handler para stdout (console)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(json_formatter)
    root_logger.addHandler(console_handler)

    # Handler para arquivo se especificado
    if log_file:
        # Criar diretório se não existir
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)

        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(json_formatter)
        root_logger.addHandler(file_handler)


# Enum-like constants para eventos de auditoria
class AuditEvent:
    """Constantes de eventos de auditoria."""

    # Auth events
    AUDIT_LOGIN_SUCCESS = "AUDIT_LOGIN_SUCCESS"
    AUDIT_LOGIN_FAILED = "AUDIT_LOGIN_FAILED"
    AUDIT_LOGOUT = "AUDIT_LOGOUT"
    AUDIT_REGISTER = "AUDIT_REGISTER"
    AUDIT_PASSWORD_RESET = "AUDIT_PASSWORD_RESET"

    # Item events
    AUDIT_ITEM_CREATED = "AUDIT_ITEM_CREATED"
    AUDIT_ITEM_DELETED = "AUDIT_ITEM_DELETED"
    AUDIT_ITEM_ADMIN_DELETED = "AUDIT_ITEM_ADMIN_DELETED"
    AUDIT_ITEM_UPDATED = "AUDIT_ITEM_UPDATED"

    # Status/History events
    AUDIT_STATUS_CHANGED = "AUDIT_STATUS_CHANGED"

    # Claim events
    AUDIT_CLAIM_CREATED = "AUDIT_CLAIM_CREATED"
    AUDIT_CLAIM_DECIDED = "AUDIT_CLAIM_DECIDED"

    # Review events
    AUDIT_REVIEW_CREATED = "AUDIT_REVIEW_CREATED"

    # Report events
    AUDIT_REPORT_CREATED = "AUDIT_REPORT_CREATED"
    AUDIT_REPORT_RESOLVED = "AUDIT_REPORT_RESOLVED"

    # Admin events
    AUDIT_ADMIN_ACTION = "AUDIT_ADMIN_ACTION"
    AUDIT_USER_STATUS_CHANGED = "AUDIT_USER_STATUS_CHANGED"
    AUDIT_USER_ROLE_CHANGED = "AUDIT_USER_ROLE_CHANGED"
    AUDIT_CATEGORY_CREATED = "AUDIT_CATEGORY_CREATED"
    AUDIT_CATEGORY_UPDATED = "AUDIT_CATEGORY_UPDATED"

    # Security events
    AUDIT_UNAUTHORIZED_ACCESS = "AUDIT_UNAUTHORIZED_ACCESS"
    AUDIT_FORBIDDEN_ACCESS = "AUDIT_FORBIDDEN_ACCESS"
    AUDIT_INVALID_TOKEN = "AUDIT_INVALID_TOKEN"


class AuditLogger:
    """Helper para registrar eventos de auditoria com contexto estruturado."""

    def __init__(self, name: str = "audit"):
        self.logger = logging.getLogger(name)

    def log_event(
        self,
        event: str,
        level: int = logging.INFO,
        user_id: str | None = None,
        item_id: str | None = None,
        action: str | None = None,
        status_code: int | None = None,
        client_ip: str | None = None,
        message: str | None = None,
        **extra_context,
    ) -> None:
        """
        Registra um evento de auditoria com contexto estruturado.

        Args:
            event: Tipo de evento (usar constantes de AuditEvent)
            level: Nível de logging
            user_id: ID do usuário associado
            item_id: ID do item associado
            action: Descrição da ação
            status_code: Código de status HTTP
            client_ip: IP do client
            message: Mensagem descritiva
            **extra_context: Contexto adicional
        """
        context = {
            "event": event,
            **({"user_id": str(user_id)} if user_id else {}),
            **({"item_id": str(item_id)} if item_id else {}),
            **({"action": action} if action else {}),
            **({"status_code": status_code} if status_code else {}),
            **({"client_ip": client_ip} if client_ip else {}),
            **extra_context,
        }

        # Adicionar context ao record
        extra = {"context": context}

        msg = message or event
        self.logger.log(level, msg, extra=extra)


# Instância global de audit logger
audit_logger = AuditLogger()


def get_audit_logger() -> AuditLogger:
    """Retorna a instância global de audit logger."""
    return audit_logger
